---
title: NVIDIA Driver
last_verified: 2026-07-27
---

# NVIDIA Driver {#nvidia-driver}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | GPU 计算节点 |
| 依赖 | [服务器设置](../../server/setup.md#server-setup)、NVIDIA GPU |
| 使用方 | [NVIDIA Container Toolkit](../nvidia-container-toolkit/)、[Slurm](../slurm/)、[监控](../monitoring/) |

驱动连接内核、GPU 和 CUDA 程序。排查 GPU 故障时，需要先确定问题位于 PCIe、内核模块、
用户程序还是容器运行时。

## 搭建 {#nvidia-driver-setup}

### 选择驱动 {#select-driver}

同型号服务器也可能使用不同的 Ubuntu 版本。先查看 GPU、系统版本和仓库中的驱动，再选择
`-server` 或 `-server-open` 软件包：

```shell
lspci -Dnn | grep -i nvidia
cat /etc/os-release
ubuntu-drivers devices
apt-cache policy 'nvidia-driver-*-server*'
```

### 安装驱动 {#install-driver}

驱动来自 Ubuntu 软件源。当前节点使用以下元软件包：

| 节点 | 软件包 |
| --- | --- |
| `cls1-srv1..3` | `nvidia-driver-580-server` |
| `cls1-srv4` | `nvidia-driver-595-server` |
| `cls2-srv1..4`、`cls2-srv6` | `nvidia-driver-595-server-open` |
| `cls2-srv7` | `nvidia-driver-580-server` |

先安装当前内核的头文件，再安装表中对应的驱动：

```shell
sudo apt-get update
sudo apt-get install linux-headers-$(uname -r)
```

=== "580 server"

    ```shell
    sudo apt-get install nvidia-driver-580-server
    dpkg-query -W nvidia-driver-580-server
    ```

=== "595 server"

    ```shell
    sudo apt-get install nvidia-driver-595-server
    dpkg-query -W nvidia-driver-595-server
    ```

=== "595 server open"

    ```shell
    sudo apt-get install nvidia-driver-595-server-open
    dpkg-query -W nvidia-driver-595-server-open
    ```

检查内核头文件和 DKMS 构建：

```shell
dpkg-query -W linux-headers-$(uname -r)
dkms status
sudo reboot
```

重启后检查内核模块和 GPU：

```shell
cat /sys/module/nvidia/version
nvidia-smi -L
```

### Persistence daemon {#nvidia-persistenced}

`nvidia-persistenced` 保存驱动设备状态。实验室还启用 persistence mode，使 GPU 在没有作业
时继续保持初始化状态。Ubuntu 提供的 `nvidia-persistenced.service` 在大多数节点是静态
单元，因此由下面的单元启动并保持运行：

```systemd title="/etc/systemd/system/nvidia-persistence-mode.service"
[Unit]
Description=Enable NVIDIA persistence mode
After=nvidia-persistenced.service
Wants=nvidia-persistenced.service

[Service]
Type=oneshot
ExecStart=/usr/bin/nvidia-smi --persistence-mode=1
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

```shell
sudo systemctl daemon-reload
sudo systemctl enable --now nvidia-persistence-mode.service
```

检查服务、persistence mode 和 GPU 数量：

```shell
cat /sys/module/nvidia/version
nvidia-smi -L
nvidia-smi --query-gpu=index,name,uuid,pci.bus_id --format=csv
systemctl is-active nvidia-persistenced
systemctl is-active nvidia-persistence-mode
nvidia-smi --query-gpu=index,persistence_mode --format=csv
```

### 配置 Slurm GRES {#configure-slurm-gres}

Slurm 节点还要比较 `nvidia-smi -L`、`/dev/nvidia*` 和 `/etc/slurm/gres.conf`。三处的
GPU 数量必须一致。

```shell
nvidia-smi -L
ls -l /dev/nvidia[0-9]*
grep -vE '^\s*(#|$)' /etc/slurm/gres.conf
```

## 维护 {#nvidia-driver-maintenance}

### `nvidia-smi` 无法连接驱动 {#nvidia-smi-cannot-connect}

先检查 PCIe 是否还能发现 GPU：

```shell
lspci -Dnn | grep -i nvidia
```

`lspci` 没有列出 GPU 时，检查 PCIe 插槽、供电、BIOS 和硬件。PCIe
仍能发现 GPU 时，再检查模块是否为当前内核编译并加载：

```shell
uname -r
dkms status
lsmod | grep '^nvidia'
cat /sys/module/nvidia/version
journalctl -k -b | grep -iE 'nvrm|nvidia|nouveau'
```

`dkms status` 没有当前内核对应的 NVIDIA 模块，说明驱动没有为这个内核完成编译。
`modprobe nvidia` 报错时，内核日志会给出签名、符号不匹配或设备初始化失败等原因：

```shell
sudo modprobe nvidia
journalctl -k -b --since '-5 min' | grep -iE 'nvrm|nvidia|nouveau'
```

### GPU 数量减少 {#missing-gpu}

比较 PCIe、驱动和设备文件看到的 GPU：

```shell
lspci -Dnn | grep -i nvidia
nvidia-smi --query-gpu=index,name,uuid,pci.bus_id --format=csv
ls -l /dev/nvidia[0-9]*
```

PCIe 中存在但 `nvidia-smi` 中缺失的设备属于驱动初始化问题。两处都缺失时检查硬件和
PCIe。内核日志中的 Xid 79 表示驱动失去了与该 GPU 的 PCIe 通信，应保留故障 GPU 的
bus ID，并检查插槽、供电和同一 PCIe 链路上的其他设备。

### 作业出现 Xid {#xid-errors}

Xid 是驱动写入内核日志的错误编号。结合 Xid 编号、复现范围和同一时间段的日志判断问题
来自程序、显存、PCIe 还是供电。先记录作业、时间、节点、GPU UUID 和 bus ID：

```shell
nvidia-smi --query-gpu=index,uuid,pci.bus_id,name --format=csv
journalctl -k --since 'YYYY-MM-DD HH:MM:SS' | grep -iE 'NVRM: Xid|nvidia'
```

常见情况如下：

| 现象 | 先检查的内容 |
| --- | --- |
| 单个程序触发 Xid，换到其他 GPU 后不再出现 | 程序、CUDA 版本、输入和显存访问 |
| 不同程序在同一块 GPU 上重复触发 Xid | GPU、显存、PCIe 和供电 |
| Xid 31 | 程序的非法显存访问；重复出现在同一块 GPU 时再检查硬件 |
| Xid 48、63 或 64 | 显存或 SRAM 错误；停止使用该 GPU 并检查 ECC 和恢复动作 |
| Xid 79 | PCIe 通信中断；检查供电、插槽和主板 |

各编号的含义和处理方法见 [NVIDIA Xid 文档](https://docs.nvidia.com/deploy/xid-errors/)。

### 判断是否需要重启 {#gpu-recovery}

先停止故障 GPU 上的作业和容器。驱动可以读取设备时，查看它给出的恢复动作：

```shell
nvidia-smi -q -i GPU_INDEX | grep -A 3 'GPU Recovery Action'
```

恢复动作为 `Reset` 时，可以在确认没有进程、显示服务和监控程序占用设备后使用
`nvidia-smi --gpu-reset -i GPU_INDEX`。恢复动作为 `Reboot`，或者 GPU 已经从总线上消失
时，重启节点。重启后仍在同一块 GPU 上复现，应保留日志并检查硬件。

### 驱动升级 {#upgrade}

驱动升级同时影响 CUDA 程序、GPU 容器、DCGM exporter 和 Slurm GRES。先 drain 节点并
等待作业结束，再记录内核、驱动软件包和正在加载的驱动版本：

```shell
uname -r
dpkg-query -W 'nvidia-driver-*' 2>/dev/null
cat /sys/module/nvidia/version
```

升级并重启后，按搭建部分重新检查 GPU 数量。然后检查 GPU 容器、
`monitor-dcgm-exporter` 和 Slurm 节点状态，再恢复调度。

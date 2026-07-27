---
title: 维护
last_verified: 2026-07-27
---

# 维护 {#server-maintenance}

## 清理软件包 {#cleanup-packages}

APT 会把作为依赖安装的软件包标记为自动安装。上层软件包删除后，这些依赖会成为
`autoremove` 的候选项。先模拟操作，确认列表中没有驱动、存储或正在使用的内核：

```shell
sudo apt-get --simulate autoremove --purge
```

列表正确时再执行清理：

```shell
sudo apt-get autoremove --purge
sudo apt-get autoclean
```

清理列表中如有 [NVIDIA Driver](../services/nvidia-driver/)、[DOCA](../services/doca/)、
[BeeGFS](../services/beegfs/)、[ZFS](../services/zfs/) 或 [Slurm](../services/slurm/) 软件包，
检查其来源和 DKMS 依赖后再删除。

## 清理内核 {#cleanup-kernels}

Ubuntu 正常情况下会由 `autoremove` 清理旧内核。`/boot` 空间不足或者旧内核没有成为
自动删除候选时，再手动处理。先列出正在运行和已经安装的内核：

```shell
uname -r
dpkg-query -W -f='${Package}\t${Version}\n' 'linux-image-[0-9]*' 2>/dev/null
```

保留正在运行的内核、默认启动的内核和一个已验证可启动的备用内核。删除某个版本时，内核
映像、headers 和 modules 使用相同的版本号：

```shell
sudo apt-get remove --purge \
  linux-image-VERSION-generic \
  linux-modules-VERSION-generic \
  linux-modules-extra-VERSION-generic \
  linux-headers-VERSION-generic
sudo update-grub
```

删除后确认当前内核仍在，NVIDIA、DOCA 和 BeeGFS 的 DKMS 模块仍有可启动内核对应的版本：

```shell
dpkg-query -W -f='${Package}\t${Version}\n' 'linux-image-[0-9]*' 2>/dev/null
dkms status
```

## 从 Ubuntu Desktop 迁移 {#desktop-to-server}

部分 `cls2` 服务器最初安装了 Ubuntu Desktop，之后改作计算节点。`ubuntu-desktop` 和
`ubuntu-server` 都是元软件包，安装 `ubuntu-server` 只补齐服务器组件，不会自动删除桌面
环境。

先安装 Server 元软件包并把默认启动目标改为字符界面：

```shell
sudo apt-get install ubuntu-server
sudo systemctl set-default multi-user.target
systemctl get-default
```

重启后确认 SSH 正常，再查看仍在运行的显示管理器和图形会话：

```shell
systemctl status ssh --no-pager
systemctl status display-manager --no-pager
loginctl list-sessions
```

桌面软件包不应按包名通配符一次删除。先模拟删除显示管理器和 Desktop 元软件包，检查 APT
是否准备删除网络、SSH、驱动或计算软件：

```shell
sudo apt-get --simulate remove --purge ubuntu-desktop DISPLAY_MANAGER_PACKAGE
```

完成删除和 `autoremove` 后，检查启动目标、SSH、[GPU 驱动](../services/nvidia-driver/)、
[Slurm](../services/slurm/) 和[监控](../services/monitoring/)。保留 CUDA 或远程可视化软件依赖的图形库。

---
title: NVIDIA Container Toolkit
last_verified: 2026-07-27
---

# NVIDIA Container Toolkit {#nvidia-container-toolkit}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | 运行 GPU 容器的计算节点 |
| 依赖 | [NVIDIA Driver](../nvidia-driver/)、[Docker](../docker/) |
| 使用方 | GPU 容器、[监控](../monitoring/) |

Toolkit 将宿主机的设备文件和驱动库提供给容器。使用宿主机的 `nvidia-smi` 检查驱动，
使用临时容器中的 `nvidia-smi` 检查设备文件、驱动库挂载和容器运行时。

## 搭建 {#nvidia-container-toolkit-setup}

### 安装 Toolkit {#install-toolkit}

保存 NVIDIA 的签名密钥：

```shell
sudo apt-get update
sudo apt-get install ca-certificates curl gpg
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
  | sudo gpg --dearmor --yes \
    -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
sudo chmod 0644 /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
```

实验室使用 USTC 的 stable 仓库。experimental 仓库保留为注释：

```text title="/etc/apt/sources.list.d/nvidia-container-toolkit.list"
deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://mirrors.ustc.edu.cn/libnvidia-container/stable/deb/$(ARCH) /
#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://mirrors.ustc.edu.cn/libnvidia-container/experimental/deb/$(ARCH) /
```

安装 Toolkit。APT 会同时安装 `libnvidia-container1`、`libnvidia-container-tools` 和
`nvidia-container-toolkit-base`：

```shell
sudo apt-get update
sudo apt-get install nvidia-container-toolkit
```

检查签名密钥、软件源、软件包和命令：

```shell
gpg --show-keys /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
grep -F 'libnvidia-container/stable' /etc/apt/sources.list.d/nvidia-container-toolkit.list
apt-cache policy nvidia-container-toolkit
dpkg-query -W libnvidia-container1 libnvidia-container-tools \
  nvidia-container-toolkit-base nvidia-container-toolkit
nvidia-ctk --version
```

### 配置 CDI {#configure-cdi}

实验室使用 CDI 描述可用的 NVIDIA 设备。启用随驱动和设备变化自动更新 CDI 文件的
systemd 单元：

```shell
sudo systemctl enable --now nvidia-cdi-refresh.path
sudo systemctl start nvidia-cdi-refresh.service
```

检查生成结果：

```shell
systemctl is-active nvidia-cdi-refresh.path
nvidia-ctk cdi list
```

### 配置 Docker {#configure-docker-runtime}

使用 `nvidia-ctk` 将 `nvidia` runtime 合并到现有的 `/etc/docker/daemon.json`。随后按照
[Docker daemon 配置](../docker/#docker-daemon-configuration)检查完整文件：

```shell
sudo nvidia-ctk runtime configure --runtime=docker
sudo dockerd --validate --config-file=/etc/docker/daemon.json
sudo systemctl reload docker
docker info --format '{{json .Runtimes}}'
```

在临时容器中检查 GPU。镜像中的 `nvidia-smi` 使用宿主机驱动，这一步同时检查
设备文件、驱动库挂载和 Docker 运行时：

```shell
docker run --rm --gpus all ubuntu:24.04 nvidia-smi -L
```

## 维护 {#nvidia-container-toolkit-maintenance}

### 容器看不到 GPU {#gpu-not-visible-in-container}

先在宿主机运行 `nvidia-smi -L`。宿主机也失败时，按
[NVIDIA Driver](../nvidia-driver/#nvidia-smi-cannot-connect)排查。宿主机正常时，依次比较
设备、CDI 和 Docker：

```shell
ls -l /dev/nvidia[0-9]*
nvidia-ctk cdi list
docker info | sed -n '/Runtimes/p'
docker run --rm --gpus all ubuntu:24.04 nvidia-smi -L
```

CDI 没有列出 `nvidia.com/gpu` 时重新生成配置，并检查 systemd 单元日志：

```shell
sudo systemctl start nvidia-cdi-refresh.service
journalctl -u nvidia-cdi-refresh.service -n 100 --no-pager
nvidia-ctk cdi list
```

只有某个 Compose 项目失败时，检查该项目最终生成的配置。实验室的
`monitor-dcgm-exporter` 使用 GPU device reservation：

```shell
cd /srv/docker/monitor
docker compose config
docker inspect monitor-dcgm-exporter --format '{{json .HostConfig.DeviceRequests}}'
```

### 驱动升级或节点迁移后容器失效 {#after-driver-upgrade}

正在运行的容器可能仍引用升级前的驱动库。重启节点后重新生成 CDI，并重建 GPU 容器：

```shell
sudo systemctl start nvidia-cdi-refresh.service
cd /srv/docker/monitor
docker compose up -d --force-recreate dcgm-exporter
docker compose logs --tail=100 dcgm-exporter
```

`dcgm-exporter` 用于暴露监控指标。运行 `dcgmi diag` 需要独立的 DCGM Host Engine，当前
容器没有提供这个组件。

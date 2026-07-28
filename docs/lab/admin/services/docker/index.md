---
title: Docker
last_verified: 2026-07-27
---

# Docker {#docker}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | `jp-2`、`cls1-gateway`、计算节点 |
| 依赖 | [服务器设置](../../server/setup.md#server-setup)、Docker CE 软件源、网络 |
| 使用方 | [Caddy](../caddy/)、[LLDAP](../lldap/)、[Headscale](../headscale/)、[DERP](../derp/)、[监控](../monitoring/)、GPU 容器 |

## 搭建 {#docker-setup}

### 安装 Docker {#install-docker}

先安装下载软件源所需的软件包，并保存 Docker 的签名密钥：

```shell
sudo apt-get update
sudo apt-get install ca-certificates curl gpg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo tee /etc/apt/keyrings/docker.asc >/dev/null
sudo chmod 0644 /etc/apt/keyrings/docker.asc
```

`cls1` 和 `cls2` 的 Ubuntu 24.04 主机使用 USTC 镜像，`jp-2` 使用 Docker 官方源：

=== "集群主机"

    ```text title="/etc/apt/sources.list.d/docker.list"
    deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://mirrors.ustc.edu.cn/docker-ce/linux/ubuntu noble stable
    ```

=== "jp-2"

    ```text title="/etc/apt/sources.list.d/docker.list"
    deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu noble stable
    ```

刷新索引并安装实验室使用的五个软件包：

```shell
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now containerd docker
```

| 软件包 | 提供的功能 |
| --- | --- |
| `docker-ce` | `dockerd` 和 systemd 单元 |
| `docker-ce-cli` | `docker` 命令 |
| `containerd.io` | `containerd` 和 `runc` |
| `docker-buildx-plugin` | `docker buildx` |
| `docker-compose-plugin` | `docker compose` |

检查签名密钥、软件源、软件包、服务和 Compose：

```shell
gpg --show-keys /etc/apt/keyrings/docker.asc
grep -F 'signed-by=/etc/apt/keyrings/docker.asc' /etc/apt/sources.list.d/docker.list
apt-cache policy docker-ce
dpkg-query -W docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl is-active containerd docker
docker compose version
```

### 配置 containerd {#configure-containerd}

实验室通过 Docker 使用 containerd，未部署 Kubernetes CRI：

```toml title="/etc/containerd/config.toml"
disabled_plugins = ["cri"]
```

应用配置前检查语法，重启后检查服务：

```shell
sudo containerd --config /etc/containerd/config.toml config dump >/dev/null
sudo systemctl restart containerd
systemctl is-active containerd
ctr version
```

### Docker daemon 配置 {#docker-daemon-configuration}

GPU 计算节点使用以下配置：

> 非 GPU 主机删除 `runtimes.nvidia`。不使用镜像站或代理的主机删除对应配置。

```json title="/etc/docker/daemon.json"
{
  "runtimes": {
    "nvidia": {
      "args": [],
      "path": "nvidia-container-runtime"
    }
  },
  "registry-mirrors": ["https://mirrors.ustc.edu.cn/"],
  "live-restore": true,
  "proxies": {
    "http-proxy": "http://docker.proxy.lab.tiankaima.cn:7890",
    "https-proxy": "http://docker.proxy.lab.tiankaima.cn:7890",
    "no-proxy": "localhost,127.0.0.1,::1,mirrors.ustc.edu.cn"
  }
}
```

| 配置 | 用途 |
| --- | --- |
| `runtimes.nvidia` | 注册 NVIDIA Container Runtime，只在安装了 [NVIDIA Container Toolkit](../nvidia-container-toolkit/) 的节点配置 |
| `registry-mirrors` | 通过 USTC 镜像站拉取 Docker Hub 镜像 |
| `live-restore` | `dockerd` 重载或重启时保留正在运行的容器 |
| `proxies` | `dockerd` 拉取镜像时使用实验室代理 |

修改后先检查 JSON 和 Docker 配置：

```shell
sudo dockerd --validate --config-file=/etc/docker/daemon.json
```

### 重载配置 {#reload-docker-configuration}

`systemctl reload docker` 不会停止 `dockerd`，可以更新 `live-restore`、运行时和镜像站。
更新 `proxies` 需要执行 `systemctl restart docker`。

如果 `LiveRestore=false`，先添加 `"live-restore": true`，重载并确认生效。随后重启 `dockerd`
时，运行中的容器会继续运行。

重载后检查配置和容器功能：

```shell
sudo systemctl reload docker
docker info --format 'LiveRestore={{.LiveRestoreEnabled}} Runtimes={{json .Runtimes}}'
docker run --rm hello-world
docker network ls
docker volume ls
```

Compose 项目放在 `/srv/docker/PROJECT`。配置和持久数据使用不同目录。Compose 文件指定
镜像版本，数据库、证书和应用数据使用 volume 或 bind mount。

## 维护 {#docker-maintenance}

### `dockerd` 需要重启 {#before-changes}

```shell
docker info --format 'LiveRestore={{.LiveRestoreEnabled}}'
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
systemctl status docker containerd
```

### 更新 Compose 项目 {#update-compose-project}

修改 Compose 项目时：

```shell
cd /srv/docker/PROJECT
docker compose config --quiet
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail=100
```

### 升级或清理 Docker {#upgrade-and-cleanup}

- 升级前记录镜像摘要和数据库版本
- 数据库跨大版本升级前备份并按迁移说明操作
- 分别删除不再使用的镜像、网络和卷

### Docker 无法启动 {#troubleshooting}

```shell
journalctl -u docker -u containerd --since today
docker events --since 30m
docker inspect CONTAINER
docker compose config
```

Docker 无法启动时检查 `/etc/docker/daemon.json` 和 containerd 配置。`/var/lib/docker`
和 `/var/lib/containerd` 包含容器数据。

# 更新

!!! note

    记录服务器升级后的一些注意事项。

## Ubuntu 版本更新

```bash
sudo apt update
sudo apt upgrade -y
sudo apt dist-upgrade -y
sudo apt autoremove -y
```

```bash
sudo do-release-upgrade
```

## `apt`

### `ubuntu.sources`

自 Ubuntu 24.04 开始，`/etc/apt/sources.list` 文件已经被弃用，所有的源配置文件都放在 `/etc/apt/sources.list.d/` 目录下。

参考 [USTC Mirrors](https://mirrors.ustc.edu.cn/help/ubuntu.html#_7) 复制一份配置文件，对 Ubuntu 24.04，内容如下：

```ini title="/etc/apt/sources.list.d/ubuntu.sources"
Types: deb
URIs: https://mirrors.ustc.edu.cn/ubuntu
Suites: noble noble-updates noble-backports
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

Types: deb
URIs: https://mirrors.ustc.edu.cn/ubuntu
Suites: noble-security
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
```

### Docker-CE

参考 [MirrorZ Help](https://help.mirrorz.org/docker-ce/) 清理原安装。

```bash
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get remove $pkg; done
```

接下来参考 [检查单](/lab/admin/checklist/#docker) 安装 Docker-CE。

### 清理

首先列出所有 explicit 的包：

```bash
sudo apt-mark showmanual
```

关注：

- `cockpit`
- `zerotier-one`


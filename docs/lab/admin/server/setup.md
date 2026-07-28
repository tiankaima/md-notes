---
title: 设置
last_verified: 2026-07-27
---

# 设置 {#server-setup}

## 基础检查 {#basic-checks}

```shell
cat /etc/os-release
uname -a
lsblk -f
lspci -nn
hostnamectl
```

## 安装软件包 {#install-packages}

```shell
sudo apt-get update
sudo apt-get install ca-certificates curl smartmontools mailutils \
  openssh-server fail2ban unattended-upgrades
```

检查安装结果：

```shell
dpkg-query -W ca-certificates curl smartmontools mailutils \
  openssh-server fail2ban unattended-upgrades
```

## APT {#apt}

`cls1` 和 `cls2` 使用 USTC Ubuntu 镜像。先用 `/etc/os-release` 确认发行版代号，再写入
对应的 `ubuntu.sources`：

```shell
. /etc/os-release
printf '%s\n' "$VERSION_ID" "$VERSION_CODENAME"
```

=== "Ubuntu 24.04"

    ```deb822 title="/etc/apt/sources.list.d/ubuntu.sources"
    Types: deb
    URIs: https://mirrors.ustc.edu.cn/ubuntu/
    Suites: noble noble-updates noble-security noble-backports
    Components: main restricted universe multiverse
    Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
    ```

=== "Ubuntu 25.10"

    ```deb822 title="/etc/apt/sources.list.d/ubuntu.sources"
    Types: deb
    URIs: https://mirrors.ustc.edu.cn/ubuntu/
    Suites: questing questing-updates questing-security questing-backports
    Components: main restricted universe multiverse
    Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
    ```

APT 代理配置为：

```ini title="/etc/apt/apt.conf.d/01-proxy.conf"
Acquire::http::Proxy "http://proxy.lab.tiankaima.cn:7890";
Acquire::https::Proxy "http://proxy.lab.tiankaima.cn:7890";
```

检查文件中的发行版代号、软件源和代理：

```shell
grep -E '^(URIs|Suites|Components|Signed-By):' /etc/apt/sources.list.d/ubuntu.sources
apt-config dump | grep -iE 'Acquire::(http|https)::Proxy'
sudo apt-get update
apt-cache policy | sed -n '1,30p'
```

## 禁用休眠 {#disable-sleep}

```shell
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

检查 systemd 单元状态：

```shell
systemctl is-enabled sleep.target suspend.target hibernate.target hybrid-sleep.target
```

## 时间同步 {#time-sync}

```ini title="/etc/systemd/timesyncd.conf.d/60-cluster-time.conf"
[Time]
NTP=time.ustc.edu.cn
```

应用配置并检查同步状态：

```shell
sudo systemctl restart systemd-timesyncd
timedatectl timesync-status
```

## SSH {#ssh}

SSH 使用公钥认证。root 只允许使用公钥登录，作为目录服务故障时的恢复入口：

```sshconfig title="/etc/ssh/sshd_config.d/00-cluster-access.conf"
PermitRootLogin prohibit-password
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
```

检查配置后重新加载 SSH：

```shell
sudo sshd -t
sudo systemctl reload ssh
sshd -T | grep -E 'permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication'
```

## Fail2ban {#fail2ban}

```ini title="/etc/fail2ban/jail.d/60-cluster-sshd.local"
[sshd]
enabled = true
maxretry = 3
bantime = 1h
```

检查配置并启动服务：

```shell
sudo fail2ban-client -t
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

## 自动安全更新 {#unattended-upgrades}

自动更新只安装安全更新，排除 NVIDIA 驱动及其内核包，也不自动重启：

```ini title="/etc/apt/apt.conf.d/20auto-upgrades"
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

```ini title="/etc/apt/apt.conf.d/52-cluster-unattended-upgrades"
Unattended-Upgrade::Package-Blacklist {
    "^nvidia-.*";
    "^libnvidia-.*";
    "^xserver-xorg-video-nvidia-.*";
    "^linux-.*-nvidia-.*";
};
Unattended-Upgrade::Automatic-Reboot "false";
```

检查配置和 timer：

```shell
apt-config dump | grep -E 'APT::Periodic::(Update-Package-Lists|Unattended-Upgrade)'
sudo unattended-upgrade --dry-run --debug
systemctl list-timers apt-daily.timer apt-daily-upgrade.timer
```

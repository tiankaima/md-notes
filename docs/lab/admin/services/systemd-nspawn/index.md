---
title: systemd-nspawn
last_verified: 2026-07-27
---

# systemd-nspawn {#systemd-nspawn}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | `cls1-gateway` |
| 依赖 | [SSSD](../sssd/)、[Slurm](../slurm/)、共享存储 |
| 使用方 | 普通用户登录环境 |

## 搭建 {#systemd-nspawn-setup}

### 安装工具 {#install-systemd-nspawn}

`systemd-container` 提供 `systemd-nspawn` 和 `machinectl`，`debootstrap` 用于创建 Ubuntu
根文件系统：

```shell
sudo apt-get update
sudo apt-get install systemd-container debootstrap rsync openssl
```

安装后检查命令和软件包：

```shell
dpkg-query -W systemd-container debootstrap rsync openssl
systemd-nspawn --version
machinectl --version
```

### 创建根文件系统 {#bootstrap-login-rootfs}

确认目标目录不存在，再用 Ubuntu 24.04 和 USTC 镜像创建根文件系统：

```shell
sudo test ! -e /var/lib/machines/login
sudo debootstrap --arch=amd64 \
  --include=systemd-sysv,systemd-resolved,dbus,openssh-server,ca-certificates,curl,locales,sudo \
  noble /var/lib/machines/login https://mirrors.ustc.edu.cn/ubuntu
```

检查系统版本、init 和基础软件包：

```shell
sudo chroot /var/lib/machines/login cat /etc/os-release
sudo test -x /var/lib/machines/login/usr/lib/systemd/systemd
sudo chroot /var/lib/machines/login dpkg-query -W \
  systemd systemd-resolved dbus openssh-server ca-certificates curl locales sudo
```

### 初始化系统 {#initialize-login-rootfs}

设置 hostname、时区、locale 和独立的 machine ID：

```shell
sudo rm -f /var/lib/machines/login/etc/machine-id
sudo systemd-firstboot --root=/var/lib/machines/login \
  --force --hostname=login --timezone=Asia/Shanghai --locale=C.UTF-8 \
  --setup-machine-id
openssl rand -base64 48 | sed 's/^/root:/' | \
  sudo chroot /var/lib/machines/login chpasswd
```

容器使用 USTC 的 Ubuntu 24.04 软件源：

```deb822 title="/var/lib/machines/login/etc/apt/sources.list.d/ubuntu.sources"
Types: deb
URIs: https://mirrors.ustc.edu.cn/ubuntu
Suites: noble noble-updates noble-security
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
```

删除 `debootstrap` 生成的软件源文件，并配置 systemd-resolved：

```shell
sudo rm -f /var/lib/machines/login/etc/apt/sources.list
sudo ln -sfn ../run/systemd/resolve/stub-resolv.conf \
  /var/lib/machines/login/etc/resolv.conf
```

容器保留 root 公钥入口：

```sshconfig title="/var/lib/machines/login/etc/ssh/sshd_config.d/00-cluster-access.conf"
PermitRootLogin prohibit-password
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
```

```shell
sudo install -d -o root -g root -m 0700 \
  /var/lib/machines/login/root/.ssh
sudo install -o root -g root -m 0600 /root/.ssh/authorized_keys \
  /var/lib/machines/login/root/.ssh/authorized_keys
sudo systemctl --root=/var/lib/machines/login enable \
  systemd-networkd systemd-resolved ssh
```

随机密码解除 `root` 的锁定状态。SSH 禁止密码认证，管理员通过随后写入的公钥登录。

检查初始化结果：

```shell
sudo cat /var/lib/machines/login/etc/hostname
sudo wc -c /var/lib/machines/login/etc/machine-id
sudo readlink /var/lib/machines/login/etc/resolv.conf
sudo chroot /var/lib/machines/login passwd --status root
sudo systemctl --root=/var/lib/machines/login is-enabled \
  systemd-networkd systemd-resolved ssh
```

### 配置网络 {#configure-login-network}

`systemd-nspawn` 创建 veth。宿主机一端名为 `ve-login`，地址为 `192.168.49.1/24`：

```ini title="/etc/systemd/network/40-ve-login.network"
[Match]
Name=ve-login

[Network]
Address=192.168.49.1/24
LinkLocalAddressing=no
IPMasquerade=both
IPv6AcceptRA=no
IPv6SendRA=no
```

容器一端名为 `host0`，地址为 `192.168.49.2/24`：

```ini title="/var/lib/machines/login/etc/systemd/network/10-host0.network"
[Match]
Kind=veth
Name=host0
Virtualization=container

[Network]
Address=192.168.49.2/24
Gateway=192.168.49.1
DNS=192.168.49.1
LinkLocalAddressing=no
```

启用 IPv4 转发并重新加载 networkd：

```ini title="/etc/sysctl.d/90-login-forwarding.conf"
net.ipv4.ip_forward = 1
```

```shell
sudo sysctl --system
sudo networkctl reload
sysctl net.ipv4.ip_forward
```

`cls1-gateway` 将三个入口的 2022/TCP 转发到容器的 22/TCP。在现有
`/etc/nftables.conf` 中加入以下规则：

```nftables title="/etc/nftables.conf 中 table inet filter 的 chain forward"
iifname $WAN_IF oifname $LOGIN_IF ip daddr 192.168.49.2 tcp dport 22 ct state new accept
iifname $LAN_IF oifname $LOGIN_IF ip daddr 192.168.49.2 tcp dport 22 ct state new accept
iifname $TS_IF oifname $LOGIN_IF ip daddr 192.168.49.2 tcp dport 22 ct state new accept
```

```nftables title="/etc/nftables.conf 中 table ip nat 的 chain prerouting"
iifname $WAN_IF tcp dport 2022 dnat to 192.168.49.2:22
iifname $LAN_IF tcp dport 2022 dnat to 192.168.49.2:22
iifname $TS_IF tcp dport 2022 dnat to 192.168.49.2:22
```

检查规则后重新加载 nftables：

```shell
sudo nft --check --file /etc/nftables.conf
sudo systemctl reload nftables
sudo nft list ruleset | grep -E '2022|192\.168\.49\.2'
```

### 配置容器 {#configure-login-container}

`cls1-gateway` 上运行名为 `login` 的 `systemd-nspawn` 容器。

| 项目 | 值 |
| --- | --- |
| 根目录 | `/var/lib/machines/login` |
| 配置 | `/etc/systemd/nspawn/login.nspawn` |
| systemd 单元 | `systemd-nspawn@login.service` |
| 地址 | `192.168.49.2` |

`login.nspawn` 定义容器和挂载，不在其中设置 CPU 或内存限制。与用户登录有关的配置如下：

```ini title="/etc/systemd/nspawn/login.nspawn（节选）"
[Exec]
Boot=on
Hostname=login
PrivateUsers=identity

[Network]
VirtualEthernet=yes

[Files]
BindReadOnly=/etc/slurm
Bind=/home
Bind=/data/cls1-beegfs
Bind=/data/cls2-pool1
Bind=/data/cls2-pool2
```

启动前检查配置和每个 bind mount 的宿主机路径：

```shell
systemd-analyze cat-config systemd/nspawn/login.nspawn
test -r /etc/slurm/slurm.conf
findmnt -T /home
findmnt -T /data/cls1-beegfs
findmnt -T /data/cls2-pool1
findmnt -T /data/cls2-pool2
```

### 配置挂载顺序 {#configure-login-mount-order}

容器等待 [BeeGFS](../beegfs/)、[NFS](../nfs/) 和 `/home` 就绪后再启动：

```systemd title="/etc/systemd/system/systemd-nspawn@login.service.d/10-mounts.conf"
[Unit]
Wants=data-cls1\x2dbeegfs.mount data-cls2\x2dpool1.mount data-cls2\x2dpool2.mount
RequiresMountsFor=/home /data/cls1-beegfs /data/cls2-pool1 /data/cls2-pool2
After=zfs-mount.service local-fs.target remote-fs.target data-cls1\x2dbeegfs.mount data-cls2\x2dpool1.mount data-cls2\x2dpool2.mount
StartLimitIntervalSec=0
```

```systemd title="/etc/systemd/system/systemd-nspawn@login.service.d/always-running.conf"
[Service]
Restart=always
RestartSec=5s
```

检查 drop-in 合并结果：

```shell
sudo systemctl daemon-reload
systemctl cat systemd-nspawn@login.service
systemd-analyze verify systemd-nspawn@login.service
```

### 资源限制 {#resource-limits}

资源限制属于 `systemd-nspawn@login.service` 的 cgroup 属性。`cls1-gateway` 当前不限制容器的
CPU 时间，内存限制为 `MemoryHigh=20G`、`MemoryMax=25G` 和 `MemorySwapMax=4G`：

```shell
sudo systemctl set-property systemd-nspawn@login.service \
  'CPUQuota=' MemoryHigh=20G MemoryMax=25G MemorySwapMax=4G
systemctl show systemd-nspawn@login.service \
  -p CPUQuotaPerSecUSec -p MemoryHigh -p MemoryMax -p MemorySwapMax
```

`systemctl set-property` 将持久配置写入 `/etc/systemd/system.control/`。该目录中的 drop-in
由 systemd 生成，不要直接修改。

`CPUQuota` 按一个逻辑 CPU 的时间计算，`100%` 等于一个逻辑 CPU，`50%` 只等于半个逻辑
CPU。`cls1-gateway` 有 56 个逻辑 CPU；如果要限制为整机 CPU 时间的一半，对应的值是
`2800%`。当前 `CPUQuotaPerSecUSec=infinity`，表示没有 CPU 配额。

容器内任务在 `top` 中的 CPU 使用率合计只能达到约 `50%` 时，检查 systemd 服务的最终
配置。旧配置中的 `CPUQuota=50%` 会把整个登录容器限制在半个逻辑 CPU：

```shell
systemctl cat systemd-nspawn@login.service
systemctl show systemd-nspawn@login.service -p CPUQuotaPerSecUSec
```

### 首次启动 {#first-start}

```shell
sudo systemctl enable --now systemd-nspawn@login
machinectl list
machinectl status login
systemctl status systemd-nspawn@login
networkctl status ve-login
sudo machinectl shell root@login
```

进入容器后刷新软件源，检查网络和 SSH：

```shell
apt-get update
ip -brief address show host0
ip route
resolvectl status host0
systemctl is-active systemd-networkd systemd-resolved ssh
sshd -t
```

### 安装登录服务 {#install-login-services}

容器安装 SSSD 和 Munge：

```shell
apt-get install sssd sssd-tools libnss-sss libpam-sss libsss-sudo munge
dpkg-query -W sssd sssd-tools libnss-sss libpam-sss libsss-sudo munge
```

按照 [SSSD 搭建](../sssd/#sssd-setup)写入目录认证配置。按照
[Slurm 搭建](../slurm/#slurm-setup)安装 `25.11.2` 客户端软件包并复制 Munge 密钥。
`login` 运行 Slurm 客户端，`slurmd` 保持禁用：

```shell
systemctl enable --now ssh sssd munge
systemctl disable --now slurmd
systemctl is-active ssh sssd munge
systemctl is-enabled slurmd
getent group server_user
sinfo
```

### 验收登录入口 {#verify-login-container}

在宿主机检查容器、网络、资源限制和端口转发：

```shell
machinectl status login
networkctl status ve-login
systemctl show systemd-nspawn@login \
  -p CPUQuotaPerSecUSec -p MemoryHigh -p MemoryMax -p MemorySwapMax
sudo nft list ruleset | grep -E '2022|192\.168\.49\.2'
```

从 SSH 入口检查认证、Slurm 和共享存储：

```shell
ssh -p 2022 USER@cls1-gateway.s.tiankaima.dev \
  'id; sinfo; findmnt -T /data/cls1-beegfs; findmnt -T /data/cls2-pool1; findmnt -T /data/cls2-pool2'
```

## 维护 {#systemd-nspawn-maintenance}

### 容器无法启动或登录 {#regular-checks}

```shell
machinectl status login
systemctl status systemd-nspawn@login
systemctl show systemd-nspawn@login \
  -p CPUQuotaPerSecUSec -p MemoryHigh -p MemoryMax -p MemorySwapMax
journalctl -u systemd-nspawn@login --since today
ssh -p 2022 USER@cls1-gateway.s.tiankaima.dev
```

登录失败时依次检查宿主机网络、SSSD、Slurm 配置和 bind mount。

### 配置修改后未生效 {#configuration-changes}

修改 `.nspawn` 文件后检查源路径和挂载权限，然后重启容器。`.nspawn` 配置不支持
`[Service]` 段；使用 `systemctl set-property` 修改 CPU 和内存限制。Slurm 配置使用只读
bind 挂载，认证配置在容器内验证。

### 迁移或恢复登录容器 {#recovery}

恢复内容包括根文件系统、`.nspawn` 配置、网络定义和认证文件。恢复后检查 UID/GID 映射、
文件权限、SSH 主机密钥、Munge 密钥和存储路径，然后开放 2022 端口。

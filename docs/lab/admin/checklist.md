# 检查单

## 硬件检查

-   [x] CPU、GPU 是否正常，符合配置
-   [x] RAM 总量、通道配置
-   [x] 硬盘容量、RAID 配置
-   [x] 网卡是否正常，速度
-   [x] IPMI 能否正常访问

### IPMI

-   IPMI 默认不开启 DHCP，需要手动给本地 Assign 一个 IP 地址：

    -   IP: `192.168.1.2`
    -   Subnet mask: `255.255.255.0`

-   登陆 IPMI 默认用户名密码：

    -   用户名：`ADMIN`
    -   密码：`ADMIN`

-   **登陆 IPMI 后修改默认密码**

## 系统安装

考虑安装 Ubuntu Server (LTS)。

??? note "安装 XX.04 LTS 而不是 XX.10"

    Release Cycle: https://ubuntu.com/about/release-cycle

    tl;dr:

    - XX.04 LTS
    - ~~XX.10 non-LTS 每六个月发行一次，仅支持九个月~~

!!! warning "不要使用安装引导界面安装 Docker 等工具，此位置使用 snap 安装，后期配置较为繁琐"

## 网络配置

由于 InfinBand 一些尚且不明的配置问题，目前同时使用 `systemd-networkd` 和 `NetworkManager`，利用 `Netplan` 进行管理，以 `cls1-srv1` 为例：

```yaml title="/etc/netplan/01-netcfg.yaml"
network:
    version: 2
    renderer: networkd
    ethernets:
        enxc8a3625d5de7:
            addresses:
                - "192.168.48.201/24"
            nameservers:
                addresses:
                    - 202.38.64.56
                    - 202.38.64.17
            dhcp4: false
            dhcp6: true
            routes:
                - to: "default"
                  via: "192.168.48.1"
```

```yaml title="/etc/netplan/90-NM-52442efb-7349-41de-acf9-0e7410dc8476.yaml"
network:
    version: 2
    nm-devices:
        NM-52442efb-7349-41de-acf9-0e7410dc8476:
            renderer: NetworkManager
            networkmanager:
                uuid: "52442efb-7349-41de-acf9-0e7410dc8476"
                name: "InfiniBand connection 1"
                passthrough:
                    connection.type: "infiniband"
                    connection.interface-name: "ibp194s0"
                    connection.timestamp: "1737292624"
                    infiniband.mac-address: "00:00:11:15:FE:80:00:00:00:00:00:00:EC:0D:9A:03:00:30:97:1E"
                    infiniband.transport-mode: "datagram"
                    ipv4.address1: "10.9.0.1/24"
                    ipv4.method: "manual"
                    ipv6.addr-gen-mode: "stable-privacy"
                    ipv6.method: "auto"
                    proxy._: ""
```

## 管理设置

### Hostname

```bash
sudo hostnamectl set-hostname cls1-srv1
```

### 禁用休眠

```bash
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

### `Coder` 用户

为方便集中管理，创建一个 `coder` 用户：

```bash
sudo useradd -m -s /bin/bash coder
sudo usermod -aG docker coder
sudo passwd -d coder
```

```txt title="/home/coder/.ssh/authorized_keys"
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKTjL65H2yhJPN6PYUp6DQ9wxeQLT1FsC9VPhTaes892
```

### Docker Socket 挂载

在 cls1-gateway 上将当前机器的 `/var/run/docker.sock` 挂载到 `/var/run/docker/$HOSTNAME.sock`，以便 Coder 可以访问 Docker，更多[技术细节](./cls1-gateway.md#docker-socket)：

```bash
sudo systemctl enable --now docker-tunnel@$HOSTNAME
```

## APT 源

### 换源

<https://mirrors.ustc.edu.cn/help/ubuntu.html>

```bash
sudo sed -i 's@//.*archive.ubuntu.com@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list.d/ubuntu.sources
sudo sed -i 's/security.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/ubuntu.sources
sudo sed -i 's/http:/https:/g' /etc/apt/sources.list.d/ubuntu.sources

sudo apt-get update
```

### nvidia-driver

```bash
sudo apt-get install nvidia-driver-570-server -y
```

### docker-ce

<https://mirrors.ustc.edu.cn/help/docker-ce.html>

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo DOWNLOAD_URL=https://mirrors.ustc.edu.cn/docker-ce sh get-docker.sh
```

!!! note "在 A6000 上 `nvidia-driver-570-server-open` 驱动存在问题，更改为闭源驱动解决"

### libnvidia-container

<https://mirrors.ustc.edu.cn/help/libnvidia-container.html>

```bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
 && curl -s -L https://mirrors.ustc.edu.cn/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://nvidia.github.io#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://mirrors.ustc.edu.cn#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update
sudo apt-get install nvidia-container-toolkit -y
```

### DOCA

<https://developer.nvidia.com/doca-downloads>

!!! note "`3.1.0` -> `latest-2.9-LTS` to ensure compatibility"

```bash
export DOCA_URL="https://linux.mellanox.com/public/repo/doca/latest-2.9-LTS/ubuntu24.04/x86_64/"
BASE_URL=$([ "${DOCA_PREPUBLISH:-false}" = "true" ] && echo https://doca-repo-prod.nvidia.com/public/repo/doca || echo https://linux.mellanox.com/public/repo/doca)
DOCA_SUFFIX=${DOCA_URL#*public/repo/doca/}; DOCA_URL="$BASE_URL/$DOCA_SUFFIX"
curl $BASE_URL/GPG-KEY-Mellanox.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/GPG-KEY-Mellanox.pub
echo "deb [signed-by=/etc/apt/trusted.gpg.d/GPG-KEY-Mellanox.pub] $DOCA_URL ./" > /etc/apt/sources.list.d/doca.list

sudo apt-get update
sudo apt-get install doca-ofed -y
```

<!-- TODO: 补充 IPoIB 配置方法 -->

### BeeGFS

<https://doc.beegfs.io/latest/quick_start_guide/quick_start_guide.html>

```bash
sudo wget https://www.beegfs.io/release/beegfs_8.1/gpg/GPG-KEY-beegfs -O /etc/apt/trusted.gpg.d/beegfs.asc
sudo wget https://www.beegfs.io/release/beegfs_8.1/dists/beegfs-noble.list -O /etc/apt/sources.list.d/beegfs.list

sudo apt-get update
sudo apt-get install beegfs-mgmtd -y
sudo apt-get install beegfs-meta libbeegfs-ib -y
sudo apt-get install beegfs-storage libbeegfs-ib -y
sudo apt-get install beegfs-client beegfs-tools beegfs-utils -y
```

<!-- TODO: 补充 BeeGFS 设置、调优 -->

### OpenZFS (by Zabbly)

<https://github.com/zabbly/zfs>

```ini title="/etc/apt/sources.list.d/zabbly-kernel-stable.sources"
Types: deb deb-src
URIs: https://pkgs.zabbly.com/kernel/stable
Suites: noble
Components: zfs
Architectures: amd64
Signed-By: /etc/apt/keyrings/zabbly.asc
```

```bash
sudo wget -q https://pkgs.zabbly.com/key.asc -O /etc/apt/keyrings/zabbly.asc

sudo apt-get update
sudo apt-get install openzfs-zfsutils openzfs-zfs-dkms openzfs-zfs-initramfs -y
```

<!-- TODO: 补充 ZFS 设置、调优 -->

## APT 设置

### unattended-upgrades

由于实验室所有程序均运行在 Docker 环境中，除显卡驱动外，宿主环境可以开启全量自动更新。

```bash
sudo apt-get install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

禁用 Nvidia 驱动更新：

```ini title="/etc/apt/apt.conf.d/50unattended-upgrades"
Unattended-Upgrade::Package-Blacklist {
    "nvidia-";
    "libnvidia-";
}
```

### autoremove

[（可选）允许 autoremove 清理内核](./upgrading.md#清理内核)

## `/etc/` 配置

### `/etc/docker/daemon.json`

<https://mirrors.ustc.edu.cn/help/dockerhub.html>

```json
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
		"http-proxy": "http://proxy.lab.tiankaima.cn:7890",
		"https-proxy": "http://proxy.lab.tiankaima.cn:7890",
		"no-proxy": "localhost,127.0.0.1,::1,mirrors.ustc.edu.cn"
	}
}
```

!!! note

    - 默认情况下，restart Docker Daemon 会导致所有容器内进程被杀死，`live-restore` 选项可以避免这种情况。
    - `live-restore` 选项默认关闭，可以在修改 `/etc/docker/daemon.json` 后执行 `sudo systemctl reload docker` 使其生效。
    - 修改 `proxies` 选项后需要执行 `sudo systemctl restart docker` 使其生效，如果此时有容器正在运行，请通过 `docker info | grep Live` 确认 `Live Restore` 是否为 `true`，如果为 `false`，请先按上面的过程启用 `live-restore`。

### `/etc/hosts`

```txt title="/etc/hosts"
127.0.0.1       localhost
127.0.0.1       cls1-srv1 # change this to hostname

192.168.48.1    cls1-gateway

# IPoIB
10.9.0.1        cls1-srv1 # 8xa6000
10.9.0.2        cls1-srv2 # 8x4090
10.9.0.3        cls1-srv3 # 8x4090
10.9.0.4        cls1-srv4 # 8x4090
#10.9.0.5        cls1-srv5 # 8x4090D

192.168.48.201  cls1-srv1 # 8xa6000
192.168.48.202  cls1-srv2 # 8x4090
192.168.48.203  cls1-srv3 # 8x4090
192.168.48.204  cls1-srv4 # 8x4090
#192.168.48.205  cls1-srv5 # 8x4090D

192.168.51.24   cls2-srv1 # 8x3090
192.168.51.135  cls2-srv2 # 8x2080ti
192.168.51.249  cls2-srv3 # 4x2080ti
192.168.51.158  cls2-srv4 # 4x2080ti
192.168.51.157  cls2-srv5 # master
192.168.51.41   cls2-srv6 # 2a40
192.168.51.184  cls2-srv7 # 4xtitanxp

# In case of DNS failure
202.38.64.59 wlt.ustc.edu.cn
```

### `/etc/fstab`

!!! note "OpenZFS/BeeGFS 均不存放于此"

!!! note "cls1-srv1 仍然适用硬件 RAID，可考虑切换到 OpenZFS 方案"

```txt title="/etc/fstab"
# cls1-srv1
/dev/disk/by-uuid/a6d047aa-c381-420a-bbd2-61c965a5b812 /data/cls1-srv1-pool auto nosuid,nodev,nofail,x-gvfs-show 0 0

# cls-2 servers, enable for all
cls2-srv5:/data/cls2-pool1 /data/cls2-pool1 nfs defaults,nofail
cls2-srv5:/data/cls2-pool2 /data/cls2-pool2 nfs defaults,nofail
```

```bash
sudo systemctl daemon-reload
sudo mount -a
```

### `/etc/systemd/timesyncd.conf`

```ini title="/etc/systemd/timesyncd.conf"
[Time]
NTP=time.ustc.edu.cn
```

```bash
sudo systemctl restart systemd-timesyncd
```

## 安全设置

### ssh

```txt title="/etc/ssh/sshd_config"
PermitRootLogin no
PasswordAuthentication no
```

重启服务：

```bash
sudo systemctl restart ssh
```

!!! note

    对于特殊用户，不得不开启密码访问的，在确定其权限后，可以使用 `Match` 语句：

    ```txt title="/etc/ssh/sshd_config.d/0X-specialuser.conf"
    Match User specialuser
    PasswordAuthentication yes
    Match all
    ```

### fail2ban

```bash
sudo apt install fail2ban
```

设置：

```ini title="/etc/fail2ban/jail.local"
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

启动 & 检查：

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status
```

### ufw

暂无

### iptables/nftables

暂无

## 监控

参照 [cls1-gateway/监控](./cls1-gateway.md#监控) 配置。

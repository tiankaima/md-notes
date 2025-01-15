# 检查单

## 硬件检查

-   [x] CPU、GPU 是否正常，符合配置
-   [x] RAM 总量、通道配置
-   [x] 硬盘容量、RAID 配置
-   [x] 网卡是否正常，速度
-   [x] IPMI 能否正常访问

### IPMI

- IPMI 默认不开启 DHCP，需要手动给本地 Assign 一个 IP 地址：
    - IP: `192.168.1.2`
    - Subnet mask: `255.255.255.0`
- 登陆 IPMI 默认用户名密码：
    - 用户名：`ADMIN`
    - 密码：`ADMIN`
- **登陆 IPMI 后务必更改默认密码。**出于安全考虑，IPMI 不应直连网络通。（考虑设置 DHCP 后连接到网关路由器，使用内网地址访问）

## 环境配置

### 系统安装

考虑安装 Ubuntu Server (LTS)。

??? note "安装 XX.04 LTS 而不是 XX.10"

    Release Cycle: https://ubuntu.com/about/release-cycle

    tl;dr:

    - XX.04 LTS
    - ~~XX.10 non-LTS 每六个月发行一次，支持九个月~~

!!! warning "不要使用安装引导界面安装 docker 等，此位置默认使用 snap 安装。"

### Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo DOWNLOAD_URL=https://mirrors.ustc.edu.cn/docker-ce sh get-docker.sh
```

#### libnvidia-container

```bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://mirrors.ustc.edu.cn/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://nvidia.github.io#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://mirrors.ustc.edu.cn#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```

```bash
sudo apt update
sudo apt install -y nvidia-container-toolkit
```

#### `/etc/docker/daemon.json`

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
		"http-proxy": "http://192.168.50.1:7890",
		"https-proxy": "http://192.168.50.1:7890",
		"no-proxy": "localhost, 127.0.0.1, ::1, mirrors.ustc.edu.cn"
	}
}
```

!!! note

    - `/etc/docker/daemon.json` 启用了 `live-restore`，重启 Daemon 不影响容器内进程，这对于调整 `http_proxy` 等需要重启（而不是 reload）的任务至关重要。

    - 注意，该选项默认关闭，`systemctl restart docker` 之前去确认 `docker info | grep Live` 是否为 `true`，如果为 `false`，也无需 schedule 停机，只需 `systemctl reload docker` 即可。

### `/etc/hosts`

```txt title="/etc/hosts"
192.168.51.24   cls2-srv1 # 8x3090
192.168.51.135  cls2-srv2 # 8x2080ti
192.168.51.249  cls2-srv3 # 4x2080ti
192.168.51.158  cls2-srv4 # 4x2080ti
192.168.51.157  cls2-srv5 # master
192.168.51.41   cls2-srv6 # 2xa60
192.168.51.184  cls2-srv7 # 4xtitanxp
```

### `Coder` 用户

为方便集中管理，创建一个 `coder` 用户：

```bash
sudo useradd -m -s /bin/bash coder
sudo usermod -aG docker coder
```

```txt title="/home/coder/.ssh/authorized_keys"
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKTjL65H2yhJPN6PYUp6DQ9wxeQLT1FsC9VPhTaes892
```

### `apt`

更换软件源：

```bash
sudo sed -i 's@//.*archive.ubuntu.com@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list.d/ubuntu.sources
```

#### unattended-upgrades

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

### 网络配置

以 8x4090 为例，其网卡有 4 个端口：

=== "/etc/systemd/network/00-ens20f0.network"

    ```ini
    [Match]
    Name=ens20f0

    [Network]
    Address=192.168.48.3/24
    ```

=== "/etc/systemd/network/01-ens20f1.network"

    ```ini
    [Match]
    Name=ens20f1

    [Network]
    Address=10.9.0.1/24
    # Gateway=10.9.0.2
    ```

=== "/etc/systemd/network/02-ens20f2.network"

    ```ini
    [Match]
    Name=ens20f2

    [Network]
    DHCP=yes
    ```

!!! note

    - 关于实验室的网络拓扑，参考 [docs/lab/network.md](./network.md)
    - Ubuntu Desktop 与 Server 使用不同的网络配置工具，Desktop 使用 NetworkManager，Server 使用 systemd-networkd
        - 在 Server 安装桌面环境时也可能出现 NetworkManager 与 systemd-networkd 冲突，需要禁用前者
        - 有条件的情况下，建议全部切换到 systemd-network

!!! warning "systemd-networkd 现在自带 dhcp-client, 只需要在配置文件中设置 `DHCP=yes` 即可"

#### NTP

```ini title="/etc/systemd/timesyncd.conf"
[Time]
NTP=time.ustc.edu.cn
```

```bash
sudo systemctl restart systemd-timesyncd
```

#### 内网配置

!!! note "只在直连外网的机器上配置 WireGuard"

```bash
sudo apt install wireguard
```

将 [`wg-easy`](http://192.168.50.1:51821/) 生成的 config file 放到 `/etc/wireguard/lab.conf`，并启动：

```bash
sudo wg-quick up lab
```

!!! note

    偶尔遇到单向 ping 不通的情况，因此在 `sudo crontab -e` 中添加：

    ```bash
    */1 * * * * ping -c 5 10.8.0.2
    ```

### 安全设置

#### fail2ban

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

#### ssh

```txt title="/etc/ssh/sshd_config"
PermitRootLogin no
PasswordAuthentication no
```

重启服务：

```bash
sudo systemctl restart sshd
```

!!! note

    对于特殊用户，不得不开启密码访问的，在确定其权限后，可以使用 `Match` 语句：

    ```txt title="/etc/ssh/sshd_config.d/0X-specialuser.conf"
    Match User specialuser
    PasswordAuthentication yes
    Match all
    ```

#### ufw

暂无

#### iptables

暂无
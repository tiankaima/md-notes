# 检查单

## 上架检查单

检查单：

-   [x] CPU、GPU 是否正常，符合配置
-   [x] RAM 总量、通道配置
-   [x] 硬盘容量、RAID 配置
-   [x] 网卡是否正常，速度
-   [x] IPMI 能否正常访问

!!! note

    RAID 配置通常在 IPMI，部分机器可在 UEFI 中额外配置顺序

!!! note

    IPMI 默认不开启 DHCP，需要手动给本地 Assign 一个 IP 地址，一般设置成 `192.168.1.2`，并附带 Subnet mask: `255.255.255.0`

!!! warning

    首次登陆 IPMI 后务必更改默认密码。出于安全考虑，IPMI 不应直连网络通。（考虑设置 DHCP 后连接到网关路由器，使用内网地址访问）

## 环境配置

### 系统安装

考虑安装 Ubuntu Server (LTS)。

!!! note

    Release Cycle: https://ubuntu.com/about/release-cycle

    tl;dr:

    - XX.04 LTS
    - XX.10 non-LTS 每六个月发行一次，支持九个月

更换软件源：

```bash
sudo sed -i 's@//.*archive.ubuntu.com@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list.d/ubuntu.sources
```

在安装界面可以直接输入 `https://mirrors.ustc.edu.cn/ubuntu` （Ubuntu 24.04 LTS）

!!! warning

    不要使用安装引导界面安装 docker 等，此位置默认使用 snap 安装，不推荐。

### 网络配置

以 8x4090 为例，其网卡有 4 个端口：

```bash
(base) tiankaima@srv-8x4090:~$ cat /etc/systemd/network/00-ens20f0.network
[Match]
Name=ens20f0

[Network]
Address=192.168.48.3/24
(base) tiankaima@srv-8x4090:~$ cat /etc/systemd/network/01-ens20f1.network
[Match]
Name=ens20f1

[Network]
Address=10.9.0.1/24
# Gateway=10.9.0.2
(base) tiankaima@srv-8x4090:~$ cat /etc/systemd/network/02-ens20f2.network
[Match]
Name=ens20f2

[Network]
DHCP=yes
```

!!! note

    关于实验室的网络拓扑，参考 [docs/lab/network.md](./network.md)

!!! note

    Ubuntu Desktop 与 Server 使用不同的网络配置工具，Desktop 使用 NetworkManager，Server 使用 systemd-networkd

    在 Server 安装桌面环境时也可能出现 NetworkManager 与 systemd-networkd 冲突，需要手动配置

    有条件的情况下，建议全部切换到 systemd-networkd

!!! warning

    systemd-networkd 现在自带 dhcp-client, 只需要在配置文件中设置 `DHCP=yes` 即可

### 内网配置

```bash
sudo apt install wireguard
```

将 `wg-easy` 生成的 config file 放到 `/etc/wireguard/lab.conf`，并启动：

```bash
sudo wg-quick up lab
```

!!! note

    偶尔遇到单向 ping 不通的情况，因此在 `sudo crontab -e` 中添加：

    ```bash
    */1 * * * * ping -c 5 10.8.0.2
    ```

### 安全设置

-   fail2ban:

    ```bash
    sudo apt install fail2ban
    ```

    设置：

    ```bash
    sudo vim /etc/fail2ban/jail.local
    ```

    ```bash
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

-   ssh:

    ```bash
    sudo vim /etc/ssh/sshd_config
    ```

    ```bash
    PermitRootLogin no
    PasswordAuthentication no
    ```

    重启服务：

    ```bash
    sudo systemctl restart sshd
    ```

    !!! note

        对于特殊用户，不得不开启密码访问的，在确定其权限后，可以使用 `Match` 语句：

        ```bash
        Match User specialuser
        PasswordAuthentication yes
        Match all
        ```

        考虑放入 `/etc/ssh/sshd_config.d/0X-specialuser.conf` 中

-   ufw: 暂无
-   iptables: 暂无

### Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo DOWNLOAD_URL=https://mirrors.ustc.edu.cn/docker-ce sh get-docker.sh
```

### libnvidia-container

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

### docker-daemon.json

```json
{
    "runtimes": {
        "nvidia": {
            "args": [],
            "path": "nvidia-container-runtime"
        }
    },
    "registry-mirrors": ["https://mirrors.ustc.edu.cn/"]
}
```

### unattended-upgrades

!!! note

    由于实验室所有程序均运行在 Docker 环境中，宿主环境可以开启全量自动更新。

```bash
sudo apt-get install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

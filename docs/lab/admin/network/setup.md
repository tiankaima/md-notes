---
title: 设置
last_verified: 2026-07-27
---

# 设置 {#network-setup}

实验室服务器使用三类网络：`cls1` 和 `cls2` 的管理网负责 SSH 与普通服务，`cls1` 的
IPoIB 负责 [BeeGFS](../services/beegfs/) 的 RDMA 数据路径，Tailscale 连接不同机房。地址规划见
[拓扑](./topology.md#address-plan)。

## Hostname {#hostname}

主机名同时用于 SSH、[DNS](../services/dns/)、[监控](../services/monitoring/)和
[Slurm](../services/slurm/)。设置后检查静态主机名：

```shell
sudo hostnamectl set-hostname HOSTNAME
hostnamectl --static
```

## `cls1` 管理网 {#cls1-management-network}

`cls1-srv1..4` 使用 `192.168.48.201..204`，网关为 `192.168.48.1`。当前由
`systemd-networkd` 管理。`cls1-srv1` 的配置如下：

```ini title="/etc/systemd/network/10-enxc8a3625d5de7.network"
[Match]
Name=enxc8a3625d5de7

[Network]
Address=192.168.48.201/24
Gateway=192.168.48.1
DNS=202.38.64.56
DNS=202.38.64.17
IPv6AcceptRA=yes
LinkLocalAddressing=ipv6
```

其他节点需要替换接口名和地址。应用前检查生成配置，远程修改时保留 IPMI 会话：

```shell
sudo networkctl reload
sudo networkctl reconfigure INTERFACE
networkctl status INTERFACE
ip route get 192.168.48.1
```

输出中应显示预定地址，路由查询应从管理接口直达 `192.168.48.1`。

## `cls2` 管理网 {#cls2-management-network}

`cls2` 服务器通过 DHCP 获取 IPv4 和 IPv6 地址，IPv4 地址在路由器上按 MAC 地址固定。
服务器上的 Netplan 配置只负责启用 DHCP：

```yaml title="/etc/netplan/50-cloud-init.yaml"
network:
  version: 2
  ethernets:
    eno1:
      dhcp4: true
      dhcp6: true
    eno2:
      dhcp4: true
      dhcp6: true
```

修改网卡或更换主板后，先更新路由器上的 DHCP 绑定，再检查租约和默认路由：

```shell
ip -brief address
ip route
networkctl status INTERFACE
```

## `cls1` IPoIB {#cls1-ipoib}

四台 `cls1` 计算节点的 `ibp194s0` 分别使用 `10.9.0.1..4/24`。IPoIB 当前直接由
`systemd-networkd` 配置。`cls1-srv1` 的配置如下：

```ini title="/etc/systemd/network/20-ibp194s0.network"
[Match]
Name=ibp194s0

[Network]
Address=10.9.0.1/24
IPv6AcceptRA=no
LinkLocalAddressing=ipv6
```

应用后分别检查 InfiniBand 端口、IPoIB 地址和对端：

```shell
ibstat
networkctl status ibp194s0
ping -I ibp194s0 10.9.0.2
```

`ibstat` 中端口应为 `Active`，`networkctl` 应显示 `10.9.0.X`。`ping` 验证 IPoIB，
`ib_write_bw` 验证 RDMA 数据路径。带宽测试会占用链路，应避开存储作业。

## Tailscale {#tailscale}

先保存 Tailscale 的签名密钥：

```shell
sudo apt-get update
sudo apt-get install ca-certificates curl
curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.noarmor.gpg \
  | sudo tee /usr/share/keyrings/tailscale-archive-keyring.gpg >/dev/null
sudo chmod 0644 /usr/share/keyrings/tailscale-archive-keyring.gpg
```

集群主机使用 USTC 镜像，`jp-2` 使用 Tailscale 官方源：

=== "集群主机"

    ```text title="/etc/apt/sources.list.d/tailscale.list"
    deb [signed-by=/usr/share/keyrings/tailscale-archive-keyring.gpg] https://mirrors.ustc.edu.cn/tailscale/ubuntu noble main
    ```

=== "jp-2"

    ```text title="/etc/apt/sources.list.d/tailscale.list"
    deb [signed-by=/usr/share/keyrings/tailscale-archive-keyring.gpg] https://pkgs.tailscale.com/stable/ubuntu noble main
    ```

安装并启动 Tailscale：

```shell
sudo apt-get update
sudo apt-get install tailscale
sudo systemctl enable --now tailscaled
```

检查软件源、软件包和服务：

```shell
grep -F 'tailscale-archive-keyring.gpg' /etc/apt/sources.list.d/tailscale.list
apt-cache policy tailscale
dpkg-query -W tailscale
systemctl is-active tailscaled
tailscale version
```

[Headscale](../services/headscale/) 控制面位于 `jp-2`。管理员创建一次性 preauth key 后，新节点执行：

```shell
sudo tailscale up --login-server=https://headscale.lab.tiankaima.cn --authkey KEY
tailscale status
```

普通服务器只加入 Tailnet。机房路由器还需要发布物理网段，并由管理员在 Headscale 中批准
路由。服务器接入后用 Magic DNS 名称检查另一台节点：

```shell
tailscale ping PEER
```

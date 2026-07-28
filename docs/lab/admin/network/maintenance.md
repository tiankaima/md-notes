---
title: 维护
last_verified: 2026-07-27
---

# 维护 {#network-maintenance}

网络故障需要先确定影响范围。单台服务器失联通常与该节点的链路、地址或 SSH 有关。整个
机房从远端失联时，应检查机房路由器发布的 Tailscale subnet route。

## 单台服务器无法通过 SSH 访问 {#single-host-unreachable}

先分别使用主机名和管理地址连接。地址可以连接而主机名不行，问题在 DNS。两者都不能连接
时，从同一机房的服务器检查目标地址：

```shell
ping -c 3 HOST_ADDRESS
ip route get HOST_ADDRESS
```

可以 ping 通但 SSH 拒绝连接时，通过 IPMI 控制台检查 SSH：

```shell
systemctl status ssh --no-pager
ss -ltnp 'sport = :22'
journalctl -u ssh -n 100 --no-pager
```

不能 ping 通时，在 IPMI 控制台检查接口和路由。`networkctl status` 会同时显示使用的
配置文件，因此可以区分配置未加载和物理链路断开：

```shell
ip -brief link
ip -brief address
ip route
networkctl status INTERFACE
```

`no-carrier` 指向线缆、交换机端口或网卡。接口有 carrier 但没有预定地址时，检查
`/etc/systemd/network/`、Netplan 或 `cls2` 的 DHCP 绑定。

## 整个机房从远端失联 {#site-unreachable}

先检查 `jp-2` 到机房路由器的 Tailnet 连接，再检查路由器是否仍发布机房网段：

```shell
tailscale status
tailscale ping ROUTER
```

路由器在线但机房网段不可达时，检查 subnet route 是否仍被发布和批准。机房内节点可以
互相访问，只有跨机房访问失败，也说明服务器管理网仍然工作，问题位于 Tailnet 路由。

[Headscale](../services/headscale/) 负责节点注册和策略。[DERP](../services/derp/) 在节点无法建立直接连接时转发流量。现有节点全部
离线时，分别检查 Headscale、DERP、机房路由器和物理网络。

## 主机名无法解析 {#dns-failure}

检查 DNS 查询结果和 NSS 返回的地址：

```shell
resolvectl query HOSTNAME
resolvectl status
getent ahosts HOSTNAME
```

只有一个节点解析失败时，检查该节点的 DNS 配置。多个节点得到相同的错误地址时，检查
Cloudflare 记录或 Headscale 的 Magic DNS。DNS 的域名划分见 [DNS](../services/dns/)。

## IPoIB 或 RDMA 异常 {#ipoib-rdma-failure}

`cls1` 的 [BeeGFS](../services/beegfs/) 使用 IPoIB 和 RDMA。先检查端口状态和 IPoIB：

```shell
ibstat
networkctl status ibp194s0
ping -I ibp194s0 PEER_IP
```

`ibstat` 显示端口状态不是 `Active` 时，检查线缆、交换机端口和 Subnet Manager。端口为 `Active` 但没有
`10.9.0.X` 时，检查 `/etc/systemd/network/20-ibp194s0.network`。

IPoIB 可以 ping 通但 BeeGFS 仍回退或超时时，再检查 RDMA verbs 和数据路径：

```shell
ibv_devinfo
ib_write_bw PEER_IP
```

`ib_write_bw` 需要先在对端启动服务端，测试期间不要运行存储作业。RDMA 正常后再检查
[BeeGFS](../services/beegfs/#troubleshooting)的服务配置。

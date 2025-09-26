# 网络拓扑

## Headscale 拓扑

`jp-2-server` 部署了 Headscale 控制平面 <https://headscale.lab.tiankaima.cn/web>，所有 Tailscale 节点通过这个 Headscale 平面进行连接。

!!! note

    - `jp-2-server` 上也需要另外的 Tailscale 客户端。
    - Headscale 使用 Docker 进行管理，升级前后注意备份数据/密钥。
    - 内网 IP 随机分配，请使用 Tailscale 提供的 Magic DNS，或者使用 `tailscale status` 查看 IP。

分别在 `cls1` 和 `cls2` 机房的路由器上配置了 Tailscale，各自分配的 IP 段如下（均为静态）：

-   `192.168.48.0/24`: `cls1`（高新区 1 号学科楼机房）

    -   `192.168.48.10X`: IPMI
    -   `192.168.48.20X`: `cls1-srvX`

-   `192.168.50.0/24`：`cls2`（先研院机房）

    -   暂未调整，目前依靠 DHCP 分配 IP，在路由器上进行了固定。

其余设备不再直接接入内网，均通过 Coder 自带的 tailscale 打洞。

---

## 旧 Wireguard 拓扑

!!! warning

    旧的 WireGuard 拓扑已经不再使用，现已迁移到 Headscale。下面的内容仅供存档使用。

占用的 IP 段：

-   `10.8.0.0/24`
-   `192.168.48.0/22`
-   `192.168.10.0/24`

!!! note

    WireGuard 接入点 `222.195.90.19`

    - :51280/udp
    - :51281/tcp (Web UI)

    **管理面板只对内网开放**。

### 高新区 1 号学科楼机房

!!! note

    -   (b608) `10.8.0.X`
    -   `192.168.48.1/24` -> `8x4090`, ~~`8xa6000`~~ (And their IPMIs)

-   `8x4090`

    -   ens20f0 `192.168.48.3` -> ASUS Router
    -   ens20f1 `10.9.0.1` -> `8xa6000`
    -   ens20f2: `211.86.155.32` -> NIC Gateway

    (WireGuard)

    -   lab: `10.8.0.22`
    -   Docker subnet: `192.168.10.1/24` (Intranet Routing available, [deployment docs](/blog/server/headscale/#docker-subnet))

-   `8xa6000`

    -   `enp194s0f0` `210.45.71.238` -> NIC Gateway
    -   `enp194s0f1` `10.9.0.2` -> `8x4090`

### 先研院机房

!!! note

    -   (cluster) `10.8.0.4`
    -   `192.168.51.0/24`

TBC

### 信智楼 10 楼实验室

!!! note

    -   (b1004) `10.8.0.5`
    -   `192.168.50.0/24`

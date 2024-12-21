# 网络拓扑

占用的 IP 段：

-   `10.8.0.0/24`
-   `192.168.48.0/22`
-   `192.168.10.0/24`

!!! warning

    WireGuard 接入点 `222.195.90.19`

    - :51280/udp
    - :51281/tcp (Web UI)

    **管理面板只对内网开放**。

## 高新区 1 号学科楼机房

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

## 先研院机房

!!! note

    -   (cluster) `10.8.0.4`
    -   `192.168.51.0/24`

TBC

## 信智楼 10 楼实验室

!!! note

    -   (b1004) `10.8.0.5`
    -   `192.168.50.0/24`

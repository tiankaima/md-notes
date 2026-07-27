---
title: 拓扑
last_verified: 2026-07-26
---

# 拓扑 {#network}

- Headscale 管理跨机房的 Tailscale 网络。
- 控制面运行在 `jp-2`，机房路由器发布物理网段。
- 配置见 [Headscale](../services/headscale/) 和 [DERP](../services/derp/)。

## 地址规划 {#address-plan}

| 网段 | 用途 | 说明 |
| --- | --- | --- |
| `192.168.48.0/24` | `cls1` 机房 | 网关、服务器和 IPMI 使用固定规划 |
| `192.168.51.0/24` | `cls2` 机房 | 主要使用 DHCP，并在路由器侧固定绑定 |
| `10.9.0.0/24` | `cls1` IPoIB | RDMA/InfiniBand 链路 |

| 地址 | 主机 |
| --- | --- |
| `192.168.48.1` | `cls1-gateway` |
| `192.168.48.10X` | IPMI |
| `192.168.48.20X` | `cls1-srvX` |

`cls2` 服务器地址以路由器的 DHCP 绑定为准。

## 网络拓扑 {#topology}

```mermaid
flowchart LR
  JP2["jp-2"] ---|Tailscale| CLS1Router["cls1 router"]
  JP2 ---|Tailscale| CLS2Router["cls2 router"]
  CLS1Router ---|192.168.48.0/24| Gateway["cls1-gateway"]
  CLS1Router ---|192.168.48.0/24| CLS1["cls1-srv1..4"]
  IBSwitch["InfiniBand switch"] ---|10.9.0.0/24 IPoIB| CLS1
  CLS2Router ---|192.168.51.0/24| CLS2["cls2-srv1..7"]
```

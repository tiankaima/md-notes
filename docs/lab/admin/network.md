# 网络拓扑

## 当前拓扑（Tailscale）

`jp-2` 部署了 Headscale 控制平面：<https://headscale.lab.tiankaima.cn/web/>。  
所有接入的 Tailscale 节点通过该控制平面完成注册、策略下发和互联。

!!! note

    - `jp-2` 自身也需要安装并登录 Tailscale 客户端。
    - Headscale 由 Docker 管理，升级前后请备份数据目录和密钥文件。
    - 节点的 Tailnet 地址为随机分配，优先使用 Magic DNS；必要时用 `tailscale status` 确认当前地址。

### 地址规划

目前在 `cls1` 和 `cls2` 的路由器上都已接入 Tailscale，并对机房网段做了固定规划。

- `192.168.48.0/24`：`cls1`（高新区 1 号学科楼机房）
  
    - `192.168.48.1`: `cls1-gateway`
    - `192.168.48.10X`：`cls1` IPMI
    - `192.168.48.20X`：`cls1-srvX`

- `192.168.50.0/24`：`cls2`（先研院机房）

    - `cls2` 当前主要依赖 DHCP 分配，并已在路由器侧做固定绑定

### 运维提示

- 新节点接入与控制面配置见 `docs/lab/admin/services.md` 的 Headscale 章节。
- 网络问题排查优先检查：节点在线状态、子网路由通告、ACL 策略、DERP 连通性。
- 发生大规模异常时，优先保证 `jp-2` 的 Headscale 可用，再排查各机房路由器节点状态。

---

## 旧拓扑存档（WireGuard）

!!! warning

    旧的 WireGuard 拓扑已经停用，现已迁移到 Headscale。以下内容仅作历史记录。

### 旧网段

- `10.8.0.0/24`
- `192.168.48.0/22`
- `192.168.10.0/24`

### 旧入口

WireGuard 接入点：`222.195.90.19`

- `:51280/udp`
- `:51281/tcp`（Web UI）

管理面板仅对内网开放。

### 高新区 1 号学科楼机房（旧）

!!! note

    - (B608) `10.8.0.X`
    - `192.168.48.1/24` -> `8x4090`、~~`8xa6000`~~（含对应 IPMI）

- `8x4090`

    - `ens20f0`: `192.168.48.3` -> ASUS Router
    - `ens20f1`: `10.9.0.1` -> `8xa6000`
    - `ens20f2`: `211.86.155.32` -> NIC Gateway
    - WireGuard 地址（`lab`）：`10.8.0.22`
    - Docker 子网：`192.168.10.1/24`（Intranet Routing，见 [deployment docs](../../blog/server/headscale.md#docker-subnet)）

- `8xa6000`

    - `enp194s0f0`: `210.45.71.238` -> NIC Gateway
    - `enp194s0f1`: `10.9.0.2` -> `8x4090`

### 先研院机房（旧）

!!! note

    - (cluster) `10.8.0.4`
    - `192.168.51.0/24`

### 信智楼 10 楼实验室（旧）

!!! note

    - (B1004) `10.8.0.5`
    - `192.168.50.0/24`

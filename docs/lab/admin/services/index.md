---
title: 服务
description: 当前实验室服务、部署位置和依赖关系
---

# 服务 {#services}

## 依赖关系 {#dependencies}

```mermaid
flowchart TB
  subgraph Legend["图例"]
    direction LR
    ContainerLegend["容器化"]
    MonitoredLegend["已监控"]
  end

  MonitoredLegend ~~~ Nspawn["systemd-nspawn"]
  Nspawn --> Slurm["Slurm"]
  Nspawn --> NFS["NFS"]
  NvidiaToolkit["NVIDIA Container Toolkit"] --> NvidiaDriver["NVIDIA Driver"]
  DERP["DERP"] --> Headscale["Headscale"]

  Slurm --> SSSD["SSSD"]
  Slurm --> BeeGFS["BeeGFS"]
  Slurm --> NvidiaDriver
  NvidiaToolkit --> Docker["Docker"]

  SSSD --> LLDAP["LLDAP"]
  LLDAP --> Caddy["Caddy"]
  Headscale --> Caddy
  Caddy --> DNS["DNS"]

  NFS --> ZFS["ZFS"]
  BeeGFS --> DOCA["DOCA / RDMA"]

  classDef container fill:#264f78,stroke:#60a5fa,color:#ffffff;
  classDef monitored stroke:#22c55e,stroke-width:4px;

  class ContainerLegend,LLDAP,DERP,Headscale,Caddy container;
  class MonitoredLegend,Slurm,NvidiaToolkit,NvidiaDriver,Docker,SSSD,NFS,BeeGFS,ZFS,Headscale,Caddy,DOCA monitored;
```

所有服务器先完成[服务器设置](../server/setup.md#server-setup)和网络配置。

## 部署位置 {#deployments}

| 服务 | `cls1-gateway` | `login` | GPU 计算节点 | `jp-2` |
| --- | :---: | :---: | :---: | :---: |
| [systemd-nspawn](./systemd-nspawn/) | ☑ | | | |
| [监控](./monitoring/) | ☑ | | ☑ | ☑ |
| [Postfix](./postfix/) | ☑ | ☑ | ☑ | |
| [Slurm](./slurm/) | ☑ | ☑ | ☑ | |
| [SSSD](./sssd/) | ☑ | ☑ | ☑ | ☑ |
| [LLDAP](./lldap/) | | | | ☑ |
| [NFS](./nfs/) | ☑ | | | |
| [BeeGFS](./beegfs/) | ☑ | | ☑ | |
| [ZFS](./zfs/) | ☑ | | | |
| [DERP](./derp/) | ☑ | | | ☑ |
| [Headscale](./headscale/) | | | | ☑ |
| [Caddy](./caddy/) | ☑ | | | ☑ |
| [NVIDIA Container Toolkit](./nvidia-container-toolkit/) | | | ☑ | |
| [NVIDIA Driver](./nvidia-driver/) | | | ☑ | |
| [Docker](./docker/) | ☑ | | ☑ | ☑ |
| [DOCA / RDMA](./doca/) | | | ☑ | |
| [DNS](./dns/) | | | | |

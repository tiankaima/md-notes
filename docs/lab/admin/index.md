---
title: 管理员文档
description: 实验室服务器、网络和服务的手工搭建与维护
---

# 管理员文档 {#admin}

这里记录实验室服务器和服务的手工搭建与维护方法。

## 文档 {#documentation}

- [服务器检查单](./server/checklist.md)
- [服务器设置](./server/setup.md)
- [服务器维护](./server/maintenance.md)
- [网络拓扑](./network/topology.md)
- [网络设置](./network/setup.md)
- [网络维护](./network/maintenance.md)
- [服务](./services/index.md)
- [归档](./archive/index.md)
- [维护日志](../maintenance/log.md)

不再使用的服务和配置放入归档。

## 注意 {#notes}

- 公开文档不能包含密码、Token、私钥和认证文件
- 修改网络、存储、驱动或认证前，确认 IPMI/KVM 可用
- 修改服务后，更新 `last_verified` 和[维护日志](../maintenance/log.md)

---
title: 检查单
last_verified: 2026-07-26
---

# 检查单 {#checklist}

## 硬件 {#hardware}

- [ ] CPU、GPU 型号和数量符合采购配置
- [ ] RAM 总量、通道和 ECC 状态正常
- [ ] 系统盘、数据盘、RAID/HBA 状态正常
- [ ] 网卡、链路速率和固件正常
- [ ] 测试 IPMI/BMC 可以**独立**访问
- [ ] 修改 IPMI/BMC 默认密码

## 配置 {#configuration}

- [ ] 安装 Ubuntu Server LTS
- [ ] 完成[服务器设置](./setup.md)
- [ ] 完成[网络设置](../network/setup.md)，[地址规划](../network/topology.md#address-plan)
- [ ] 配置[各类服务](../services/index.md)

## 记录 {#records}

- [ ] 更新固定地址、[DNS](../services/dns/)和[监控](../services/monitoring/)目标
- [ ] 更新网络文档和服务文档
- [ ] 在[维护日志](../../maintenance/log.md)记录变更

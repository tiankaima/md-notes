---
title: DNS
last_verified: 2026-07-26
---

# DNS {#dns}

DNS 托管在 Cloudflare。

## 搭建 {#dns-setup}

### 配置域名 {#configure-domains}

| DNS Domain | 记录 | 用途 |
| --- | --- | --- |
| `lab.tiankaima.cn` | CNAME | HTTP(S)、代理和控制面入口，指向 `s.tiankaima.dev` 下的服务器记录 |
| `s.tiankaima.dev` | A、AAAA | 服务器地址 |

配置后查询两类域名：

```shell
dig CNAME SERVICE.lab.tiankaima.cn
dig A HOST.s.tiankaima.dev
dig AAAA HOST.s.tiankaima.dev
```

## 维护 {#dns-maintenance}

### 域名无法解析 {#dns-resolution-failure}

分别查询 CNAME、IPv4 和 IPv6 记录：

```shell
dig CNAME SERVICE.lab.tiankaima.cn
dig A HOST.s.tiankaima.dev
dig AAAA HOST.s.tiankaima.dev
```

Cloudflare 中的记录应与服务器地址和服务入口一致。

---
title: DERP
last_verified: 2026-07-26
---

# DERP {#derp}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | 内置中继位于 `jp-2`，独立中继位于 `cls1-gateway` |
| 依赖 | [Headscale](../headscale/)、[Docker](../docker/)、[Caddy](../caddy/)、[DNS](../dns/) |
| 使用方 | Tailscale 客户端 |

## 搭建 {#derp-setup}

### 配置内置 DERP {#configure-embedded-derp}

`jp-2` 的 Headscale 提供内置 DERP：

```yaml title="/srv/docker/headscale/conf/config.yaml"
derp:
  server:
    enabled: true
    region_id: 999
    region_code: headscale
    region_name: Headscale Embedded DERP
    stun_listen_addr: 0.0.0.0:3478
    private_key_path: /var/lib/headscale/derp_server_private.key
    automatically_add_embedded_derp_region: true
  paths:
    - /etc/headscale/derp.yaml
  auto_update_enabled: true
  update_frequency: 1h
```

重启 Headscale 后检查内置 DERP：

```shell
cd /srv/docker/headscale
docker compose config --quiet
docker compose up -d
curl --fail https://headscale.lab.tiankaima.cn/derp/probe
```

### 配置独立 DERP {#configure-standalone-derp}

`cls1-gateway` 运行独立 DERP：

```yaml title="/srv/docker/derper/docker-compose.yml"
services:
  derper:
    image: ghcr.io/kaaanata/derper:latest@sha256:ad459b034ec531685d0ad29460d90b316337505ae91681240d908a3d6cd83a7d
    container_name: derper
    restart: always
    environment:
      - DERP_DOMAIN=cls1-gateway.derp.tiankaima.cn
      - DERP_ADDR=0.0.0.0:3002
      - DERP_STUN=true
      - DERP_STUN_PORT=3478
      - DERP_HTTP_PORT=3002
      - DERP_VERIFY_CLIENTS=false
    ports:
      - "0.0.0.0:3002:3002"
      - "[::]:3002:3002"
      - "0.0.0.0:3478:3478/udp"
      - "[::]:3478:3478/udp"
    volumes:
      - /var/run/tailscale/tailscaled.sock:/var/run/tailscale/tailscaled.sock
```

`/srv/docker/headscale/conf/derp.yaml` 记录独立中继的 region ID、hostname 和
`derpport: 8443`。DNS 解析 hostname，`cls1-gateway` 上的 Caddy 提供 TLS。

启动后检查独立 DERP 和客户端连接方式：

```shell
cd /srv/docker/derper
docker compose config --quiet
docker compose up -d
docker compose ps
curl --fail https://cls1-gateway.derp.tiankaima.cn:8443/derp/probe
tailscale netcheck
```

## 维护 {#derp-maintenance}

### DERP 中继不可用 {#derp-unavailable}

```shell
docker logs --tail=100 headscale
docker compose -f /srv/docker/derper/docker-compose.yml ps
docker logs --tail=100 derper
tailscale netcheck
```

修改 region ID、hostname 或端口后，同步更新 Headscale 配置、DNS、Caddy 和[监控](../monitoring/)。
systemd 部署见[归档](../../archive/derp-systemd.md)。

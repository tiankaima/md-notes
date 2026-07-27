---
title: Headscale
last_verified: 2026-07-27
---

# Headscale {#headscale}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | `jp-2` |
| 依赖 | [Docker](../docker/)、[Caddy](../caddy/)、[DNS](../dns/) |
| 使用方 | 跨机房管理、[监控](../monitoring/)、管理员远程访问、[DERP](../derp/) |

## 搭建 {#headscale-setup}

### 准备目录 {#prepare-headscale-directories}

```shell
sudo install -d -o root -g root -m 0755 \
  /srv/docker/headscale/conf \
  /srv/docker/headscale/lib \
  /srv/docker/headscale/run
```

检查目录后再写入 Compose 和 Headscale 配置：

```shell
stat -c '%a %U:%G %n' \
  /srv/docker/headscale/conf \
  /srv/docker/headscale/lib \
  /srv/docker/headscale/run
```

### 配置 Headscale {#configure-headscale}

Headscale 数据、配置和 socket 文件位于 `/srv/docker/headscale/{conf,lib,run}`。

```yaml title="/srv/docker/headscale/docker-compose.yml"
services:
  headscale:
    image: headscale/headscale:0.29.2@sha256:d337f1be4a9155b330aa9077bf6c82d24ff0581b8e69390ebc6d7c623bb339ce
    container_name: headscale
    restart: always
    network_mode: host
    command: serve
    volumes:
      - /srv/docker/headscale/conf:/etc/headscale
      - /srv/docker/headscale/lib:/var/lib/headscale
      - /srv/docker/headscale/run:/var/run/headscale
```

HTTP 和 metrics 监听环回地址，由 Caddy 提供 HTTPS：

```yaml title="/srv/docker/headscale/conf/config.yaml"
server_url: https://headscale.lab.tiankaima.cn
listen_addr: 127.0.0.1:8080
metrics_listen_addr: 127.0.0.1:9095
grpc_listen_addr: 127.0.0.1:50443
grpc_allow_insecure: false

noise:
  private_key_path: /var/lib/headscale/noise_private.key

prefixes:
  v4: 100.100.100.0/24
  v6: fd7a:115c:a1e0::/48
  allocation: random

database:
  type: sqlite
  sqlite:
    path: /var/lib/headscale/db.sqlite
    write_ahead_log: true

policy:
  mode: file
  path: /etc/headscale/policy.hujson

dns:
  magic_dns: true
  base_domain: lab-inet

unix_socket: /var/run/headscale/headscale.sock
unix_socket_permission: "0770"
```

[DERP](../derp/)页记录中继配置。

### 配置访问策略 {#configure-headscale-policy}

当前 tailnet 允许已经加入的节点互相访问，并允许节点使用 peer relay：

```json title="/srv/docker/headscale/conf/policy.hujson"
{
  "acls": [
    {"action": "accept", "src": ["*"], "dst": ["*:*"]},
  ],
  "grants": [
    {"src": ["*"], "dst": ["*"], "app": {"tailscale.com/cap/relay": []}},
  ],
}
```

加入由其他人管理的节点前，先修改这里的访问范围。

启动前检查 `config.yaml` 和访问策略，启动后检查版本、容器和健康端点：

```shell
cd /srv/docker/headscale
docker compose config --quiet
test -r /srv/docker/headscale/conf/policy.hujson
docker compose run --rm headscale configtest
docker compose up -d
docker compose ps
docker exec headscale headscale version
curl --fail https://headscale.lab.tiankaima.cn/health
```

### 节点接入 {#join-nodes}

为新节点创建一次性 preauth key：

```shell
docker exec headscale headscale users list
docker exec headscale headscale users create USER
docker exec headscale headscale preauthkeys create --user USER
sudo tailscale up --login-server=https://headscale.lab.tiankaima.cn --authkey KEY
```

接入后检查节点列表和连接方式：

```shell
docker exec headscale headscale nodes list
tailscale status
tailscale netcheck
```

## 维护 {#headscale-maintenance}

### Headscale 无法访问 {#regular-checks}

```shell
docker compose -f /srv/docker/headscale/docker-compose.yml ps
docker logs --tail=100 headscale
docker exec headscale headscale nodes list
tailscale status
tailscale netcheck
```

### 节点无法接入或路由不可用 {#node-management}

- 新节点使用一次性 preauth key
- 删除节点前检查 subnet route 和 exit node 配置
- 修改路由后检查 ACL、路由批准和转发
- 多个节点同时离线时，先检查 `jp-2`，再检查机房路由器和 [DERP](../derp/)

### 升级或迁移 Headscale {#backup-and-upgrade}

升级前备份 `conf`、`lib` 和密钥文件，并记录 Headscale 版本。数据库迁移后如需降级，
使用升级前的备份。

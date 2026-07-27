---
title: Caddy
last_verified: 2026-07-27
---

# Caddy {#caddy}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | `cls1-gateway`、`jp-2` |
| 依赖 | [Docker](../docker/)、[DNS](../dns/)、Cloudflare API Token |
| 使用方 | Grafana、[LLDAP](../lldap/)、[Headscale](../headscale/)、[DERP](../derp/) |

## 搭建 {#caddy-setup}

### 准备目录和凭据 {#prepare-caddy-directories}

两台主机都创建配置和数据目录。`jp-2` 还保存 Headscale UI 和访问日志：

```shell
sudo install -d -o root -g root -m 0755 \
  /srv/docker/caddy/conf /srv/docker/caddy/data
sudo install -d -o root -g root -m 0755 \
  /srv/docker/caddy/www /srv/docker/caddy/logs  # 仅 jp-2
sudo chown 3001:3000 /srv/docker/caddy/data      # 仅 cls1-gateway
```

ACME HTTP Challenge 需要 CA 从 80/TCP 访问验证文件。`cls1-gateway` 无法使用这个端口，
所以通过 Cloudflare DNS API 完成 DNS Challenge。该主机的 HTTP 和 HTTPS 入口分别使用
8080/TCP 和 8443/TCP，下面的 Caddyfile 和访问地址使用这两个端口。

将限定域名范围的 API Token 写入环境文件：

```bash title="cls1-gateway:/srv/docker/caddy/caddy.env"
CLOUDFLARE_API_TOKEN=REPLACE_WITH_CLOUDFLARE_API_TOKEN
```

```shell
sudo chown root:root /srv/docker/caddy/caddy.env
sudo chmod 0600 /srv/docker/caddy/caddy.env
stat -c '%a %U:%G' /srv/docker/caddy/caddy.env
```

### 配置 Compose 项目 {#configure-compose-project}

项目目录为 `/srv/docker/caddy`：

=== "cls1-gateway"

    ```yaml title="/srv/docker/caddy/docker-compose.yml"
    services:
      caddy:
        image: tiankaima/caddy-cf@sha256:65cd32324070073b5ff67144bed2c996dd210c229372975dd4359c978e85e53b
        restart: always
        container_name: caddy
        user: "3001:3000"
        network_mode: host
        env_file:
          - /srv/docker/caddy/caddy.env
        environment:
          XDG_CONFIG_HOME: /data/config
        volumes:
          - /srv/docker/caddy/conf:/etc/caddy
          - /srv/docker/caddy/data:/data
    ```

=== "jp-2"

    ```yaml title="/srv/docker/caddy/docker-compose.yml"
    services:
      caddy:
        image: ghcr.io/tiankaima/caddy-cf@sha256:2bb2ff98fd35101467fda5c81fd70dbf7de5a6aecbaa9c1e2e5f6151f3643b11
        restart: always
        container_name: caddy
        network_mode: host
        volumes:
          - /srv/docker/caddy/conf:/etc/caddy
          - /srv/docker/caddy/data:/data
          - /srv/docker/caddy/www:/var/www
          - /srv/docker/caddy/logs:/var/log/caddy
    ```

镜像包含 Cloudflare DNS 模块。Token 保存在环境文件中。

写入 Compose 文件后先检查语法：

```shell
cd /srv/docker/caddy
docker compose config --quiet
```

### 配置入口 {#configure-sites}

=== "cls1-gateway"

    ```caddyfile title="/srv/docker/caddy/conf/Caddyfile"
    {
      http_port 8080
      https_port 8443
      metrics {
        per_host
      }
    }

    grafana.lab.tiankaima.cn {
      tls {
        dns cloudflare {$CLOUDFLARE_API_TOKEN}
      }
      reverse_proxy 127.0.0.1:3000
    }

    cls1-gateway.derp.tiankaima.cn {
      tls {
        dns cloudflare {$CLOUDFLARE_API_TOKEN}
      }
      reverse_proxy 127.0.0.1:3002
    }
    ```

=== "jp-2"

    ```caddyfile title="/srv/docker/caddy/conf/Caddyfile"
    {
      metrics {
        per_host
      }
    }

    headscale.lab.tiankaima.cn {
      handle_path /web* {
        root * /var/www/html-headscale-ui
        file_server
      }
      reverse_proxy 127.0.0.1:8080
    }

    lldap.lab.tiankaima.cn {
      reverse_proxy 127.0.0.1:17170
    }
    ```

用 Compose 镜像检查模块和 Caddyfile，再启动容器：

```shell
cd /srv/docker/caddy
docker compose run --rm caddy caddy list-modules | grep -F dns.providers.cloudflare
docker compose run --rm caddy caddy validate -c /etc/caddy/Caddyfile
docker compose up -d
docker compose ps
curl -I https://grafana.lab.tiankaima.cn:8443/
curl --fail https://headscale.lab.tiankaima.cn/health
```

## 维护 {#caddy-maintenance}

### 配置重载失败 {#configuration-changes}

```shell
docker exec caddy caddy fmt -c /etc/caddy/Caddyfile -w
docker exec caddy caddy validate -c /etc/caddy/Caddyfile
docker exec caddy caddy reload -c /etc/caddy/Caddyfile
docker logs --tail=100 caddy
```

新增入口前检查 DNS、后端地址、访问范围和 ACME DNS challenge。

### 迁移 Caddy {#certificates-and-data}

`/srv/docker/caddy/data` 包含 ACME 账户和证书。升级或迁移前备份该目录。Cloudflare Token
只授予所需域名的 DNS 权限。

### TLS 失败或入口返回 502 {#troubleshooting}

- TLS 失败时，检查 DNS、系统时间、Token 权限和 ACME 日志
- 返回 502 时，检查后端地址、容器状态和 `network_mode: host` 配置
- IPv4 和 IPv6 结果不同时，分别运行 `curl -4` 和 `curl -6`
- 重载失败时，修复配置并重新运行 `validate`

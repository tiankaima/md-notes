# 服务总览

> 这里记录了所有需要维护的服务、维护这些服务的原因，以及一些做法的考量，以供后续维护参考（为什么要做、为什么这样做、后续改进/替代方案可行性分析），更新可能有延迟。
>
> 记录顺序总体按照「假如爆炸了，理想的恢复顺序」进行，注意，部分服务不直接影响面向用户的部分，但可能导致可用性降级。
>
> 本页只记录 `*.lab.tiankaima.cn` 相关基础设施；`*.tiankaima.dev` 的个人服务不在此处维护。

## 用户侧入口

### 监控

- 用量监控：<https://grafana.lab.tiankaima.cn:8443/>
    - 为 Grafana 开启了「允许未登录」的设置。
    - 可在页面中切换数据源。
- 占用情况监控：<https://git.lug.ustc.edu.cn/-/snippets/349>
    - 可在此处确认各台服务器当前正在被哪些容器使用。

### 代理

- 代理设置请参考 [代理使用说明](../proxy.md)。

## DNS

- `*.lab.tiankaima.cn`：这里应该包含所有对外提供服务（HTTP(S)、代理等）的 URL。

- `*.s.tiankaima.dev`：包含了一些服务器的 `A` & `AAAA` 记录，这样其他服务只需要使用 `CNAME` 就可以同时对外以 `IPv4` & `IPv6` 提供服务。

正如名字所暗示的，是我自己个人的域名，因此目前是在我的 CloudFlare 上，交替使用了两个 TLD 的原因是，我最开始注册了 `.dev` 域名，后面因为合规原因又注册了 `.cn`（我自己备案了这个域名），不过事实上我们也没办法使用 `:443`，所以也许区别不大。

## Caddy

> 目标：
>
> > [Caddy](http://caddyserver.com/)：易用的反向代理，自带 TLS 证书申请工具
>
> 注意：
>
> > 校内服务器的 HTTP/HTTPS 设置为 `8000+80/443=8080/8443`，因为 `:80` & `:443` 都会被查水表。
> >
> > 使用 `ghcr.io/tiankaima/caddy-cf:latest` 替换了默认的 `caddy:alpine` 镜像，这里面[打包](https://github.com/tiankaima/Dockerfile/blob/master/caddy-cf/Dockerfile)了一些 Caddy 插件方便使用。
> >
> > `tls { dns cloudflare }` 的用法是通过 DNS Challenge 签发 TLS 证书（默认行为是 HTTP Challenge，会更加透明一些，但是因为 `:80` 端口无法使用，所以只能这样设置），然后为了集中这个设置（不再重复这段代码），使用了 Handler 的语法。如果新增反代的话就照猫画虎一下就好。
>
> 上游文档：<http://caddyserver.com/>

=== "docker-compose.yml"

    ```yaml title="/srv/docker/caddy/docker-compose.yml"
    services:
        caddy:
            image: ghcr.io/tiankaima/caddy-cf
            restart: always
            container_name: caddy
            network_mode: host
            volumes:
                - /srv/docker/caddy/conf:/etc/caddy
                - /srv/docker/caddy/data:/data
                - /srv/docker/caddy/www:/var/www
    ```

=== "cls1-gateway"

    ```txt title="/srv/docker/caddy/conf/Caddyfile"
    {
        http_port 8080
        https_port 8443

        metrics {
                per_host
        }
    }

    grafana.lab.tiankaima.cn,
    coder.lab.tiankaima.cn,
    *.coder.lab.tiankaima.cn,
    cls1-gateway.derp.tiankaima.cn {
            tls {
                    dns cloudflare $CLOUDFLARE_API_TOKEN
            }

            @grafana host grafana.lab.tiankaima.cn
            handle @grafana {
                    reverse_proxy :3000
            }

            @public-ipv4 not client_ip 100.100.0.0/16 192.168.48.0/22 10.9.0.0/8
            @coder host coder.lab.tiankaima.cn *.coder.lab.tiankaima.cn
            handle @coder {
                    #respond @public-ipv4 "Under Maintainance"
                    reverse_proxy :3001
            }

            @derp host cls1-gateway.derp.tiankaima.cn
            handle @derp {
                    reverse_proxy :3002
            }
    }
    ```

=== "jp-2"

    ```txt title="/srv/docker/caddy/conf/Caddyfile"
    {
        metrics {
                per_host
        }
    }

    headscale.lab.tiankaima.cn {
            handle_path /web*{
                    root* /var/www/html-headscale-ui
                    file_server
            }

            reverse_proxy :8080
    }

    lldap.lab.tiankaima.cn {
            reverse_proxy :17170
    }
    ```

!!! note

    修改 `Caddyfile` 后，按照顺序执行：

    ```bash
    docker exec caddy caddy validate -c /etc/caddy/Caddyfile
    docker exec caddy caddy fmt -c /etc/caddy/Caddyfile -w
    docker exec caddy caddy reload -c /etc/caddy/Caddyfile
    ```

!!! note

    在维护结束后，开放给用户之前，可以先在内网进行测试，只需要取消下面的注释：

    ```txt title="/srv/docker/caddy/conf/Caddyfile" hl_lines="2"
    handle @coder {
        #respond @public-ipv4 "Under Maintainance"
    }
    ```

    然后在本地通过修改 `/etc/hosts` 的方式将服务直接解析到内网地址即可访问（注意浏览器中 DoH/DoT 设置）。

### `cls1-gateway`（历史配置）

<https://201.ustclug.org/advanced/caddy/>

```txt title="/srv/docker/caddy"
.
├── conf
│   └── Caddyfile
├── data
├── fmt.sh
├── reload.sh
├── run.sh
└── validate.sh
```

修改 `Caddyfile` 后可按 `./validate.sh` -> `./fmt.sh` -> `./reload.sh` 执行，保证 0-downtime。

```txt title="/srv/docker/caddy/conf/Caddyfile"
grafana.lab.tiankaima.cn,
coder.lab.tiankaima.cn,
*.coder.lab.tiankaima.cn {
 tls {
  dns cloudflare ***
 }

 @public-ipv4 not client_ip 100.100.0.0/16 192.168.48.0/22 10.0.0.0/8

 @grafana host grafana.lab.tiankaima.cn
 handle @grafana {
  reverse_proxy :3000 {
   header_down -X-Frame-Options
   header_down +X-Frame-Options "SAMEORIGIN"
  }
 }

 @coder host coder.lab.tiankaima.cn *.coder.lab.tiankaima.cn
 handle @coder {
  # respond @public-ipv4 "Under Maintainance"

  @websockets `header({'Connection':'*Upgrade*','Upgrade':'websocket'}) || header({':protocol': 'websocket'})`

  reverse_proxy :3001 {
   header_up -Accept-Encoding
   header_up Accept-Encoding identity
   header_down -content-security-policy
  }
 }
}
```

## Coder（历史）

!!! warning

    Coder 服务已暂停使用，本节仅用于保留历史部署信息。

<https://coder.lab.tiankaima.cn:8443>

```yaml title="/srv/docker/coder/docker-compose.yaml"
services:
  coder:
    image: ghcr.io/coder/coder:latest
    container_name: coder
    restart: unless-stopped
    network_mode: "host"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/run/docker/:/var/run/docker/
    env_file:
      - ./coder.env
    environment:
      CODER_PG_CONNECTION_URL: "postgresql://${POSTGRES_USER:-coder}:${POSTGRES_PASSWORD:-***}@127.0.0.1/${POSTGRES_DB:-coder}?sslmode=disable"
    group_add:
      - 988 # docker group
    depends_on:
      database:
        condition: service_healthy

  database:
    image: postgres:16
    container_name: coder-database
    restart: unless-stopped
    network_mode: "host"
    environment:
        POSTGRES_USER: ${POSTGRES_USER:-coder}
        POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-***}
        POSTGRES_DB: ${POSTGRES_DB:-coder}
        POSTGRES_PORT: ${POSTGRES_PORT:-tcp://127.0.0.1:5432}
    volumes:
      - ./pg-data:/var/lib/postgresql/data
    healthcheck:
        test:
          - "CMD-SHELL"
          - "pg_isready -U ${POSTGRES_USER:-coder} -d ${POSTGRES_DB:-coder}"
        interval: 5s
        timeout: 5s
        retries: 5
```

代理设置请参考 [代理使用说明](../proxy.md)。

## Docker Socket {#docker-socket}

为在一台机器上同时控制多台 Docker Daemon，我们使用 systemd 挂载 ssh socket forward 到 `/var/run/docker/$srv.sock`：

```ini title="/etc/systemd/system/docker-tunnel@$.service"
[Unit]
Description=SSH Tunnel for Docker Socket on %i
After=network.target

[Service]
ExecStartPre=/usr/bin/rm -f /var/run/docker.%i.sock
ExecStart=/usr/bin/ssh -nNT -L /var/run/docker/%i.sock:/var/run/docker.sock coder@%i
#ExecStartPost=chown :docker /var/run/docker.%i.sock
#ExecStartPost=chmod g+rw /var/run/docker.%i.sock
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
```

为正确设置权限，调整 `sudo crontab -e`：

```txt
*/1 * * * * chown :docker /var/run/docker.*.sock; chmod g+rw /var/run/docker.*.sock
```

!!! warning "这不是一个 best practice，这甚至都不能称作解决办法……"

## LLDAP

> 目标：
>
> > [LLDAP](https://github.com/lldap/lldap)：轻量 LDAP 服务，作为统一账号目录，提供 LDAP/LDAPS 与 Web 管理界面。
>
> 注意：
>
> > 部署在 `jp-2` 上，Web 管理界面只在本机 `127.0.0.1:17170` 监听，通过 Caddy 暴露 `lldap.lab.tiankaima.cn`。
> >
> > LDAP/LDAPS 端口对内网服务可见（`389` / `636`），如无必要不要直接对公网暴露。

=== "docker-compose.yml"

    ```yaml title="/srv/docker/lldap/docker-compose.yml"
    services:
        lldap:
            image: lldap/lldap:stable
            container_name: lldap
            restart: always
            env_file:
                - /srv/docker/lldap/lldap.env
            ports:
                # - "0.0.0.0:389:3890" # LDAP
                - "[::]:389:389"
                - "0.0.0.0:636:6360" # LDAPS
                - "[::]:636:6360" # LDAPS
                - "127.0.0.1:17170:17170" # Web
            volumes:
                - /srv/docker/lldap/data:/data
                - /srv/docker/caddy/data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/lldap.lab.tiankaima.cn:/certs:ro
            environment:
                - LLDAP_LDAPS_OPTIONS__ENABLED=true
                - LLDAP_LDAPS_OPTIONS__CERT_FILE=/certs/lldap.lab.tiankaima.cn.crt
                - LLDAP_LDAPS_OPTIONS__KEY_FILE=/certs/lldap.lab.tiankaima.cn.key
    ```

=== "lldap.env"

    ```bash title="/srv/docker/lldap/lldap.env"
    UID=0
    GID=0
    TZ=Asia/Shanghai

    LLDAP_JWT_SECRET=REPLACE_WITH_RANDOM_HEX
    LLDAP_KEY_SEED=REPLACE_WITH_RANDOM_HEX
    LLDAP_LDAP_BASE_DN=dc=lab,dc=tiankaima,dc=cn
    LLDAP_LDAP_USER_PASS=REPLACE_WITH_RANDOM_HEX
    ```

## Headscale

> 目标：
>
> > [Tailscale](https://tailscale.com/)：跨集群建立点对点连接（俗称打洞），替代之前手工配置的 [Wireguard](https://www.wireguard.com/) 树状拓扑，改为网状拓扑；同时有 [DERP](https://tailscale.com/kb/1232/derp-servers) 兜底，更适合复杂网络环境。
> >
> > [Headscale](https://headscale.net/)：是一个开源的 Tailscale 控制节点方案，自建的目标是解决可能的 Tailscale 被 GFW 屏蔽问题、合规问题。
>
> 注意：
>
> > 部署在 `jp-2` 上：Headscale 节点需要公开的 `:443` 访问，校园内部无法提供对应环境，同时由于节点间的通讯是点对点的，放在境外不影响延迟。
>
> > 使用 Docker 进行部署：参考[文档](https://headscale.net/stable/setup/install/container/)。
>
> GitHub：<https://github.com/juanfont/headscale>
>
> 上游文档：<https://headscale.net/>

=== "docker-compose.yml"

    ```yaml title="/srv/docker/headscale/docker-compose.yml"
    services:
        headscale:
            image: headscale/headscale:latest
            restart: always
            container_name: headscale
            volumes:
                - /srv/docker/headscale/conf:/etc/headscale
                - /srv/docker/headscale/lib:/var/lib/headscale
                - /srv/docker/headscale/run:/var/run/headscale
            command: serve
            network_mode: host
            ports:
                - "0.0.0.0:3478:3478/udp"
                - "[::]:3478:3478/udp"
                - "127.0.0.1:8080:8080/tcp"
                - "127.0.0.1:9095:9095/tcp"
    ```

=== "config.yaml"

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

    derp:
        server:
            enabled: true
            region_id: 999
            region_code: "headscale"
            region_name: "Headscale Embedded DERP"
            stun_listen_addr: "0.0.0.0:3478"
            private_key_path: /var/lib/headscale/derp_server_private.key
            automatically_add_embedded_derp_region: true
            ipv4: 45.77.129.48
            ipv6: 2001:19f0:7001:1d11:5400:5ff:fe51:2e0c

        paths:
            - /etc/headscale/derp.yaml
        auto_update_enabled: true
        update_frequency: 1h
    ```

=== "derp.yaml"

    ```yaml title="/srv/docker/headscale/conf/derp.yaml"
    regions:
        508:
            regionid: 508
            regioncode: cls1
            regionname: cls1
            nodes:
                - name: cls1-gateway
                  regionid: 508
                  hostname: cls1-gateway.derp.tiankaima.cn
                  ipv4: 210.45.71.95
                  # ipv6: 2001:da8:d800:338:ae1f:6bff:fe0c:8a74
                  canport80: false
                  derpport: 8443
    ```

!!! note

    在 `jp-2` 中 `/root/.bashrc` 中预留了如下的 alias：

    ```bash
    alias headscale='docker exec -it headscale headscale'
    ```

    这样，所有[官方文档](https://headscale.net/)提供的代码都可直接用 `headscale ...` 来执行。

!!! note

    其实大部分操作都可以使用下文中部署的网页版 [headscale-ui](#headscale-ui) 来操作。

### cls1-gateway DERP

参考[文档](https://tailscale.com/docs/reference/derp-servers/custom-derp-servers)。

=== "docker"

    ```yaml title="/srv/docker/derper/docker-compose.yml"
    services:
        derper:
            image: ghcr.io/kaaanata/derper:latest
            container_name: derper
            restart: always

            environment:
                - DERP_DOMAIN=cls1-gateway.derp.tiankaima.cn
                - DERP_ADDR=0.0.0.0:3002
                - DERP_STUN=true
                - DERP_STUN_PORT=3478
                - DERP_HTTP_PORT=3002
                - DERP_VERIFY_CLIENTS=true

            ports:
                - "0.0.0.0:3002:3002"
                - "0.0.0.0:3478:3478/udp"

            volumes:
                - /var/run/tailscale/tailscaled.sock:/var/run/tailscale/tailscaled.sock
    ```

=== "systemd (old)"

    ```ini title="/etc/systemd/system/derper.service"
    [Unit]
    Description=Tailscale DERP Relay Server
    After=network.target

    [Service]
    Type=simple
    User=root
    WorkingDirectory=/home/tiankaima
    ExecStart=/home/tiankaima/go/bin/derper -stun -hostname=cls1-gateway.derp.tiankaima.cn -http-port 3002 -a=0.0.0.0:3002 -stun-port 3478 -c /srv/network/derp-config
    Restart=always
    RestartSec=3
    LimitNOFILE=65535

    [Install]
    WantedBy=multi-user.target
    ```

### Tailscale 接入

请在 `lab` 用户下注册新设备，首先通过命令行/网页获取 `lab` 用户的 `$PREAUTH_KEY`。拥有这个密钥=拥有（以该用户的身份）加入新设备的能力。

```shell
headscale users list
headscale preauthkey create -u $UID --reusable
```

```bash title="/srv/network/tailscale.sh"
#!/bin/sh

set -xe

tailscale up \
        --accept-routes \
        --advertise-exit-node \
        --login-server=https://headscale.lab.tiankaima.cn \
        --authkey $FILL_PRE_AUTH_KEY_HERE
```

### `headscale-ui`

<https://headscale.lab.tiankaima.cn/web/>，基于 Web 的 Headscale 控制面板。

使用前需要获取 API key，在 `jp-2` 上执行命令：

```shell
headscale apikeys create
```

## 监控 {#infra-monitoring}

有了统一挂载的 Docker Socket，可以很方便地在一处配置所有服务器的监控。

配置了 Prometheus + Grafana 来做监控：

- CPU、内存、硬盘、网络流量：`node-exporter`
- GPU 监控：`dcgm-exporter`
- 监控本体：`prometheus`
- 可视化：`grafana`

配置文件参考：<https://gist.github.com/tiankaima/9c31f36435af0c5093704b366d43eea2>

分别提供了以下目录的 `docker-compose.yml`：

- `/srv/docker/monitor/`（有 Grafana）
- `/srv/docker/monitor.slave/`（无 Grafana）
- `/srv/docker/monitor.slave.nogpu/`（无 GPU 监控）

得益于 Docker 的前后端分离设计，Slave 上 Docker 容器开启、关闭、日志只需要设置环境变量即可：

```bash title="On target slave"
sudo mkdir -p /srv/docker/monitor/proetheus/config/
sudo mkdir -p /srv/docker/monitor/proetheus/data/
sudo vim /srv/docker/monitor/proetheus/config/proetheus.yml
```

```bash title="On cls1-gateway"
export DOCKER_HOST=unix:///var/log/docker.$HOSTNAME.sock
```

!!! tip "已配置 Grafana「允许未登录」"

!!! warning "当前 node-exporter, dcgm-exporter, prometheus 直接使用 `network: host` 模式"

!!! note "Prometheus 分体式记录"

    每台服务器上都有着自己的 Prometheus 实例，分别记录各自的监控数据。

    同时 `cls1-gateway` 上还额外添加了一个 `prometheus.merged` 实例来采集所有服务器的监控数据。

### `jp-2`

=== "docker-compose.yml"

    ```yaml title="/srv/docker/monitor/docker-compose.yml"
    services:
        node-exporter:
            image: prom/node-exporter:latest
            container_name: monitor-node-exporter
            restart: always
            network_mode: host
            pid: "host"
            volumes:
                - "/:/host:ro,rslave"
            command:
                - "--path.rootfs=/host"

        blackbox-exporter:
            image: prom/blackbox-exporter:latest
            container_name: monitor-blackbox-exporter
            restart: always
            network_mode: host
            privileged: true
            cap_add:
                - NET_RAW
            volumes:
                - /srv/docker/monitor/blackbox-exporter/conf/blackbox.yml:/etc/blackbox_exporter/blackbox.yml:ro
            command:
                - "--config.file=/etc/blackbox_exporter/blackbox.yml"

        # alertmanager
            # image: prom/alertmanager
            # container_name: monitor-alertmanager
            # restart: always
            # network_mode: host
            # volumes
            # - /srv/docker/monitor/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
            # command
            # - "--config.file=/etc/alertmanager/alertmanager.yml"

        prometheus:
            image: prom/prometheus
            container_name: monitor-prometheus
            restart: always
            network_mode: host
            volumes:
                - /srv/docker/monitor/prometheus/conf/prometheus.yml:/etc/prometheus/prometheus.yml:ro
                # - /srv/docker/monitor/prometheus/conf/alert_rules.yml:/etc/prometheus/alert_rules.yml:ro
                - /srv/docker/monitor/prometheus/data:/prometheus/data
            command:
                - "--config.file=/etc/prometheus/prometheus.yml"
                - "--web.enable-lifecycle"
            depends_on:
                - node-exporter
                # - alertmanager

        grafana:
            image: grafana/grafana-oss:latest
            container_name: monitor-grafana
            restart: always
            network_mode: host
            volumes:
                - /srv/docker/monitor/grafana/data:/var/lib/grafana
            depends_on:
                - prometheus
            environment:
                - GF_SERVER_ROOT_URL=<https://monitor.tiankaima.dev/>
                - GF_SERVER_DOMAIN=monitor.tiankaima.dev
                - GF_SECURITY_ADMIN_USER=${GRAFANA_ADMIN_USER}
                - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
                - GF_USERS_ALLOW_SIGN_UP=false
                - GF_AUTH_ANONYMOUS_ENABLED=true
                - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
    ```

=== "prometheus.yml"

    ```yaml title="/srv/docker/monitor/prometheus/conf/prometheus.yml"
    global:
      scrape_interval: 15s

    alerting:
      alertmanagers:
        - static_configs:
            - targets: ['localhost:9093']

    #rule_files:
    #- alert_rules.yml

    scrape_configs:
      - job_name: 'node_exporter'
        static_configs:
          - targets:
              - cls1-srv1:9100
              - cls1-srv2:9100
              - cls1-srv3:9100
              - cls1-srv4:9100
              #- cls1-srv5:9100
              - cls2-srv1:9100
              - cls2-srv2:9100
              - cls2-srv3:9100
              - cls2-srv4:9100
              - cls2-srv5:9100
              - cls2-srv6:9100
              - cls2-srv7:9100

      - job_name: 'dcgm_exporter'
        static_configs:
          - targets:
              - cls1-srv1:9400
              - cls1-srv2:9400
              - cls1-srv3:9400
              - cls1-srv4:9400
              #- cls1-srv5:9400
              - cls2-srv1:9400
              - cls2-srv2:9400
              - cls2-srv3:9400
              - cls2-srv4:9400
              - cls2-srv6:9400
              - cls2-srv7:9400

      - job_name: 'blackbox_https_sites_ipv4'
        metrics_path: /probe
        params:
          module: [https_tls_ipv4]
        static_configs:
          - targets:
              - https://coder.lab.tiankaima.cn:8443
              - https://headscale.lab.tiankaima.cn/health

        relabel_configs:
          - source_labels: [__address__]
            target_label: __param_target
          - source_labels: [__param_target]
            target_label: instance
          - target_label: __address__
            replacement: localhost:9115

      - job_name: 'blackbox_https_sites_ipv6'
        metrics_path: /probe
        params:
          module: [https_tls_ipv6]
        static_configs:
          - targets:
              #- https://coder.lab.tiankaima.cn:8443
              - https://headscale.lab.tiankaima.cn/health

        relabel_configs:
          - source_labels: [__address__]
            target_label: __param_target
          - source_labels: [__param_target]
            target_label: instance
          - target_label: __address__
            replacement: localhost:9115

      - job_name: 'blackbox_ping_cluster'
        metrics_path: /probe
        params:
          module: [ping_ipv4]
        static_configs:
          - targets:
              - cls1-gateway
              - cls1-srv1
              - cls1-srv2
              - cls1-srv3
              - cls1-srv4
              - cls2-srv1
              - cls2-srv2
              - cls2-srv3
              - cls2-srv4
              - cls2-srv5
              - cls2-srv6
              - cls2-srv7
        relabel_configs:
          - source_labels: [__address__]
            target_label: __param_target
          - source_labels: [__param_target]
            target_label: instance
          - target_label: __address__
            replacement: localhost:9115

      - job_name: 'tailscale'
        static_configs:
          - targets:
              - 100.100.100.100

      - job_name: 'headscale'
        static_configs:
          - targets:
              - 127.0.0.1:9095

      - job_name: 'caddy'
        static_configs:
          - targets:
              - localhost:2019

      - job_name: 'caddy_gateway'
        scheme: https
        static_configs:
          - targets:
              - coder.lab.tiankaima.cn:8443

      - job_name: 'coder'
        static_configs:
          - targets:
              - cls1-gateway:2112
    ```

=== "alert_rules.yml"

    ```yaml title="/srv/docker/monitor/prometheus/conf/alert_rules.yml"
    groups:
      - name: node_down_alerts
        rules:
          - alert: HostDown
            expr: up == 0
            for: 1m
            labels:
              severity: critical
            annotations:
              summary: "Host {{ $labels.instance }} is down"
              description: "Prometheus failed to scrape {{ $labels.job }} on {{ $labels.instance }} for more than 1 minute."
    ```

    !!! warning

        使用 Grafana Alert 代替了 alertmanager，目前 alertmanager 尚未启用。

### `cls1-gateway`

=== "docker-compose.yml"

    ```yaml title="/srv/docker/monitor/docker-compose.yml"
    services:
      node-exporter:
        image: prom/node-exporter
        container_name: monitor-node-exporter
        restart: always
        pid: "host"
        network_mode: "host"
        volumes:
          - "/:/host:ro,rslave"
        command:
          - "--path.rootfs=/host"

      prometheus:
        image: prom/prometheus
        container_name: monitor-prometheus
        restart: always
        network_mode: "host"
        volumes:
          - /srv/docker/monitor/prometheus/conf:/etc/prometheus
          - /srv/docker/monitor/prometheus/data:/prometheus
        depends_on:
          - node-exporter

      prometheus-merged:
        image: prom/prometheus
        container_name: monitor-prometheus-merged
        restart: always
        network_mode: "host"
        volumes:
          - /srv/docker/monitor/prometheus.merged/config:/etc/prometheus
          - /srv/docker/monitor/prometheus.merged/data:/prometheus
        command: --web.listen-address=:9091 --config.file=/etc/prometheus/prometheus.yml
        depends_on:
          - node-exporter

      grafana:
        image: grafana/grafana-oss
        container_name: monitor-grafana
        restart: always
        volumes:
          - /srv/docker/monitor/grafana/grafana.ini:/etc/grafana/grafana.ini
          - /srv/docker/monitor/grafana/data:/var/lib/grafana
          - /srv/docker/monitor/grafana/log:/var/log/grafana
        depends_on:
          - prometheus
        environment:
          - https_proxy=http://grafana.proxy.lab.tiankaima.cn:7890
          - http_proxy=http://grafana.proxy.lab.tiankaima.cn:7890
          - HTTPS_PROXY=http://grafana.proxy.lab.tiankaima.cn:7890
          - HTTP_PROXY=http://grafana.proxy.lab.tiankaima.cn:7890
          - no_proxy=192.168.48.1/22,cls1-srv1,cls1-srv2,cls1-srv3,cls1-srv4,cls1-srv5,cls2-srv1,cls2-srv2,cls2-srv3,cls2-srv4,cls2-srv5,cls2-srv6,cls2-srv7
        network_mode: "host"
    ```

=== "prometheus.yml"

    ```yaml title="/srv/docker/monitor/prometheus/conf/prometheus.yml"
    # my global config
    global:
      scrape_interval: 5s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
      evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
      # scrape_timeout is set to the global default (10s).

    # Alertmanager configuration
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              # - alertmanager:9093

    # Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
    rule_files:
      # - "first_rules.yml"
      # - "second_rules.yml"

    # A scrape configuration containing exactly one endpoint to scrape:
    # Here it's Prometheus itself.
    scrape_configs:
      - job_name: "prometheus"
        static_configs:
          - targets: ["localhost:9090"]
      - job_name: "node"
        static_configs:
          - targets:
            - "localhost:9100"
            - "localhost:9400"
    ```

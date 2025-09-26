# cls1-gateway

## Caddy

<https://201.ustclug.org/advanced/caddy/>

```txt title="/srv/docker/caddy"
.
├── conf
│   └── Caddyfile
├── data
├── fmt.sh
├── reload.sh
├── run.sh
└── validate.sh
```

修改 `Caddyfile` 后请执行 `./validate.sh` -> `./fmt.sh` -> `./reload.sh` 保证 0-downtime。


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
```

## Coder

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

## Docker socket

为在一台机器上同时控制多台 Docker Daemon，我们使用 systemd 挂载一个 ssh socket foward 到 `/var/run/docker/$srv.sock`:

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

为正确设置权限，调整了 `sudo crontab -e`:

```txt
*/1 * * * * chown :docker /var/run/docker.*.sock; chmod g+rw /var/run/docker.*.sock
```

!!! warning "这不是一个 best practice，这甚至都不能称作解决办法……"

## 监控 {#监控}

有了统一挂载的 Docker Socket，可以很方便的在一处配置所有服务器的监控。

配置了 Prometheus + Grafana 来做监控：

-   CPU、内存、硬盘、网络流量：`node-exporter`
-   GPU 监控：`dcgm-exporter`
-   监控本体：`prometheus`
-   可视化：`grafana`

配置文件参考：<https://gist.github.com/tiankaima/9c31f36435af0c5093704b366d43eea2>

分别提供了三个位于

-   `/srv/docker/monitor/` （有 Grafana）
-   `/srv/docker/monitor.slave/` （无 Grafana）
-   `/srv/docker/monitor.slave.nogpu/` （无 GPU 监控）

的 `docker-compose.yml` 用于相应配置。

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

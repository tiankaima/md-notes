# 归档

> 保留已停用或替换的旧实现，仅供参考。

## Docker Socket {#docker-socket}

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

配套的历史 `crontab`：

```txt
*/1 * * * * chown :docker /var/run/docker.*.sock; chmod g+rw /var/run/docker.*.sock
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

## DERP

容器化之前的 `systemd` 旧实现：

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

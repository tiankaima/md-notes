---
title: Docker socket SSH tunnel
last_verified: 2026-07-26
---

# Docker socket SSH tunnel {#docker-socket-ssh-tunnel}

此配置把远端 [Docker](../services/docker/) socket 映射为本地 Unix socket，并每分钟修改 socket 权限。

对应的 systemd 单元如下：

```ini title="/etc/systemd/system/docker-tunnel@$.service"
[Unit]
Description=SSH Tunnel for Docker Socket on %i
After=network.target

[Service]
ExecStartPre=/usr/bin/rm -f /var/run/docker.%i.sock
ExecStart=/usr/bin/ssh -nNT -L /var/run/docker/%i.sock:/var/run/docker.sock coder@%i
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
```

Cron 每分钟修改 socket 的用户组和权限：

```text
*/1 * * * * chown :docker /var/run/docker.*.sock; chmod g+rw /var/run/docker.*.sock
```

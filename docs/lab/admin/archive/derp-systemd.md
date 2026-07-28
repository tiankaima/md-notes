---
title: DERP systemd
last_verified: 2026-07-26
---

# DERP systemd {#derp-systemd}

当前部署方式见 [DERP](../services/derp/)。

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

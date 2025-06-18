# cls1-srv2 (8x4090)

!!! note "Note: @tiankaima"

    从上架开始就接手的服务器，记录的内容会更全面一点。

    上架检查单 -> [docs/lab/checklist.md](/lab/admin/checklist)

## Coder

~~为避免影响现在的 Coder Instance (<https://s8a6.iaticetc.cn:8443>) 中进行的工作，在这台机器上另外开一个 Coder，地址在 <https://coder.lab.tiankaima.cn:8443>，确认无误并调整存储位置后，该 Coder Instance 将会替换现有的 Coder Instance。~~

原 Coder Instance 已经停机，目前仅有 <https://coder.lab.tiankaima.cn:8443> 这个 Coder 实例。

下面是技术细节：

### Docker socket

为在一台机器上同时控制多台 Docker Daemon，我们使用 systemd 挂载一个 ssh socket foward 到 `/var/run/docker.$srv.sock`:

```ini title="/etc/systemd/system/docker-tunnel@$.service"
[Unit]
Description=SSH Tunnel for Docker Socket on %i
After=network.target

[Service]
ExecStartPre=/usr/bin/rm -f /var/run/docker.%i.sock
ExecStart=/usr/bin/ssh -nNT -L /var/run/docker.%i.sock:/var/run/docker.sock coder@%i
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

### 监控 {#监控}

有了统一挂载的 Docker Socket，可以很方便的在一处配置所有服务器的监控。

配置了 Prometheus + Grafana 来做监控：

-   CPU、内存、硬盘、网络流量：`node-exporter`
-   GPU 监控：`dcgm-exporter`
-   监控本体：`prometheus`
-   可视化：`grafana`

配置文件参考：<https://gist.github.com/tiankaima/9c31f36435af0c5093704b366d43eea2>

分别提供了三个位于

-   `/srv/docker/monitor/` （有 Grafana）
-   `/srv/docker/monitor/slave/` （无 Grafana）
-   `/srv/docker/monitor/slave.nogpu/` （无 GPU 监控）

的 `docker-compose.yml` 用于相应配置。

得益于 Docker 的前后端分离设计，Slave 上 Docker 容器开启、关闭、日志只需要设置环境变量即可：

```bash title="On target slave"
sudo mkdir -p /srv/docker/monitor/proetheus/config/
sudo mkdir -p /srv/docker/monitor/proetheus/data/
sudo vim /srv/docker/monitor/proetheus/config/proetheus.yml
```

```bash title="On cls1-srv2"
export DOCKER_HOST=unix:///var/log/docker.$HOSTNAME.sock
```

!!! tip "已配置 Grafana「允许未登录」"

!!! warning "当前 node-exporter, dcgm-exporter, prometheus 直接使用 `network: host` 模式"

!!! note "Prometheus 分体式记录"

    每台服务器上都有着自己的 Prometheus 实例，分别记录各自的监控数据。

    同时 `cls1-srv2` 上还额外添加了一个 `prometheus.merged` 实例来采集所有服务器的监控数据。

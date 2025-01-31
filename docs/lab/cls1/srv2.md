# cls1-srv2 (8x4090)

!!! note "Note: @tiankaima"

    从上架开始就接手的服务器，记录的内容会更全面一点。

    上架检查单 -> [docs/lab/checklist.md](/lab/admin/checklist)

## Coder.new

为避免打扰现在的 Coder Instance (<https://s8a6.iaticetc.cn:8443>) 中进行的工作，在这台机器上另外开一个 Coder，地址在 <https://coder.lab.tiankaima.cn:8443>，确认无误并调整存储位置后，该 Coder Instance 将会替换现有的 Coder Instance。

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

### Slave 监控

有了统一挂载的 Docker Socket，可以很方便的在一处配置所有服务器的监控。

配置了 Prometheus + Grafana 来做监控：

- CPU、内存、硬盘、网络流量：`node-exporter`
- GPU 监控：`dcgm-exporter`
- 监控本体：`prometheus`
- 可视化：`grafana`

配置文件参考：<https://gist.github.com/tiankaima/9c31f36435af0c5093704b366d43eea2>

其中，无需在 Slave 中拉起 `grafana`；部分机器无需要监控的 GPU，如 cls2-srv5 (master)，分别提供了三个位于 `~/docker/monitor/` `$MON/slave/` `$MON/slave.nogpu/` 的 `docker-compose.yml` 用于相应配置。配置时无需在目标 Slave 上手动拉起（配置文件 `~/docker/monitor/proetheus/config/proetheus.yml` 和存储 `~/docker/monitor/proetheus/data` 需要手动配置。

得益于 Docker 的分体设计，其余容器的开启、关闭、日志只需要设置环境变量即可：

```bash
export DOCKER_HOST=unix:///var/log/docker.cls2-srv2.sock
```

!!! note "可能存在的问题"

    经过粗略评估，监控数据并不敏感，同时也提供了「允许未登录」的选项（至少是对内网的），因此所有容器都采取了 `network_mode: "host"` 的配置（也即外部均可采集监控数据）

    > 如果应监管要求、或安全问题需要调整，考虑从 iptables 调整出栈策略。

    另外，Prometheus 分体式记录，主要考虑是在 Grafana 中切换 Prometheus 源方便的多。
# 服务

> 记录实验室服务器提供的全部服务。

- 魔法网络：请参考 [使用说明](../proxy.md)。
- 节点监控：<https://grafana.lab.tiankaima.cn:8443/>
- ~~占用情况：<https://git.lug.ustc.edu.cn/-/snippets/349>~~

## DNS

- `*.lab.tiankaima.cn`：这里应该包含所有对外提供服务（HTTP(S)、代理等）的 URL。
- `*.s.tiankaima.dev`：包含了一些服务器的 `A` & `AAAA` 记录，这样其他服务只需要使用 `CNAME` 就可以同时对外以 `IPv4` & `IPv6` 提供服务。

## Caddy (`cls1-gateway/jp-2`)

```shell title="~/.bashrc"
alias caddy='docker exec -it caddy caddy'
```

=== "cls1-gateway"

    === "docker-compose.yml"

        ```yaml title="/srv/docker/caddy/docker-compose.yml"
        services:
          caddy:
            image: ghcr.io/tiankaima/caddy-cf # (1)!
            restart: always
            container_name: caddy
            network_mode: host
            volumes:
              - /srv/docker/caddy/conf:/etc/caddy
              - /srv/docker/caddy/data:/data
        ```

        1. <https://github.com/tiankaima/Dockerfile/tree/master/caddy-cf>

    === "Caddyfile"

        <!-- nginx is used for synatx highlighting only  -->
        ```nginx title="/srv/docker/caddy/conf/Caddyfile"
        {
          http_port 8080 # (1)!
          https_port 8443 # (2)!

          metrics {
              per_host
          }
        }

        grafana.lab.tiankaima.cn,
        coder.lab.tiankaima.cn,
        *.coder.lab.tiankaima.cn,
        cls1-gateway.derp.tiankaima.cn {
            tls {
                dns cloudflare $CLOUDFLARE_API_TOKEN # (3)!
            }

            @grafana host grafana.lab.tiankaima.cn
            handle @grafana {
                reverse_proxy :3000
            }

            @public-ipv4 not client_ip 100.100.0.0/16 192.168.48.0/22 10.9.0.0/8
            @coder host coder.lab.tiankaima.cn *.coder.lab.tiankaima.cn
            handle @coder {
                #respond @public-ipv4 "Under Maintenance"
                reverse_proxy :3001
            }

            @derp host cls1-gateway.derp.tiankaima.cn
            handle @derp {
                reverse_proxy :3002
            }
        }
        ```

        1. HTTP 不直接走 `:80`。
        2. HTTPS 不直接走 `:443`。
        3. 证书通过 DNS challenge 签发。

=== "jp-2"

    === "docker-compose.yml"

        ```yaml title="/srv/docker/caddy/docker-compose.yml"
        services:
          caddy:
            image: ghcr.io/tiankaima/caddy-cf # (1)!
            restart: always
            container_name: caddy
            network_mode: host
            volumes:
              - /srv/docker/caddy/conf:/etc/caddy
              - /srv/docker/caddy/data:/data
              - /srv/docker/caddy/www:/var/www
        ```

        1. <https://github.com/tiankaima/Dockerfile/tree/master/caddy-cf>

    === "Caddyfile"

        <!-- nginx is used for synatx highlighting only  -->
        ```nginx title="/srv/docker/caddy/conf/Caddyfile"
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

### 常用操作

```shell
caddy validate -c /etc/caddy/Caddyfile
caddy fmt -c /etc/caddy/Caddyfile -w
caddy reload -c /etc/caddy/Caddyfile
```

### 维护测试

可临时取消下面这行注释，本地改 `/etc/hosts` 指向内网地址即可访问。

```txt title="/srv/docker/caddy/conf/Caddyfile" hl_lines="2"
handle @coder {
  #respond @public-ipv4 "Under Maintenance"
}
```

## LLDAP (`jp-2`)

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
          # - "[::]:389:389"
          - "0.0.0.0:636:6360" # LDAPS
          - "[::]:636:6360" # LDAPS
          - "127.0.0.1:17170:17170" # Web
        volumes:
          - /srv/docker/lldap/data:/data
          - /srv/docker/caddy/data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/lldap.lab.tiankaima.cn:/certs
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

## Headscale (`jp-2`)

```shell title="~/.bashrc"
alias headscale='docker exec -it headscale headscale'
```

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

### DERP (`cls1-gateway`)

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
      - DERP_VERIFY_CLIENTS=false

    ports:
      - "0.0.0.0:3002:3002"
      - "[::]:3002:3002"
      - "0.0.0.0:3478:3478/udp"
      - "[::]:3478:3478/udp"

    volumes:
      - /var/run/tailscale/tailscaled.sock:/var/run/tailscale/tailscaled.sock
```

### headscale-ui (`jp-2`) {#headscale-ui}

Web 控制面板：<https://headscale.lab.tiankaima.cn/web/>

```shell
headscale apikeys create
```

### Tailscale 接入

在 `lab` 用户下生成 preauth key：

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

## systemd-nspawn (`cls1-gateway`)

`cls1-gateway` 上运行了名为 `login` 的 `systemd-nspawn` 容器，用于提供登录环境。

- 容器根目录：`/var/lib/machines/login`
- 容器配置：`/etc/systemd/nspawn/login.nspawn`
- systemd 单元：`systemd-nspawn@login.service`
- 当前 `machinectl` 显示容器地址为 `192.168.49.2`

```ini title="/etc/systemd/nspawn/login.nspawn"
[Exec]
Boot=on
Hostname=login
PrivateUsers=identity

[Service]
CPUQuota=50%
MemoryHigh=20G
MemoryMax=25G
MemorySwapMax=0

[Network]
VirtualEthernet=yes

[Files]
Bind=/data
```

容器内当前承载了登录所需的基础服务，如 `sshd`、`sssd` 与 `munge`。

### 常用操作

```shell
machinectl list
machinectl status login
systemctl status systemd-nspawn@login
machinectl shell root@login
```

## BeeGFS (`cls1-gateway`)

`cls1-gateway` 当前承担 BeeGFS 管理节点，同时本机也作为客户端挂载共享文件系统。

- 管理服务：`beegfs-mgmtd.service`
- 管理配置：`/etc/beegfs/beegfs-mgmtd.toml`
- 客户端配置：`/etc/beegfs/beegfs-client.conf`
- 挂载配置：`/etc/beegfs/beegfs-mounts.conf`
- 认证文件：`/etc/beegfs/conn.auth`

```ini title="/etc/beegfs/beegfs-client.conf"
sysMgmtdHost                  = cls1-gateway
connAuthFile                  = /etc/beegfs/conn.auth
connMgmtdPort                 = 8008
quotaEnabled                  = true
```

当前可见的挂载点包括：

- `/data/cls1-beegfs`
- `/data/cls1-beegfs/home`
- `/home`

当前管理节点监听：

- `8008/udp`
- `8008/tcp`
- `8010/tcp`

### 常用操作

```shell
systemctl status beegfs-mgmtd
mount | grep beegfs
findmnt /data/cls1-beegfs /data/cls1-beegfs/home /home
ss -ltnup | grep 8008
```

## Slurm (`cls1-gateway`)

`cls1-gateway` 承担 Slurm 控制面与记账服务；计算节点运行 `slurmd`，控制节点本机不运行 `slurmd.service`。

- 认证服务：`munge.service`
- 控制器：`slurmctld.service`
- 记账服务：`slurmdbd.service`
- 主配置：`/etc/slurm/slurm.conf`
- cgroup 配置：`/etc/slurm/cgroup.conf`
- `slurmdbd` 配置：`/etc/slurm/slurmdbd.conf`
- 作业完成日志：`/data/cls1-beegfs/slurm/log/job-completion.log`

```ini title="/etc/slurm/slurm.conf"
ClusterName=cls1
SlurmctldHost=cls1-gateway
SlurmctldPort=6817
AccountingStorageHost=cls1-gateway
AccountingStoragePort=6819
AccountingStorageType=accounting_storage/slurmdbd
JobCompLoc=/data/cls1-beegfs/slurm/log/job-completion.log

PartitionName=cls1 Nodes=cls1-srv[1-4] Default=YES MaxTime=INFINITE State=UP
PartitionName=cls2 Nodes=cls2-srv[1-3],cls2-srv[6-7] Default=NO MaxTime=INFINITE State=UP
```

`slurmdbd` 当前监听 `6819/tcp`，`slurmctld` 当前监听 `6817/tcp`。账务数据库通过本机 `127.0.0.1:3306` 提供，不对外暴露。

### 常用操作

```shell
systemctl status munge slurmctld slurmdbd
sinfo
scontrol show nodes
sacctmgr show cluster
ss -ltnup | egrep '6817|6819|3306'
```

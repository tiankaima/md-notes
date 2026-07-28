---
title: BeeGFS
last_verified: 2026-07-27
---

# BeeGFS {#beegfs}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | - management 位于 `cls1-gateway`<br> - metadata 位于 `cls1-srv1..4`<br> - storage 位于 `cls1-srv1..4`<br> - client 位于 `cls1-gateway` 和 `cls1-srv1..4` |
| 依赖 | [DOCA/RDMA](../doca/)、数据盘、IPoIB、节点身份 |
| 使用方 | [systemd-nspawn](../systemd-nspawn/)、[Slurm](../slurm/)、[监控](../monitoring/) |

BeeGFS 将元数据和文件内容分别交给 metadata target 和 storage target。客户端必须先连接
management service，取得节点和 target 信息后才能访问文件系统。

## 搭建 {#beegfs-setup}

### 安装 BeeGFS {#install-beegfs}

所有组件使用 BeeGFS `20:8.4.0`。先下载 8.4 仓库的签名密钥并核对 SHA-256：

```shell
sudo apt-get update
sudo apt-get install ca-certificates curl openssl
curl -fsSL https://www.beegfs.io/release/beegfs_8.4/gpg/GPG-KEY-beegfs \
  -o /tmp/beegfs.asc
echo '00d3e83fe0c76927052a46b3f8e6bac15df4de271edf508564527c64ed5a6b25  /tmp/beegfs.asc' \
  | sha256sum --check
sudo install -o root -g root -m 0644 /tmp/beegfs.asc \
  /etc/apt/trusted.gpg.d/beegfs.asc
rm /tmp/beegfs.asc
```

添加 Ubuntu 24.04 仓库：

```text title="/etc/apt/sources.list.d/beegfs.list"
deb [signed-by=/etc/apt/trusted.gpg.d/beegfs.asc] https://www.beegfs.io/release/beegfs_8.4 noble non-free
```

刷新索引并检查候选版本：

```shell
sudo apt-get update
apt-cache policy beegfs-client beegfs-mgmtd beegfs-meta beegfs-storage
```

`cls1-gateway` 安装管理服务和客户端，计算节点安装 metadata、storage 和客户端：

=== "cls1-gateway"

    ```shell
    sudo apt-get install beegfs-mgmtd libbeegfs-license \
      beegfs-client beegfs-client-dev beegfs-tools beegfs-utils libbeegfs-ib
    dpkg-query -W beegfs-mgmtd libbeegfs-license \
      beegfs-client beegfs-client-dev beegfs-tools beegfs-utils libbeegfs-ib
    ```

=== "cls1-srv1..4"

    ```shell
    sudo apt-get install beegfs-meta beegfs-storage \
      beegfs-client beegfs-client-dev beegfs-tools beegfs-utils libbeegfs-ib
    dpkg-query -W beegfs-meta beegfs-storage \
      beegfs-client beegfs-client-dev beegfs-tools beegfs-utils libbeegfs-ib
    ```

### 创建连接认证文件 {#create-beegfs-connection-authentication}

所有 BeeGFS 组件使用同一个 128 字节 `conn.auth`。在 `cls1-gateway` 生成一次，再通过管理员
SSH 分发到四台计算节点：

```shell
openssl rand 128 | sudo tee /etc/beegfs/conn.auth >/dev/null
sudo chown root:root /etc/beegfs/conn.auth
sudo chmod 0400 /etc/beegfs/conn.auth
stat -c '%s %a %U:%G' /etc/beegfs/conn.auth
```

分发后在每台节点检查文件长度和 SHA-256。五台主机的结果必须相同：

```shell
stat -c '%s %a %U:%G' /etc/beegfs/conn.auth
sha256sum /etc/beegfs/conn.auth
```

### 初始化 management {#initialize-beegfs-management}

BeeGFS 8.4 的 management service 使用 SQLite，并通过 gRPC 证书提供管理接口。生成只包含
management 地址的自签名证书：

```shell
sudo openssl req -x509 -newkey rsa:4096 -sha256 -nodes \
  -days 3650 \
  -subj '/CN=cls1-gateway/O=cls1 BeeGFS' \
  -addext 'subjectAltName=DNS:cls1-gateway,IP:192.168.48.1' \
  -keyout /etc/beegfs/key.pem \
  -out /etc/beegfs/cert.pem
sudo chown root:root /etc/beegfs/key.pem /etc/beegfs/cert.pem
sudo chmod 0600 /etc/beegfs/key.pem
sudo chmod 0644 /etc/beegfs/cert.pem
```

management 配置指定数据库、认证文件、证书和管理网卡：

```toml title="/etc/beegfs/beegfs-mgmtd.toml"
db-file = "/var/lib/beegfs/mgmtd.sqlite"
auth-file = "/etc/beegfs/conn.auth"
interfaces = ["ens5f1 192.168.48.1 4"]
tls-cert-file = "/etc/beegfs/cert.pem"
tls-key-file = "/etc/beegfs/key.pem"
```

从空目录搭建时初始化一次数据库：

```shell
sudo test ! -e /var/lib/beegfs/mgmtd.sqlite
sudo /opt/beegfs/sbin/beegfs-mgmtd --init \
  --config-file /etc/beegfs/beegfs-mgmtd.toml
sudo test -s /var/lib/beegfs/mgmtd.sqlite
sudo /opt/beegfs/sbin/beegfs-mgmtd --version
openssl x509 -in /etc/beegfs/cert.pem -noout -subject -dates -ext subjectAltName
```

`/etc/beegfs/license.pem` 由 BeeGFS 提供。使用现有许可证时检查文件存在，不在文档和仓库中
保存其内容。

### 初始化 metadata 和 storage {#initialize-beegfs-targets}

四台计算节点的 metadata ID 与节点编号一致。`NODE_ID` 分别取 1、2、3、4：

```shell
sudo /opt/beegfs/sbin/beegfs-setup-meta \
  -p /var/lib/beegfs/meta -s NODE_ID -m 192.168.48.1
grep -E '^(sysMgmtdHost|storeMetaDirectory|storeAllowFirstRunInit)' \
  /etc/beegfs/beegfs-meta.conf
cat /var/lib/beegfs/meta/nodeNumID
```

初始化完成后，在 metadata 配置中指定认证文件和 RDMA：

```ini title="/etc/beegfs/beegfs-meta.conf 中需要修改的配置"
sysMgmtdHost = 192.168.48.1
storeMetaDirectory = /var/lib/beegfs/meta
storeAllowFirstRunInit = false
connAuthFile = /etc/beegfs/conn.auth
connUseRDMA = true
```

```shell
grep -E '^(sysMgmtdHost|storeMetaDirectory|storeAllowFirstRunInit|connAuthFile|connUseRDMA)' \
  /etc/beegfs/beegfs-meta.conf
```

每台节点提供三个 storage target。target ID 按下表设置：

| 节点 | server ID | `ssd1` | `ssd2` | `ssd3` |
| --- | ---: | ---: | ---: | ---: |
| `cls1-srv1` | 1 | 1 | 2 | 3 |
| `cls1-srv2` | 2 | 4 | 5 | 6 |
| `cls1-srv3` | 3 | 7 | 8 | 9 |
| `cls1-srv4` | 4 | 10 | 11 | 12 |

确认三块本地文件系统已经挂载，再逐个初始化 target：

```shell
findmnt -M /beegfs/ssd1
findmnt -M /beegfs/ssd2
findmnt -M /beegfs/ssd3
sudo /opt/beegfs/sbin/beegfs-setup-storage \
  -p /beegfs/ssd1/storage -s SERVER_ID -i SSD1_TARGET_ID -m 192.168.48.1
sudo /opt/beegfs/sbin/beegfs-setup-storage \
  -p /beegfs/ssd2/storage -s SERVER_ID -i SSD2_TARGET_ID -m 192.168.48.1
sudo /opt/beegfs/sbin/beegfs-setup-storage \
  -p /beegfs/ssd3/storage -s SERVER_ID -i SSD3_TARGET_ID -m 192.168.48.1
```

检查 server ID、target ID 和最终配置：

```shell
paste /beegfs/ssd{1,2,3}/storage/nodeNumID
paste /beegfs/ssd{1,2,3}/storage/targetNumID
grep -E '^(sysMgmtdHost|storeStorageDirectory|storeAllowFirstRunInit)' \
  /etc/beegfs/beegfs-storage.conf
```

storage service 使用同一个认证文件，并将三块盘写入一个配置文件：

```ini title="/etc/beegfs/beegfs-storage.conf 中需要修改的配置"
sysMgmtdHost = 192.168.48.1
storeStorageDirectory = /beegfs/ssd1/storage,/beegfs/ssd2/storage,/beegfs/ssd3/storage
storeAllowFirstRunInit = true
connAuthFile = /etc/beegfs/conn.auth
connUseRDMA = true
```

```shell
grep -E '^(sysMgmtdHost|storeStorageDirectory|storeAllowFirstRunInit|connAuthFile|connUseRDMA)' \
  /etc/beegfs/beegfs-storage.conf
```

### 配置组件 {#configure-components}

各节点的职责如下：

| 节点 | 服务 | 数据或挂载点 |
| --- | --- | --- |
| `cls1-gateway` | `beegfs-mgmtd`、`beegfs-client` | `/data/cls1-beegfs` |
| `cls1-srv1..4` | `beegfs-meta` | `/var/lib/beegfs/meta` |
| `cls1-srv1..4` | `beegfs-storage` | `/beegfs/ssd1/storage`、`/beegfs/ssd2/storage`、`/beegfs/ssd3/storage` |
| `cls1-srv1..4` | `beegfs-client` | `/data/cls1-beegfs` |

所有组件通过 `sysMgmtdHost = 192.168.48.1` 找到 management service。计算节点的客户端
使用 buffered cache，`cls1-gateway` 使用 `tuneFileCacheType = none`。客户端和服务端都启用
RDMA，IPoIB 地址为 `10.9.0.1..4`。

```ini title="/etc/beegfs/beegfs-client.conf"
sysMgmtdHost = 192.168.48.1
connAuthFile = /etc/beegfs/conn.auth
connUseRDMA = true
connRDMABufNum = 70
connRDMABufSize = 8192
```

先用软件包提供的脚本设置 management 地址，再写入 RDMA 和缓存参数：

```shell
sudo /opt/beegfs/sbin/beegfs-setup-client -m 192.168.48.1
grep -E '^sysMgmtdHost' /etc/beegfs/beegfs-client.conf
```

客户端挂载由 `/etc/beegfs/beegfs-mounts.conf` 定义：

```text title="/etc/beegfs/beegfs-mounts.conf"
/data/cls1-beegfs /etc/beegfs/beegfs-client.conf
```

检查 management 地址、RDMA 和挂载配置：

```shell
grep -E '^(sysMgmtdHost|connAuthFile|connUseRDMA|connRDMABufNum|connRDMABufSize)' \
  /etc/beegfs/beegfs-client.conf
grep -F '/data/cls1-beegfs' /etc/beegfs/beegfs-mounts.conf
```

扩容或重装时需要保留 `conn.auth`、TLS 私钥、license 和 metadata/storage identity。已有
target 使用原 identity 和数据目录，不能按新 target 重新初始化。

### 服务端调优 {#server-tuning}

`cls1-srv1..4` 的 metadata 和 storage 配置相同。以下默认值来自 BeeGFS `20:8.4.0`
软件包中的配置文件：

| 服务 | 配置 | 默认值 | 当前值 | 作用 |
| --- | --- | --- | --- | --- |
| metadata | `sysRemoteInvalEnabled` | `false` | `true` | metadata 主动通知客户端清除缓存 |
| metadata | `tuneNumWorkers` | `0` | `24` | 固定 metadata worker 数 |
| storage | `tuneNumWorkers` | `12` | `24` | 将 storage worker 数增加到 24 |

metadata 的 `tuneNumWorkers = 0` 表示使用物理核心数的两倍，且不少于 4。四台服务器各有
128 个物理核心，默认设置会创建 256 个 metadata worker。当前固定为 24，同时每台服务器
还运行 24 个 storage worker。

remote invalidation 是 BeeGFS 8.4 的实验功能，五个客户端也设置了
`sysRemoteInvalEnabled = true`。`tuneInvalWatchMaxObjects = 50000000` 和
`tuneInvalWatchQueueSize = 4m` 使用软件包默认值。

```ini title="/etc/beegfs/beegfs-meta.conf"
sysRemoteInvalEnabled = true
tuneNumWorkers = 24
tuneInvalWatchMaxObjects = 50000000
tuneInvalWatchQueueSize = 4m
```

```ini title="/etc/beegfs/beegfs-storage.conf"
tuneNumWorkers = 24
```

检查四台节点的配置：

```shell
grep -E '^(sysRemoteInvalEnabled|tuneNumWorkers|tuneInvalWatch)' \
  /etc/beegfs/beegfs-meta.conf
grep -E '^tuneNumWorkers' /etc/beegfs/beegfs-storage.conf
grep -E '^sysRemoteInvalEnabled' /etc/beegfs/beegfs-client.conf
```

### 启动关系 {#startup-order}

management service 保存节点和 target 的注册信息，因此先启动。metadata 和 storage 向它
注册后，客户端才能挂载：

1. `cls1-gateway` 的 `beegfs-mgmtd`
2. `cls1-srv1..4` 的 `beegfs-meta` 和 `beegfs-storage`
3. 各节点的 `beegfs-client`

按节点职责启动服务：

=== "cls1-gateway"

    ```shell
    sudo systemctl enable --now beegfs-mgmtd
    systemctl is-active beegfs-mgmtd
    sudo systemctl enable --now beegfs-client
    systemctl is-active beegfs-client
    ```

=== "cls1-srv1..4"

    ```shell
    sudo systemctl enable --now beegfs-meta beegfs-storage
    systemctl is-active beegfs-meta beegfs-storage
    sudo systemctl enable --now beegfs-client
    systemctl is-active beegfs-client
    ```

所有服务启动后，在 `cls1-gateway` 查看节点和连接方式：

```shell
beegfs node list --with-nics
beegfs health check --print-net --print-df
```

正常结果应包含一个 management、四个 metadata、四个 storage 和五个 client 节点。
`Fallbacks` 应显示所有连接使用首选网卡和协议，targets 应全部可达并完成同步。

在每个客户端检查挂载：

```shell
findmnt -M /data/cls1-beegfs
```

当前许可证不包含 quota 功能，配置中的 quota 选项不会限制用户空间。

## 维护 {#beegfs-maintenance}

### 客户端无法挂载 {#client-mount-failure}

先检查客户端能否连接 management service：

```shell
ping -c 3 192.168.48.1
systemctl status beegfs-client --no-pager
journalctl -u beegfs-client -n 100 --no-pager
```

`management service unreachable` 指向 `cls1-gateway`、管理网或 TLS。management 可用但
metadata 或 storage 节点缺失时，在 `cls1-gateway` 查看注册状态：

```shell
beegfs node list --with-nics
beegfs health check
```

只有一台客户端失败时，比较该节点的 `/etc/beegfs/beegfs-client.conf`、认证文件和内核
模块。所有客户端同时失败时，先检查 management、metadata 和 storage，不要逐台重装客户端。

### 连接回退到 TCP {#rdma-fallback}

BeeGFS 在 RDMA 不可用时回退到 TCP，文件系统仍可访问。使用 `Fallbacks` 检查回退连接：

```shell
beegfs health check --print-net
```

先按[网络维护](../../network/maintenance.md#ipoib-rdma-failure)检查 `ibp194s0` 和 RDMA。
IPoIB 恢复后重新建立 BeeGFS 连接，再确认 `Fallbacks` 消失。

### target 离线或不同步 {#target-offline}

`beegfs health check` 会分别报告 reachability、mirror consistency、capacity 和 mapping。
先在对应节点检查底层文件系统和服务：

```shell
systemctl status beegfs-ssd1.mount beegfs-ssd2.mount beegfs-ssd3.mount --no-pager
systemctl status beegfs-meta beegfs-storage --no-pager
journalctl -u beegfs-meta -u beegfs-storage -n 200 --no-pager
```

底层文件系统没有挂载时，不要启动指向空目录的 storage 服务。target identity 或
mapping 异常时保留原目录和 identity，先确认故障节点和 target ID，再决定是否重新注册。

### 容量不足 {#capacity}

用 health check 同时查看 target 的可用空间和 inode：

```shell
beegfs health check --print-df
```

某个 target 单独接近满载时，检查 buddy group 的分布、该 target 上的文件和整个 BeeGFS 的
剩余容量。删除数据前确认路径属于 BeeGFS，并检查仍在运行的 Slurm 作业。

### 发生误删除或存储故障 {#data-reliability}

BeeGFS 和 `/home` 没有备份或快照。buddy mirror 和磁盘冗余不能恢复误删除，也不能处理
超过冗余能力的故障。数据恢复只提供 best-effort。

### 升级或迁移 BeeGFS {#upgrade}

所有 BeeGFS 节点使用相同版本。升级前停止写入并卸载客户端，确认 buddy mirror 已同步，
再保存 management 数据、配置和各 target identity。升级顺序与启动关系相同。恢复客户端后
运行 `beegfs health check --print-net --print-df`，同时检查 target 和 RDMA 连接。

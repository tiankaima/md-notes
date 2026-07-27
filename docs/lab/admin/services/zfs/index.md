---
title: ZFS
last_verified: 2026-07-27
---

# ZFS {#zfs}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | `cls1-gateway` |
| 依赖 | [服务器设置](../../server/setup.md#server-setup)、数据盘 |
| 使用方 | [NFS](../nfs/)、`cls1-gateway` 本地数据 |

## 搭建 {#zfs-setup}

### 配置软件源 {#configure-zfs-repository}

下载 Zabbly 签名密钥并核对 SHA-256：

```shell
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -d -m 0755 /etc/apt/keyrings
curl -fsSL https://pkgs.zabbly.com/key.asc -o /tmp/zabbly.asc
echo 'f1adb44fdf82083f983a392b5b406d34e473dce3d66a51de3118cdc1f51d3f87  /tmp/zabbly.asc' \
  | sha256sum --check
sudo install -o root -g root -m 0644 /tmp/zabbly.asc /etc/apt/keyrings/zabbly.asc
rm /tmp/zabbly.asc
```

实验室使用 Zabbly 的 Ubuntu 24.04 stable 内核和 OpenZFS 仓库：

```deb822 title="/etc/apt/sources.list.d/zabbly-kernel-stable.sources"
Types: deb deb-src
URIs: https://pkgs.zabbly.com/kernel/stable
Suites: noble
Components: zfs
Architectures: amd64
Signed-By: /etc/apt/keyrings/zabbly.asc
```

检查文件和仓库索引：

```shell
grep -E '^(URIs|Suites|Components|Signed-By):' \
  /etc/apt/sources.list.d/zabbly-kernel-stable.sources
sudo apt-get update
apt-cache policy openzfs-zfsutils openzfs-zfs-dkms openzfs-zfs-zed
```

### 安装 OpenZFS {#install-openzfs}

安装命令行工具、DKMS 模块和 ZED：

```shell
sudo apt-get install openzfs-zfsutils openzfs-zfs-dkms openzfs-zfs-zed
sudo modprobe zfs
```

检查软件包、内核模块和服务：

```shell
dpkg-query -W openzfs-zfsutils openzfs-zfs-dkms openzfs-zfs-zed
dkms status | grep -i zfs
zfs --version
systemctl is-active zfs-zed
```

### 导入存储池 {#import-zfs-pools}

`cls1-gateway` 当前有两个池：

| 池 | 用途 | 结构 |
| --- | --- | --- |
| `cls1-pool-gw` | `/data/cls1-pool-gw` | 一个由系统识别为单设备的 vdev |
| `cls1-pool-home` | `/home` 和 WebDAV | 两个 RAIDZ2 vdev |

先按磁盘序列号检查设备，再列出可以导入的池：

```shell
lsblk -o NAME,SIZE,MODEL,SERIAL,FSTYPE,MOUNTPOINTS
sudo zpool import -d /dev/disk/by-id
```

对上名称和 vdev 后导入已有池：

```shell
sudo zpool import -d /dev/disk/by-id cls1-pool-gw
sudo zpool import -d /dev/disk/by-id cls1-pool-home
zpool status
zfs list
```

创建新池前记录磁盘序列号、拓扑、ashift 和冗余方案。

### 配置数据集属性 {#configure-zfs-datasets}

实验室关闭两个数据集的 atime，并使用 LZ4 压缩：

```shell
sudo zfs set atime=off compression=lz4 cls1-pool-gw
sudo zfs set atime=off compression=lz4 cls1-pool-home/home
```

检查属性、池状态和挂载点：

```shell
zfs get atime,compression,mountpoint,recordsize \
  cls1-pool-gw cls1-pool-home/home
zpool status -x
zfs mount
```

### 配置 scrub 和 trim {#configure-scrub-and-trim}

两个池都启用每月 scrub。只有 `cls1-pool-gw` 启用每月 trim：

```shell
sudo systemctl enable --now zfs-scrub-monthly@cls1-pool-gw.timer
sudo systemctl enable --now zfs-scrub-monthly@cls1-pool-home.timer
sudo systemctl enable --now zfs-trim-monthly@cls1-pool-gw.timer
```

scrub 会读取并校验池中的数据。只有支持 discard 的设备才启用 trim。

```shell
systemctl list-timers 'zfs-scrub-*' 'zfs-trim-*'
```

`cls1-pool-home` 当前没有快照或备份。RAIDZ2 可以在一定数量的磁盘故障后继续工作，但不能
恢复误删除的文件。

## 维护 {#zfs-maintenance}

### 存储池状态异常 {#regular-checks}

```shell
zpool status -x
zpool list
zfs list -o name,used,available,mountpoint
systemctl list-timers 'zfs-scrub-*' 'zfs-trim-*'
```

### 磁盘故障 {#disk-failure}

先查看设备错误属于 READ、WRITE 还是 CKSUM，并使用 `/dev/disk/by-id/` 路径确认故障盘：

```shell
zpool status -P
smartctl -a /dev/disk/by-id/DEVICE
```

CKSUM 增长表示 ZFS 读到的数据校验失败，原因可能是磁盘、线缆、控制器或内存。只看到一个
历史错误计数时先观察是否继续增长，不要直接把磁盘离线。

1. 用序列号和槽位确认故障盘
2. 检查池的剩余冗余
3. 记录 `zpool status -P`
4. 更换磁盘，使用 `/dev/disk/by-id/` 路径
5. 等待 resilver 完成，再运行 scrub

`/dev/sdX` 会随启动顺序变化。使用磁盘序列号和 `/dev/disk/by-id/` 选择替换目标。降级池
一次只更换一块磁盘。

`zpool status` 提示存在未启用的 feature 时，先检查当前 ZFS 版本和恢复环境。
`zpool upgrade` 会改变磁盘格式，旧版本 ZFS 可能无法再导入该池，因此只在确认所有恢复环境
都支持这些 feature 后执行。

### 容量不足或文件被删除 {#capacity-and-recovery}

容量接近满载时，性能和恢复空间都会下降。删除数据集前检查 NFS、容器和其他使用方。
当前没有可供 rollback 的快照，误删除只能尝试恢复。

---
title: NFS
last_verified: 2026-07-28
---

# NFS {#nfs}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | `cls1-gateway`、`cls2-srv5` |
| 依赖 | [服务器设置](../../server/setup.md#server-setup)、[DNS](../dns/)、本地磁盘或 [ZFS](../zfs/)、可选的 [DOCA/RDMA](../doca/) |
| 使用方 | 登录环境、计算节点 |

## 搭建 {#nfs-setup}

### 安装软件包 {#install-nfs-packages}

=== "服务端"

    ```shell
    sudo apt-get update
    sudo apt-get install nfs-kernel-server
    dpkg-query -W nfs-kernel-server
    ```

=== "客户端"

    ```shell
    sudo apt-get update
    sudo apt-get install nfs-common
    dpkg-query -W nfs-common
    ```

### 配置服务端 {#configure-server}

`cls1-gateway` 导出集群目录。`root_squash` 将客户端的 root 映射为匿名用户：

写入 `/etc/exports` 前确认目录位于预期的本地文件系统：

=== "cls1-gateway"

    ```shell
    findmnt -T /data/cls1-pool-gw/cluster
    ```

=== "cls2-srv5"

    ```shell
    findmnt -T /data/cls2-pool1
    findmnt -T /data/cls2-pool2
    ```

```exports title="cls1-gateway:/etc/exports"
/data/cls1-pool-gw/cluster 192.168.48.0/24(rw,sync,no_subtree_check,root_squash,insecure) 192.168.51.0/24(rw,sync,no_subtree_check,root_squash,insecure) 192.168.49.0/24(rw,sync,no_subtree_check,root_squash,insecure) 100.64.0.0/10(rw,sync,no_subtree_check,root_squash,insecure)
```

`cls2-srv5` 向计算节点和 [Headscale](../headscale/) 网络导出 `/data/cls2-pool1` 和
`/data/cls2-pool2`。

```shell
sudo systemctl enable --now nfs-server
sudo exportfs -rav
systemctl is-active nfs-server
sudo exportfs -v
rpcinfo -p localhost
```

### 配置 NFSoRDMA {#configure-nfs-over-rdma}

当前两台 NFS 服务端只监听 TCP。启用 NFSoRDMA 时，服务端加载 `svcrdma`，并在
`/etc/nfs.conf` 中打开 RDMA 监听：

```ini title="/etc/nfs.conf"
[nfsd]
rdma=y
rdma-port=20049
```

```shell
echo svcrdma | sudo tee /etc/modules-load.d/nfs-rdma-server.conf
sudo modprobe svcrdma
sudo systemctl restart nfs-server
grep '^svcrdma ' /proc/modules
grep -F 'rdma 20049' /proc/fs/nfsd/portlist
```

客户端加载 `xprtrdma`，并使用服务端的 RDMA 网络地址挂载：

```shell
echo xprtrdma | sudo tee /etc/modules-load.d/nfs-rdma-client.conf
sudo modprobe xprtrdma
grep '^xprtrdma ' /proc/modules
sudo mount -t nfs4 -o proto=rdma,port=20049 \
  NFS_RDMA_SERVER:/data/EXPORT /mnt
findmnt -M /mnt -o TARGET,SOURCE,FSTYPE,OPTIONS
grep -F 'proto=rdma' /proc/mounts
```

需要在启动时挂载时，将相同参数写入 `/etc/fstab`：

```fstab title="/etc/fstab"
NFS_RDMA_SERVER:/data/EXPORT /mnt nfs4 rw,nofail,_netdev,hard,proto=rdma,port=20049,timeo=600,retrans=2 0 0
```

### 配置客户端 {#configure-client}

`cls2` 数据盘客户端示例：

```shell
sudo install -d -o root -g root -m 0755 \
  /data/cls2-pool1 /data/cls2-pool2
stat -c '%a %U:%G %n' /data/cls2-pool1 /data/cls2-pool2
```

```fstab title="/etc/fstab"
cls2-srv5:/data/cls2-pool1 /data/cls2-pool1 nfs4 rw,nofail,_netdev,hard,timeo=600,retrans=2 0 0
cls2-srv5:/data/cls2-pool2 /data/cls2-pool2 nfs4 rw,nofail,_netdev,hard,timeo=600,retrans=2 0 0
```

挂载后检查来源、文件系统类型和容量：

```shell
sudo mount -a
findmnt -M /data/cls2-pool1
findmnt -M /data/cls2-pool2
df -hT /data/cls2-pool1 /data/cls2-pool2
```

## 维护 {#nfs-maintenance}

### 导出或挂载状态异常 {#regular-checks}

```shell
exportfs -v
nfsstat -s
findmnt -t nfs,nfs4
df -hT
```

修改导出前检查客户端和底层文件系统。更新 exports 文件后运行 `exportfs -rav`。

### 客户端挂载失败 {#troubleshooting}

检查 DNS、路由、exports 客户端网段和端口。

### I/O 卡住 {#nfs-io-stalled}

检查服务器磁盘、网络、NFS 线程和客户端 `hard` 挂载状态。

### 文件权限错误 {#nfs-permission-error}

比较服务端和客户端的 UID/GID。

### 容量不足 {#nfs-capacity}

确认数据用途和保留时间。

### 数据被删除 {#nfs-data-deleted}

NFS 不提供备份。数据恢复能力取决于底层存储和备份。

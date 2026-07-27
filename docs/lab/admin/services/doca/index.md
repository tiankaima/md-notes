---
title: DOCA / RDMA
last_verified: 2026-07-27
---

# DOCA / RDMA {#doca}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | `cls1` 计算节点 |
| 依赖 | [服务器设置](../../server/setup.md#server-setup)、InfiniBand、IPoIB |
| 使用方 | [BeeGFS](../beegfs/) |

## 搭建 {#doca-setup}

### 配置软件源 {#configure-repository}

当前使用 NVIDIA DOCA 2.9 LTS 的 Ubuntu 24.04 x86-64 仓库。仓库提供的
`doca_keyring.gpg` 指纹是 `70454E6BF5D9C2D3B78709E8DC726C5E41B9CC50`。

```shell
sudo apt-get update
sudo apt-get install ca-certificates curl gpg
curl -fsSL \
  https://linux.mellanox.com/public/repo/doca/latest-2.9-LTS/ubuntu24.04/x86_64/doca_keyring.gpg \
  -o /tmp/doca_keyring.gpg
echo '2367ec42f81ddf785040cc410b03d861d9eb2c75c35ff859d98ce4494944f4e0  /tmp/doca_keyring.gpg' | \
  sha256sum --check
gpg --show-keys --with-fingerprint /tmp/doca_keyring.gpg
sudo install -o root -g root -m 0644 /tmp/doca_keyring.gpg \
  /usr/share/keyrings/doca_keyring.gpg
rm /tmp/doca_keyring.gpg
```

软件源固定在 `latest-2.9-LTS`：

```text title="/etc/apt/sources.list.d/doca.list"
deb [signed-by=/usr/share/keyrings/doca_keyring.gpg] https://linux.mellanox.com/public/repo/doca/latest-2.9-LTS/ubuntu24.04/x86_64/ ./
```

检查签名密钥和软件源：

```shell
gpg --show-keys /usr/share/keyrings/doca_keyring.gpg
grep -F 'latest-2.9-LTS' /etc/apt/sources.list.d/doca.list
sudo apt-get update
apt-cache policy doca-ofed
```

### 安装 DOCA/OFED {#install-doca-ofed}

实验室接口由 Netplan 和 systemd-networkd 管理。以下 drop-in 阻止 DOCA 的接口管理单元在
缺少 `/etc/network/interfaces` 时启动：

```ini title="/etc/systemd/system/mlnx_interface_mgr@.service.d/10-network-backend.conf"
[Unit]
ConditionPathExists=/etc/network/interfaces
```

```shell
sudo systemctl daemon-reload
sudo apt-get install doca-ofed=2.9.5-0.1.8
dpkg-query -W doca-ofed
dkms status
sudo reboot
```

重启后检查 OFED、InfiniBand 和 IPoIB：

```shell
ofed_info -s
ibstat
ibv_devinfo
rdma link
ip -details link show type ipoib
```

最后检查 IPoIB 和 RDMA 数据路径：

```shell
ping -I IPOIB_INTERFACE PEER_IP
ib_write_bw PEER_IP
```

在维护窗口内执行带宽测试，测试两端停止存储流量。

## 维护 {#doca-maintenance}

### 升级 DOCA/OFED {#upgrade}

DOCA/OFED 和内核模块变更会中断 BeeGFS RDMA。维护前停止 RDMA 流量，确认 IPMI 可用，
记录内核、固件和 OFED 版本。

```shell
uname -r
ofed_info -s
ethtool -i INTERFACE
ibstat
```

在同一维护窗口升级 DOCA/OFED 和内核。重启后检查 IPoIB、RDMA verbs、BeeGFS 和计算
服务。

### 链路丢包或 RDMA 回退 {#regular-checks}

```shell
rdma link
ibstat
ibqueryerrors
ip -s link show IPOIB_INTERFACE
```

出现丢包、链路降速或 RDMA 回退时，检查端口、交换机、MTU、IPoIB 模式、内核日志和
BeeGFS 客户端日志。`ping` 检查 IPoIB，`ib_write_bw` 检查 RDMA 数据路径。

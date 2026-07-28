---
title: Postfix
last_verified: 2026-07-27
---

# Postfix {#postfix}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | `cls1-gateway`、`login` 和计算节点 |
| 依赖 | 管理网络、服务器主机名 |
| 使用方 | [监控](../monitoring/)中的存储邮件检查 |

Postfix 将各节点发给 `root` 的本地邮件集中到 `cls1-gateway`。当前没有配置外部邮箱或
`root` 别名，这些邮件保存在 `cls1-gateway` 的 `/var/mail/root`。邮件主要来自存储检查、smartd
和 Cron 输出。

## 搭建 {#postfix-setup}

### 安装 Postfix {#install-postfix}

所有发送节点安装 Postfix 和 `mail`：

```shell
sudo apt-get update
sudo apt-get install postfix mailutils
dpkg-query -W postfix mailutils
```

### 配置发送节点 {#configure-mail-clients}

`cls1` 节点使用 `cls1-gateway` 作为邮件中继，`cls2` 节点使用它的管理地址。发送节点只监听
环回地址，并将非本地邮件交给 `cls1-gateway`：

```ini title="发送节点的 /etc/postfix/main.cf"
inet_interfaces = loopback-only
myhostname = HOSTNAME
myorigin = $myhostname
mydestination =
relayhost = [cls1-gateway]
relay_transport = relay
```

应用配置后检查监听地址和邮件中继：

```shell
sudo postfix check
sudo systemctl restart postfix
postconf inet_interfaces relayhost mydestination
ss -ltn 'sport = :25'
```

发送节点只应在环回地址的 25/TCP 监听，`mydestination` 应为空。

### 配置 `cls1-gateway` {#configure-mail-gateway}

`cls1-gateway` 在 `127.0.0.1` 和 `192.168.48.1` 上监听。它将各服务器主机名列入
`mydestination`，所以 `root@cls2-srv5` 等地址会作为本地邮件投递：

```ini title="cls1-gateway 的 /etc/postfix/main.cf"
inet_interfaces = 127.0.0.1, 192.168.48.1
myorigin = $myhostname
mydestination = $myhostname, cls1-gateway, login, cls1-srv1, cls1-srv2,
    cls1-srv3, cls1-srv4, cls2-srv1, cls2-srv2, cls2-srv3, cls2-srv4,
    cls2-srv5, cls2-srv6, cls2-srv7, localhost.localdomain, localhost
relay_transport = error
```

`mynetworks` 限制可以连接的来源，修改监听地址时一并检查。

```shell
sudo postfix check
sudo systemctl restart postfix
postconf inet_interfaces mydestination mynetworks relay_transport
ss -ltn 'sport = :25'
```

### 验证邮件转发 {#verify-mail-relay}

在发送节点向本机 root 地址发送测试邮件。`cls1-gateway` 将主机名识别为本地目标：

```shell
printf 'postfix relay test from %s\n' "$(hostname -s)" | \
  mail -s "postfix-test-$(hostname -s)" "root@$(hostname -s)"
postqueue -p
```

在 `cls1-gateway` 查找测试主题：

```shell
grep -F 'Subject: postfix-test-' /var/mail/root | tail
```

### 配置 SMART 邮件 {#smartd-mail}

`smartd` 使用发行版提供的 `smartd-runner`，发现磁盘错误时发送给 `root`：

```shell
sudo apt-get update
sudo apt-get install smartmontools
dpkg-query -W smartmontools
```

```text title="/etc/smartd.conf"
DEVICESCAN -d removable -n standby -m root -M exec /usr/share/smartmontools/smartd-runner
```

```shell
sudo systemctl enable --now smartmontools.service
systemctl status smartmontools.service --no-pager
journalctl -u smartmontools.service -n 100 --no-pager
```

## 维护 {#postfix-maintenance}

### Cron 邮件过多 {#excessive-cron-mail}

Cron 会把任务的 stdout 和 stderr 发给 `root`。持续产生正常输出的任务应调整输出方式，
错误信息仍应保留。

### 邮件未到达 `cls1-gateway` {#mail-not-delivered}

先在发送节点检查队列和到 `cls1-gateway` 的 25/TCP：

```shell
postqueue -p
nc -vz 192.168.48.1 25
journalctl -u postfix -n 100 --no-pager
```

队列为空时，在 `cls1-gateway` 检查 root 邮箱和本地投递日志：

```shell
grep -c '^From ' /var/mail/root
sudo mail -u root
journalctl -u postfix -n 100 --no-pager
```

### 存储告警需要发送到外部邮箱 {#external-alert-recipient}

将存储告警发送到外部邮箱时，需要设置 `MAIL_TO`。`cls1-gateway` 无法直接投递到目标邮件
服务器时，还需要配置外部邮件中继。

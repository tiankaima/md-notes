---
title: SSSD
last_verified: 2026-07-28
---

# SSSD {#sssd}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | 实验室 Linux 服务器、[systemd-nspawn](../systemd-nspawn/) 容器 |
| 依赖 | [服务器设置](../../server/setup.md#server-setup)、[LLDAP](../lldap/) |
| 使用方 | [Slurm](../slurm/)、SSH |

## 搭建 {#sssd-setup}

### 选择访问组 {#select-access-group}

| 主机 | `simple_allow_groups` |
| --- | --- |
| 大多数服务器 | `server_admin` |
| `login` | `server_user` |
| `cls2-srv1` | `server_admin, server_user` |

修改远程服务器的 SSSD、PAM 或 SSH 前，保留一个 root 公钥登录会话。

### 安装依赖 {#install-packages}

```shell
sudo apt-get update
sudo apt install -y sssd sssd-tools libnss-sss libpam-sss libsss-sudo
dpkg-query -W sssd sssd-tools libnss-sss libpam-sss libsss-sudo
```

### SSSD 主配置 {#sssd-config}

```ini title="/etc/sssd/sssd.conf"
[sssd]
config_file_version = 2
services = nss, pam, ssh
domains = lldap.lab.tiankaima.cn

[nss]
filter_users = root
filter_groups = root

[pam]
offline_failed_login_attempts = 3
offline_failed_login_delay = 5

[ssh]
```

### LLDAP 域配置 {#lldap-domain}

```ini title="/etc/sssd/conf.d/lldap.lab.tiankaima.cn.conf"
[domain/lldap.lab.tiankaima.cn]
id_provider = ldap
auth_provider = ldap
chpass_provider = ldap
access_provider = simple
simple_allow_groups = server_admin

enumerate = True
cache_credentials = True

ldap_uri = ldaps://lldap.lab.tiankaima.cn/
ldap_schema = rfc2307bis
ldap_search_base = dc=lab,dc=tiankaima,dc=cn

ldap_default_bind_dn = READ_ONLY_BIND_DN
ldap_default_authtok = READ_ONLY_BIND_PASSWORD

ldap_tls_cacert = /etc/ssl/certs/ca-certificates.crt
ldap_tls_reqcert = demand

ldap_user_search_base = ou=people,dc=lab,dc=tiankaima,dc=cn?subtree?(uidNumber=*)
ldap_user_object_class = posixAccount
ldap_user_name = uid
ldap_user_gecos = cn
ldap_user_uid_number = uidNumber
ldap_user_gid_number = gidNumber
ldap_user_home_directory = homeDirectory
ldap_user_shell = unixShell
ldap_user_ssh_public_key = sshPublicKey

ldap_group_search_base = ou=groups,dc=lab,dc=tiankaima,dc=cn?subtree?(gidNumber=*)
ldap_group_object_class = groupOfUniqueNames
ldap_group_name = cn
ldap_group_gid_number = gidNumber
ldap_group_member = uniqueMember
```

!!! warning

    查询账户只授予目录读取权限。`ldap_default_authtok` 是明文密码，配置文件权限为
    `0600`。

### 权限与重启 {#permissions-and-restart}

```shell
sudo chown root:root /etc/sssd/sssd.conf \
  /etc/sssd/conf.d/lldap.lab.tiankaima.cn.conf
sudo chmod 0600 /etc/sssd/sssd.conf \
  /etc/sssd/conf.d/lldap.lab.tiankaima.cn.conf
sudo pam-auth-update --enable mkhomedir
sudo sssctl config-check
sudo systemctl disable --now sssd-nss.socket sssd-pam.socket \
  sssd-pam-priv.socket sssd-ssh.socket
sudo systemctl restart sssd
systemctl is-active sssd
sssctl domain-status lldap.lab.tiankaima.cn
getent passwd LDAP_USER
id LDAP_USER
```

### SSH 公钥 {#ssh-public-keys}

```sshconfig title="/etc/ssh/sshd_config.d/10-sssd-authorized-keys.conf"
AuthorizedKeysCommand /usr/bin/sss_ssh_authorizedkeys
AuthorizedKeysCommandUser nobody
```

```shell
sudo sshd -t
sudo systemctl reload ssh
sss_ssh_authorizedkeys LDAP_USER
```

### sudo 权限 {#sudo}

```sudoers
%server_admin ALL=(ALL:ALL) NOPASSWD: ALL
```

使用 `visudo` 修改 sudoers。

```shell
sudo visudo -cf /etc/sudoers.d/server_admin
sudo -l -U LDAP_USER
```

## 维护 {#sssd-maintenance}

### 配置修改后未生效 {#changes}

```shell
sudo sssctl config-check
sudo sshd -t
sudo systemctl restart sssd
getent passwd USER
id USER
sss_ssh_authorizedkeys USER
```

确认 LLDAP 数据正确后清理缓存：

```shell
sudo sssctl cache-expire -u USER
sudo sss_cache -E
```

### 迁移现有用户 {#migrate-local-users}

确认本地用户和目录用户的 UID/GID，查找原用户的文件：

```shell
id LOCAL_USER
getent passwd LDAP_USER
find / -xdev -uid LOCAL_UID -print
find / -xdev -gid LOCAL_GID -print
```

检查输出后，对列出的文件执行 `chown` 和 `chgrp`。确认目录账号可以登录后，再运行
`deluser`。

### 用户无法解析或登录 {#troubleshooting}

```shell
sssctl domain-status lldap.lab.tiankaima.cn
journalctl -u sssd --since today
ldapsearch -x -H ldaps://lldap.lab.tiankaima.cn -b dc=lab,dc=tiankaima,dc=cn
```

LDAP bind 失败时检查查询账户和密码。目录中可以查询用户，但 `getent` 没有结果时检查
SSSD 缓存和用户属性。`getent` 正常但 SSH 登录失败时检查 PAM 和 SSH 日志。

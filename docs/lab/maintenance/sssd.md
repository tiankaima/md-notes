# SSSD Migration

> 目标：
>
> > 使用 SSSD 对接 `lldap.lab.tiankaima.cn`，统一 Linux 登录鉴权、用户/组解析与 SSH 公钥获取。
>
> 注意：
>
> > 本文示例基于 Debian/Ubuntu 系，LDAP 通过 `LDAPS` 访问。
> >
> > `sssd.conf` 与 `conf.d/*.conf` 包含敏感信息，必须限制权限。

## 安装依赖

```shell
sudo apt install -y sssd sssd-tools libnss-sss libpam-sss libsss-sudo
```

## SSSD 主配置

=== "`/etc/sssd/sssd.conf`"

    ```ini
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

## 域配置（LLDAP）

=== "`/etc/sssd/conf.d/lldap.lab.tiankaima.cn.conf`"

    ```ini
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

    ldap_default_bind_dn = uid=admin,ou=people,dc=lab,dc=tiankaima,dc=cn
    ldap_default_authtok = FILL_BIND_PASSWORD_HERE

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

    `ldap_default_authtok` 是明文密码，建议后续改为使用更细粒度权限的只读绑定账号，并配合主机级访问控制。

## 权限与重启

```shell
sudo chmod -R go-rwx /etc/sssd
sudo pam-auth-update --enable mkhomedir
sudo systemctl restart sssd
```

## SSH 公钥集成

编辑 `sshd` 配置，启用 SSSD 公钥查询：

=== "`/etc/ssh/sshd_config`"

    ```sshconfig
    AuthorizedKeysCommand /usr/bin/sss_ssh_authorizedkeys
    AuthorizedKeysCommandUser nobody
    ```

```shell
sudo systemctl restart ssh
sudo systemctl restart sshd
```

## sudo 权限示例

```shell
sudo visudo
```

```sudoers
%server_admin ALL=(ALL:ALL) NOPASSWD: ALL
```

## 迁移现有用户

```shell
sudo pam-auth-update
id <local-user>
find / -xdev -uid <local-uid> -print -exec chown <ldap-user> {} \;
find / -xdev -gid <local-gid> -print -exec chgrp <ldap-user> {} \;
sudo deluser <local-user>
```

## 快速验证

```shell
getent passwd <ldap-user>
id <ldap-user>
sssctl domain-status lldap.lab.tiankaima.cn
sudo -l -U <ldap-user>
```

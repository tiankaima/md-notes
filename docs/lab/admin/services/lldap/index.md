---
title: LLDAP
last_verified: 2026-07-28
---

# LLDAP {#lldap}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | `jp-2` |
| 依赖 | [Docker](../docker/)、[Caddy](../caddy/)签发的 TLS 证书 |
| 使用方 | [SSSD](../sssd/) |

数据保存在 `/srv/docker/lldap/data`。

## 搭建 {#lldap-setup}

### 准备目录和密钥 {#prepare-lldap-data}

创建项目和数据目录，并安装初始化时使用的 LDAP 客户端：

```shell
sudo apt-get update
sudo apt-get install ldap-utils openssl
sudo install -d -o root -g root -m 0755 \
  /srv/docker/lldap /srv/docker/lldap/data
```

JWT secret、key seed 和管理员密码分别生成，不重复使用同一个值：

```shell
openssl rand -hex 32
openssl rand -hex 32
openssl rand -base64 32
```

将三次输出写入下面的环境文件，然后限制读取权限：

```bash title="/srv/docker/lldap/lldap.env"
UID=0
GID=0
TZ=Asia/Shanghai
LLDAP_JWT_SECRET=REPLACE_WITH_FIRST_RANDOM_HEX
LLDAP_KEY_SEED=REPLACE_WITH_SECOND_RANDOM_HEX
LLDAP_LDAP_BASE_DN=dc=lab,dc=tiankaima,dc=cn
LLDAP_LDAP_USER_PASS=REPLACE_WITH_RANDOM_PASSWORD
```

```shell
sudo chown root:root /srv/docker/lldap/lldap.env
sudo chmod 0600 /srv/docker/lldap/lldap.env
stat -c '%a %U:%G' /srv/docker/lldap/lldap.env
```

先启动 [Caddy](../caddy/)，再检查 LLDAP 使用的证书文件：

```shell
sudo test -r /srv/docker/caddy/data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/lldap.lab.tiankaima.cn/lldap.lab.tiankaima.cn.crt
sudo test -r /srv/docker/caddy/data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/lldap.lab.tiankaima.cn/lldap.lab.tiankaima.cn.key
```

### 启动 LLDAP {#start-lldap}

```yaml title="/srv/docker/lldap/docker-compose.yml"
services:
  lldap:
    image: lldap/lldap:stable@sha256:9e605a66c02514bfcffd1b67cafb1e98d50992216bb2871d7ae44622047dd09d
    container_name: lldap
    restart: always
    env_file:
      - /srv/docker/lldap/lldap.env
    ports:
      - "0.0.0.0:636:6360"
      - "[::]:636:6360"
      - "127.0.0.1:17170:17170"
    volumes:
      - /srv/docker/lldap/data:/data
      - /srv/docker/caddy/data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/lldap.lab.tiankaima.cn:/certs:ro
    environment:
      - LLDAP_LDAPS_OPTIONS__ENABLED=true
      - LLDAP_LDAPS_OPTIONS__CERT_FILE=/certs/lldap.lab.tiankaima.cn.crt
      - LLDAP_LDAPS_OPTIONS__KEY_FILE=/certs/lldap.lab.tiankaima.cn.key
```

启动后检查 Compose、容器和 LDAPS：

```shell
cd /srv/docker/lldap
docker compose config --quiet
docker compose up -d
docker compose ps
openssl s_client -verify_return_error \
  -connect lldap.lab.tiankaima.cn:636 \
  -servername lldap.lab.tiankaima.cn </dev/null
```

### 初始化 {#initialization}

创建 POSIX 用户时设置 `uidNumber`、`gidNumber`、home、shell 和 SSH 公钥。创建
`server_user`、`server_admin` 组。UID/GID 在所有主机上保持一致。

初始化后查询目录中的用户和组：

```shell
ldapwhoami -x -H ldaps://lldap.lab.tiankaima.cn \
  -D READ_ONLY_BIND_DN -W
ldapsearch -x -H ldaps://lldap.lab.tiankaima.cn \
  -D READ_ONLY_BIND_DN -W \
  -b dc=lab,dc=tiankaima,dc=cn '(objectClass=*)' dn
```

## 维护 {#lldap-maintenance}

### LLDAP 无法访问 {#regular-checks}

LLDAP 故障会影响 SSSD 用户解析、新 SSH 会话和 sudo 组判断。维护前保留 root 公钥登录
会话，并检查各主机的 SSSD 缓存。

```shell
docker compose -f /srv/docker/lldap/docker-compose.yml ps
docker logs --tail=100 lldap
openssl s_client -connect lldap.lab.tiankaima.cn:636 </dev/null
```

### UID、GID 或组权限错误 {#users-and-groups}

- 已用于文件所有权的 UID/GID 保持不变
- 删除用户前检查文件所有权、[Slurm](../slurm/) association 和运行中的作业
- `server_admin` 只授予服务器管理员
- 修改 SSH 公钥后，在 SSSD 客户端查询新公钥

### 升级或迁移 LLDAP {#backup-and-upgrade}

升级前停止写入，备份 `/srv/docker/lldap/data` 和环境文件，并记录镜像摘要。恢复测试
使用隔离网络。

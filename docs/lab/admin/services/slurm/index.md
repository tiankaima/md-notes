---
title: Slurm
last_verified: 2026-07-27
---

# Slurm {#slurm}

| 项目 | 内容 |
| --- | --- |
| 部署位置 | - `slurmctld`、`slurmdbd` 和 `slurm-mysql` 位于 `cls1-gateway`<br> - Munge 位于 controller、`login` 和计算节点<br> - client 位于 [systemd-nspawn](../systemd-nspawn/)<br> - `slurmd` 位于计算节点 |
| 依赖 | [SSSD](../sssd/)、MySQL、[NVIDIA Driver](../nvidia-driver/)、共享存储 |
| 使用方 | [监控](../monitoring/) |

## 搭建 {#slurm-setup}

### 准备服务账号 {#prepare-accounts-and-version}

所有主机使用 `slurm` UID/GID `2000`。新主机在安装软件包前创建本地账号：

```shell
sudo groupadd --system --gid 2000 slurm
sudo useradd --system --uid 2000 --gid 2000 \
  --home-dir /var/lib/slurm --create-home \
  --shell /usr/sbin/nologin slurm
```

检查本地账号：

```shell
getent passwd slurm
getent group slurm
grep '^slurm:' /etc/passwd /etc/group
```

### 构建 Ubuntu 24.04 软件包 {#build-slurm-packages}

`cls1-gateway`、`login` 和 Ubuntu 24.04 计算节点使用 SchedMD 25.11.2。当前软件源不提供
这组软件包，需要从 SchedMD 源码构建 DEB：

```shell
sudo apt-get update
sudo apt-get install build-essential fakeroot devscripts equivs \
  ca-certificates curl
mkdir -p ~/src
cd ~/src
curl --fail --location --remote-name \
  https://download.schedmd.com/slurm/slurm-25.11.2.tar.bz2
echo '9bfd844f746c1268d6e0cb14bda586b548b1c4b12f8c72181397d0cec9ce5d39  slurm-25.11.2.tar.bz2' | \
  sha256sum --check
tar -xjf slurm-25.11.2.tar.bz2
cd slurm-25.11.2
sudo mk-build-deps --install debian/control
debuild -b -uc -us
```

`mk-build-deps` 根据当前版本的 `debian/control` 安装构建依赖。SchedMD 的
[Quick Start Administrator Guide](https://slurm.schedmd.com/quickstart_admin.html#debuild)记录了相同的
DEB 构建流程。

检查源码版本和后续安装需要的软件包：

```shell
cd ~/src
tar -xjOf slurm-25.11.2.tar.bz2 slurm-25.11.2/META | \
  grep -E '^[[:space:]]+(Version|Release):'
for package in \
  slurm-smd_25.11.2-1_amd64.deb \
  slurm-smd-client_25.11.2-1_amd64.deb \
  slurm-smd-slurmctld_25.11.2-1_amd64.deb \
  slurm-smd-slurmd_25.11.2-1_amd64.deb \
  slurm-smd-slurmdbd_25.11.2-1_amd64.deb; do
  test -r "$package" || exit 1
  dpkg-deb --field "$package" Package Version
done
```

将这些 DEB 复制到 `cls1-gateway`、`login` 和 Ubuntu 24.04 计算节点。软件包必须来自同一次
构建。

### 安装 Slurm {#install-slurm}

在 Ubuntu 24.04 主机的软件包目录中执行对应命令。Ubuntu 25.10 计算节点使用系统软件源中的
`slurm-client` 和 `slurmd`：

=== "Controller"

    ```shell
    sudo apt-get install munge \
      ./slurm-smd_25.11.2-1_amd64.deb \
      ./slurm-smd-client_25.11.2-1_amd64.deb \
      ./slurm-smd-slurmctld_25.11.2-1_amd64.deb \
      ./slurm-smd-slurmd_25.11.2-1_amd64.deb \
      ./slurm-smd-slurmdbd_25.11.2-1_amd64.deb
    dpkg-query -W munge slurm-smd slurm-smd-client \
      slurm-smd-slurmctld slurm-smd-slurmd slurm-smd-slurmdbd
    test "$(sinfo --version)" = 'slurm 25.11.2'
    ```

=== "Ubuntu 24.04 计算节点和 login"

    ```shell
    sudo apt-get install munge \
      ./slurm-smd_25.11.2-1_amd64.deb \
      ./slurm-smd-client_25.11.2-1_amd64.deb \
      ./slurm-smd-slurmd_25.11.2-1_amd64.deb
    dpkg-query -W munge slurm-smd slurm-smd-client slurm-smd-slurmd
    test "$(sinfo --version)" = 'slurm 25.11.2'
    ```

=== "Ubuntu 25.10 计算节点"

    ```shell
    sudo apt-get update
    sudo apt-get install --no-install-recommends munge slurm-client slurmd
    dpkg-query -W munge slurm-client slurmd
    sinfo --version
    ```

### Munge {#munge}

Munge 用于认证 Slurm 组件之间的通信。controller、`login` 和计算节点使用同一个
`/etc/munge/munge.key`。密钥通过安全渠道从现有节点复制，不在文档或仓库中保存。

```shell
sudo install -o munge -g munge -m 0400 CLUSTER_MUNGE_KEY /etc/munge/munge.key
sudo systemctl enable --now munge
```

在每台主机上验收文件权限和本机编码、解码：

```shell
stat -c '%a %U %G' /etc/munge/munge.key
munge -n | unmunge
systemctl is-active munge
```

从一台主机生成 credential，在另一台主机解码，确认两台主机使用同一密钥：

```shell
munge -n | ssh HOST unmunge
```

### 配置计费数据库 {#configure-slurm-accounting-database}

`cls1-gateway` 使用 MySQL 8.0 保存 Slurm accounting 数据。创建项目和数据目录：

```shell
sudo install -d -o root -g root -m 0755 /srv/docker/mysql
sudo install -d -o root -g root -m 0700 /srv/docker/mysql/data
openssl rand -base64 32
openssl rand -base64 32
```

将两次随机输出分别写入 root 密码和 `slurm` 数据库密码：

```bash title="/srv/docker/mysql/mysql.env"
MYSQL_ROOT_PASSWORD=REPLACE_WITH_FIRST_RANDOM_PASSWORD
MYSQL_DATABASE=slurm_acct_db
MYSQL_USER=slurm
MYSQL_PASSWORD=REPLACE_WITH_SECOND_RANDOM_PASSWORD
```

```shell
sudo chown root:root /srv/docker/mysql/mysql.env
sudo chmod 0600 /srv/docker/mysql/mysql.env
stat -c '%a %U:%G' /srv/docker/mysql/mysql.env
```

MySQL 只监听宿主机环回地址：

```yaml title="/srv/docker/mysql/docker-compose.yml"
services:
  slurm-mysql:
    image: mysql:8.0@sha256:99d774bf02a48a1bb1c599920d2571946d31e5940b854b02737d5e95c184358f
    container_name: slurm-mysql
    restart: unless-stopped
    env_file:
      - mysql.env
    ports:
      - "127.0.0.1:3306:3306"
    volumes:
      - /srv/docker/mysql/data:/var/lib/mysql
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --default-authentication-plugin=mysql_native_password
```

启动后检查容器、监听地址和数据库：

```shell
cd /srv/docker/mysql
docker compose config --quiet
docker compose up -d
docker compose ps
ss -ltn '( sport = :3306 )'
docker exec slurm-mysql sh -c \
  'mysqladmin ping -uroot -p"$MYSQL_ROOT_PASSWORD"'
```

### 配置 SlurmDBD {#slurmdbd}

`slurmdbd` 作为 systemd 服务运行在 `cls1-gateway:6819`，通过 Munge 认证。MySQL 运行在
同一台主机的 `slurm-mysql` 容器中，只监听 `127.0.0.1:3306`。数据库
`slurm_acct_db` 保存 association、QoS 和用量。

```ini title="/etc/slurm/slurmdbd.conf"
AuthType=auth/munge
DbdHost=localhost
DbdPort=6819
SlurmUser=slurm

StorageType=accounting_storage/mysql
StorageHost=127.0.0.1
StoragePort=3306
StorageUser=slurm
StoragePass=FILL_DATABASE_PASSWORD_HERE
StorageLoc=slurm_acct_db
```

`slurmdbd.conf` 包含数据库密码，只允许 `slurm` 读取：

```shell
sudo install -d -o slurm -g slurm -m 0755 \
  /var/spool/slurmctld /var/spool/slurmd /var/log/slurm
sudo chown slurm:slurm /etc/slurm/slurmdbd.conf
sudo chmod 0600 /etc/slurm/slurmdbd.conf
stat -c '%a %U %G' /etc/slurm/slurmdbd.conf
```

MySQL 和 Munge 就绪后启动 `slurmdbd`：

```shell
sudo systemctl enable --now slurmdbd
systemctl is-active slurmdbd
```

从空数据库开始时注册 `cls1`，然后检查监听端口和 accounting 数据库：

```shell
sudo sacctmgr --immediate add cluster cls1
systemctl is-active munge slurmdbd
ss -ltn '( sport = :6819 )'
ss -ltn '( sport = :3306 )'
sacctmgr show cluster
sacctmgr show qos
```

### Slurm 配置 {#slurm-configuration}

调度和计费使用以下配置：

```ini title="/etc/slurm/slurm.conf"
SlurmctldHost=cls1-gateway
SlurmctldPort=6817
ClusterName=cls1
SlurmUser=slurm
StateSaveLocation=/var/spool/slurmctld
SlurmdSpoolDir=/var/spool/slurmd
AccountingStorageHost=cls1-gateway
AccountingStoragePort=6819
AccountingStorageType=accounting_storage/slurmdbd
AccountingStorageEnforce=associations,limits,qos
SelectType=select/cons_tres
SelectTypeParameters=CR_Core_Memory
ProctrackType=proctrack/cgroup
TaskPlugin=task/cgroup
TaskPluginParam=autobind=cores
GresTypes=gpu
JobSubmitPlugins=lua

PartitionName=cls1 Nodes=cls1-srv[1-4] Default=YES MaxTime=INFINITE State=UP
PartitionName=cls2 Nodes=cls2-srv[1-3],cls2-srv[6-7] Default=NO MaxTime=INFINITE State=UP
```

GPU 节点在 `gres.conf` 中声明类型、数量和 `/dev/nvidia*` 范围。

```ini title="/etc/slurm/cgroup.conf"
CgroupPlugin=autodetect
ConstrainCores=yes
ConstrainDevices=yes
ConstrainRAMSpace=yes
ConstrainSwapSpace=yes
```

检查静态配置、节点硬件、GRES 和 cgroup：

```shell
slurmd -C
grep -vE '^\s*(#|$)' /etc/slurm/gres.conf /etc/slurm/cgroup.conf
nvidia-smi -L
```

### 提交策略 {#job-submit-policy}

`/etc/slurm/job_submit.lua` 拒绝工作目录、标准输出或标准错误位于 `/home` 的作业：

```lua title="/etc/slurm/job_submit.lua"
-- Reject Slurm jobs submitted from or logging directly to /home.
-- /home is not shared consistently across compute nodes; use BeeGFS instead.

local home_prefix = "/home"
local beegfs_hint = "/data/cls1-beegfs/home/$USER"

local function is_home_path(path)
    if path == nil then
        return false
    end
    if path == home_prefix then
        return true
    end
    return string.sub(path, 1, string.len(home_prefix) + 1) == home_prefix .. "/"
end

local function reject(reason, path)
    slurm.log_user("Rejected by cluster storage policy: %s is under /home (%s). /home is not shared consistently on compute nodes. Use /data/cls1-beegfs/home/$USER for Slurm work directories and logs.", reason, path or "unset")
    slurm.log_info("job_submit.lua: rejected job: %s=%s", reason, path or "unset")
    return slurm.ERROR
end

local function check_job(job_desc)
    if is_home_path(job_desc.work_dir) then
        return reject("WorkDir", job_desc.work_dir)
    end

    local stdout = job_desc.standard_output or job_desc.std_out or job_desc.stdout
    if is_home_path(stdout) then
        return reject("StdOut", stdout)
    end

    local stderr = job_desc.standard_error or job_desc.std_err or job_desc.stderr
    if is_home_path(stderr) then
        return reject("StdErr", stderr)
    end

    return slurm.SUCCESS
end


function slurm_job_submit(job_desc, part_list, submit_uid)
    return check_job(job_desc)
end


function slurm_job_modify(job_desc, job_ptr, part_list, modify_uid)
    return check_job(job_desc)
end
```

修改后检查语法。首次启用 `JobSubmitPlugins=lua` 时重载配置；此后 `slurmctld` 会在提交
作业时加载脚本的新版本：

```shell
luac -p /etc/slurm/job_submit.lua
```

### 启动 Slurm {#start-slurm-services}

配置文件和 `job_submit.lua` 就绪后按职责启动 daemon：

=== "Controller"

    ```shell
    sudo systemctl enable --now slurmctld
    systemctl is-active slurmctld
    ss -ltn '( sport = :6817 )'
    ```

=== "计算节点"

    ```shell
    sudo slurmd -C
    sudo systemctl enable --now slurmd
    systemctl is-active slurmd
    ```

=== "login"

    ```shell
    sudo systemctl disable --now slurmd
    systemctl is-enabled slurmd
    sinfo
    ```

所有节点启动后检查分区、节点、association 和 QoS：

```shell
sudo scontrol reconfigure
sinfo -N -o '%N %P %t %c %m %G'
sacctmgr show qos
sacctmgr show assoc
```

### 验证提交策略 {#verify-job-submit-policy}

以下三个命令应分别因 `WorkDir`、`StdOut` 和 `StdErr` 位于 `/home` 而被拒绝：

```shell
BEEGFS_HOME="/data/cls1-beegfs/home/$USER"
sbatch --test-only --chdir="/home/$USER" --wrap=true
sbatch --test-only --chdir="$BEEGFS_HOME" --output="/home/$USER/slurm-%j.out" --wrap=true
sbatch --test-only --chdir="$BEEGFS_HOME" --error="/home/$USER/slurm-%j.err" --wrap=true
sbatch --test-only --chdir="$BEEGFS_HOME" --output="$BEEGFS_HOME/slurm-%j.out" --error="$BEEGFS_HOME/slurm-%j.err" --wrap=true
```

最后一个命令应通过检查。

association 和 QoS 设置作业数、时长、资源与计费用量上限。`cls2` 只允许获得管理员授权的
账号使用。

## 维护 {#slurm-maintenance}

### 作业排队或节点不可用 {#regular-checks}

```shell
sinfo -R
squeue -o '%.18i %.9P %.20j %.8u %.8T %.10M %R'
sdiag
sacct -S today -o JobID,User,State,Elapsed,AllocTRES,ExitCode
systemctl status munge slurmdbd slurmctld
```

### 节点需要停机维护 {#node-maintenance}

```shell
scontrol update NodeName=NODE State=DRAIN Reason='maintenance: DESCRIPTION'
squeue -w NODE
```

维护完成后检查 `slurmd`、GRES 和节点健康检查，再恢复节点：

```shell
scontrol update NodeName=NODE State=RESUME
```

### 作业因 QoS、计费或分区权限被拒绝 {#qos-billing-and-restricted-partitions}

每个计费周期都有使用量上限。修改 association、QoS 或用量前，记录原设置并由管理员
确认。`cls2` 权限通过 association 授予和撤销。

### 迁移或恢复 Slurm controller {#backup-and-recovery}

备份 SlurmDB 计费数据、`slurmdbd.conf`、Munge 密钥和 controller 状态。恢复数据库和
Munge 后再启动 controller。

### 作业提交或计费异常 {#troubleshooting}

```shell
scontrol show job JOBID
scontrol show node NODE
journalctl -u munge -u slurmctld -u slurmd -u slurmdbd --since today
sacctmgr show assoc user=USER
cd /srv/docker/mysql
docker compose ps
docker compose logs --tail=100
```

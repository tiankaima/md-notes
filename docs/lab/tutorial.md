# 关于 Slurm {#slurm}

本文最后核验于 2026-07-26。分区和节点状态以 `sinfo`、`scontrol` 的输出为准。

使用前填写群内登记表，并私信管理员确认账号。示例使用 `cls1` 分区。`cls2` 不对所有同学
开放，使用权限由管理员确认。

集群通过 [Slurm](./admin/services/slurm/) 提交作业。使用注册的用户名登录：

```shell
ssh username@cls1-gateway.s.tiankaima.dev -p 2022
```

登录节点名为 `login`。建议配置 `~/.ssh/config`：

```sshconfig title="~/.ssh/config"
Host login
    HostName cls1-gateway.s.tiankaima.dev
    Port 2022
    User username
```

配置后运行：

```shell
ssh login
```

### 工作目录 {#working-directory}

计算节点不共享 `/home`。Slurm 拒绝工作目录、标准输出或标准错误位于 `/home` 的作业。
使用 `cls1` 分区时，将代码、环境、数据和日志放在 [BeeGFS](./admin/services/beegfs/) 中：

```shell
cd "/data/cls1-beegfs/home/$USER"
```

!!! danger "重要数据请自行备份"

    `/home` 和 BeeGFS 存储的数据无备份或快照。

    磁盘冗余不能防止误删除、软件错误或超过冗余能力的硬件故障。我们只提供 best-effort 的数据恢复。

### QoS 与计费用量 {#qos-and-billing}

| QoS | 最长时间 | CPU/GPU 上限 | 同时运行作业数 |
| --- | ---: | ---: | ---: |
| `debug` | 2 小时 | 16/1 | 1 |
| `normal` | 2 天 | 64/8 | 4 |
| `long` | 7 天 | 64/8 | 1 |

账号可以使用的 QoS 由管理员分配。每个账号在计费周期内都有使用量上限。达到上限
后，作业可能无法提交或运行。

### 常用命令 {#commands}

```shell
# 查看分区和节点状态
sinfo

# 查看自己的作业队列
squeue -u $USER

# 查看作业详情
scontrol show job <jobid>

# 查看历史作业
sacct -u $USER
```

### 批处理作业示例（GPU） {#batch-job}

训练和长时间任务尽量使用 `sbatch`：

```shell
cat > job.slurm <<'EOF'
#!/bin/bash
#SBATCH --job-name=demo
#SBATCH --partition=cls1
#SBATCH --gpus=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G
#SBATCH --time=04:00:00
#SBATCH --output=%x-%j.out

nvidia-smi
python train.py
EOF

sbatch job.slurm
```

### 交互式作业示例（GPU） {#interactive-job}

交互式作业只用于短时间调试。不要占用 GPU 编辑代码、下载数据或等待其他操作。调试后
退出 shell。

```shell
srun \
  --partition=cls1 \
  --gpus 1 \
  --cpus-per-task 8 \
  --mem 32G \
  --time 00:30:00 \
  --pty bash
```

### 取消作业 {#cancel-jobs}

```shell
# 取消单个作业
scancel <jobid>

# 取消自己的所有作业
scancel -u $USER
```

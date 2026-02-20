# 关于 Slurm

!!! warning

    本文档由 GPT-5.3-Codex 生成，可能存在错误，请结合实际环境与管理员通知核对。

目前集群已支持通过 Slurm 提交作业。请先使用注册的用户名登录网关：

```shell
ssh username@cls1-gateway.s.tiankaima.dev -p 2022
```

登录节点的名字统一使用 `login`，建议在本地配置 `~/.ssh/config`：

```sshconfig title="~/.ssh/config"
Host login
    HostName cls1-gateway.s.tiankaima.dev
    Port 2022
    User username
```

配置后可直接登录：

```shell
ssh login
```

### 常用命令

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

### 交互式作业示例（GPU）

我们是 GPU 集群，请使用 `cls1` 分区，并通过 `--gpus N` 指定显卡数量。

```shell
srun \
  --partition=cls1 \
  --gpus 1 \
  --cpus-per-task 8 \
  --mem 32G \
  --time 04:00:00 \
  --pty bash
```

### 批处理作业示例（GPU）

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

### 取消作业

```shell
# 取消单个作业
scancel <jobid>

# 取消自己所有作业
scancel -u $USER
```

- 旧版 Coder 文档已迁移至：[Coder 使用文档（旧）](./coder.md)
- 代理设置请参考 [关于魔法网络](./proxy.md)

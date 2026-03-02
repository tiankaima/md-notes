# 维护记录

## 2026-02-11

- 16:13 维护通知

    - 计划今晚 18:00 起维护，维护结束时间待定，请提前备份数据。

- 2026-02-19 通知

    - 服务器维护接近尾声，请各位同学更新群文档内的用户信息，并务必填写新增的 SSH 公钥内容。今后需使用 SSH 连接服务器，新集群的使用教程将在近日内发布。

    - 推荐使用电脑填写；没有 SSH 公钥（`id_rsa.pub` 或 `id_ed25519.pub`）的同学，请在命令行执行 `ssh-keygen -t ed25519`，并将用户目录下的 `.ssh/id_ed25519.pub` 文本内容复制到文档中。

- 2026-02-21 01:21 通知

    - 对于已经在登记表中填写公钥的同学，可以使用 `ssh username@cls1-gateway.s.tiankaima.dev -p 2022` 登录并使用 Slurm。

    - 目前 Slurm 还有部分调优工作未完成；应部分同学要求，提前开放了一个半成熟环境，可能会有不定期中断。
    - 更新了关于 Slurm 的文档；同时也可以参考超算李会民老师的文档 <https://scc.ustc.edu.cn/hmli/doc/userguide/slurm-userguide.pdf>。
    - 本次更新了存储限制（2 TiB + 1M inode）；达到限额后将无法进行写入操作（限额检测更新可能有延迟）。

## 2026-01-16

- 11:27 维护通知

    - 计划 2026-01-17 0:00 - 24:00 常规停机维护，请提前备份数据。

    - 针对容器内 zombie process 的问题，建议注意：
        - 不建议直接使用 VS Code Web 的 Terminal 跑任务，最好还是挂 `tmux`/`screen`。
        - 打包 Docker image 时建议使用 tini：上次维护时，我在默认镜像中加入了 tini（<https://github.com/krallin/tini>）作为 Entrypoint，它会作为容器内 PID 1 清理 zombie process（Ref: <https://github.com/krallin/tini/issues/8#issuecomment-146135930>）。Dockerfile 参考：<https://github.com/tiankaima/Dockerfile/blob/master/miniforge/Dockerfile#L60>。
        - 另外，自己打包的镜像需要注意：Terraform Docker 默认不拉取最新 tag 版本，建议新建 tag 解决。

## 2025-12-09

- 21:01 通知

    - 邮箱为 <zcharlie0257@mail.ustc.edu.cn> 的用户因异常脚本 `faster_nn.py`/`faster_nn_2.py`，Coder 账户已被 suspend，请邮件联系管理员说明情况。

    - 相关脚本存档 -> <https://gist.github.com/tiankaima/0657dec06d3658203d8bd969e516ddfb>

## 2025-11-24

- 20:26 故障报告
- 2025-12-04 19:14 维护结束

## 2025-11-18

- 17:23 通知

    - 邮箱为 <gaopuyang@mail.ustc.edu.cn> 的用户因异常脚本 `train.py`/`gpu_occupy.py`，Coder 账户已被 suspend，请邮件联系管理员说明情况。

    - 相关脚本存档 -> <https://gist.github.com/tiankaima/0657dec06d3658203d8bd969e516ddfb>

- 23:06 通知

    - 请抽空填写群内登记表，下次维护将清理不在登记表内的用户

## 2025-11-05

- 09:14 故障报告
- 2025-11-07 13:29 通知

    - 本次由于故障是硬件问题（已经联系维修），已经临时切换到备用硬件，在恢复之前，部分服务降级运行（无法新建容器、监控等），现有容器不受影响。

## 2025-10-23

- 18:45 通知

    - 因管理需要，我们将在下周一从集群中移除 `cls2` 机器（包括 `3090`、`a40`、`2080`、`titanxp` 等）
    - 请有容器运行在上面机器的同学在 2025-10-26 23:59 前完成数据备份（到 `/data/cls1-beegfs` 目录 / 本地）。

## 2025-09-10

- 18:06 维护通知

    - 将迁移到 BeeGFS 文件系统，届时将不再存在 `/data/cls1-srv{1...5}-pool` 存储池之间的区别
    - 本次维护时间较长，可能持续一周以上，请提前备份数据

- 2025-09-21 18:08 通知

    - 文件迁移速度比预期慢很多，目前还剩 ~20TB 待拷贝 ETA ~7h，还望谅解
    - 另外麻烦不要在共享存储上存放 conda/venv 环境（NFS/BeeGFS 等共享协议的小文件读写性能都不佳，目前还没有成熟解决方案）
    - 不要使用诸如 `watch -n 0.1 nvidia-smi` 这类写法（可能由于 `nvidia-persistenced` 的一个 bug，会导致 GPU hang），考虑改成 `nvidia-smi -lms 500` / 直接查看 <https://grafana.lab.tiankaima.cn:8443>

- 2025-09-22 18:53 通知

    - <https://coder.lab.tiankaima.cn:8443/> 已重新开放。原 `/data/cls1-srv{1,2}-pool` 和 `/data/share` 的存储迁移还在继续；部分同学数据集小文件数量……爆炸，ETA 未知🙇。迁移完成后会再通知，`/data/cls1-srv{3,4}-pool` 已完成迁移。

    - 新目录 `/data/cls1-beegfs` 为 cls1 各服务器共享存储，原数据已经迁移到 `/data/cls1-beegfs/cls1-srv{3,4}-pool/` 下，均保持了 uid/gid/xattr（为性能考虑已关闭 atime）

- 2025-09-24 00:24 通知

    - 原 `/data/cls1-srv2-pool` 数据已迁移，还剩 `{1,5,share}` 三个目录，ETA 不确定

- 2025-09-26 16:43 维护结束

    - 所有数据迁移均已完成，其中 `cls1-srv5-pool` 的数据前期被合并到了 `cls1-srv1-pool`

- 2025-09-26 22:01 通知

    - 麻烦检查原本在 `cls1-srv5-pool` 上的数据是否存在于新的 `cls1-srv1-pool` 内，特别要注意 2025-08-28 到 2025-09-10 号间的数据。

        很抱歉，集群迁移时因工作失误，这期间的修改可能并未同步。大家发现有问题的话，请尽快在群里通知管理员。

- 2025-10-04 13:54 通知

    - 出于管理需求，十一期间暂时将 `srv1` 暂时下线，不会影响存储服务，`srv1` 上运行程序的同学请及时切换到其他节点（2025-10-04 18:00 开始）

## 2025-07-19

- 21:43 故障报告
- 22:11 机房通知
- 22:22 维护开始

    - 关闭了所有服务器

- 2025-07-21 13:59 维护结束
- 2025-07-23 11:36 维护通知

    - 机房将于 2025-07-24 18:30-19:30 进行电力维护。

- 2025-07-24 18:30 维护开始
- 2025-07-24 19:30 维护结束

## 2025-06-07

- 22:49 维护通知
- 2025-06-14 00:00 维护开始
- 2025-06-16 00:05 维护结束

    - 调整了过境网络拓扑
    - 清理了 Coder 中标注为 status:failed 的容器
    - 为解决近期服务器不稳定问题，更新了 nvidia-driver 版本

    - cls1-srv4 已经确定为硬件问题，暂无法保证稳定，不推荐使用，恢复时间待定
    - 更新驱动版本需要重启服务器，请检查任务情况

- 2025-06-23 16:30 提醒

    - cls1-srv4 已正常运行三天，已恢复使用

## 2025-03-24

- 11:43 维护通知
- 14:00 维护开始
- 16:22 维护结束

    - 务必更新 Workspace 到最新版本，并关闭不用的或者创建失败的 Workspace
        - 无法删掉的 Workspace 请联系管理员删除
    - `cls1-pool2-legacy` 预计近期重格式化，请尽快备份数据
    - Workspace 默认镜像配置了 tmux 和 zsh，不习惯的话可以使用 chsh 切换回 bash，编辑 `~/.zshrc` 注释掉 tmux 配置即可

## 2025-03-10

- 15:05 提醒

    - 服务器前端界面 <https://coder.lab.tiankaima.cn:8443>
        - 用户认证方式：使用科大邮箱（`mail.ustc.edu.cn` 或 `ustc.edu.cn`）注册 USTCLUG GitLab 账号（<https://git.lug.ustc.edu.cn/>）实现认证。
        - 使用方法：Create workspace，选择服务器（cls1-srv{1...5}）与基础镜像地址（可自行构建，参考 <https://github.com/tiankaima/Dockerfile/blob/master/cuda/Dockerfile>），即可创建自己的工作空间；用户具有全部 GPU 的访问权限及 sudo 权限。
    - 资源监控 <https://grafana.lab.tiankaima.cn:8443>
    - 注意事项：除 `/data` 目录下的 `pool` 子目录外，所有操作均不会持久保存；当 Workspace 关闭、重启或服务器维护时会丢失，请注意数据备份。

## 2025-03-04

- 11:21 维护通知

    - 服务器机房通知 20 分钟后断电

- 11:41 维护开始
- 13:59 维护结束

- 15:31 维护通知

    - 将给集群内添加三台 8 卡服务器，近期将重启 a6000 与 4090 服务器。

- 2025-03-09 00:00 维护开始
- 2025-03-10 12:03 维护结束

    - 服务入口 <https://coder.lab.tiankaima.cn:8443>
        - 此外添加 Pycharm 和 Filebrowser 入口，可以使用后者在浏览器中直接查看及下载文件
    - 监控 <https://grafana.lab.tiankaima.cn:8443>
    - 仅 `/data` 下 `pool` 子目录持久，当前 7 个存储池，其中
        - `/data/cls1-srv{2...5}-pool` 为私有存储
        - `/data/cls1-pool2-legacy/pool*-bak` 为共享只读历史目录。

## 2025-01-21

- 17:19 提醒

    - 对于自行构建的容器请参考

        <https://github.com/tiankaima/Dockerfile/blob/master/cuda/Dockerfile>

        容器内需要安装 `curl`、`sudo` 并创建 `uid=1000` 无密码用户

## 2025-01-20

- 11:47 通知

    - 新 Coder 平台上线，支持 USTC GitLab 登录注册，并新增 `cls2-srv[1-4,6-7]`

        - 无 GitLab 平台账户的可以使用科大邮箱进行注册，没有邮箱的请联系管理员解决

    - Workspace 重启后仅保留 `/data/`，不保留 `/home/`
    - 切换 Host 前需先关闭 Workspace 再修改 Workspace 的参数

## 2025-01-06

- 18:18 提醒

    - Coder 上现在可以在创建容器的时候选择位置 a6000/4090，数据的位置和之前保持一致，也就是 ~/data 和 ~/share 都还是原来 a6000 上的存储
    - 新的两个目录 ~/data.new 是 4090 上的 SSD raid4 (\~21T)，`~/master-mnt` 是先研院的存储（read-only）
    - 容器创建之后目前还不能调整宿主（现有容器也没办法移动到 4090）
    - 现有容器 upgrade 的时候会弹一个窗口，务必选择 8xa6000

## 2024-12-15

- 13:09 通知

    新的 4090 的脚本管理方案已经上线，使用方法

    ```shell
    ssh docker-management@*****
    ```

    会进入一个创建/管理 Docker 容器的脚本

    - 记得修改容器内的用户名/密码（默认是 user/password）
    - 如有需要，在本地的 WireGuard 里加一条路由  192.168.10.0/24，可以直接通过内网 IP 访问容器

## 2024-12-04

- 18:03 维护通知

    - 2024-12-05 需要移动服务器位置，需要重启

- 2024-12-08 16:48 维护结束

    - 需要重启 Workspace

## 2024-11-06

- 09:20 提醒

    - 昨晚服务器因未知原因宕机
    - 请将数据迁移到 HDD（`~/share`）。

## 2024-11-04

- 15:44 维护通知

    - 安装新的 48T 存储

- 16:00 维护开始
- 18:10 维护结束

    - 需要重启 Workspace 以使用新存储。

## 2024-11-02

- 12:43 维护通知

    - 无法创建新的工作环境，需要维护
- 21:29 维护结束

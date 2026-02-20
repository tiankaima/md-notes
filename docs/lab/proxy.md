# 关于魔法网络

在集群内如需魔法网络，可先设置代理环境变量：

```shell
export http_proxy="http://proxy.lab.tiankaima.cn:7890"
export https_proxy="$http_proxy"
export no_proxy="localhost,127.0.0.1,::1"
```

将下面的内容添加到 `~/.bashrc` 中，可通过 `SET_PROXY` 和 `UNSET_PROXY` 快速设置与取消代理设置：

```shell
alias SET_PROXY="export http_proxy=\"http://proxy.lab.tiankaima.cn:7890\" https_proxy=\"http://proxy.lab.tiankaima.cn:7890\""
alias UNSET_PROXY="unset http_proxy https_proxy no_proxy"
```

!!! tip

    不同软件对 `http_proxy`、`https_proxy`、`all_proxy`、`no_proxy` 的支持并不一致。建议使用 `curl -v`、`git -vv` 等命令确认是否生效。

    例如：

    ```shell
    https_proxy="http://proxy.lab.tiankaima.cn:7890" curl -v https://www.google.com
    ```

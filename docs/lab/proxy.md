# 关于魔法网络 {#proxy}

在集群内使用代理时，设置以下环境变量：

```shell
export http_proxy="http://proxy.lab.tiankaima.cn:7890"
export https_proxy="$http_proxy"
export no_proxy="localhost,127.0.0.1,::1"
```

将以下 shell 别名添加到 `~/.bashrc`：

```shell
alias SET_PROXY="export http_proxy=\"http://proxy.lab.tiankaima.cn:7890\" https_proxy=\"http://proxy.lab.tiankaima.cn:7890\""
alias UNSET_PROXY="unset http_proxy https_proxy no_proxy"
```

!!! tip

    软件对 `http_proxy`、`https_proxy`、`all_proxy`、`no_proxy` 的支持不同。使用
    `curl -v`、`git -vv` 等命令检查代理是否生效。

    ```shell
    https_proxy="http://proxy.lab.tiankaima.cn:7890" curl -v https://www.google.com
    ```

# Rpi Setup

> 最近的新玩具 Rpi 5 (8GB) 到了，借这个机会记录下新设备的设置过程。

## Rpi-specific

1. flash SD card

    > 与之前下载 iso 然后 dd 不同，有个现成的 rpi-imager
    >
    > 直接内置了用户名密码 ssh public key 等等设置，很方便。

2. 硬件 setup

    电源、散热、外壳

    [Rpi Pinout](https://pinout.xyz/pinout/ground), 接了 4(5V) 6(GND) 给风扇。

    > 也许有时间应该琢磨一下怎么写个脚本，但是听说 Rpi 5 还是挺热的...

## OS

1.  换源

    <https://mirrors.ustc.edu.cn/help/raspbian.html>

    !!! note "关于 Arm 32/64 bit"

          - ARMv7 是 32 位的
          - ARMv8 是 64 位的

          而 Rpi 4B 使用的 BCM2711 (4x A72), Rpi 5B 使用的 BCM2712 (4x A76) 都是 Armv8-A。事实上，按照 [Rpi 的说法](https://www.raspberrypi.com/news/raspberry-pi-os-64-bit/), Rpi 3B+ & Zero 2+ 都支持 64 位操作系统，但是官方长期为了保持兼容性而推荐 32 位系统。但是在 2024 年，实在是没有理由不用 64 位系统了，尤其是这还是一块 8 GB 的板子。

    !!! note "软件源"

          在 Debian 上：

          - armhf 是 32 位的，最低要求是 ARMv7
          - arm64 是 64 位的，最低要求是 ARMv8

          而在 Rpi 上就是个问题，因为 Rpi 1 是 ARMv6, 不能直接使用 Debian 的 armhf 软件源。

          因此 [Raspbian 软件源](https://www.raspbian.org/RaspbianRepository) 只提供了 armhf 的软件包，支持 ARMv6+.

    -   在 Rpi 4+ 后，使用 aarch64 的系统，就不再存在兼容性问题，因此可以直接使用 [配置 Debian 镜像的方法](https://mirrors.ustc.edu.cn/help/debian.html) 来换源。

    -   顺带一提，Rpi 还有个自己的额外的软件源在这两者之外，叫 [Raspberrypi](https://archive.raspberrypi.org/debian/), 里面有一些专有的软件包。

    -   ~~研究了一圈之后还顺手交了个 [PR](https://github.com/ustclug/mirrorhelp/pull/265)~~

    ```bash
    sudo sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list

    sudo sed \
        -e 's|http://archive.raspberrypi.org|http://mirrors.ustc.edu.cn/raspberrypi|g' \
        -e 's|http://archive.raspberrypi.com|http://mirrors.ustc.edu.cn/raspberrypi|g' \
        -i.bak \
        /etc/apt/sources.list.d/raspi.list
    ```

## Shell

```bash
sudo apt install zsh tmux bat gh
```

1.  oh-my-zsh

    Installation:

    ```bash
    sudo apt install zsh-autosuggestions zsh-syntax-highlighting zsh
    sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
    ```

    Plugins:

    ```bash
    git clone https://github.com/zsh-users/zsh-autosuggestions.git $ZSH_CUSTOM/plugins/zsh-autosuggestions
    git clone https://github.com/zsh-users/zsh-syntax-highlighting.git $ZSH_CUSTOM/plugins/zsh-syntax-highlighting
    git clone https://github.com/zdharma-continuum/fast-syntax-highlighting.git $ZSH_CUSTOM/plugins/fast-syntax-highlighting
    git clone https://github.com/marlonrichert/zsh-autocomplete.git $ZSH_CUSTOM/plugins/zsh-autocomplete
    ```

    Config:

    ```bash title="$HOME/.zshrc"
    export ZSH="$HOME/.oh-my-zsh"
    ZSH_THEME="frisk" # set by `omz`
    CASE_SENSITIVE="true"
    zstyle ':omz:update' mode auto
    ENABLE_CORRECTION="true"
    COMPLETION_WAITING_DOTS="true"
    plugins=(
        git
        zsh-autosuggestions
        fast-syntax-highlighting
        zsh-autocomplete
    )
    source $ZSH/oh-my-zsh.sh
    ```

2.  Git & GitHub

    Config:

    ```bash
    gh auth login
    ```

    此时 `~/.gitconfig` 内应该就配置好 `github.com` 的 credential 了，再添加一些设置：

    ```bash title="$HOME/.gitconfig"
    [alias]
        aliases = !git config --get-regexp alias | sed -re 's/alias\\.(\\S*)\\s(.*)$/\\1 = \\2/g'
        ci = commit
        co = checkout
        st = status
        lg = log --graph --date=relative --pretty=tformat:'%Cred%h%Creset -%C(auto)%d%Creset %s %Cgreen(%an %ad)%Creset'
        oops = commit --amend --no-edit
        reword = commit --amend
        push-with-lease = push --force-with-lease
        uncommit = reset --soft HEAD~1

    [color]
        ui = auto
    [color "branch"]
        upstream = green
        remote = red
    [core]
        editor = nvim
        excludesfile = ~/.gitignore_global
    [commit]
        template = ~/.gitmessage
    [pull]
        ff = only
    [push]
        default = upstream
        followTags = true
    [tag]
        sort = version:refname
    ```

    直接用下面的命令会快一点：

    ```bash
    curl -sS  https://201.ustclug.org/assets/gitconfig_sample >> ~/.gitconfig
    ```

    Commit message template:

    ```bash title="$HOME/.gitmessage"

    # (50) ###########################################
    # (feat, fix, docs, style, refactor, perf, test, chore, build, ci): <subject>

    # (72) #################################################################
    ```

3.  shorthands

    -   Extend `$HOME/.zsh_history` size

        ```bash title="$HOME/.zshrc"
        export HISTFILE="$HOME/.zsh_history"
        export HISTSIZE=1000000000
        export SAVEHIST=1000000000
        setopt EXTENDED_HISTORY
        ```

    -   aliases:

        ```bash title="$HOME/.zshrc"
        alias v=nvim
        alias vi=nvim
        alias vim=nvim
        alias bat=batcat
        ```

    -   shell functions:

        Watch the latest GitHub Actions run:

        ```bash title="$HOME/.zshrc"
        watch_latest_run() {
            # Fetch the latest run ID using gh and jq
            local latest_run_id=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')

            if [ -z "$latest_run_id" ]; then
                echo "No runs found."
                return 1
            fi

            # Pass the latest run ID to gh run watch
            gh run watch "$latest_run_id"
        }
        ```

4.  tmux

    Auto start with ssh session:

    ```bash title="$HOME/.zshrc"
    if [[ $- =~ i ]] && [[ -z "$TMUX" ]] && [[ -n "$SSH_TTY" ]]; then
        tmux attach-session -t ssh_tmux || tmux new-session -s ssh_tmux
    fi
    ```

    > 也可以考虑 `/etc/sshd_config` `ForceCommand`

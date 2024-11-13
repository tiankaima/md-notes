# Rpi Setup

> 最近的新玩具 Rpi 5 (8GB) 到了，借这个机会记录下新设备的设置过程。

## 硬件准备

1. flash SD card

    与之前下载 iso 然后 dd 不同，有个现成的 rpi-imager

    直接内置了用户名密码 ssh public key 等等设置，很方便。

2. 硬件 setup

    电源、散热、外壳

    [Rpi Pinout](https://pinout.xyz/pinout/ground), 接了 4(5V) 6(GND) 给风扇。

    > 也许有时间应该琢磨一下怎么写个脚本，但是听说 Rpi 5 还是挺热的...

## 软件准备

### 换源

<https://mirrors.ustc.edu.cn/help/raspbian.html>

!!! note "关于 Arm 32/64 bit"

    -   ARMv7 是 32 位的
    -   ARMv8 是 64 位的

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

### Base

```bash
sudo apt update && sudo apt upgrade
sudo apt install zsh tmux bat gh
```

### oh-my-zsh

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

### Git & GitHub

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

Commit message template: (Strip `#` in the first line)

```bash title="$HOME/.gitmessage"
#
# (50) ###########################################
# (feat, fix, docs, style, refactor, perf, test, chore, build, ci): <subject>

# (72) #################################################################
```

### shorthands

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

### tmux

Auto start with ssh session:

```bash title="$HOME/.zshrc"
if [[ $- =~ i ]] && [[ -z "$TMUX" ]] && [[ -n "$SSH_TTY" ]]; then
    tmux attach-session -t ssh_tmux || tmux new-session -s ssh_tmux
fi
```

> 也可以考虑 `/etc/sshd_config` `ForceCommand`

## 折腾

### 端口转发

在另一台机器上：

```bash
ssh root@10.250.206.1
vim ~/iptables/rules.v4 # edit as below
sh ~/iptables/apply.sh
```

```txt title="rules.v4"
*nat

-A PortFoward -p tcp --dport 60022 -j DNAT --to-destination 10.250.206.186:22
-A PortFoward -p tcp --dport 60080 -j DNAT --to-destination 10.250.206.186:60080
-A PortFoward -p tcp --dport 60443 -j DNAT --to-destination 10.250.206:186:60443
```

### Caddy 配置

```txt title="/etc/caddy/Caddyfile"
{
    order webdav before file_server
    http_port 60080
    https_port 60443
}

http://*:60080 {
    # redirect to https
    redir https://{host}:60443{uri}
}

ustc.server.tiankaima.dev {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
    respond "Hello, World!"
}

alist.ustc.server.tiankaia.dev {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
    reverse_proxy :5244
}

qbittorrent.ustc.server.tiankaima.dev {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
    reverse_proxy :8080
}

webdav.ustc.server.tiankaima.dev {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
    basic_auth {
        tiankaima {env.WEBDAV_PASS}
    }
    root * /srv/dav
    route {
        @get method GET
        file_server @get browse

        webdav
    }
}
```

### btrfs

```bash
sudo apt install btrfs-progs
```

```bash
sudo mkfs.btrfs -L data /dev/sda
sudo mkdir /mnt/data
sudo mount /dev/sda -o compress=zstd /mnt/videodrive
sudo umount /mnt/data
```

### UAS -> USB

UAS: USB Attached Storage; 在 Rpi 上外接了一个 12 TB 的盘，挂在 USB 3.0 上，但是 UAS 的挂载模式似乎有些问题，而且长时间没修，参考：

-   rpi/linux [#5060](https://github.com/raspberrypi/linux/issues/5060) [#5737](https://github.com/raspberrypi/linux/issues/5737) [#3404](https://github.com/raspberrypi/linux/issues/3404)

Sadly 我其实到现在都不理解到底是哪里出了问题，`dmesg` 会先提示一段时间的读写错误：

```txt
Sep 22 17:08:51 raspberrypi kernel: xhci-hcd xhci-hcd.0: WARN A Set TR Deq Ptr command is pending for slot 1 ep 3
Sep 22 17:08:51 raspberrypi kernel: xhci-hcd xhci-hcd.0: Mismatch between completed Set TR Deq Ptr command & xHCI internal state.
Sep 22 17:08:51 raspberrypi kernel: xhci-hcd xhci-hcd.0: ep deq seg = 00000000a16ba073, deq ptr = 00000000e46b19c2
Sep 22 17:08:51 raspberrypi kernel: xhci-hcd xhci-hcd.0: Mismatch between completed Set TR Deq Ptr command & xHCI internal state.
Sep 22 17:08:51 raspberrypi kernel: xhci-hcd xhci-hcd.0: ep deq seg = 00000000ccb6951c, deq ptr = 0000000008a351a2
Sep 22 17:08:51 raspberrypi kernel: xhci-hcd xhci-hcd.0: Mismatch between completed Set TR Deq Ptr command & xHCI internal state.
Sep 22 17:08:51 raspberrypi kernel: xhci-hcd xhci-hcd.0: ep deq seg = 00000000397da6e2, deq ptr = 00000000eca82b12
Sep 22 17:08:51 raspberrypi kernel: xhci-hcd xhci-hcd.0: Mismatch between completed Set TR Deq Ptr command & xHCI internal state.
Sep 22 17:08:51 raspberrypi kernel: xhci-hcd xhci-hcd.0: ep deq seg = 00000000b326086b, deq ptr = 000000001871ee96
Sep 22 17:08:51 raspberrypi kernel: xhci-hcd xhci-hcd.0: Mismatch between completed Set TR Deq Ptr command & xHCI internal state.
Sep 22 17:08:51 raspberrypi kernel: xhci-hcd xhci-hcd.0: ep deq seg = 0000000000000000, deq ptr = 0000000000000000
Sep 22 17:08:51 raspberrypi kernel: xhci-hcd xhci-hcd.0: WARN A Set TR Deq Ptr command is pending for slot 1 ep 3
```

```txt
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#18 uas_eh_abort_handler 0 uas-tag 19 inflight: CMD OUT
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#18 CDB: opcode=0x8a 8a 00 00 00 00 02 7a bf c9 f8 00 00 04 00 00 00
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#17 uas_eh_abort_handler 0 uas-tag 18 inflight: CMD OUT
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#17 CDB: opcode=0x8a 8a 00 00 00 00 02 7a bf c5 f8 00 00 04 00 00 00
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#16 uas_eh_abort_handler 0 uas-tag 17 inflight: CMD OUT
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#16 CDB: opcode=0x8a 8a 00 00 00 00 02 7a bf c3 b8 00 00 02 40 00 00
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#15 uas_eh_abort_handler 0 uas-tag 16 inflight: CMD OUT
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#15 CDB: opcode=0x8a 8a 00 00 00 00 02 7a bf bf b8 00 00 04 00 00 00
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#14 uas_eh_abort_handler 0 uas-tag 15 inflight: CMD OUT
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#14 CDB: opcode=0x8a 8a 00 00 00 00 02 7a bf bb b8 00 00 04 00 00 00
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#13 uas_eh_abort_handler 0 uas-tag 14 inflight: CMD OUT
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#13 CDB: opcode=0x8a 8a 00 00 00 00 02 7a bf b7 b8 00 00 04 00 00 00
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#12 uas_eh_abort_handler 0 uas-tag 13 inflight: CMD OUT
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#12 CDB: opcode=0x8a 8a 00 00 00 00 02 7a bf b3 b8 00 00 04 00 00 00
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#11 uas_eh_abort_handler 0 uas-tag 12 inflight: CMD OUT
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#11 CDB: opcode=0x8a 8a 00 00 00 00 02 7a bf af b8 00 00 04 00 00 00
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#10 uas_eh_abort_handler 0 uas-tag 11 inflight: CMD OUT
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#10 CDB: opcode=0x8a 8a 00 00 00 00 02 7a bf ab b8 00 00 04 00 00 00
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#9 uas_eh_abort_handler 0 uas-tag 10 inflight: CMD OUT
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#9 CDB: opcode=0x8a 8a 00 00 00 00 02 7a bf a7 b8 00 00 04 00 00 00
Sep 22 17:07:23 raspberrypi kernel: sd 0:0:0:0: [sda] tag#8 uas_eh_abort_handler 0 uas-tag 9 inflight: CMD OUT
```

然后就掉盘：

```txt
Sep 22 17:11:22 raspberrypi kernel: sd 0:0:0:0: [sda] tag#0 CDB: opcode=0x8a 8a 00 00 00 00 02 7b ae 10 20 00 00 04 00 00 00
Sep 22 17:11:22 raspberrypi kernel: scsi host0: uas_eh_device_reset_handler start
Sep 22 17:11:23 raspberrypi kernel: usb 2-1: reset SuperSpeed USB device number 2 using xhci-hcd
Sep 22 17:11:23 raspberrypi kernel: scsi host0: uas_eh_device_reset_handler success
Sep 22 17:12:30 raspberrypi NetworkManager[739]: <info>  [1726996350.0114] dhcp4 (eth0): state changed new lease, address=10.250.206.186
Sep 22 17:12:56 raspberrypi kernel: xhci-hcd xhci-hcd.0: xHCI host not responding to stop endpoint command
Sep 22 17:12:56 raspberrypi kernel: xhci-hcd xhci-hcd.0: xHCI host controller not responding, assume dead
Sep 22 17:12:56 raspberrypi kernel: xhci-hcd xhci-hcd.0: HC died; cleaning up
Sep 22 17:12:56 raspberrypi kernel: usb 2-1: USB disconnect, device number 2
Sep 22 17:12:56 raspberrypi kernel: sd 0:0:0:0: [sda] tag#19 uas_zap_pending 0 uas-tag 8 inflight: CMD
Sep 22 17:12:56 raspberrypi kernel: sd 0:0:0:0: [sda] tag#19 CDB: opcode=0x8a 8a 00 00 00 00 02 7c 30 7d 88 00 00 04 00 00 00
Sep 22 17:12:56 raspberrypi kernel: scsi_io_completion_action: 6 callbacks suppressed
Sep 22 17:12:56 raspberrypi kernel: sd 0:0:0:0: [sda] tag#19 UNKNOWN(0x2003) Result: hostbyte=0x01 driverbyte=DRIVER_OK cmd_age=5s
Sep 22 17:12:56 raspberrypi kernel: sd 0:0:0:0: [sda] tag#19 CDB: opcode=0x8a 8a 00 00 00 00 02 7c 30 7d 88 00 00 04 00 00 00
Sep 22 17:12:56 raspberrypi kernel: blk_print_req_error: 6 callbacks suppressed
Sep 22 17:12:56 raspberrypi kernel: I/O error, dev sda, sector 10673487240 op 0x1:(WRITE) flags 0x4104000 phys_seg 32 prio class 2
Sep 22 17:12:56 raspberrypi kernel: device offline error, dev sda, sector 10673457672 op 0x1:(WRITE) flags 0x4100000 phys_seg 28 prio class 2
Sep 22 17:12:56 raspberrypi kernel: device offline error, dev sda, sector 10673488264 op 0x1:(WRITE) flags 0x4104000 phys_seg 32 prio class 2
Sep 22 17:12:56 raspberrypi kernel: device offline error, dev sda, sector 10673489288 op 0x1:(WRITE) flags 0x4104000 phys_seg 32 prio class 2
Sep 22 17:12:56 raspberrypi kernel: device offline error, dev sda, sector 10673490312 op 0x1:(WRITE) flags 0x4100000 phys_seg 32 prio class 2
Sep 22 17:12:56 raspberrypi kernel: device offline error, dev sda, sector 10673491336 op 0x1:(WRITE) flags 0x4104000 phys_seg 32 prio class 2
Sep 22 17:12:56 raspberrypi kernel: device offline error, dev sda, sector 10673492360 op 0x1:(WRITE) flags 0x4104000 phys_seg 32 prio class 2
Sep 22 17:12:56 raspberrypi kernel: device offline error, dev sda, sector 10673493384 op 0x1:(WRITE) flags 0x4104000 phys_seg 32 prio class 2
Sep 22 17:12:56 raspberrypi kernel: device offline error, dev sda, sector 10673494408 op 0x1:(WRITE) flags 0x4104000 phys_seg 32 prio class 2
Sep 22 17:12:56 raspberrypi kernel: device offline error, dev sda, sector 10673495432 op 0x1:(WRITE) flags 0x4104000 phys_seg 32 prio class 2
Sep 22 17:12:56 raspberrypi kernel: kworker/u12:8: attempt to access beyond end of device
                                    sda: rw=68157441, sector=10673644136, nr_sectors = 9088 limit=0
```

再往后还有一些 btrfs 的报错，显然跟 fs 没关系我就不放出来了。

于是参考了 [这篇文章](<https://leo.leung.xyz/wiki/How_to_disable_USB_Attached_Storage_(UAS)>) 提到是 UAS 的问题，于是按照提示操作：

```shell
lsusb
```

```txt hl_lines="3"
Bus 004 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 003 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 002 Device 002: ID 174c:1156 ******
Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
```

```txt title="/boot/firmware/cmdline.txt"
usb-storage.quirks=XX.YY:u
```

最后这个添加的要在一行内，然后重启即可。

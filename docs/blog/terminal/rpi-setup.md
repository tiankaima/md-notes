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

1. 换源

    <https://mirrors.ustc.edu.cn/help/raspbian.html>

    呃，在这之前我也许应该先讲清楚一个问题，关于 Arm 32/64 bit 以及软件源的问题：

    - ARMv7 是 32 位的
    - ARMv8 是 64 位的

    而 Rpi 4B 使用的 BCM2711 (4x A72), Rpi 5B 使用的 BCM2712 (4x A76) 都是 Armv8-A。事实上，按照 [Rpi 的说法](https://www.raspberrypi.com/news/raspberry-pi-os-64-bit/), Rpi 3B+ & Zero 2+ 都支持 64 位操作系统，但是官方长期为了保持兼容性而推荐 32 位系统。但是在 2024 年，实在是没有理由不用 64 位系统了，尤其是这还是一块 8 GB 的板子。

    接下来说软件源的问题 (这是另一大坨，我们先说 Debian 的)：

    - armhf 是 32 位的，但是最低要求是 ARMv7
    - arm64 是 64 位的，最低要求是 ARMv8

    这放到 Rpi 上就带来了个问题，Rpi 1 是 ARMv6, 因此为了保持兼容性，32 位的系统上并不能直接使用 Debian 的软件源，因此 [Raspbian 软件源](https://www.raspbian.org/RaspbianRepository) 应运而生，优化目标是 ARMv6 & ARMv7.

    等到了 Rpi 4+ 之后，这个问题就不存在了，所以可以直接使用 [配置 Debian 镜像的方法](https://mirrors.ustc.edu.cn/help/debian.html) 来换源。

    顺带一提，Rpi 还有个自己的额外的软件源在这两者之外，叫 [Raspberrypi](https://archive.raspberrypi.org/debian/), 里面有一些专有的软件包。

    > 研究了一圈之后还顺手交了个 [PR](https://github.com/ustclug/mirrorhelp/pull/265)

剩下还有一些 zsh 之类的内容，有时间再补。
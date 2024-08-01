# 关于科大网络设施的整理

> 本文部分参考自 [zzh1996/USTC-Network-Resources (MIT License)](https://github.com/zzh1996/USTC-Network-Resources)，表示感谢。

## 前言

写在新生开学之前，整理下常用的网络设置，以及一些常用的网站/App 等，供新同学参考。

> 值得注意的是，这里面大部分内容均应该在报到后，在校内进行申请/设置，未报到的新生可能无法正确开通网络通。
>
> **文章内容可能过时，如遇问题请邮件咨询[网络信息中心](mailto://netservice@ustc.edu.cn)**

**Warning:** 请务必妥善保管自己的邮箱密码 & 统一身份认证密码，使用更强的密码、减少重复使用密码的次数，并尽可能使用密码管理器等来保障自己学校账户的安全。

> 就在过去的一年里，已经看到至少三位同学被“开盒”出来，严重的甚至被攻击者在教务系统上放弃了成绩，**请务必严肃看待账户的安全性问题**。

## 针对新生

请先按照录取通知书/班级群/2023 级新生群等渠道的要求，在迎新网上注册，地址在[https://welcome.ustc.edu.cn/](https://welcome.ustc.edu.cn/)，并在这里进行注册网络通/邮箱等账户 [https://zczx.ustc.edu.cn/](https://zczx.ustc.edu.cn/)

> 提交申请、交作业、联系助教、接受教秘、班主任通知等均需使用邮箱，**注册邮箱名时尽量谨慎，推荐汉语拼音**。

请注意，在完成以上所有设置（部分请等到报到后完成），以下内容应当设置完成：

-   统一身份认证（微信/用户名&密码）
-   邮箱（`xxx@mail.ustc.edu.cn`）
-   网络通账户

后两者请在[https://zczx.ustc.edu.cn/accounts](https://zczx.ustc.edu.cn/accounts) 查看。

**Warning:** 再次强调安全问题，请认真看待：

-   注册所用手机号的安全性
-   统一身份认证微信的安全性
-   统一身份认证的用户名密码
-   邮箱账户密码

**注意：**

-   统一身份认证或邮箱密码忘记时，均可互相找回，这也意味着两者泄露一个等于全部泄露
-   两者均忘记时，可通过手机短信重置密码
-   如果手机短信仍不可用，请线下前往网络中心办理

---

## 校园网

### 网络通

接入学校网络时，必须使用网络通才可以访问校外的互联网。地址在 [http://wlt.ustc.edu.cn](http://wlt.ustc.edu.cn)。

网络通同一时间只能在一处登录，不能多台设备共用。eduroam 可以任意多台设备同时使用，和网络通登录是不冲突的，eduroam 也可以通过访问网络通页面来更改出口。

关于出口选择：

-   看文献选 1 号出口（教育网）
-   下载东西选 9 号出口（不限 p2p）

> 完整的解释在：[http://wlt.ustc.edu.cn/link.html](http://wlt.ustc.edu.cn/link.html)，教育网方向不走 NAT，接受传入连接，但常用端口 80 443 8000 8080 等一般来说无法访问。

---

常用如下四个 SSID：

### ustc-guest

-   连接后需要设置：手机短信登陆
-   无需网络通
-   免费
-   完整的外部访问

### elearning

-   连接后无需设置
-   无需网络通
-   免费
-   完整的外部访问

> 在中区开放的校园网，唯一的缺陷就是也许只能在中区寝室使用，并且有可能随时关闭的风险

### ustcnet

-   连接后需要设置：每次均需登陆网络通
-   需要网络通
-   教育网出口免费，校外需收费
-   完整的外部访问（付费）

> 打开任意校外网页（http）会自动进行跳转，但直接使用手机 App 等仍需先设置

### eduroam

**特别注意，用户名区别于邮箱地址`@mail.ustc.edu.cn`**

-   用户名：`$(网络通用户名)@ustc.edu.cn`
-   密码：`$(网络通密码)`

iOS 上可直接输入，并选择信任证书。

Android & Windows & Linux 请参考以下设置：

```txt
网络名：eduroam
安全类型：WPA-企业

EAP 方法：PEAP
阶段 2 身份验证：MSCHAPv2
```

（可能需要选择：不验证证书）

---

## 常用网站

-   官网：[https://www.ustc.edu.cn/](https://www.ustc.edu.cn/)
    > 可特别关注官网上通知（放假安排、停水停电等）
-   邮箱：[https://mail.ustc.edu.cn/](https://mail.ustc.edu.cn/)
    > 在校期间可以在[https://zczx.ustc.edu.cn/accounts](https://zczx.ustc.edu.cn/accounts)另外申请一个邮箱名，两个邮箱名均可使用。
    > 小技巧：
    > 有些浏览器保存密码时不能保存下拉列表的状态，每次登录都要选`@mail.ustc.edu.cn`，这时可以直接在用户名处填写`xxx@mail.ustc.edu.cn`，即使下拉列表选择了`@ustc.edu.cn`也可以正常登录。
-   网络通服务中心：[https://zczx.ustc.edu.cn/](https://zczx.ustc.edu.cn/)
    > 上文提到的网络通、邮箱等注册、修改
-   图书馆：[https://lib.ustc.edu.cn/](https://lib.ustc.edu.cn/)
-   教务处：[https://www.teach.ustc.edu.cn/](https://www.teach.ustc.edu.cn/)
    > 查询教学日历、通知等
-   教务系统：[https://jw.ustc.edu.cn/](https://jw.ustc.edu.cn/)
    > 报到之后班主任会讲……
-   一卡通：[https://ecard.ustc.edu.cn/](https://ecard.ustc.edu.cn/)
    > 挂失，解冻，查账单等。充值可使用支付宝，搜索校园卡，找到中国科大即可。
-   公共查询：[https://catalog.ustc.edu.cn/](https://catalog.ustc.edu.cn/query/lesson)
-   WebVPN：[https://wvpn.ustc.edu.cn/](https://wvpn.ustc.edu.cn/)
-   Blackboard 教学平台：[https://www.bb.ustc.edu.cn/](https://www.bb.ustc.edu.cn/)
    > 有的时候会在这上面交作业看成绩？
-   睿客网：[https://rec.ustc.edu.cn/](https://rec.ustc.edu.cn/)
    > 网盘，可设置校内分享
-   大雾：[https://pems.ustc.edu.cn/](https://pems.ustc.edu.cn/)
-   Overleaf：[https://latex.ustc.edu.cn/](https://latex.ustc.edu.cn/)

### 更多

-   正版软件（Windows、Office、Matlab 等）：[https://software.ustc.edu.cn/zbh.php](https://software.ustc.edu.cn/zbh.php)
-   学生主页：[https://home.ustc.edu.cn/](https://home.ustc.edu.cn/)
    > 直接访问可能什么都没有，个人的主页在 `https://home.ustc.edu.cn/~$(邮箱名)`，无目录功能
    > 其实就是 FTP 服务器，
    > **对 2022 年 7 月之后的新用户不再开通**
    > 使用方法在 [http://home.ustc.edu.cn/help/](http://home.ustc.edu.cn/help/)
    > 有些助教会把课程相关的信息挂在上面，也有同学分享自己的资料什么的…… 也可以用来挂简历，有学校官网的后缀显得正式一些。
-   教工主页：[https//staff.ustc.edu.cn/](https//staff.ustc.edu.cn/)
    > 参考学生主页，似乎也在迁移
-   BBS：[https://bbs.ustc.edu.cn/](https://bbs.ustc.edu.cn/)
    > 也许现在很冷清？

### 非官方网站

-   评课社区：[https://icourse.club/](https://icourse.club/)
    > 选课之前可以先去看看
-   导航站：[https://ustc.life/](https://ustc.life/)
-   南七茶馆：[https://ustcforum.com/](https://ustcforum.com/)
    > 校内贴吧，简单来说
-   南七集市：[https://nan7market.com/](https://nan7market.com/)
    > 二手市场（~~有一说一总把这域名看成 nana7mi~~）

### 面向计科同学

-   镜像站：[https://mirrors.ustc.edu.cn/](https://mirrors.ustc.edu.cn/)
-   私有 GitLab：
    -   LUG：[https://git.lug.ustc.edu.cn/](https://git.lug.ustc.edu.cn/)
    -   超算：[https://git.ustc.edu.cn/](https://git.ustc.edu.cn/)
-   VLab：[https://vlab.ustc.edu.cn/](https://vlab.ustc.edu.cn/)
    > 想尝试 Linux，或许 VLab 是个好选择。
-   PXE：[http://pxe.ustc.edu.cn/](http://pxe.ustc.edu.cn/)

### 手机 App

如果以上链接种类繁多，网站没做移动端优化（如教务系统），手机上不方便查看，可使用[学在科大](https://xzkd.ustc.edu.cn/)

### 教育优惠

所有高校学生均可享受的优惠，可参考：[ivmm/Student-resources](https://github.com/ivmm/Student-resources)，如`GitHub Student Pack`等。

另：

-   在线版 MATLAB
-   Mathematica（校内服务器）（目前只支持 50 人同时在线）
-   Office 365 Education A1

（以上内容均可在 [https://software.ustc.edu.cn/zbh.php](https://software.ustc.edu.cn/zbh.php) 查看更多）

### 微信公众号 & RSS

微信公众号也是下发通知/宣传的重要方式，部分学生组织可能通过微信公众号/QQ 公众号下发活动通知等，在这里无法一一列举，提供一些公众号的 RSS 源：

```txt
校主页：https://www.ustc.edu.cn/system/resource/code/rss/rssfeedg.jsp?type=list&treeid=1002&viewid=249541&mode=10&dbname=vsb&owner=1585251974&contentid=221571,221572,221573,221574
教务处：https://www.teach.ustc.edu.cn/category/notice/feed/
```

!!! notes "微信公众号"

    鉴于目前并不存在稳定的「微信公众号」 $\Rightarrow$ RSS 的转发服务，因此需要自行查找公众号的 RSS 源。

---

以上。

> 如有更新/错误，可在 [https://github.com/tiankaima/md-notes](https://github.com/tiankaima/md-notes) 上提 issue / PR。

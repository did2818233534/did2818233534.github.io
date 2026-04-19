---
layout: post
title: "嵌入式 Linux 开发常用工具"
---

<!-- markdownlint-disable MD033 -->

不同于家用电脑的办公功能, 嵌入式 Linux 的开发板通常是运行在嵌入式设备上, 开发工具自然也有所不同, 接下来博主将分享一些适合嵌入式 Linux 开发的小工具和一些环境配置.

## 配置代理

Linux 下载应用大部分都需要代理, 然而 Linux 开发板由于缺少图形化配置代理比较麻烦, 因此可以使其使用主机的代理(主机和 Linux 开发板需要在统一局域网下)

### 主机配置

主机要有代理软件, 以 clash verge 为例, 在主机开启代理后, 打开局域网代理, 然后查看端口

<div align="center">
    <img src="/posts_image/2026-04-19-Preparation-for-Embedded-Linux-Development/image1.png" width="100%" alt="Repositories">  
</div>

```bash
ip a
```

找到 wlp6s0 开头的网卡, 例如

```bash
3: wlp6s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether bc:cd:99:b2:13:c1 brd ff:ff:ff:ff:ff:ff
    inet 192.168.140.168/24 brd 192.168.140.255 scope global dynamic noprefixroute wlp6s0
       valid_lft 3023sec preferred_lft 3023sec
    inet6 2409:8907:2cb4:710:c094:4c0b:933c:7de0/64 scope global temporary dynamic 
       valid_lft 7089sec preferred_lft 7089sec
    inet6 2409:8907:2cb4:710:8ad0:6380:da96:bbf9/64 scope global dynamic mngtmpaddr noprefixroute 
       valid_lft 7089sec preferred_lft 7089sec
    inet6 fe80::c950:a234:f569:59b0/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
```

`192.168.140.168` 就是本设备的 ip 地址

### 嵌入式设备配置

```bash
nano ~/.bashrc # 配置终端
```

在 `.bashrc` 结尾追加以下内容

```shell
export host_ip="192.168.140.168"            # 192.168.140.168 换成主机 ip 地址
export http_proxy="http://$host_ip:7897"    # 7897 为 clash verge 代理端口
export https_proxy="http://$host_ip:7897"
```

```bash
source ~/.bashrc # source 下终端
```

然后只要主机开着, 开发板也能翻墙了

## ssh 远程终端

由于嵌入式开发板运行在嵌入式设备上, 一旦安装上如果要有线调试很麻烦, 即使不考虑有线设备的接入比较困难, 当嵌入式设备如机器人在运动中, 带着另一台电脑跟着调试也是很不优雅. ssh 远程终端使用 wifi 远程访问嵌入式 Linux 的终端, 即使机器人在运动中, 调试者也能坐在工位悠然自得的发送指令, 分析数据, 甚至动态的调整参数.

### 开发板端

安装 openssh

```bash
sudo apt update
sudo apt install openssh-server
```

配置 ssh

```bash
nano /etc/ssh/sshd_config
```

将 `#PermitRootLogin prohibit-password` 修改为 `PermitRootLogin yes` , 以允许 root 登陆

重启服务

```bash
sudo systemctl restart ssh
```

连接上互联网后按上面的方法查看本设备的 ip 地址

### 主机端

```bash
ssh-copy-id root@192.168.140.168        # 将密钥拷贝到设备 root 用户, 192.168.140.168 换成设备的 ip 地址
ssh-copy-id username@192.168.140.168    # 将密钥拷贝到设备 username 用户 (username 换成具体用户名), 192.168.140.168 换成设备的 ip 地址
```

```bash
ssh root@192.168.140.168        # 登陆设备 root 用户, 192.168.140.168 换成设备的 ip 地址
ssh username@192.168.140.168    # 登陆设备 username 用户 (username 换成具体用户名), 192.168.140.168 换成设备的 ip 地址
```

## docker

嵌入式开发板上面提供的版本可能比较老, 比如你想用 humble 版本的ros2, humble 需要运行在 22.04 版本的 Ubuntu 上, 但是你的开发板只提供了 20.04 的镜像, 那么 docker 则可以提供一个轻量化的环境来虚拟一个 22.04 的 Ubuntu 在开发板上同时性能不会特别损失

另外, docker 也经常用来打包系统, 如果你的嵌入式开发板需要好多应用, 例如 ros2, supervisor 等, 如果某天它坏了要移植到另一台开发板上则需要都重新安装一遍, docker 则可以将运行在 docker 上的虚拟系统一键打包, 无论是用来备份系统还是迁移系统都是不二之选.

### docker 安装

```bash
sudo apt update             
sudo apt install docker.io  # 安装 docker

sudo nano /etc/systemd/system/docker.service.d/http-proxy.conf             # 设置代理

## 添加以下内容, 192.168.71.168 换成主机代理
[Service]
Environment="HTTP_PROXY=http://192.168.71.168:7897"
Environment="HTTPS_PROXY=http://192.168.71.168:7897"
Environment="NO_PROXY=localhost,127.0.0.1"
## 添加以上内容

sudo systemctl daemon-reload # 重启 docker 
sudo systemctl restart docker

# 创建 docker
docker run -it --name 容器名 \
  --net=host \
  --privileged \
  -v /dev:/dev \
  ros:jazzy-ros-base         
```

其中 `--net=host` 参数代表 docker 内的网络不和主机隔离
`--privileged` 代表容器内的 root 用户拥有宿主机 root 的几乎所有权限
`-v /dev:/dev` 代表将设备目录映射到 docker
`ros:jazzy-ros-base` 代表安装带有 jazzy-ros-base 版本 ros2 的 docker

### 常用指令

```bash
docker start 容器名             # 启动容器
docker stop 容器名              # 停止容器
docker exec -it 容器名 bash     # 进入容器
docker ps                      # 列出运行中的容器
docker ps -a                   # 列出所有容器
```

## 进程管理

进程管理工具主要有 supervisor 和 monit, 篇幅较长, 会转开一篇讲解

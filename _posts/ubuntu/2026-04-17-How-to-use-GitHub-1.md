---
layout: post
title: "git (一) : 环境部署和基本工作流"
---

<!-- markdownlint-disable MD033 -->

## 介绍

在个人开发者备份项目或者团队共同开发时, 初期可能利用QQ群或者百度网盘之类的软件传文件, 然后手工管理项目. 在这个过程中, 往往会遇到以下几个问题:

1. 百度网盘传文件限速  
2. QQ传文件大小有限制
3. 每次上传文件夹需要压缩
4. 可能会有审核, 安全性不足
5. 手工管理项目过于复杂, 多人并行开发不友好
6. 版本管理困难

因此, 我们引入更加专业和现代化的 git 工具来管理项目. git 是一款开源免费的跨平台项目管理工具, 它强大的版本管理, 分支同步, 并行开发, 代码自动测试和审核的能力使得他成为许多公司最常用的工具之一. github 则是基于 git 的一个免费的云平台, 是全球最大的开源平台, 也提供私有项目的服务, 我们可以将代码上传到 github 以便和别人一同开发.

## 安装 git

### Windows

`https://git-scm.com` 仓库下载安装包双击安装, 安装全选默认即可

### Ubuntu

```bash
sudo apt update
sudo apt install git
```

## 使用 git 和 github

git 有命令行和图形化两种使用方式, 然而在 linux 上只有命令行, 而且 windows 上的图形化也并不方便 (因为命令行可以很方便的写成脚本而图形化不可以), 因此本章讲解命令行的使用

### 创建 github 仓库

github 在中国没有被明确要求被屏蔽, 然而三大运营商还是会封锁, 导致时常连接不上的情况, 因此我们需要使用科学上网工具进入网站, 推荐 clash verge  

进入 `https://github.com` 之后, 注册账号并登陆, 推荐使用 outlook 邮箱或 google 直接登陆  

点击右上角头像, 点击 Repositories  

<div align="center">
    <img src="/posts_image/2026-04-17-How-to-use-GitHub-1/5765014c-6742-4902-9056-25ed591d5312.png" width="50%" alt="Repositories">  
</div>
然后就会显示本人创建的仓库, 刚创建的账号没有任何仓库, 我们点击右上角的 NEW 新建一个仓库, 填写仓库名字和描述, 这里我们可以选择创建一个公开仓库(public)还是私有仓库(private), 为了项目不被外人看到, 这里我们选择私有仓库, 之后点击 create repository 完成创建

<div align="center">
    <img src="/posts_image/2026-04-17-How-to-use-GitHub-1/image1.png " width="100%" alt="image1">
    <img src="/posts_image/2026-04-17-How-to-use-GitHub-1/image2.png " width="70%" alt="image2">  
</div>

### 添加协作者

多人开发项目的时候需要在仓库内添加协作者以便能一起开发项目, 在仓库设置内邀请新成员

<div align="center">
    <img src="/posts_image/2026-04-17-How-to-use-GitHub-1/image5.png " width="100%" alt="image5">  
</div>

收到邀请的成员点击头像旁边按钮同意邀请, 然后就可以一起开发项目

<div align="center">
    <img src="/posts_image/2026-04-17-How-to-use-GitHub-1/image6.png " width="70%" alt="image5">  
</div>

由于笔者只有一个账号, 所以不方便演示了, 随便尝试点点就能同意了

### 添加 ssh 公钥

我们创建了 github 仓库, 就要把这个仓库下载(或者更专业点的说克隆)到本地进行编辑和上传, 那么克隆, 同步或上传的时候如何才能让 github 认识到你这台电脑对这个仓库有管理权限呢, 这里就要用到 ssh 公钥, 本地电脑创建一个 ssh 公钥并将其添加到拥有仓库管理权限的账号, 每次管理仓库时 git 就会自动通过公钥获得权限

首先 windows 键入组合键 win+R 输入 powershell 打开终端, linux 键入组合键 ctrl+alt+t 打开终端, 然后设置用户名和邮箱地址

```bash
git config --global user.name "用户名" # 这两个不需要填写真实的, 只是上传的时候给别的开发者看的, 一台电脑中的一个系统配置一次即可(docker内除外)
git config --global user.email "邮箱地址"
```

然后在本地生成密钥, 输入完指令后一路回车即可, 不需要设置密码

```bash
ssh-keygen
```

打印密钥

```bash
cat ~/.ssh/id_rsa.pub # 一台电脑中的一个系统配置一次即可(docker内除外)
```

有时密钥生成的文件不是 id_rsa.pub, 试试以下命令

```bash
cat ~/.ssh/id_ed25519.pub # 上面的代码显示文件不存在就试试这个
```

如果还是不存在就运行 ls 命令, 并打印.pub结尾的文件

```bash
ls ~/.ssh
cat ~/.ssh/xxx.pub 
```

然后将打印出的密钥选中并复制(注意 linux 中端里面 ctrl+C 不是复制, ctrl+shift+C 才是复制, 以免复制失败, 建议鼠标右键菜单选择复制)
然后在 github 添加密钥

<div align="center">
    <img src="/posts_image/2026-04-17-How-to-use-GitHub-1/image3.png" width="100%" alt="Repositories">
    <img src="/posts_image/2026-04-17-How-to-use-GitHub-1/image4.png" width="100%" alt="Repositories">  
</div>

### 编辑仓库

获得仓库编辑权限的人可以编辑仓库, 登陆账号后进入仓库, 选择 ssh 然后复制链接

<div align="center">
    <img src="/posts_image/2026-04-17-How-to-use-GitHub-1/image7.png" width="100%" alt="Repositories">  
</div>

在终端中进入要存放仓库的文件夹, 输入下面指令克隆仓库

```bash
git clone git@github.com:did2818233534/test_repository.git
# git@github.com:did2818233534/test_repository.git 替换成实际的仓库链接
```

随便改点什么东西, 比如将你想要上传的工程复制过来
修改仓库之后, 需要提交修改, 然后再上传本次修改, 按顺序运行以下命令

```bash
git add 文件路径            # 将某个文件的修改应用
# "文件路径" 也可以换成 "-A" 表示将这个目录下的所有修改应用
# git add -A # 将这个目录下的所有修改应用

git commit -m "我修改了..."  # 提交本次的修改

git push                    # 将本次修改推送到云端
```

在推送到云端之后, 你的修改就算结束了, 你再点进 github 仓库就会发现仓库已经应用修改

下次你的协作者修改了仓库之后, 你不用删除仓库重新克隆, 只需运行 pull 命令就能进行同步

```bash
git pull                    # 从云端拉取代码进行同步
```

然而在多人开发中, 却会遇到一些问题, 比如在你拉取了某个仓库, 你拉取之后你的同事添加了导航的功能并上传, 你电脑本地的仓库没有导航功能, 这时候如果你在你拉取的仓库添加其他功能的时候, 你就会得到一个没有导航功能但是有其他功能的仓库, 这时侯如果你推送, github 就会进入一个两难的境地: 如果保留你的代码, 导航功能就会被覆盖; 如果保留你协作者的代码, 你的添加的新功能就会实效, 这时 github 就会报错.

这种情况通常有两种解决办法, 一种是在你开始改仓库前先同步一下最新版的云端代码, 并让你的协作者停止开发, 等你开发完上传之后你的协作者在进行开发, 这种方法比较简单但是不能并行开发, 效率低下, 适合 git 新手来不及学习时临时使用

另一种是在仓库开一个分支, 你和你的协作者同时进行开发, 开发完成后再合并分支, 这时 github 会智能合并二者的代码, 遇到无法合并的代码会在冲突的地方报错然后我们可以使用 git 的工具很方便的修改冲突的代码并继续合并, 这种方能法可以并行开发, 效率高, 是目前大部分公司的选择, 但是比较复杂, 将在之后单开一章进行讲解.

### 其他常用命令

```bash
git log                     # 查看修改历史
git status                  # 查看当前代码和当前版本的初始代码有什么不同
git restore .               # 撤销为提交的修改, 回退到当前版本的初始代码
git reset --hard HEAD^      # 回退到上一个版本
git reset --hard [版本号]    # 回退到某个版本
```

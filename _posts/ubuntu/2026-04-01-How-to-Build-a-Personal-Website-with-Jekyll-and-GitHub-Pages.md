---
layout: post
title: "使用 Jekyll 在 GitHub 上搭建个人博客"
---

## 前言

GitHub 除了作为代码仓库之外, 也可以作为一个个人博客托管的网站, 它免费而又稳定, Jekyll 则是一个简单的静态站点生成器, 可以使用 Markdown 等语言格式化文本并生成静态网站, 二者可以完美结合, 让新手也能低门槛搭建自己的博客网站  
本文将带领读者从部署 Jekyll 环境开始搭建一个 GitHub 的个人博客, 本文默认读者已有 GitHub 账号并会简单的使用 git 命令, 环境为 Ubuntu/Debian

---

## 部署 Jekyll 环境

### 安装 Ruby 环境

```bash
sudo apt update
sudo apt install ruby-full build-essential zlib1g-dev
```

### 配置环境变量

打开 `~/.bashrc` ( zsh 打开 `~/.zshrc` )

```bash
nano ~/.bashrc
```

在文件末尾添加

```bash
export GEM_HOME="$HOME/gems"
export PATH="$HOME/gems/bin:$PATH"
```

Ctrl + S 保存, Ctrl + X 退出, 刷新终端

```bash
source ~/.bashrc
```

### 安装 Jekyll

```bash
gem install jekyll bundler
```

验证安装成功

```bash
jekyll -v # 输出版本号证明安装成功
```

---

## 创建 GitHub 账户

打开 GitHub, 创建一个名为 `username.github.io` 的仓库, 其中 `username` 为你的用户名  
克隆仓库到本地文件夹并进入仓库目录  

```bash
git clone https://github.com/username/username.github.io.git
cd username.github.io
```

<!-- ---

### 运行以下命令在本地启动服务

```bash
bundle exec jekyll serve
``` -->

## 未完待续

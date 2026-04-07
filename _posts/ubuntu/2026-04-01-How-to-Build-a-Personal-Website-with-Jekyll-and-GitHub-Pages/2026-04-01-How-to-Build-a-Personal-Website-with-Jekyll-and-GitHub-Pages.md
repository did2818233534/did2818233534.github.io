---
layout: post
title: "Jekyll (一) : 使用 Jekyll 在 GitHub 上搭建个人博客"
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

## 创建 GitHub 仓库

打开 GitHub, 创建一个名为 `username.github.io` 的仓库, 其中 `username` 为你的用户名  
克隆仓库到本地文件夹并进入仓库目录  

```bash
git clone https://github.com/username/username.github.io.git
cd username.github.io
```

## 初始化 jekyll 项目

```bash
jekyll new . --force
```

### 编辑 Gemfile

```Ruby
source "https://rubygems.org"
gem "github-pages", group: :jekyll_plugins
gem "webrick", "~> 1.7"
```

### 编辑 _config.yml

主要修改一下几个部分

```yml
title:          # 你的网站标题
subtitle:       # 你的网站副标题
description:    # 网站描述
email:          # 邮箱地址

# 路径设置 (URL settings)
# 重要：如果你在本地运行或使用 username.github.io，请保持 baseurl 为空 ""
baseurl: ""     
url:            # 站点的域名，应当填写为 github_username.github.io
```

### 安装依赖

```bash
bundle install
```

---

## 运行以下命令在本地启动服务

```bash
bundle exec jekyll serve
```

启动本地服务之后就可以通过访问 `http://127.0.0.1:4000` 看到博客, 不过只有同一个局域网的人能看到  

## 挂载到 github

```bash
git add -A                      # 添加所有修改
git commit -m "添加你的提交记录"
git push                        # 推送到 github
```

不出意外的话, 通过访问 `https://github_username.github.io` 就能访问到你的博客了  

---

## 偷懒

如果读者觉得自己手动创建一个太麻烦, 也可以直接拉取别人的博客仓库加以修改  
例如, 作者的 github 为 `https://github.com/did2818233534`
  
克隆一个仓库

```bash
git clone https://github.com/did2818233534/did2818233534.github.io.git
```

修改 _config.yml 文件, 改成自己的
上传到 github  
之后删除 .git目录, 改成自己的  

```bash
git init
git add -A
git commit -m "创建了我的博客"
git remote add origin https://github.com/github_username_/github_username_.github.io.git    
git branch -M main  
git push -u origin main
```

然后就能愉快的访问你的博客了  

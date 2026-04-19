---
layout: post
title: "git (二) : 基于 branch 的并行开发"
---

<!-- markdownlint-disable MD033 -->

## 前言

上一节介绍了 git 和 github 的环境部署及基本工作流, 简单的讲解了基于 git 的开发流程. 这节我们将基于分支(branch)进行高效并行开发.

## 介绍

<div align="center">
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image1.svg" width="70%" alt="Repositories">  
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image2.png" width="70%" alt="Repositories">  
</div>

正如分支这个名字, 分支就是在主线上开一条分支, 主线和分支互不影响, 分支常见的应用场景有以下几种, 第一种是A成员在主分支上开发新功能, B成员在分分支上开发测试程序, 测试程序开发完之后就删除; 第二种是项目完成一个大版本之后开一个分支作为版本分支, 然后继续在主分支开发; 第三种是主分支和分分支被多位成员同时开发多个不同的功能, 开发完后再合并到一起.

## 开发流程

首先需要创建一个分支

```bash
git checkout -b <分支名>    # 创建并切换到分支
git switch -c <分支名>      # 创建并切换到分支 (更现代的方式)
git switch <分支名>         # 切换到某分支
```

创建并切换到某分支之后主分支和分分支就能并行开发了, A 成员在主分支开发, B 成员在分分支开发, 开发完之后提交到 github, 然后进行合并

例如, 本来仓库里有一个文件 testfle, 里面只有一句 aaa

<div align="center">
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image3.png" width="100%" alt="Repositories">  
</div>

A 成员和 B 成员分别克隆了这个仓库, 然后 B 成员创建并切换到了 branch2 分支

```bash
git switch -c branch2
```

A 成员在初始的 main 分支第5行添加了 bbb, 然后添加修改并上传

```bash
git add -A
git commit -m "main"
git push
```

<div align="center">
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image4.png" width="100%" alt="Repositories">  
</div>

B 成员在初始的 branch2 分支第15行添加了 ccc, 然后添加修改并上传

```bash
git add -A
git commit -m "main"
git push --set-upstream origin branch2 # 创建一个分支之后第一次上传需要设置上游分支
```

<div align="center">
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image5.png" width="100%" alt="Repositories">  
</div>

打开 github 发现多了一个 branch2 分支, 切换到 main 分支发现第5行是 bbb, 切换到 branch2 分支发现第15行是 ccc

<div align="center">
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image6.png" width="100%" alt="Repositories">  
</div>

然而光创建了这个分支还不够, 我们要做的是将 AB 两位成员的代码整合到一起, 点击 `pull requests`, 点击 `new pull requests`

<div align="center">
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image7.png" width="100%" alt="Repositories">  
</div>

因为我们要将 branch2 合并到 main 分支, 于是我们要将左边设置成 main, 右边设置成 branch2, 因为没有冲突, 所以显示 Able to merge 代表可以自动合并, 点击右边绿色按钮 Create pull request, 然后再设置标题和描述再点击 Create pull request, 再点击 Merge pull request, 再点击 Confirm merge 就可以合并

<div align="center">
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image8.png" width="100%" alt="Repositories">  
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image9.png" width="100%" alt="Repositories">  
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image10.png" width="100%" alt="Repositories">  
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image11.png" width="100%" alt="Repositories">  
</div>

然后再返回 main 分支查看, 已经自动合并

<div align="center">
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image12.png" width="100%" alt="Repositories">  
</div>

合并后并不会删除 branch2 分支, 可以点击 branches 删除对应的分支

<div align="center">
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image13.png" width="100%" alt="Repositories">  
</div>

本地仓库可以先返回 main 同步一下内容, 然后再删除分支

```bash
git switch main
git pull
git branch -d branch2 # 删除 branch2
```

## 冲突

然而, 并不是每次合并都是 `Able to merge` 可以自动合并, 这次之所以可以自动合并是因为我们 main 分支在第五行添加了 bbb, branch2 分支在第15行添加了 ccc, 很容易合并. 如果我们 main 在第五行添加了 bbb, branch2 也在第五行添加了 ccc, 那么你合并的时候 git 就不知道你的第五行到底是要 bbb 还是 ccc 了, 就会产生冲突, 这时候, 我们就要手动解决冲突以正常合并

例如

现在我们的 main 分支是

<div align="center">
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image14.png" width="100%" alt="Repositories">  
</div>

A 成员要在 main 分支第17行添加 ddd, B 成员要在 branch3 分支第17行添加 eee, 然后二者进行之前的操作
然后就会发现这次不再是 `Able to merge` 而是 `Can’t automatically merge`

<div align="center">
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image15.png" width="100%" alt="Repositories">  
</div>

这次我们就需要在电脑上手动解决冲突
首先我们需要在本地电脑上同时同步两个分支

如果在 A 电脑上, 因为 A 在克隆仓库的时候没有 branch3 分支, 所以应该同步一下云端然后下载 branch3 分支, 不过保险起见最好把 main 分支也同步一下

```bash
git pull            # 在 main 分支下
git fetch origin    # 获取远程更新
git switch branch3  # 切换到 branch3, 这时 git 会发现本地没有 branch3 然后开始拉取 branch3
```

如果在 B 电脑上, 只需同步下两个分支就行

```bash
git pull            # 在 branch3 分支下
git switch main     # 切换 main 分支
git pull            # 同步 main 分支
```

然后运行合并命令, 要将别的分支合并到 main 分支的化, 就要先切换到 main 分支, 然后运行合并命令

```bash
git switch main
git merge branch3 # 合并命令
```

由于有冲突, 这时候冲突的地方就会显示类似于下图所示

<div align="center">
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image16.png" width="100%" alt="Repositories">  
</div>

HEAD里面是 main 分支的更改, branch3 里面是 branch3 分支的更改, 点击 **采用当前更改** 则会保留 main 分支的更改, 点击 **采用传入的更改** 则会保留 branch3 里的更改, 点击 **保留双方变更** 则会都保留
这里我们点击 **保留双方变更**

<div align="center">
    <img src="/posts_image/2026-04-18-How-to-use-GitHub-2/image17.png" width="100%" alt="Repositories">  
</div>

于是 ddd 和 eee 都保留了下来
然后保存更改, 推送更改就行

```bash
git add -A
git commit -m "..."
git push
git push origin --delete branch3 # 推送顺便删除 branch3
```

另外, 如果有好几处冲突的话可以在 vscode 中全局搜索 `<<<<<<<` 来快速定位冲突

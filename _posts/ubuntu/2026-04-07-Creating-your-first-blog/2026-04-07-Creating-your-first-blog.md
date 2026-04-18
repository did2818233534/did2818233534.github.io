---
layout: post
title: "Jekyll (二) : 创建你的第一条博客"
---

## 前言

上一节讲述了如何在 github 上搭建一个博客网站, 这节将带大家创建第一条博客

---

## 创建 `.md` 文件

在 `_posts` 文件夹下面创建一个以 `.md` 结尾的文件  
输入一下内容, 固定格式  

```markdown
---
layout: post
title: "博客标题"
---
```

`.md` 结尾的文件为 markdown 文件, 这种文件语法简单易懂, 支持 vscode 里面 `ctrl + shift + V` 实时预览, 具体语法可以查看访问 `https://markdown.com.cn/basic-syntax` 来学习  
vscode Markdown 有许多插件, 我比较推荐的是  
  
Markdown All in One : 添加一些语法辅助  
Markdown Image : 便捷插入图片  
Markdown Preview Enhanced : 增强实时预览功能
markdownlint : Markdown 代码规范检查

## 添加到 git 并发布

```bash

git add -A
git commit -m "修改内容"
git push
```

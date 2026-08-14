---
title: "Git使用详解"
published: 2026-03-12
description: "Git的全部指令作用以及详细解析和使用场景说明"
tags: [Git, 版本控制]
category: "工具"
draft: false
---

# Git 使用指南（零基础入门到掌握）

> 这是一份面向初学者的 Git 完整教程：先讲清楚"为什么"和"是什么"，再一步步练习每个命令。通读一遍可以建立完整的知识框架，之后把它当作手册，遇到问题时随时查阅。

## 阅读约定

- 命令前的 `$` 表示在终端（命令行）中输入，实际输入时不需要输入 `$`
- `<...>` 表示需要你替换成自己的内容，例如 `<文件名>`、`<提交ID>`
- 代码块中以 `#` 开头的是注释，用于解释命令，不需要输入
- 章节按"概念 → 本地操作 → 远程协作 → 进阶技巧"的顺序安排，建议按顺序阅读

## 目录

1. Git 是什么
2. 安装与初始配置
3. 核心概念：仓库、工作区、暂存区、版本库
4. 文件的四种状态
5. 获取 Git 仓库
6. 日常操作：查看、暂存、提交
7. 查看历史与对比
8. 撤销与回退
9. 远程仓库
10. 分支
11. 标签
12. 忽略文件（.gitignore）
13. 暂存工作现场（git stash）
14. 常用协作流程
15. 常见问题排查
16. 实用技巧
- 附录：命令速查表

---

## 1. Git 是什么

**Git 是一个分布式版本控制系统**，用来记录文件（主要是代码）的每一次修改，让你随时可以：

- 查看任何一次修改的内容、时间、作者
- 回到任意一个历史版本
- 多人同时修改同一份代码而不互相覆盖
- 用分支并行开发多个功能

### 1.1 为什么要用版本控制？

想象你写文档时这样做过：

```text
毕业论文.docx
毕业论文-修改版.docx
毕业论文-最终版.docx
毕业论文-最终版2.docx
毕业论文-真的最终版.docx
```

手动"另存为"既混乱又容易丢失内容。Git 就是自动、专业地帮你做这件事的工具：**每完成一小步工作就"存档"一次（提交），所有存档串成完整的历史，随时可以翻看和回退**。

### 1.2 分布式是什么意思？

- **集中式**（如 SVN）：代码历史只存在一台中央服务器上，断网就无法提交、无法看历史
- **分布式**（Git）：每个人的电脑上都有一份**完整**的仓库副本。日常操作（提交、看历史、建分支）全部在本地完成，不依赖网络；只有"和别人同步"时才需要联网

Git 由 Linux 之父 Linus Torvalds 开发，最初用于管理 Linux 内核源码，现在已成为业界事实上的标准。

## 2. 安装与初始配置

### 2.1 安装

- **Windows**：到 <https://git-scm.com/downloads> 下载安装包，一路默认安装即可（安装后右键菜单会多出 **Git Bash**，推荐使用它）
- **macOS**：终端执行 `brew install git`（或安装 Xcode 命令行工具）
- **Linux**：`sudo apt install git`（Debian/Ubuntu）或 `sudo yum install git`（CentOS）

安装完成后验证：

```bash
$ git --version
git version 2.43.0
```

能打印出版本号就说明安装成功。

### 2.2 首次使用必须做的配置

Git 会在每次提交时记录"是谁提交的"，所以先告诉 Git 你是谁：

```bash
$ git config --global user.name "你的名字"
$ git config --global user.email "你的邮箱@example.com"
```

- `--global` 表示对这台电脑上的所有仓库生效（只需设置一次）
- 不加 `--global` 则只对当前仓库生效
- 查看配置：`git config --list` 或 `git config user.name`

> **💡 提示**：邮箱建议填 GitHub/Gitee 账号绑定的邮箱，这样远程平台才能把提交和你关联起来。

（可选）设置新建仓库的默认分支名为 main：

```bash
$ git config --global init.defaultBranch main
```

配置的三个级别，优先级从高到低：

| 级别 | 命令 | 作用范围 |
| --- | --- | --- |
| 系统级 | `git config --system` | 整台电脑的所有用户 |
| 全局级 | `git config --global` | 当前用户的所有仓库 |
| 仓库级 | `git config`（在仓库内执行） | 只对当前仓库 |

## 3. 核心概念：仓库、工作区、暂存区、版本库

理解 Git 只要抓住三个"区"和两条"转移命令"：

```text
  ┌──────────────┐   git add    ┌──────────────┐   git commit   ┌──────────────┐
  │    工作区     │ ───────────▶ │    暂存区     │ ─────────────▶ │    版本库     │
  │（写代码的地方）│              │（提交前的清单）│                │（永久历史存档）│
  └──────────────┘              └──────────────┘                └──────────────┘
```

- **仓库（Repository）**：被 Git 管理的整个目录，它的标志是里面有一个隐藏的 `.git` 文件夹
- **工作区（Working Directory）**：你在资源管理器/编辑器里看到的、正在编辑的文件
- **暂存区（Staging Area / Index）**：`.git` 文件夹里的 `index` 文件，相当于"待提交清单"。`git add` 就是**把修改加入清单**，此时还没有真正存档
- **版本库（Repository）**：`.git` 文件夹本身，保存所有配置、日志和每一次提交的历史版本。`git commit` 才是**真正存档**，把清单里的内容永久记录进历史

> **🍦 通俗类比**：超市购物——把商品放进**购物车（暂存区）**不等于买下，到收银台**结账（提交）**后才算真正成交；工作区就是你挑选商品的过程。

### 3.1 .git 文件夹

- `git init` 后生成的隐藏文件夹，**整个仓库的历史都存放在这里**
- Windows 资源管理器默认不显示隐藏文件，需开启"查看 → 隐藏的项目"
- 删掉 `.git` 就等于删掉了全部版本历史（工作区文件还在，但不再受版本控制）

### 3.2 HEAD 与提交 ID

- **提交（commit）**：一次"存档"。每次提交都有一个唯一的 ID（哈希值），形如 `a1b2c3d4...`，一般用前 7 位 `a1b2c3d` 就足以区分
- **HEAD**：一个指针，指向**当前分支的最新提交**，可以理解为"我现在站在哪个版本上"

## 4. 文件的四种状态

工作区中的文件分为两大类、四种状态：

| 状态 | 英文 | 含义 |
| --- | --- | --- |
| 未跟踪 | untracked | 新文件，Git 还没开始管理它 |
| 未修改 | unmodified | 已提交过，之后没有再改动 |
| 已修改 | modified | 已跟踪的文件被改动，但还没加入暂存区 |
| 已暂存 | staged | 修改已加入暂存区，等待提交 |

状态流转图：

```text
                 git add                        git commit
  未跟踪 ─────────────────▶ 已暂存 ──────────────────────▶ 未修改
 (untracked)             (staged)                       (unmodified)
                             ▲                               │
                git add      │        修改文件               │
                             │                               ▼
                           已修改 ◀───────────────────────────┘
                          (modified)
```

用 `git status` 查看当前所有文件的状态；`git status -s` 用一两个字母的简写显示：

| 简写 | 含义 |
| --- | --- |
| `??` | 未跟踪 |
| `A` | 新文件已暂存 |
| `M` | 已修改（左侧 M = 已暂存，右侧 M = 已修改未暂存） |
| `D` | 已删除 |

## 5. 获取 Git 仓库

有两种方式得到仓库：新建（init）和克隆（clone）。

### 5.1 在已有项目中新建仓库

```bash
$ cd <你的项目目录>      # 进入项目文件夹
$ git init
Initialized empty Git repository in .../.git/
```

也可以一步完成：`git init <目录名>`。

初始化后项目里就多了一个 `.git` 文件夹，项目从此受 Git 管理。

### 5.2 克隆远程仓库

把远程服务器上的仓库完整复制到本地（包含全部历史）：

```bash
$ git clone <仓库地址>
$ git clone <仓库地址> <本地目录名>   # 指定保存到的目录名
```

例如：

```bash
$ git clone https://github.com/git/git.git
```

### 5.3 远程地址的两种协议

| 协议 | 示例 | 特点 |
| --- | --- | --- |
| HTTPS | `https://github.com/用户/仓库.git` | 简单，首次使用需登录（GitHub 现在用个人令牌代替密码） |
| SSH | `git@github.com:用户/仓库.git` | 配置一次密钥后免密，日常更省事 |

## 6. 日常操作：查看、暂存、提交

最核心的四个命令，日常 90% 的时间都在重复它们：

```text
git status  →  查看状态
git add     →  把修改加入暂存区
git commit  →  把暂存区内容提交进历史
git push    →  把提交同步到远程（详见第 9 章）
```

### 6.1 git status —— 查看状态

```bash
$ git status
```

输出会告诉你：

- 哪些文件是新的（未跟踪）
- 哪些文件被修改了（未暂存）
- 哪些文件已加入暂存区（待提交）
- 并**贴心地提示下一步可以执行的命令**

### 6.2 git add —— 加入暂存区

```bash
$ git add <文件名>           # 添加指定文件
$ git add .                 # 添加当前目录下的所有改动（最常用）
$ git add -A                # 添加仓库中的所有改动（含删除）
$ git add -p                # 交互式地一块一块选择要暂存的内容
```

> **💡 提示**：每次 add 后再执行 `git status` 看看状态变化，能帮你快速建立"三个区"的直觉。

### 6.3 git commit —— 提交到版本库

```bash
$ git commit -m "本次提交的说明"
```

- 提交说明要**写清楚这次改了什么、为什么改**，方便日后翻历史
- 常用变体：

```bash
$ git commit -am "说明"              # 跳过 git add，直接提交所有【已跟踪】文件的修改（新文件不行）
$ git commit --amend                # 把新的改动合并进【上一次】提交
$ git commit --amend -m "新的说明"    # 只修改上一次提交的说明
```

> **⚠️ 注意**：`--amend` 会改写历史。如果上一次提交已经推送到远程且别人可能用到，慎用（个人练习无所谓）。

### 6.4 提交信息规范（推荐）

参考"约定式提交"（Conventional Commits），格式：`类型: 说明`

| 类型 | 用途 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `docs` | 文档修改 |
| `style` | 代码格式（不影响逻辑） |
| `refactor` | 重构 |
| `test` | 测试相关 |
| `chore` | 构建、工具等杂项 |

## 7. 查看历史与对比

### 7.1 git log —— 查看提交历史

```bash
$ git log                          # 完整历史（按 q 退出）
$ git log --oneline                # 每行一条，只显示短 ID 和说明
$ git log --oneline --graph --all  # 图形化显示所有分支（强烈推荐）
$ git log -p                       # 显示每次提交的具体改动
$ git log --stat                   # 显示每次提交的文件统计
$ git log -3                       # 只看最近 3 次
$ git log --author="张三"           # 按作者筛选
```

### 7.2 git diff —— 查看具体差异

```bash
$ git diff                   # 工作区 vs 暂存区（改了什么还没 add）
$ git diff --staged          # 暂存区 vs 上次提交（即将提交什么）
$ git diff <提交A> <提交B>    # 任意两次提交之间的差异
```

### 7.3 git show 与 git blame

```bash
$ git show <提交ID>           # 查看某次提交的详细内容
$ git show HEAD              # 查看最新一次提交
$ git blame <文件名>          # 逐行显示每行代码是谁、哪次提交改的
```

## 8. 撤销与回退

> **💡 先了解两条命令的分工**（Git 2.23+ 版本）：
> - `git restore`：撤销**文件**的改动（丢弃修改、取消暂存）
> - `git reset` / `git revert`：移动**版本**（回退提交）
>
> 旧版教程常用 `git checkout` 和 `git reset HEAD` 完成同样的事，看到时知道是同一个意思即可。

### 8.1 撤销工作区/暂存区的改动（还没提交）

```bash
$ git restore <文件名>             # 丢弃工作区的修改，恢复成暂存区/版本库中的样子 ⚠️ 不可找回
$ git restore --staged <文件名>    # 取消暂存（从暂存区退回工作区，修改还在）
$ git restore .                  # 丢弃所有文件的工作区修改 ⚠️ 谨慎
```

旧写法对照：`git checkout -- <文件>` 相当于 `git restore <文件>`；`git reset HEAD <文件>` 相当于 `git restore --staged <文件>`。

### 8.2 撤销提交（git reset）

`git reset <目标>` 把分支指针移回某个提交，有三种模式：

| 模式 | 效果 | 改动去哪了 |
| --- | --- | --- |
| `--soft` | 只撤销提交本身 | 改动保留在**暂存区**，可直接重新提交 |
| `--mixed`（默认） | 撤销提交 + 取消暂存 | 改动保留在**工作区** |
| `--hard` | 全部撤销 | 改动**彻底丢弃** ⚠️ |

```bash
$ git reset --soft HEAD~1      # 撤销最近一次提交，改动回到暂存区（最常用）
$ git reset --mixed HEAD~1     # 撤销提交并取消暂存
$ git reset --hard HEAD~1      # 连提交带改动一起删除 ⚠️ 危险
$ git reset --hard <提交ID>     # 回到历史上的任意版本 ⚠️
```

`HEAD~1` 表示"上一次提交"，`HEAD~2` 表示上上次，依此类推。

> **⚠️ 重要**：`reset --hard` 会**永久丢弃**改动且难以找回。另外，如果目标提交**已经推送到远程**，用 reset 会改写历史，多人协作时应改用下面更安全的 `git revert`。

### 8.3 安全地撤销已推送的提交（git revert）

```bash
$ git revert <提交ID>
```

`git revert` 不删除历史，而是**生成一个新的"反向提交"**，把那次提交的改动抵消掉。适合已经推送到远程的提交，对协作者友好。

### 8.4 误删文件、丢失提交怎么办

```bash
$ git restore <文件名>                     # 误改/误删已跟踪文件后恢复（改动还没提交时）
$ git restore --source=<提交ID> <文件名>    # 从某个历史提交恢复文件
$ git clean -n                           # 列出将被删除的未跟踪文件（先预览）
$ git clean -fd                          # 删除所有未跟踪的文件 ⚠️ 谨慎
```

**"后悔药" git reflog**：几乎每一次 HEAD 移动（提交、reset、切换分支）都会被记录。误操作后：

```bash
$ git reflog                         # 查看 HEAD 的历史足迹
$ git reset --hard <reflog中的提交ID>  # 回到误操作之前
```

只要提交过，几乎总能通过 reflog 找回。

## 9. 远程仓库

远程仓库（GitHub、Gitee、GitLab、公司内网服务器等）用于**备份和多人协作**。本地的提交不会自动同步到远程，需要手动 push/pull。

### 9.1 添加与查看远程仓库

```bash
$ git remote add origin <仓库地址>      # 给当前仓库关联一个远程仓库，起名叫 origin
$ git remote -v                       # 查看已关联的远程仓库及地址
$ git remote remove origin            # 解除关联
$ git remote rename origin upstream   # 重命名
```

- `origin` 是约定俗成的名字，表示"默认的远程仓库"，你可以起别的名字
- 用 `git clone` 得到的仓库会自动关联好 origin，无需再 add

### 9.2 git push —— 推送（上传）

```bash
$ git push -u origin main                # 首次推送并建立跟踪关系（-u 只需第一次）
$ git push                               # 之后直接 push 即可
$ git push origin <分支名>                # 推送指定分支
$ git push origin <本地分支>:<远程分支>     # 完整语法：把本地分支推送到远程的指定分支
```

> **💡 提示**：`git push` 只推送**已提交**的内容，记得先 commit。

### 9.3 git fetch / git pull —— 拉取（下载）

```text
git fetch  = 只把远程的新提交下载到本地，【不】动你正在工作的代码
git pull   = fetch + merge，下载并【自动合并】到当前分支
```

```bash
$ git fetch origin              # 下载远程的所有更新
$ git diff main origin/main     # 合并前先看看远程改了什么
$ git merge origin/main         # 确认无误后再合并

$ git pull                      # 一步到位（下载 + 合并）
$ git pull --rebase             # 下载后以变基方式合并（历史更整洁，见 10.5）
```

- 拿不准时可以先 fetch 看看，再决定怎么合并
- `origin/main` 表示"远程 main 分支在本地的镜像"，也叫远程跟踪分支
- 远程分支已被删除时，用 `git fetch --prune` 清理本地残留的镜像

### 9.4 推送被拒绝怎么办

远程有新提交而本地没拉取时，push 会被拒绝（non-fast-forward）。正确做法：

```bash
$ git pull            # 先把远程更新拉下来（若有冲突，按 10.4 解决）
$ git push            # 再推送
```

### 9.5 本地仓库首次关联远程仓库（常见场景）

本地 `git init` 的仓库和远程仓库没有共同历史，第一次 pull 会报错：

```text
fatal: refusing to merge unrelated histories
```

解决办法是允许合并无关联历史：

```bash
$ git pull origin main --allow-unrelated-histories
```

之后再正常 push/pull 即可。

### 9.6 删除远程分支与 SSH 配置

```bash
$ git push origin --delete <分支名>   # 删除远程分支
```

**SSH 免密（可选）**：

```bash
$ ssh-keygen -t ed25519 -C "你的邮箱"   # 一路回车生成密钥
$ cat ~/.ssh/id_ed25519.pub          # 查看公钥内容
```

把公钥内容粘贴到 GitHub/Gitee 的「Settings → SSH and GPG keys → New SSH key」中，之后就可以用 `git@...` 形式的 SSH 地址免密操作。

## 10. 分支

### 10.1 什么是分支

分支是 Git 最强大的功能。它让你可以**从主线上分出一条独立的"平行线"**，在分支上随便折腾新功能而不影响主线，做好了再合并回去。

- 通俗理解：主线是你的"正式版"，分支是"草稿本"，写好了才誊抄回正式版
- 从技术上讲，分支只是一个**指向某次提交的指针**，创建、切换分支几乎瞬间完成，代价极低
- 所以 Git 鼓励"**小步提交、大胆开分支**"
- 旧版本 Git 默认分支名为 `master`，新版本（2.28+）默认 `main`，只是名字不同，没有本质区别

### 10.2 分支的基本操作

```bash
$ git branch              # 列出本地分支（当前分支前有 * 号）
$ git branch -r           # 列出远程分支
$ git branch -a           # 列出全部（本地 + 远程）
$ git branch -v           # 每个分支最近一次提交
$ git branch -vv          # 显示本地分支与远程分支的跟踪关系
$ git branch --merged     # 查看已合并的分支（可安全删除）

$ git branch <名字>        # 创建分支（但还停留在当前分支）
$ git switch <名字>        # 切换分支
$ git switch -c <名字>     # 创建并切换到新分支（最常用）
$ git switch -            # 切回上一个分支

$ git branch -d <名字>     # 删除分支（已合并的才能删）
$ git branch -D <名字>     # 强制删除（未合并也删）⚠️
$ git branch -m <新名字>   # 重命名当前分支
```

旧写法对照：`git checkout <名字>` = 切换分支；`git checkout -b <名字>` = 创建并切换。新命令 `git switch` 语义更清晰，建议使用。

### 10.3 合并分支（git merge）

把目标分支合并进**当前所在的分支**：

```bash
$ git switch main              # 先切到要"合并进"的分支
$ git merge <要合并进来的分支名>
```

两种合并方式：

- **快进合并（fast-forward）**：main 在分出 feature 后没有新提交，直接把 main 指针"快进"过去。历史是一条直线，但看不出"这里合并过分支"

```text
合并前：  A---B (main)
              \
               C (feature)

合并后：  A---B---C (main, feature)
```

- **三方合并**：两边都有新提交，Git 自动合并；若同一处被两边都改过，则产生冲突（见 10.4）

想保留"发生过合并"的记录，可以用：

```bash
$ git merge --no-ff <分支名>   # 禁止快进，总是生成一个合并提交
```

### 10.4 解决合并冲突（必学）

**何时冲突**：两个分支都修改了**同一个文件的同一处**，Git 无法自动判断保留哪份。

**冲突文件长这样**：

```text
<<<<<<< HEAD
当前分支（main）的内容
=======
要合并进来的分支的内容
>>>>>>> feature/login
```

**解决步骤**：

1. `git status` 查看哪些文件冲突（显示 `both modified`）
2. 打开冲突文件，和同事商量后**保留想要的内容**，手动删除 `<<<<<<<`、`=======`、`>>>>>>>` 三行标记
3. `git add <冲突文件>` 告诉 Git "冲突已解决"
4. `git commit` 完成合并（Git 会准备好默认的合并说明）
5. 不想合并了：`git merge --abort` 放弃合并，回到合并前状态

> **💡 减少冲突的建议**：开工前先 pull；小步提交；同一文件避免多人同时大改；及时沟通。

### 10.5 变基（git rebase）与摘樱桃（cherry-pick）

- `git rebase <分支>`：把当前分支的提交"搬到"目标分支最新提交之上，得到一条直线的历史。与 merge 的区别：**merge 保留真实历史（有分叉），rebase 把历史"抹平"**。新手先用 merge 即可。

```text
merge：   A---B-------M (main)
              \     /
               C---D (feature)

rebase：  A---B---C'---D' (feature)
```

- `git cherry-pick <提交ID>`：把**某一个提交**单独"复制"到当前分支，常用于把 bug 修复从一个分支挑到另一个分支

> **⚠️ 注意**：不要 rebase 已经推送到远程且别人可能在用的分支，会打乱别人的历史。

### 10.6 与远程协作的分支操作

```bash
$ git push -u origin <本地分支>      # 首次推送本地新分支到远程并建立跟踪
$ git pull                         # 拉取并合并远程的更新
$ git push origin --delete <分支名>  # 删除远程分支
```

`git branch -vv` 可以查看本地分支跟踪的是哪个远程分支。

## 11. 标签

标签是给**某一次提交**起的固定名字，常用来标记发布节点（如 v1.0.0）。和分支不同，标签不会随提交移动，是一个"路标"。

### 11.1 标签操作

```bash
$ git tag                       # 列出已有标签
$ git tag <名字>                 # 创建轻量标签（只是个指向提交的引用）
$ git tag -a <名字> -m "说明"     # 创建附注标签（含作者、时间、说明，推荐）
$ git show <标签名>              # 查看标签指向的提交详情

$ git push origin <标签名>        # 推送单个标签到远程
$ git push origin --tags         # 推送所有本地标签

$ git tag -d <标签名>                    # 删除本地标签
$ git push origin --delete <标签名>       # 删除远程标签
```

### 11.2 在标签处开分支 / 检出标签

```bash
$ git switch -c <新分支名> <标签名>   # 在标签位置创建并切换分支
$ git checkout <标签名>              # 直接查看标签时刻的代码（进入 detached HEAD 状态）
```

> **💡 提示**：版本号常遵循语义化版本（semver）：`v主版本.次版本.修订号`，如 `v1.2.3`。主版本变更 = 不兼容的大改动，次版本 = 新功能，修订号 = bug 修复。

> **⚠️ detached HEAD（游离头指针）**：当你 checkout 某个标签或提交 ID 时，HEAD 不再指向分支。此时做的提交不挂在任何分支上，切走容易"丢失"。做法：若想保留改动，立即执行 `git switch -c <新分支名>` 把它变成分支。

## 12. 忽略文件（.gitignore）

有些文件不该被 Git 管理：编译产物、依赖目录、日志、本地配置、密钥等。在仓库根目录建一个 `.gitignore` 文件，把不想跟踪的文件写进去。

### 12.1 示例

```text
# 依赖目录
node_modules/
vendor/

# 编译产物
dist/
build/
*.class

# 日志与临时文件
*.log
*.tmp

# 密钥与环境变量（千万不要提交！）
.env
*.pem

# 编辑器与系统文件
.idea/
.vscode/
.DS_Store
Thumbs.db

# 例外：仍然要跟踪这个文件
!important.log
```

### 12.2 匹配规则

| 写法 | 含义 |
| --- | --- |
| `*.log` | 任意层级的 .log 文件 |
| `build/` | 名为 build 的目录（含其中所有内容） |
| `/todo.txt` | 只匹配仓库根目录下的 todo.txt |
| `doc/*.txt` | doc 目录下一层的 txt 文件 |
| `doc/**/*.txt` | doc 目录下任意深度的 txt 文件 |
| `?` / `[0-9]` | 匹配单个字符 / 指定范围字符 |
| `!文件` | 取反，重新包含（注意：父目录被整体忽略时无法恢复） |
| `#` 开头 | 注释 |

> **💡 重要**：`.gitignore` **只对未跟踪的文件生效**。如果一个文件已经被 Git 跟踪，要先把它移出跟踪：
>
> ```bash
> $ git rm --cached <文件名>    # 停止跟踪但保留本地文件
> $ git commit -m "chore: 停止跟踪 xxx"
> ```
>
> 可以用 `git check-ignore <文件名>` 排查某个文件是否被忽略、被哪条规则忽略。

- 全局忽略（对电脑上所有仓库生效）：`git config --global core.excludesfile ~/.gitignore_global`
- GitHub 提供了各种语言的 .gitignore 模板：<https://github.com/github/gitignore>

## 13. 暂存工作现场（git stash）

**场景**：功能改到一半，还没到可以提交的程度，突然要切到别的分支处理紧急任务。此时既不想提交半成品，又不想丢弃改动。

`git stash` 把当前未提交的改动"收进抽屉"保存起来，让工作区变干净：

```bash
$ git stash                   # 暂存所有改动，工作区恢复干净
$ git stash push -m "说明"     # 暂存并写个说明（便于之后辨认）

$ git stash list              # 查看抽屉里有哪些暂存
$ git stash pop               # 取出最近一次暂存（同时从列表删除）
$ git stash apply             # 取出但不删除（可反复使用）
$ git stash drop              # 删除最近一次暂存
$ git stash clear             # 清空所有暂存 ⚠️
```

> **💡 提示**：`stash pop` 时如果和当前代码冲突，该暂存不会被删除。解决完冲突、`git add` 之后，再手动 `git stash drop` 即可。

## 14. 常用协作流程

### 14.1 单人项目流程

```text
git init → 写代码 → git add → git commit →（需要备份/多设备时）关联远程并 git push
```

### 14.2 功能分支工作流（团队最常用）

核心思想：**main 分支始终保持可发布**，所有开发都在功能分支上进行，完成后合并回 main。

```text
1. git switch main && git pull           # 从最新的主线开始
2. git switch -c feature/登录功能         # 开功能分支
3. 开发... git add . && git commit -m "feat: 实现登录功能"
4. git push -u origin feature/登录功能    # 推到远程备份 / 供他人查看
5. 在平台上发起合并请求（PR/MR），他人 review 通过后合并进 main
6. git switch main && git pull           # 切回主线并同步
7. git branch -d feature/登录功能         # 删除本地分支；远程分支在平台上删除
```

- **合并请求**（GitHub 叫 Pull Request，GitLab 叫 Merge Request）：请求把分支合并进主线的"审批单"，团队在上面讨论代码、跑自动化测试、批准合并。这是团队协作的核心环节。
- GitHub Flow 就是上述流程的简化版；Git Flow 则按 main/develop/feature/release/hotfix 更细致分工。中小团队先掌握功能分支流程即可。

### 14.3 团队协作好习惯

- 每次提交只做一件事，提交说明写清楚
- 开工前 `git pull`，收工前 `git push`
- 提交前用 `git status` / `git diff` 检查改了什么
- 不直接推送到 main，走分支 + 合并请求
- 冲突及时沟通解决

## 15. 常见问题排查

| 现象 / 报错 | 原因 | 解决办法 |
| --- | --- | --- |
| `refusing to merge unrelated histories` | 本地与远程没有共同历史（本地 init 的仓库直接 pull） | `git pull origin main --allow-unrelated-histories` |
| push 被拒绝（non-fast-forward） | 远程有新提交 | 先 `git pull` 合并，再 `git push` |
| 提交说明写错了 | — | `git commit --amend -m "新说明"`（未推送时） |
| 提交用了错误的用户名/邮箱 | 提交时身份配置不对 | 改好 `git config` 后执行 `git commit --amend --reset-author` |
| 误删/误改了文件 | — | `git restore <文件>`；想从历史恢复：`git restore --source=<提交ID> <文件>` |
| 误操作后想"回到过去" | — | `git reflog` 找到目标提交，`git reset --hard <提交ID>` |
| 想彻底放弃本地所有改动 | — | `git reset --hard HEAD` ⚠️（丢弃所有未提交改动） |
| 分支删除失败（有未合并提交） | 分支没合并过 | 先合并，或确认不要了就 `git branch -D <分支>` ⚠️ |
| 中文文件名显示为 `\346\226\207...` | 转义显示问题 | `git config --global core.quotepath false` |
| 处于 detached HEAD 状态 | checkout 了某个提交/标签 | `git switch <分支>` 回去；要保留改动先 `git switch -c <新分支>` |
| pull 时提示本地改动会被覆盖 | 本地未提交的改动与远程冲突 | 先 `git stash` 或先提交，再 pull |

## 16. 实用技巧

### 16.1 命令别名

```bash
$ git config --global alias.st status
$ git config --global alias.co checkout
$ git config --global alias.br branch
$ git config --global alias.lg "log --oneline --graph --all"
```

之后 `git st` 就等价于 `git status`，`git lg` 显示漂亮的提交图。

### 16.2 随时查手册

```bash
$ git help <命令>       # 打开该命令的完整手册，如 git help commit
$ git <命令> -h         # 快速查看命令选项
```

### 16.3 其他小技巧

- `git log --oneline --graph --all` 是理解仓库全貌的最佳工具，经常看
- 提交前用 `git diff --staged` 复查即将提交的内容
- `git reflog` 是万能后悔药，误操作先想到它

---

## 附录：命令速查表

### 配置

| 命令 | 作用 |
| --- | --- |
| `git config --global user.name "名字"` | 设置提交者姓名 |
| `git config --global user.email "邮箱"` | 设置提交者邮箱 |
| `git config --list` | 查看所有配置 |

### 仓库

| 命令 | 作用 |
| --- | --- |
| `git init` | 初始化本地仓库 |
| `git clone <地址>` | 克隆远程仓库 |

### 日常提交

| 命令 | 作用 |
| --- | --- |
| `git status` | 查看文件状态 |
| `git add .` | 全部加入暂存区 |
| `git add <文件>` | 指定文件加入暂存区 |
| `git commit -m "说明"` | 提交 |
| `git commit -am "说明"` | 暂存并提交已跟踪文件 |
| `git commit --amend` | 修改上次提交 |

### 查看

| 命令 | 作用 |
| --- | --- |
| `git log --oneline --graph --all` | 图形化历史 |
| `git diff` / `git diff --staged` | 查看差异 |
| `git show <提交>` | 查看提交详情 |
| `git blame <文件>` | 逐行查看作者 |
| `git reflog` | 查看 HEAD 足迹（后悔药） |

### 撤销

| 命令 | 作用 |
| --- | --- |
| `git restore <文件>` | 丢弃工作区改动 |
| `git restore --staged <文件>` | 取消暂存 |
| `git reset --soft HEAD~1` | 撤销提交保留改动 |
| `git reset --hard <提交>` | 回到某版本（危险） |
| `git revert <提交>` | 反向提交（安全撤销） |

### 远程

| 命令 | 作用 |
| --- | --- |
| `git remote -v` | 查看远程仓库 |
| `git remote add origin <地址>` | 添加远程仓库 |
| `git fetch` | 下载不合并 |
| `git pull` | 下载并合并 |
| `git push` | 推送 |
| `git push -u origin <分支>` | 首次推送并跟踪 |

### 分支与标签

| 命令 | 作用 |
| --- | --- |
| `git branch` / `-r` / `-a` | 查看分支 |
| `git switch -c <分支>` | 创建并切换分支 |
| `git switch <分支>` | 切换分支 |
| `git merge <分支>` | 合并分支 |
| `git merge --abort` | 放弃合并 |
| `git branch -d <分支>` | 删除分支 |
| `git tag -a <标签> -m "说明"` | 创建标签 |
| `git push origin --tags` | 推送标签 |

### 其他

| 命令 | 作用 |
| --- | --- |
| `git stash` / `git stash pop` | 暂存现场 / 恢复现场 |
| `git rm --cached <文件>` | 停止跟踪文件 |
| `git cherry-pick <提交>` | 复制某提交到当前分支 |
| `git rebase <分支>` | 变基 |
| `git help <命令>` | 查看命令手册 |

---

## 学习资源

- **Pro Git（中文版）**：Git 官方推荐教材，免费在线阅读 <https://git-scm.com/book/zh/v2>
- **Learn Git Branching**：交互式可视化练习，专门攻克分支、合并、变基 <https://learngitbranching.js.org/>
- **Git 官方文档**：所有命令的权威参考 <https://git-scm.com/docs>
- **.gitignore 模板**：<https://github.com/github/gitignore>

> 学习 Git 最好的方式是动手：建一个练习仓库，把每个命令都敲一遍，再配合图形化历史（`git log --oneline --graph --all`）观察每次操作的变化。遇到报错不要慌，先读报错信息，再查本文第 15 章。

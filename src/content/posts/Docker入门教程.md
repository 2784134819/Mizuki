---
title: "Docker入门教程"
published: 2026-08-14
description: "从零开始的 Docker 全面入门：镜像、容器、仓库三大核心概念，Dockerfile 与 docker compose 详解，数据卷、网络、镜像加速与常用实战命令，附完整可运行示例。"
tags: [Docker, 容器, 部署]
category: "工具"
draft: false
---

# Docker 入门教程

Docker 是当今应用部署与交付的事实标准。本文从"为什么需要 Docker"讲起，覆盖三大核心概念、常用命令、Dockerfile、数据卷、网络、docker compose、镜像仓库与常见问题排查，读完即可把任意应用打包成镜像并一键部署。

## 一、为什么需要 Docker

**最核心的价值：解决"在我电脑上能跑，在你电脑上跑不起来"的环境一致性问题。**

传统部署的痛点：开发环境、测试环境、生产环境的操作系统版本、依赖库版本、配置各不相同，同一个应用换个环境就可能崩溃。Docker 把**应用 + 它运行所需的全部依赖（运行时、库、配置）**打包成一个标准化的"镜像"，在任何装了 Docker 的机器上都能原样运行——**一次打包，处处运行**。

**Docker 容器与虚拟机的对比：**

| 对比项 | 虚拟机 | Docker 容器 |
|--------|--------|-------------|
| 隔离级别 | 硬件级虚拟化，每个 VM 有完整 Guest OS | 进程级隔离，共享宿主机内核 |
| 启动速度 | 分钟级（要启动整个操作系统） | 秒级（本质是启动进程） |
| 资源占用 | 每个 VM 数 GB 内存、完整磁盘 | 仅应用本身，共享内核，MB 级 |
| 镜像大小 | 几 GB 起步 | 几十 MB 起步 |
| 性能损耗 | 有虚拟化开销 | 接近原生 |

**一句话总结：** 虚拟机隔离的是"整台机器"，容器隔离的是"单个应用"。

**典型应用场景：**

- 微服务：每个服务打一个镜像，独立部署、独立升级；
- CI/CD：流水线里用同一镜像构建、测试、发布，保证各阶段环境一致；
- 快速交付：新机器无需装环境，`docker run` 一条命令拉起整套服务；
- 环境隔离：在一台服务器上同时跑需要不同版本依赖的多个应用，互不干扰。

## 二、核心概念：镜像、容器、仓库

Docker 有三层核心概念，理解它们的关系就入门了一半：

- **镜像（Image）**：一个**只读**的打包模板，包含运行某个应用所需的文件系统、依赖、启动命令。镜像采用**分层存储**——每一条构建指令生成一层，层与层之间共享、复用，这也是镜像体积小、构建快的根本原因。
- **容器（Container）**：镜像的**运行实例**。容器在镜像的只读层之上加了一层**可写层**，运行时的所有修改都发生在这层。一个镜像可以同时启动无数个互相隔离的容器。
- **仓库（Registry）**：存放镜像的地方，公共仓库是 [Docker Hub](https://hub.docker.com/)，也可以自建私有仓库（Harbor 等）。

```
┌──────────┐   docker run    ┌──────────────┐
│  镜像 Image │ ──────────────> │  容器 Container │
│ （只读模板） │                │ （运行实例+可写层）│
└──────────┘                 └──────────────┘
      ▲                             │
      │ docker build / pull         │ docker commit（不推荐，应改用 Dockerfile）
      │                             ▼
┌──────────┐                 ┌──────────────┐
│ Dockerfile │                │  仓库 Registry │
│ （构建配方） │ ── docker push ──> │ （Docker Hub 等）│
└──────────┘                 └──────────────┘
```

**类比理解：** 镜像相当于"类"（class），容器相当于"实例"（object）；Dockerfile 相当于"配方"，镜像相当于按配方烤好的"成品"，仓库相当于"成品商店"。

## 三、安装 Docker

**Linux（生产环境主流）：**

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | bash
# 或手动 apt 安装
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# CentOS / Rocky 系
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker
```

**Windows：** 推荐安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)，它会自动配置 **WSL2** 后端（需先在 Windows 功能里启用"适用于 Linux 的 Windows 子系统"和"虚拟机平台"）。WSL2 模式下 Docker 实际跑在一个轻量 Linux 虚拟机里，体验与原生 Linux 几乎一致。

**macOS：** 安装 Docker Desktop（Apple Silicon 与 Intel 版本不同，官网会自动识别）。

**验证安装：**

```bash
docker version          # 查看客户端与服务端版本
docker run hello-world  # 拉取并运行测试镜像，输出 "Hello from Docker!" 即成功
```

:::tip
Linux 下如果每次都要 `sudo docker`，把当前用户加入 docker 组即可：`sudo usermod -aG docker $USER`，然后**注销重新登录**生效。
:::

## 四、配置镜像加速（国内必备）

国内直接访问 Docker Hub 经常超时，需要配置镜像加速器（以腾讯云为例，登录容器镜像服务控制台可获取个人加速地址）：

```bash
# 编辑 /etc/docker/daemon.json（没有就新建）
sudo vim /etc/docker/daemon.json
```

```json
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.m.daocloud.io"
  ]
}
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
docker info | grep -A 3 "Registry Mirrors"   # 验证加速器是否生效
```

## 五、第一个容器：docker run 详解

### 5.1 拉取并运行 Nginx

```bash
docker pull nginx            # 从仓库拉取镜像（默认 latest 标签）
docker images                # 查看本地镜像列表
docker run -d -p 8080:80 --name my-nginx nginx
```

浏览器访问 `http://localhost:8080` 即可看到 Nginx 欢迎页。

### 5.2 docker run 常用参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-d` | 后台运行（守护模式） | `docker run -d nginx` |
| `-p 宿主机端口:容器端口` | 端口映射 | `-p 8080:80` 把容器的 80 映射到宿主机的 8080 |
| `-v 宿主机路径:容器路径` | 挂载数据卷 | `-v /data:/var/lib/mysql` |
| `-e` | 设置环境变量 | `-e MYSQL_ROOT_PASSWORD=123456` |
| `--name` | 给容器起名字 | `--name my-nginx` |
| `-it` | 交互式终端（常配合 `/bin/bash` 进入容器） | `docker run -it ubuntu /bin/bash` |
| `--rm` | 容器退出后自动删除 | `docker run --rm hello-world` |
| `--restart always` | 容器退出自动重启（开机自启） | `docker run -d --restart always nginx` |

:::warning
`-p 宿主机端口:容器端口` 中宿主机端口不能重复；若省略宿主机端口（`-p 80`）则随机分配。端口被占用是新手最常见的报错之一。
:::

### 5.3 容器生命周期管理

```bash
docker ps              # 查看运行中的容器
docker ps -a           # 查看所有容器（含已停止的）
docker logs my-nginx   # 查看容器日志（-f 持续输出，--tail 100 只看末尾100行）
docker exec -it my-nginx /bin/bash   # 进入正在运行的容器
docker stop my-nginx   # 停止容器（发送 SIGTERM，优雅退出）
docker start my-nginx  # 再次启动已停止的容器
docker restart my-nginx# 重启
docker rm my-nginx     # 删除容器（先 stop；-f 强制删除运行中的）
docker rm $(docker ps -aq)   # 删除全部容器（慎用）
```

**容器状态流转：** `Created → Running → Paused / Stopped → Deleted`。`stop` 只是停止、数据还在（在可写层和挂载卷里），`rm` 才真正删除容器。

## 六、镜像管理

```bash
docker search nginx              # 在 Docker Hub 搜索镜像
docker pull nginx:1.25           # 拉取指定标签（tag）的镜像
docker tag nginx:1.25 my-nginx:v1   # 给镜像打新标签（相当于复制一个引用）
docker rmi my-nginx:v1           # 删除镜像（有容器在用时会报错，先删容器）
docker history nginx             # 查看镜像的构建历史（每一层对应的指令）
docker inspect nginx             # 查看镜像/容器的详细信息（JSON 格式）
docker save -o nginx.tar nginx   # 把镜像导出为 tar 文件（离线传输）
docker load -i nginx.tar         # 从 tar 文件导入镜像
docker image prune               # 清理无标签的悬空镜像（dangling）
```

:::tip
镜像标签只是"引用别名"：`docker rmi` 删的是标签，只有所有标签都被删除后镜像层才会被真正回收。
:::

## 七、Dockerfile：把应用打包成镜像

Dockerfile 是构建镜像的"配方"：一个文本文件，每一条指令生成镜像的一层。

### 7.1 常用指令详解

| 指令 | 作用 | 示例 |
|------|------|------|
| `FROM` | 指定基础镜像，**必须写在第一行** | `FROM node:20-alpine` |
| `WORKDIR` | 设置工作目录（不存在会自动创建，等价于 cd） | `WORKDIR /app` |
| `COPY` | 把构建上下文中的文件复制进镜像 | `COPY . /app` |
| `ADD` | 类似 COPY，但支持自动解压 tar 和远程 URL（不推荐用 URL，层不可控） | `ADD app.tar.gz /app` |
| `RUN` | 构建时执行命令（常用于安装依赖） | `RUN npm install` |
| `ENV` | 设置环境变量（运行时也生效） | `ENV NODE_ENV=production` |
| `ARG` | 构建参数（只在构建期可用，配合 `--build-arg`） | `ARG VERSION=1.0` |
| `EXPOSE` | 声明容器监听端口（文档作用，实际映射靠 -p） | `EXPOSE 3000` |
| `VOLUME` | 声明匿名卷挂载点 | `VOLUME /data` |
| `USER` | 以哪个用户运行容器（安全最佳实践：不用 root） | `USER node` |
| `HEALTHCHECK` | 健康检查命令 | `HEALTHCHECK CMD curl -f http://localhost/ || exit 1` |
| `CMD` | 容器启动时的**默认**命令（可被 docker run 覆盖） | `CMD ["node", "server.js"]` |
| `ENTRYPOINT` | 容器启动时的**固定**入口命令（docker run 的参数会追加给它） | `ENTRYPOINT ["docker-entrypoint.sh"]` |

### 7.2 CMD 与 ENTRYPOINT 的区别

| | CMD | ENTRYPOINT |
|---|-----|------------|
| 定位 | 默认命令 | 固定入口 |
| 能否被 `docker run` 后面的参数覆盖 | **能**（整个被替换） | 不能（参数会**追加**到 ENTRYPOINT 后面） |
| 典型用法 | `CMD ["node","server.js"]` | `ENTRYPOINT ["nginx"]` + `CMD ["-g","daemon off;"]` |

**组合写法：** `ENTRYPOINT` 定义"程序是什么"，`CMD` 定义"默认参数是什么"——这样用户 `docker run img --help` 时，`--help` 会追加到 ENTRYPOINT 之后，非常灵活。

### 7.3 构建缓存与 .dockerignore

Docker 按层缓存：只要某条指令及其之前的层都没变，构建时直接复用缓存。**先 COPY 依赖清单、再 RUN 安装、最后 COPY 源码**的顺序可以最大化缓存命中：

```dockerfile
# ❌ 差：源码一变，npm install 层缓存全部失效
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "server.js"]
```

```dockerfile
# ✅ 好：只有 package.json 变化才重新装依赖
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
CMD ["node", "server.js"]
```

`.dockerignore` 文件用于排除不参与构建的文件（类似 .gitignore），能显著减小构建上下文：

```
node_modules
.git
*.log
.env
```

### 7.4 多阶段构建（Multi-stage Build）

把"编译"和"运行"拆成两个阶段，最终镜像只保留运行所需的产物，体积大幅缩小：

```dockerfile
# 阶段一：构建（编译源码）
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN go build -o myapp .

# 阶段二：运行（只拷贝编译产物）
FROM alpine:3.20
WORKDIR /app
COPY --from=builder /app/myapp .
ENTRYPOINT ["./myapp"]
```

### 7.5 完整示例：打包一个 Python Flask 应用

`app.py`：

```python
from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello Docker!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

`requirements.txt`：

```text
flask==3.0.3
```

`Dockerfile`：

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 5000
CMD ["python", "app.py"]
```

构建并运行：

```bash
docker build -t my-flask:1.0 .      # 注意末尾的点：构建上下文为当前目录
docker run -d -p 5000:5000 --name flask-app my-flask:1.0
curl http://localhost:5000          # 输出 Hello Docker!
```

## 八、数据管理：让数据持久化

容器删除后，可写层的数据会一起消失。要让数据持久保存，必须用**卷（Volume）**或**绑定挂载（Bind Mount）**：

| 方式 | 数据存放位置 | 适用场景 |
|------|-------------|---------|
| 匿名卷 | Docker 自动管理（/var/lib/docker/volumes） | 临时数据，不关心位置 |
| 命名卷 Volume | Docker 管理，有名字 | **推荐**：数据库等需要持久化的数据 |
| 绑定挂载 Bind Mount | 宿主机指定目录 | 开发调试（源码热更新）、配置文件 |

```bash
# 命名卷
docker volume create mydata
docker run -d -v mydata:/var/lib/mysql --name db mysql:8

# 绑定挂载（宿主机绝对路径:容器路径）
docker run -d -v /opt/nginx/html:/usr/share/nginx/html -p 80:80 nginx

# 卷管理
docker volume ls           # 列出所有卷
docker volume inspect mydata   # 查看卷详情（含宿主机实际路径）
docker volume rm mydata        # 删除卷
```

:::warning
数据库容器（MySQL、Postgres、Redis 等）**必须挂载命名卷**，否则 `docker rm` 之后数据全部丢失。
:::

## 九、网络

Docker 默认提供三种网络模式：

| 模式 | 说明 |
|------|------|
| `bridge`（默认） | 每个容器有独立 IP，通过 NAT 与外界通信；容器间默认互不直接访问 |
| `host` | 容器与宿主机共享网络栈（端口直接可用，无隔离） |
| `none` | 完全无网络 |

**端口映射 `-p` 的原理：** 把宿主机的端口转发到容器在 bridge 网络中的 IP:端口，即 `-p 8080:80` 表示访问宿主机 8080 = 访问容器 80。

**容器间通信的正确姿势——自定义网络：** 同一个自定义网络里的容器可以**直接用容器名互相访问**（Docker 内置 DNS 解析）：

```bash
docker network create mynet                 # 创建自定义网络
docker run -d --network mynet --name app my-flask:1.0
docker run -d --network mynet --name db -e MYSQL_ROOT_PASSWORD=123456 mysql:8

# 在 app 容器里直接用容器名访问 db，无需知道 IP
docker exec app mysql -h db -uroot -p123456
```

```bash
docker network ls        # 查看网络列表
docker network inspect mynet   # 查看网络详情
docker network rm mynet        # 删除网络
```

:::tip
`--link` 是早期做法，已过时，请一律使用自定义网络。
:::

## 十、Docker Compose：多容器编排

当应用由多个容器组成（如 web + mysql + redis）时，一条条 `docker run` 太繁琐，docker compose 用一个 YAML 文件描述整个服务栈，一条命令全部拉起。

### 10.1 示例：Web + MySQL + Redis

`docker-compose.yml`：

```yaml
services:
  web:
    build: .                       # 用当前目录的 Dockerfile 构建
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=db
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis
    restart: always

  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: myapp
    volumes:
      - db-data:/var/lib/mysql     # 命名卷持久化
    restart: always

  redis:
    image: redis:7
    restart: always

volumes:
  db-data:                          # 声明命名卷
```

### 10.2 常用命令

```bash
docker compose up -d            # 后台启动整个服务栈（-d 守护模式）
docker compose up -d --build    # 重新构建并启动
docker compose ps               # 查看服务栈状态
docker compose logs -f web      # 查看指定服务的日志
docker compose exec web bash    # 进入指定服务的容器
docker compose down             # 停止并删除服务栈（保留命名卷）
docker compose down -v          # 连同命名卷一起删除（数据也会没！）
```

:::tip
`depends_on` 只保证**启动顺序**，不保证服务"就绪"（MySQL 可能还没完成初始化）。生产环境建议配合 `healthcheck` 或 `depends_on` 的 `condition: service_healthy` 使用。
:::

## 十一、镜像仓库

**使用 Docker Hub（公共仓库）：**

```bash
docker login                              # 登录（输入用户名与 Access Token）
docker tag my-flask:1.0 yourname/my-flask:1.0   # 打上 用户名/镜像名:标签 格式的标签
docker push yourname/my-flask:1.0         # 推送到 Docker Hub
docker pull yourname/my-flask:1.0         # 任何机器都能拉取
```

**私有仓库：** 企业内常用 [Harbor](https://goharbor.io/) 自建私有镜像仓库，支持权限管理、镜像扫描、签名；腾讯云、阿里云也提供托管的容器镜像服务（个人版免费），可以直接 `docker login` 到云厂商的镜像仓库地址后 push/pull。

## 十二、常见问题排查

**1. 端口被占用**

```bash
docker: Error response from daemon: ... bind: address already in use
```

解决：换一个宿主机端口（`-p 8081:80`），或找出占用进程 `netstat -tlnp | grep 8080` 后处理。

**2. 权限不足**

```bash
permission denied while trying to connect to the Docker daemon socket
```

解决：`sudo usermod -aG docker $USER` 后重新登录。

**3. 容器时区不对**

```bash
docker run -d -e TZ=Asia/Shanghai --name app my-flask:1.0   # 加 -e TZ=Asia/Shanghai
```

**4. 磁盘占用过大**

```bash
docker system df              # 查看镜像/容器/卷占用
docker system prune           # 清理停止的容器、无标签镜像、无用网络
docker system prune -a        # 更彻底（删除所有未被容器使用的镜像，慎用）
docker builder prune          # 清理构建缓存
```

**5. 容器启动后立刻退出**

- `docker logs <容器名>` 看退出原因（最常见：前台进程退出后容器就结束，比如把 `-d` 用错）；
- 前台程序必须常驻，后台程序（如 nginx）要用 `daemon off;` 之类的前台模式或 `-d` 运行；
- `docker ps -a` 里看容器的 `Exited (code)` 退出码定位问题。

**6. 拉取镜像超时 / 失败**

先确认第 4 节的镜像加速是否配置并重启生效；仍失败就换加速地址或多配几个镜像源。

## 十三、总结与学习路线

**核心记忆点：**

- **镜像**是只读模板，**容器**是运行实例，**仓库**是镜像商店；
- `docker run -d -p 端口 -v 卷 --name 名字 镜像` 是最常用的启动姿势；
- 数据要持久化就挂**卷**；容器间通信就建**自定义网络**；
- 应用交付的正确姿势是写 **Dockerfile**（而不是进容器里手动改东西）；
- 多容器应用用 **docker compose** 一条命令管理整个服务栈。

**进阶路线：** 镜像分层与缓存优化 → 多阶段构建 → HEALTHCHECK 与容器编排 → Kubernetes（K8s）→ 服务网格。打好本文基础，后面每一步都会顺理成章。

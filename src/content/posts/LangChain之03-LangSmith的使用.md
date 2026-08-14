---
title: "LangChain之03：LangSmith的使用"
published: 2026-08-14
description: "介绍 LangChain 生态的调试监控平台 LangSmith：核心功能、账号准备与环境配置，以及如何用代码接入并查看追踪与监控指标。"
tags: [LangChain, LangSmith, 调试追踪, 监控评估]
category: "LangChain"
draft: false
---

# LangChain之03：LangSmith的使用

## 1. LangSmith 概述

### 1.1 什么是 LangSmith

LangSmith 是 LangChain 生态系统中专门用于 LLM（大语言模型）应用调试、监控、评估和管理的平台。

主要能力：

- 追踪（Tracing）：记录每次 LLM 调用的详细信息
- 监控（Monitoring）：实时查看应用性能
- 调试（Debug）：排查问题和优化性能
- 评估（Evaluate）：系统化测试 LLM 应用

### 1.2 具体功能

#### 功能一：核心应用与开发

- **Tracing（追踪）**：LangSmith 最核心的功能，完整记录大模型应用的每一次调用链路（Trace）。当 Agent 或 RAG 系统运行变慢或报错时，可进入对应项目查看每一步的 Prompt、模型返回、Token 消耗以及每个链条节点的耗时，方便排查 Bug 和优化性能。
- **Monitoring（监控）**：提供生产环境的高级数据可视化看板，从宏观角度监控应用运行状况，查看 Token 消耗趋势、QPS（每秒请求数）、错误率、平均延迟（Latency）以及成本预估。
- **Datasets & Experiments（数据集与实验）**：管理测试数据集并运行对比实验。可把真实输入、边界情况（Edge Cases）存为数据集，修改 Prompt 或更换底层大模型后运行自动化对比测试，直观看到新旧版本在同一批测试集上的表现差异。
- **Evaluators（评估器）**：配置和自动化评估任务。大模型输出难以用传统断言测试，可配置基于规则（如关键词匹配）或基于模型（LLM-as-a-judge）的评估指标（如答案相关性、是否包含幻觉），对追踪数据或实验结果自动打分。
- **Annotation Queues（标注队列）**：人工反馈与数据清洗工具。把一部分痕迹发送到标注队列，由核心成员、业务专家或人工客服手动打分、纠正回答或贴标签，高质量标注数据后续可用于微调模型或充当测试集。

#### 功能二：提示词与调试工具

- **Prompts（提示词管理）**：类似“提示词版的 GitHub”。把 Prompt 从代码中解耦出来，在云端统一管理，支持版本控制（如 v1、v2），通过 API 动态拉取最新提示词，并支持团队协作与分享。
- **Playground（演练场）**：网页端模型交互界面。无需写代码即可选择不同模型（如 OpenAI、Anthropic 或本地模型），快速微调并测试 Prompt 效果，可一键保存到 Prompts 仓库。
- **Studio（工作室）**：与 LangGraph 深度集成，提供可视化图形交互界面。可视化查看状态机（State）在各节点间的流转，支持在节点“暂停”、手动修改数据后继续执行，是调试复杂智能体交互的利器。
- **Context Hub（上下文中心）**：管理全局上下文或通用组件配置，存放可在多个项目或 Prompt 中复用的公共上下文模板、全局变量或系统预设提示。

#### 功能三：部署与沙盒

- **Deployments（部署）**：一键将 LangChain 应用或 LangGraph Agent 部署为线上可用的 API 服务（通常依托 LangGraph Cloud），提供开箱即用的生产端点，处理高并发、队列管理和状态持久化。
- **Sandboxes（沙盒）**：提供轻量级的在线运行和测试环境，在不污染生产环境的前提下，供开发人员安全试运行、测试新部署的 Agent 或执行自动化脚本。

> 建议：现阶段重点关注 Tracing（观察项目调用细节）和 Playground（快速调优提示词）。当应用结构走向复杂（如引入复杂 RAG 检索或多 Agent 协同）时，再逐步引入 Datasets 进行量化评估，并利用 Studio 进行可视化调试。

## 2. 准备账号

### 2.1 注册或登录

1. 访问官网：https://smith.langchain.com/
2. 自由选择注册或登录方式
3. 登录成功

### 2.2 获取 API Key

1. 打开设置
2. 创建 API Key
3. 保存 Key

> 注意：点击 copy 将 API Key 保存到剪贴板并关闭弹窗。API Key 只在上述窗口出现一次，关闭后回到设置页面就无法再查看其内容，请妥善保存。

4. （可选）按需删除：如需删除 Key，点击右侧图标即可。

### 2.3 新增环境变量

在 `.env` 配置文件中添加四个环境变量：

```bash
# 是否启用Langsmith监控功能
LANGSMITH_TRACING=true
# Langsmith监控WebUI地址
LANGSMITH_ENDPOINT=https://api.smith.LangChain.com
# 创建的API_KEY
LANGSMITH_API_KEY=<YOUR_API_KEY>
# 自定义项目名称，可以在Langsmith WebUI监控页面根据名称查看对应的运行记录
LANGSMITH_PROJECT="pr-clear-harmony-32"
```

## 3. 查看监控指标

添加上述环境变量后，在程序中通过 `load_dotenv()` 加载并运行 LangChain 代码，LangSmith 会自动记录运行指标并同步至后台服务，可在官网查看运行记录。

### 步骤一：运行任意 LangChain 程序

**举例 1：使用 ChatDeepSeek**

```python
import os
from dotenv import load_dotenv
from langchain_deepseek import ChatDeepSeek
# 将env文件中的变量加载为环境变量
#override=True：表示.env优先
load_dotenv(override=True)
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL")
model = ChatDeepSeek(
api_key=DEEPSEEK_API_KEY,
api_base=DEEPSEEK_BASE_URL,
model_name="deepseek-v4-flash"
)
print(model.invoke("你好"))
```

**举例 2：使用 init_chat_model（OpenAI 协议）**

```python
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
import os
load_dotenv(override=True)
CLOSEAI_API_KEY=os.getenv("CLOSEAI_API_KEY")
CLOSEAI_BASE_URL=os.getenv("CLOSEAI_BASE_URL")
model = init_chat_model(model="deepseek-v4-flash",
model_provider="openai",
api_key=CLOSEAI_API_KEY,
base_url=CLOSEAI_BASE_URL)
print(model.invoke("你好，用一句话回答"))
```

**举例 3：使用 init_chat_model（DeepSeek + config 配置）**

```python
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
import os
from rich import print as rprint
# 从.env文件中加载环境变量
load_dotenv(override=True)
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL")
# 1. 初始化模型
model = init_chat_model(
model="deepseek-v4-flash",
model_provider="deepseek",
api_key=DEEPSEEK_API_KEY,
base_url=DEEPSEEK_BASE_URL,
temperature=0.2,
max_tokens=500,
# 指定可调整参数
configurable_fields=("model", "model_provider", "temperature",
"max_tokens"),
)
# 2. 准备 config 字典
config = {
"run_name": "joke_generation", # 在LangSmith中这次运行会显示为"joke_generation"
"tags": ["my_tag1", "my_tag2"], # 打上标签便于分类查找
"metadata": {
"user_id": "shkstart", # 记录用户ID
"session_id": "sess_123" # 记录会话ID
},
"configurable": {
"model": "deepseek-v4-pro", # 配置模型参数
"model_provider": "openai", # 配置模型提供商参数
"temperature": 0.7, # 配置温度参数
"max_tokens": 1000 # 配置最大令牌数
}
}
# 3. 调用模型并传入config
response = model.invoke(
"1 + 2 = ？",
config=config
)
rprint(response)
```

### 步骤二：打开监控界面

此时在 LangSmith 官方 WebUI 的 Tracing 界面下，可以看到按 `LANGSMITH_PROJECT` 命名的项目。

### 步骤三：查看运行指标

点击条目任意位置进入详情页面，此处列出详细的运行指标；点击某次运行记录可查看更详细的信息。

### 步骤四：查看运行报表

此处提供大量指标报表，点击标签或下滑页面可切换指标。

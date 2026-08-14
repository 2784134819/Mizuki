---
title: "LangChain之09：上下文与记忆"
published: 2026-08-14
description: "系统讲解 LangChain 记忆机制：短期记忆的 Checkpointer 持久化、上下文裁剪/删除/摘要治理，以及长期记忆的 Store 四层架构与读写检索 API。"
tags: [LangChain, 上下文, 记忆]
category: "LangChain"
draft: false
---

# LangChain之09：上下文与记忆

## 一、概述

### 1.1 为什么需要记忆（Memory）

记忆是一种记住之前互动信息的系统。随着 Agent 处理涉及大量用户交互的复杂任务，记忆变得至关重要。

大多数大模型应用都会有一个会话接口，允许进行多轮对话，并具备一定的上下文记忆能力。但实际上，大模型本身是“无状态”的，不会记忆任何上下文：每次调用 `agent.invoke()` 都是全新的开始，不记得之前的对话。

```python
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
import os

# 从.env文件中加载环境变量
load_dotenv(override=True)
model = init_chat_model(
    model="gpt-5.4-mini",
    model_provider="openai",
    api_key=os.getenv("CLOSEAI_API_KEY"),
    base_url=os.getenv("CLOSEAI_BASE_URL")
)
```

**情况 1：把历史消息一次性传入**

```python
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage, AIMessage

messages1 = [
    HumanMessage("你好，我叫小明"),
    AIMessage("很高兴认识你，小明"),
    HumanMessage("你用一句话介绍下你自己"),
]
agent = create_agent(
    model=model,
    tools=[],
)
response1 = agent.invoke({"messages": messages1})
for msg in response1["messages"]:
    msg.pretty_print()
```

输出：

```text
Human Message: 你好，我叫小明
Ai Message: 很高兴认识你，小明
Human Message: 你用一句话介绍下你自己
Ai Message: 我是一个可以帮助你回答问题、写作、翻译和思考的 AI 助手。
```

**情况 2：新开一轮、不带历史**

```python
messages2 = [HumanMessage("我叫什么名字？")]
response2 = agent.invoke({"messages": messages2})
for msg in response2["messages"]:
    msg.pretty_print()
```

输出：

```text
Human Message: 我叫什么名字？
Ai Message: 我不知道你的名字，除非你告诉我。
```

**情况 3：把完整历史（含“我叫小明”）再传一次**

```python
messages3 = [
    HumanMessage("你好，我叫小明"),
    AIMessage("很高兴认识你，小明"),
    HumanMessage("你用一句话介绍下你自己"),
    AIMessage("我是一个由 OpenAI 训练的人工智能助手，可以帮你回答问题、写作和解决各种任务。"),
    HumanMessage("我叫什么名字？")
]
response3 = agent.invoke({"messages": messages3})
for msg in response3["messages"]:
    msg.pretty_print()
```

结论：大模型本身不会自动记住对话，只有把历史信息显式地重新传入，它才能“想起”之前说过什么。

### 1.2 如何解决记忆问题

实现记忆功能，需要额外的模块去保存和模型对话的上下文信息，然后在下一次请求时把历史信息都输入给模型，让模型输出结果。

#### 1.2.1 上下文工程

在 LangChain 中，记忆（Memory）是专门负责“存储历史交互信息”的组件，核心作用是「保存上下文」和「提供上下文」，让 LLM 在每次响应时都能“看到”之前的对话内容。

上下文工程（Context Engineering）负责“合理组织”这些记忆和任务信息，让 LLM 的响应更连贯、更贴合需求，也是 Agent 能实现复杂多轮交互的核心基础。

类比：你和模型对话时，模型需要“你叫小明”这类前置信息才能正确回应。

#### 1.2.2 上下文类型及相关的 API

LangChain 的上下文工程基于 Agent 讨论，而上下文工程构建在 LangGraph 之上。LangGraph 提供了三种管理上下文的方法，结合了可变性和生命周期两个维度：

| 上下文类型 | 描述 | 可变性 | 生命周期 | 访问方法 |
| --- | --- | --- | --- | --- |
| 动态运行时上下文 | 在单次运行中会演变的可变数据 | 动态 | 单次运行 | LangGraph state 对象 |
| 动态跨会话上下文 | 在对话间共享的持久数据，如用户偏好、历史洞察、知识条目 | 动态 | 跨对话 | LangGraph store 对象 |
| 静态运行时上下文 | 在启动时传入的用户元数据、工具、数据库连接 | 静态 | 单次运行 | LangGraph context 对象 |

### 1.3 LangChain 的记忆

#### 1.3.1 记忆的分类

官方文档：<https://docs.langchain.com/oss/python/concepts/memory>

记忆分为短期记忆和长期记忆，对应不同的使用场景：

- **短期记忆（Short-term memory、会话级记忆、thread-scoped memory）**：作用范围是单个对话线程（Thread）内，一旦开启新对话（更换 `thread_id`），记忆即消失。
- **长期记忆（Long-term memory，跨会话级记忆）**：在会话间存储用户特定或应用级数据，并在会话线程间共享。它可以随时在任何线程中被调用，范围是任意自定义命名空间，而不仅仅是单一线程 ID。

#### 1.3.2 记忆的管理

- 在 LangChain v0.x 版本中，通过专用的 `xxxMemory` 类管理记忆。
- 在 LangChain v1.x 版本中，Agent 构建在 LangGraph 图结构之上，通过 `state` 和 `store` 构建记忆系统，使用更简单、功能更统一。

- `state`：短期记忆对象，以会话为单位组织，包含当前会话的所有消息记录以及自定义信息。
- `store`：长期记忆对象，跨会话持久化的数据，通常需要结合向量数据库或外部存储实现。

## 二、短期记忆

LangChain 1.x 的短期记忆是三者组合：**State（会话内部状态）+ Checkpointer（持久化机制）+ Thread ID（会话作用域）**。

- State：默认存储历史消息列表 `messages`，通过 State 管理历史消息。
- Checkpointer：负责将 State 作为检查点持久化保存，检查点是某个时刻的 State 快照。
- Thread ID：用于唯一标识 State，LangChain 运行时会按照 `thread_id` 读写 State 快照。

这就像玩 RPG 游戏时的“自动存档”：不需要手动保存，系统在关键节点自动记录，下次进入游戏随时可以从上次的存档点继续。

### 2.1 基于内存的持久化器

这是最便捷的使用方式，适合快速测试或调试。

#### 2.1.1 举例 1：没有记忆

```python
from langchain.agents import create_agent
from langchain.messages import HumanMessage

agent = create_agent(
    model=model,
    tools=[]
)

print("\n第一轮对话：")
response1 = agent.invoke({
    "messages": [HumanMessage("我叫张三")]
})
print(f"Agent: {response1['messages'][-1].content}")

print("\n第二轮对话：")
response2 = agent.invoke({
    "messages": [HumanMessage("我叫什么？")]
})
print(f"Agent: {response2['messages'][-1].content}")
```

输出：

```text
第一轮对话：
Agent: 你好，张三！很高兴认识你。有什么我可以帮你的吗？
第二轮对话：
Agent: 我不知道你的名字，除非你告诉我。
```

#### 2.1.2 举例 2：拥有记忆

```python
from langgraph.checkpoint.memory import InMemorySaver

checkpointer = InMemorySaver()

# 1. 创建 Agent 时添加 checkpointer
agent = create_agent(
    model=model,
    checkpointer=checkpointer  # 添加内存管理
)

# 2. 调用时指定 thread_id
config = {
    "configurable": {
        "thread_id": "1"
    }
}

print("\n第一轮对话：")
response1 = agent.invoke({
    "messages": [HumanMessage("我叫张三")]},
    config=config  # 传入 config
)
print(f"Agent: {response1['messages'][-1].content}")

print("\n第二轮对话：")
response2 = agent.invoke({
    "messages": [HumanMessage("我叫什么？")]},
    config=config  # 使用相同的 thread_id
)
print(f"Agent: {response2['messages'][-1].content}")
```

输出：

```text
第一轮对话：
Agent: 你好，张三！很高兴认识你。有什么我可以帮你的吗？
第二轮对话：
Agent: 你叫张三。
```

说明：只需传入 `checkpointer` 和 `config`，Agent 就能自然具备连续对话能力。可用 `agent.get_state(config)` 查看当前 State 快照（输出较长，下面仅保留关键字段）：

```python
from rich import print as rprint
latest_state = agent.get_state(config)
rprint(latest_state)
```

```text
StateSnapshot(
    values={
        'messages': [
            HumanMessage(content='我叫张三', ...),
            AIMessage(content='你好，张三！很高兴认识你。有什么我可以帮你的吗？', ...),
            HumanMessage(content='我叫什么？', ...),
            AIMessage(content='你叫张三。', ...),
        ]
    },
    next=(),
    config={'configurable': {'thread_id': '1', ...}},
    ...
)
```

第三轮对话直接带入线程 ID，即可带入此前对话记忆：

```python
print("\n第三轮对话：")
response3 = agent.invoke({
    "messages": [HumanMessage("我刚才问了什么问题？")]},
    config=config  # 使用相同的 thread_id
)
print(f"Agent: {response3['messages'][-1].content}")
```

```text
第三轮对话：
Agent: 你刚才问的是："我叫什么？"
```

所有消息历史都会自动追加到 AgentState 的 `messages` 字段中，无需手动维护。而如果更新线程 ID，则会重新开启对话——`thread_id` 隔离不同会话空间。

#### 2.1.3 关键步骤说明

1. **初始化记忆引擎**：`checkpointer = InMemorySaver()` 创建一个内存级记忆存储。注意 InMemorySaver 保存在内存中，进程结束就丢失数据，适合测试；生产环境可换成数据库持久化的 `SqliteSaver`、`PostgresSaver` 等。
2. **绑定 Agent**：在 `create_agent` 时传入 `checkpointer`，让 Agent 具备状态存储能力。
3. **设定会话 ID**：通过 `config = {"configurable": {"thread_id": "1"}}` 为每次调用指定线程标识。同一个 `thread_id` 共享记忆，不同 `thread_id` 完全隔离。

`thread_id` 是记忆管理的核心开关：在会话 2 里询问会话 1 的信息，Agent 会表示不知道——因为双方记忆空间完全隔离。

**生产环境场景 1：多用户聊天**

不同 `thread_id` = 不同会话，Agent 能正确记住每个会话的内容。

```python
# 用户 Alice
config_alice = {"configurable": {"thread_id": "user_alice"}}
agent.invoke({"messages": [...]}, config_alice)

# 用户 Bob
config_bob = {"configurable": {"thread_id": "user_bob"}}
agent.invoke({"messages": [...]}, config_bob)

# 两个会话完全独立
```

**生产环境场景 2：同一用户的不同任务**

```python
# 任务 1：写代码
config_task1 = {"configurable": {"thread_id": "task_coding"}}
agent.invoke({"messages": [...]}, config_task1)

# 任务 2：写文档
config_task2 = {"configurable": {"thread_id": "task_docs"}}
agent.invoke({"messages": [...]}, config_task2)
```

#### 2.1.4 工作原理

InMemorySaver 保存的是 `thread_id` 与 `messages` 的映射，并且会自动追加历史：

```python
agent.invoke({"messages": [{"role": "user", "content": "你好"}]}, config)
# InMemorySaver 保存：
# {
#     "thread_id": "xxx",
#     "messages": [
#         HumanMessage("你好"),
#         AIMessage("你好！有什么可以帮助你的吗？")
#     ]
# }

agent.invoke({"messages": [{"role": "user", "content": "天气"}]}, config)
# InMemorySaver 更新：
# {
#     "thread_id": "xxx",
#     "messages": [
#         HumanMessage("你好"),
#         AIMessage("你好！有什么可以帮助你的吗？"),
#         HumanMessage("天气"),
#         AIMessage("...")
#     ]
# }
```

此时 checkpointer 会自动：① 读取之前的历史；② 追加新消息；③ 调用模型（传入完整历史）；④ 保存新的历史。

#### 2.1.5 常见问题

**1、为什么 Agent 不记得？**

检查：是否添加了 `checkpointer=InMemorySaver()`？是否传入了 `config` 参数？两次调用的 `thread_id` 是否相同？

```python
# ❌ 错误：没有 checkpointer
agent = create_agent(model=model, tools=[])
agent.invoke({...})  # 不会记住

# ❌ 错误：没有 config
agent = create_agent(model=model, tools=[], checkpointer=InMemorySaver())
agent.invoke({...})  # 不会记住

# ❌ 错误：thread_id 不同
agent.invoke({...}, config={"configurable": {"thread_id": "1"}})
agent.invoke({...}, config={"configurable": {"thread_id": "2"}})  # 不同会话

# ✅ 正确
agent = create_agent(model=model, tools=[], checkpointer=InMemorySaver())
config = {"configurable": {"thread_id": "1"}}
agent.invoke({...}, config)
agent.invoke({...}, config)  # 记得！
```

**2、InMemorySaver 会丢失数据吗？**

会！InMemorySaver 只保存在内存中：

- 同一进程内有效（不支持跨进程共享）
- 程序/进程重启后丢失
- 不同进程无法共享

解决方案：持久化（SQLite、PostgreSQL）。

**3、内存会无限增长吗？**

会！默认情况下 InMemorySaver 会保存所有消息，带来问题：

- 消息越来越多（无限增长，需要管理上下文）
- token 消耗增加，甚至会超过模型的 token 限制
- 响应速度变慢、成本增加

解决方案：上下文管理（裁剪、摘要）。

**4、如何清空某个会话的历史？**

目前 InMemorySaver 没有提供删除 API。临时方案：使用新的 `thread_id`，或重新创建 Agent。

### 2.2 基于外部存储介质的持久化器

如果将状态检查点（checkpointer）保存在内存，进程结束则状态丢失，生产环境不可接受。因此生产环境要用持久化的外部存储介质，如 PostgreSQL。LangGraph 提供的 checkpointer 后端列表见：

<https://docs.langchain.com/oss/python/langgraph/persistence#checkpointer-libraries>

#### 2.2.1 数据库环境准备

先在云服务器的 Ubuntu 系统安装 PostgreSQL，具体安装见课件 02-资料下的《Linux 云服务器安装与 PostgreSQL 安装》。URL 中的用户名、密码、IP 地址需根据自己情况替换：

```text
postgresql://langchain_user:abcd1234@118.195.128.47:5432/langchain_db?sslmode=disable
```

对接 PostgreSQL 还需要额外依赖，课程开始的 `requirements.txt` 已提供，不必重复安装：

```bash
pip install langgraph-checkpoint-postgres
```

#### 2.2.2 代码实现

```python
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langgraph.checkpoint.postgres import PostgresSaver

DB_URL = "postgresql://langchain_user:abcd1234@118.195.128.47:5432/langchain_db?sslmode=disable"

with PostgresSaver.from_conn_string(DB_URL) as checkpointer:
    # 初始化PostgreSQL数据库
    checkpointer.setup()
    agent = create_agent(
        model=model,
        checkpointer=checkpointer
    )
    config = {"configurable": {"thread_id": "1"}}

    response1 = agent.invoke(
        {"messages": [HumanMessage("你好，我是老王")]},
        config=config
    )
    print("=" * 30, "-> 第一次调用 <-", "=" * 30)
    for msg in response1["messages"]:
        msg.pretty_print()

    response2 = agent.invoke(
        {"messages": [HumanMessage("你好，我是谁？")]},
        config=config
    )
    print("=" * 30, "-> 第二次调用 <-", "=" * 30)
    for msg in response2["messages"]:
        msg.pretty_print()
```

输出（两次调用累积）：

```text
-> 第一次调用 <-
Human Message: 你好，我是老王
Ai Message: 你好，老王！很高兴认识你。有什么我可以帮你的？
-> 第二次调用 <-
Human Message: 你好，我是老王
Ai Message: 你好，老王！很高兴认识你。有什么我可以帮你的？
Human Message: 你好，我是谁？
Ai Message: 你是老王。
```

`setup()` 用于初始化 PostgreSQL 数据库，首次运行会创建必要的表，重复执行不会重新建表，底层逻辑是 `Create If Not Exists`：

```python
def setup(self) -> None:
    """Set up the checkpoint database asynchronously.

    This method creates the necessary tables in the Postgres database if they
    don't already exist and runs database migrations. It MUST be called directly
    by the user the first time checkpointer is used.
    """
    ...
```

#### 2.2.3 查看持久化数据

PostgreSQL 的存储结构是 `Database -> Schema -> Table`。

```bash
ubuntu@VM-0-6-ubuntu:~$ psql "postgresql://langchain_user:abcd1234@localhost:5432/langchain_db?sslmode=disable"
psql (16.13 (Ubuntu 16.13-0ubuntu0.24.04.1))
Type "help" for help.
langgraph_db=>
```

**需求 1：查看所有数据库（`\l`）**

| Name | Owner | Encoding | Collate | Ctype |
| --- | --- | --- | --- | --- |
| langgraph_db | langgraph_user | UTF8 | C.UTF-8 | C.UTF-8 |
| postgres | postgres | UTF8 | C.UTF-8 | C.UTF-8 |
| template0 | postgres | UTF8 | C.UTF-8 | C.UTF-8 |
| template1 | postgres | UTF8 | C.UTF-8 | C.UTF-8 |

**需求 2：查看所有 schema（`\dn`）**

| Name | Owner |
| --- | --- |
| public | pg_database_owner |

**需求 3：查看当前所处 schema**

```text
langgraph_db=> select current_schema();
 current_schema
----------------
 public
(1 row)
```

**需求 4：查看当前 schema 下的所有表（`\dt`）**

| Schema | Name | Type | Owner |
| --- | --- | --- | --- |
| public | checkpoint_blobs | table | langgraph_user |
| public | checkpoint_migrations | table | langgraph_user |
| public | checkpoint_writes | table | langgraph_user |
| public | checkpoints | table | langgraph_user |

这四张表都是 `setup()` 函数初始化时创建的：

- `checkpoints`：主表，存每个 thread 在某个时刻的 checkpoint 快照。
- `checkpoint_blobs`：存不适合直接内联进 `checkpoints.checkpoint` 的较复杂 channel 值。
- `checkpoint_writes`：存中间写入 / pending writes，不是最终完整 checkpoint。
- `checkpoint_migrations`：迁移版本表，不是业务数据表。

### 2.3 对比两种方式

**举例 1：基于内存存储**

每次运行创建新的 `InMemorySaver()`，没有更改 `thread_id` 却看不到上次运行的状态，是因为每次运行创建新的 Saver()，历史 State 被丢弃了。

**举例 2：基于外部存储器存储**

```python
with PostgresSaver.from_conn_string(DB_URL) as checkpointer:
    checkpointer.setup()
    agent = create_agent(model=model, checkpointer=checkpointer)
    config = {"configurable": {"thread_id": "3"}}
    # ... 多次 invoke，输出省略
```

根据输出判断，状态是累积的。即便重新创建 Saver()，只要 `thread_id` 一致，历史状态就可以和当前调用串联起来。

**总结：**

1. `InMemorySaver()` 将状态持久化到内存，进程结束或重建 Saver() 则历史状态丢失。
2. 基于外部存储介质（如 PostgreSQL）的持久化器，其存储的状态不会随进程终止而丢失，只要不显式删除历史状态，即可通过 `thread_id` 加载历史状态。

### 2.4 记忆治理策略（上下文管理）

随着对话进行，历史消息不断累积，state 会持续增长，为模型带来挑战：

1. LLM 的上下文窗口有限，完整历史可能无法装入，导致上下文丢失或错误。
2. 即便上下文窗口够大，多数 LLM 在长上下文场景仍表现不佳，会被陈旧或离题的内容“分散注意力”。
3. 同时会带来高昂的 token 花费。

因此需要对上下文进行管理：对历史记录进行压缩、清理、重组等。

#### 2.4.1 消息裁剪

调用模型前裁剪上下文。目标是控制 token 用量，通常保留系统初始消息和最近若干消息，或按 token 数保留末尾内容。适合成本敏感、对旧上下文依赖不强的场景。

```python
from langchain_core.messages import HumanMessage
from langchain.messages import RemoveMessage
from langgraph.graph.message import REMOVE_ALL_MESSAGES
from langgraph.checkpoint.memory import InMemorySaver
from langchain.agents import create_agent, AgentState
from langchain.agents.middleware import before_model
from langgraph.runtime import Runtime
from langchain_core.runnables import RunnableConfig
from typing import Any

@before_model
def trim_messages(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    messages = state["messages"]
    if len(messages) <= 3:
        return None
    first_msg = messages[0]
    recent_messages = messages[-3:] if len(messages) % 2 == 0 else messages[-4:]
    new_messages = [first_msg] + recent_messages
    return {
        "messages": [
            RemoveMessage(id=REMOVE_ALL_MESSAGES),
            *new_messages
        ]
    }

agent = create_agent(
    model=model,
    middleware=[trim_messages],
    checkpointer=InMemorySaver(),
)
config: RunnableConfig = {"configurable": {"thread_id": "1"}}
agent.invoke({"messages": [HumanMessage("你好，我是老王")]}, config)
agent.invoke({"messages": [HumanMessage("从现在起，你叫小王")]}, config)
agent.invoke({"messages": [HumanMessage("今天天气不错")]}, config)
final_response = agent.invoke({"messages": [HumanMessage("告诉我，你是谁？我是谁？")]}, config)
for msg in final_response["messages"]:
    msg.pretty_print()
```

连续 4 次 invoke 时内存里发生的变化：

| 步骤 | 触发动作 | 触发前 messages 长度 | trim_messages 是否触发 | 最终传给 LLM 的内容 |
| --- | --- | --- | --- | --- |
| 1 | invoke("你好，我是老王") | 1 | 不触发（长度≤3） | [H: 你好，我是老王] |
| 2 | invoke("从现在起，你叫小王") | 3 | 不触发（长度≤3） | [H, A1, H: 从现在起] |
| 3 | invoke("今天天气不错") | 5 | 触发裁剪（5 为奇数取后 4 条） | [H: 你好，我是老王（第一条）, A1, H: 从现在起, A2, H: 今天天气] |
| 4 | invoke("告诉我，你是谁？我是谁？") | 7 | 触发裁剪（7 为奇数取后 4 条） | [H: 你好，我是老王（第一条）, A2, H: 今天, A3, H: 告诉我] |

假设有 5 条消息 `[H1, A1, H2, A2, H3]`（总数 5，奇数），执行 `messages[-4:]` 取出 `[A1, H2, A2, H3]`，加上第一条 H1，最终大模型看到 `[H1, A1, H2, A2, H3]`。显然裁剪生效了。

#### 2.4.2 消息删除

消息裁剪强调“在模型调用前裁剪消息列表，控制模型可以看到的上下文范围”，而消息删除强调“模型调用完成后将某些消息从消息列表中移除”，永久更改状态。适合明确要遗忘、清理、重置某些历史。

```python
from langchain.messages import RemoveMessage
from langchain.agents import create_agent, AgentState
from langchain.agents.middleware import after_model
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.runtime import Runtime
from langchain_core.runnables import RunnableConfig

@after_model
def delete_old_messages(state: AgentState, runtime: Runtime) -> dict | None:
    messages = state["messages"]
    # 保持最近的 5 条消息
    if len(messages) > 5:
        # 框架中通常使用 RemoveMessage 来标记删除，并返回更新状态。
        to_delete = len(messages) - 5
        return {"messages": [RemoveMessage(id=m.id) for m in messages[:to_delete]]}
    return None

agent = create_agent(
    model=model,
    middleware=[delete_old_messages],
    checkpointer=InMemorySaver()
)
config: RunnableConfig = {"configurable": {"thread_id": "1"}}
agent.invoke({"messages": "你好，我是老王"}, config)
agent.invoke({"messages": "从现在起，你叫小王"}, config)
agent.invoke({"messages": "今天天气不错"}, config)
final_response = agent.invoke({"messages": "告诉我，你是谁？我是谁？"}, config)
for msg in final_response["messages"]:
    msg.pretty_print()
```

说明：只要消息总数超过 5 条，就计算超出几条（`to_delete`），精准地删掉最老的那几条，使剩下的消息总数永远保持在 5 条。

分析消息列表 `messages` 的数量变化：

- **第一轮**：用户说“你好，我是老王”（第 1 条），AI 回复“你好，老王！”（第 2 条）。此时 `len(messages) == 2`，中间件不触发。
- **第二轮**：用户说“从现在起，你叫小王”（第 3 条），AI 回复“好的，我是小王。”（第 4 条）。此时 `len(messages) == 4`，中间件不触发。
- **第三轮**：用户说“今天天气不错”（第 5 条），AI 回复（第 6 条）。此时 `len(messages) == 6`，触发中间件：`to_delete = 6 - 5 = 1`，删除最老的第 1 条消息。
- **第四轮（最终提问）**：用户输入“告诉我，你是谁？我是谁？”（第 7 条）。模型读取留存的 5 条历史 + 新提问，仍能推断出用户叫老王。回复后 `len(messages) == 8`，再次触发：`to_delete = 8 - 5 = 3`，删除最老的前 3 条，剩余精准保持最后 5 条。

**RemoveMessage 到底干了什么？**

当中间件返回 `[RemoveMessage(id=m.id)]` 时，实际上向框架发送了一个删除指令，底层处理逻辑：

1. **追加“墓碑”标记**：框架收到 `RemoveMessage(id="1")` 后，不会在内存数组里删掉 `id="1"` 的对象，而是把 RemoveMessage 作为一条新记录追加到当前线程的状态历史中，就像一块“墓碑”。
2. **运行时过滤合并（Reducer）**：下一次调用 `agent.invoke` 或模型读取上下文时，框架的内置合并器把“原始消息”和“墓碑标记”放在一起计算，在丢给大模型之前自动把被标记删除的消息过滤掉。

```text
[历史消息池 (内存中持续存在)]
├── Message(id="1", content="你好，我是老王")
├── Message(id="2", content="...")
└── RemoveMessage(id="1") <-- 这是一个新追加进去的"墓碑"标记
```

#### 2.4.3 摘要

把早期历史压缩成摘要，再替换原始消息。消息裁剪和删除都会导致上下文缺失，影响回答质量和用户体验；摘要是更适合长会话的折中方案：保语义，不保原文。官方推荐内置 `SummarizationMiddleware`。

```python
from langchain.agents.middleware import SummarizationMiddleware
from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver

# 创建带摘要中间件的 Agent
agent = create_agent(
    model=model_out,
    tools=[],
    checkpointer=InMemorySaver(),
    middleware=[
        SummarizationMiddleware(
            model=model_in,
            trigger=[
                ("tokens", 100),  # 超过 100 tokens 就摘要
            ],
            keep=("messages", 2),
            summary_prompt="对历史消息摘要，消息列表如下\n{messages}",
        )
    ]
)
config = {"configurable": {"thread_id": "1"}}

conversations = [
    "我叫张三，是工程师。这里是一段非常长非常长的废话..." * 20,  # 强制撑爆 100 tokens
    "请总结一下我的信息"
]
for msg in conversations:
    response = agent.invoke(
        {"messages": [{"role": "user", "content": msg}]},
        config=config
    )
    for msg in response["messages"]:
        msg.pretty_print()
    print("*" * 50)
```

工作原理：

```text
对话历史: [消息1, 消息2, ..., 消息20] (超过 100 tokens)
↓
SummarizationMiddleware 自动触发
↓
摘要旧消息: "用户是张三，在北京工作，喜欢编程..."
↓
新历史: [摘要, 最近消息] (减少到 100 tokens)
```

**常见问题：**

1. **摘要会丢失信息吗？** 会有一些细节丢失，但重要信息会保留（姓名、关键事实），最近的消息完整保留，对大部分场景足够。
2. **设置最大 token 数触发摘要的标准？** 按模型上下文窗口预留余量，例如 4k 窗口设 3000、8k 设 6000、16k 设 12000，留一些余量给工具调用和系统提示。
3. **摘要成本高吗？** 摘要只在超过阈值时触发，可用便宜模型（如 gpt-4o-mini），相比传输全部历史通常更便宜。
4. **摘要触发频率要关注吗？** 要关注，根据监控调整阈值：频繁触发就提高阈值，从不触发就降低阈值。

#### 2.4.4 自定义过滤策略

通过中间件可以随意更改消息列表，因此可以实现任意的过滤策略，此处不再演示。

### 2.5 了解：state 的理解

state 是 agent 底层有状态运行图的状态信息，是 `AgentState` 类型的实例。`AgentState` 是 `TypedDict` 的子类，可以按字典的读写方式访问实例元素。

```python
class AgentState(TypedDict, Generic[ResponseT]):
    """State schema for the agent."""
    messages: Required[Annotated[list[AnyMessage], add_messages]]
    jump_to: NotRequired[Annotated[JumpTo | None, EphemeralValue, PrivateStateAttr]]
    structured_response: NotRequired[Annotated[ResponseT, OmitFromInput]]
```

三个字段：

- `messages`：截止到当前节点的历史会话消息记录，标记为 `Required`。
- `jump_to`：表示跳转至运行图的指定节点，标记为 `NotRequired`，可为 None。
- `structured_response`：结构化输出内容，启用结构化输出时记录在此。

举例（结构化输出 + 跳转工具节点）：

```python
from langchain.agents import create_agent
from langchain.agents.middleware import AgentState, before_model, wrap_tool_call, after_agent
from langchain.tools.tool_node import ToolCallRequest
from langchain.messages import HumanMessage, AIMessage, ToolMessage
from langchain.tools import tool
from langgraph.runtime import Runtime
from pydantic import BaseModel, Field

class WeatherInfo(BaseModel):
    """城市天气情况"""
    city: str = Field(description="城市名称")
    temperature: str = Field(description="气温")
    desc: str = Field(description="当日天气概述")

@tool(parse_docstring=True)
def get_weather(city: str):
    """
    获取当日天气
    Args:
        city: 城市名称
    """
    return f"[{city}] 今天气温9~16度，万里无云，天气不错适合外出"

@before_model(can_jump_to=["tools"])
def direct_tool_call(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    last_msg = state["messages"][-1]
    if isinstance(last_msg, HumanMessage) and "天气" in last_msg.text and "北京" in last_msg.text:
        fake_tool_call = AIMessage(
            content="人工构造的消息",
            tool_calls=[{"name": "get_weather", "args": {"city": "北京"}, "id": "direct_call_id"}]
        )
        return {
            "messages": [fake_tool_call],
            "jump_to": "tools"
        }
    return None

@after_agent
def final_check(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    for msg in state["messages"]:
        msg.pretty_print()
    print(f"{state.get('jump_to', None) = }")
    print(f"{state.get('structured_response', None) = }")
    return None

agent = create_agent(
    model=model,
    response_format=WeatherInfo,
    middleware=[direct_tool_call, final_check],
    tools=[get_weather],
)
response = agent.invoke({
    "messages": [HumanMessage("请帮我查询北京当日天气")]
})
```

输出关键部分：

```text
request.state.get("jump_to", None) = 'tools'
request.state.get("structured_response", None) = None
...
Ai Message: {"city":"北京","temperature":"9~16℃","desc":"万里无云，天气不错适合外出"}
state.get("jump_to", None) = None
state.get("structured_response", None) = WeatherInfo(city='北京', temperature='9~16℃', desc='万里无云，天气不错适合外出')
```

分析：

1. 在模型调用之前通过 `jump_to` 直接跳转至工具节点。
2. 在工具调用前打印状态信息，此时 `jump_to` 非空。
3. 在 Agent 执行完毕后打印状态信息，此时 `structured_response` 非空而 `jump_to` 为空。

## 三、长期记忆

### 3.1 基本理解

#### 3.1.1 什么是长期记忆

短期记忆记录的是会话级别（线程，Thread）的数据，会话间不共享。长期记忆记录的是用户特定或应用级别的数据，任何会话都可以随时访问。例如：

- 你喜欢简短回答
- 你偏好 Python
- 某个用户是 VIP
- 某个流程过去怎么做效果更好

这类信息不属于某一条聊天，而属于“用户/组织/应用本身”。

#### 3.1.2 类型划分

LangChain 参考 CoALA paper 将长期记忆划分为三类：

| Memory Type | 存什么 |
| --- | --- |
| Semantic（语义记忆） | 事实 |
| Episodic（情景记忆） | 经验 |
| Procedural（程序性记忆） | 规则/做事方法 |

- **Semantic Memory（语义记忆）**：即“事实类记忆”，记录事实/用户偏好/概念，如用户喜欢简洁回答、用户常用中文、某个公司属于哪个行业。
- **Episodic Memory（情景记忆）**：即“经验类记忆”，记录 Agent 过去执行的动作，如过去某个任务是怎么成功的、某种用户输入下怎样回答效果最好。在 Agent 里常表现为 few-shot examples（少样本示例）：不直接告诉模型规则，而是给它看几个“输入 -> 输出”的例子让它照着学。
- **Procedural Memory（程序性记忆）**：即“规则/做事方法”，如 Agent 的系统提示词、Agent 的工作流程、工具调用规则。

#### 3.1.3 存储架构

长期记忆的存储是 `store -> namespace -> key -> value` 的四层架构：

- **第 1 层：Store（记忆仓库）**，是 `langgraph.store.base.BaseStore` 的子类实例，由 LangGraph 提供。常用实现：`InMemoryStore`（内存，适合测试）、`PostgresStore`（PostgreSQL，适合生产）。
- **第 2 层：Namespace（命名空间）**，由任意长度的 `tuple[str, ...]` 表示的层级路径，作用像“文件路径/文件夹层级”，用于分组和隔离，数据类型为字符串元组。
- **第 3 层：Key（键）**，该 namespace 下的唯一标识，数据类型为字符串 `str`。
- **第 4 层：Value（值）**，存储的值，数据类型为字典 `dict[str, Any]`。

举例：

```python
namespace = ("users", "user_123", "preferences")  # 元组类型
key = "profile"                                    # 字符串类型
value = {                                          # 字典类型
    "language": "zh-CN",
    "style": "short_direct",
    "likes": ["python", "rag"]
}
store.put(namespace, key, value)
```

同一个 AI 应用通常会为每个独立会话维护各自的短期状态 State，而长期记忆通常共享同一个 Store 实例，再通过 namespace 区分不同用户、组织、业务域或会话相关数据：

```text
AI应用
├─ thread_id = t1 -> state_1
│   ├─ messages = [...]
│   ├─ current_intent = "travel_planning"
│   └─ collected_slots = {"destination": "北京"}
├─ thread_id = t2 -> state_2
│   └─ ...
└─ shared store
    ├─ namespace = (user_1, "memories")
    │   ├─ key = "profile"  -> value = {"name": "张三", "city": "上海", ...}
    │   ├─ key = "travel_preference" -> value = {"favorite_cities": ["北京", "杭州"], ...}
    │   └─ key = "writing_style" -> value = {"tone": "professional", ...}
    └─ namespace = (user_2, "memories")
        └─ ...
```

### 3.2 基础 API 的使用

LangChain 1.2.x 的长期记忆基于 store 持久化数据，相关 API 有：`put()`（写入）、`get()`（读取）、`search()`（检索）。我们可以在 Agent 执行流程之外直接访问长期记忆。

#### 3.2.1 put()/get()：写入/读取 API

**① put() 源码剖析**

```python
def put(
    self,
    namespace: tuple[str, ...],
    key: str,
    value: dict[str, Any],
    index: Literal[False] | list[str] | None = None,
    *,
    ttl: float | None | NotProvided = NOT_PROVIDED,
) -> None:
```

参数说明：

- `namespace`：文档所在的层级路径。
- `key`：该路径下的唯一键。
- `value`：要保存的 JSON-like 字典。
- `index`：控制语义检索索引。`None`（默认）使用 store 初始化时的索引配置；`False` 不为该 item 建语义索引；`list[str]` 只对指定字段路径建索引。
- `ttl`：可选，过期时间，是否支持取决于具体 store 实现。

**② get() 源码剖析**

按照 `namespace + key` 精确查询，返回的不止是 value，而是完整对象——LangGraph 底层将数据封装为 `Item` 对象。

```python
def get(
    self,
    namespace: tuple[str, ...],
    key: str,
    *,
    refresh_ttl: bool | None = None,
) -> Item | None:
```

参数说明：`namespace` 为层级路径；`key` 为唯一键；`refresh_ttl` 是否刷新当前 item 的 ttl，默认 None 表示采用创建 store 对象时指定的同名配置。

**③ 举例 1：基于 InMemoryStore**

```python
from langgraph.store.memory import InMemoryStore

store = InMemoryStore()
namespace = ("users",)
user_id = 'user-1'
username = "小蓝"
store.put(namespace, user_id, {"name": username})
print(store.get(namespace, user_id))
```

```text
Item(namespace=['users'], key='user-1', value={'name': '小蓝'},
     created_at='2026-06-11T15:20:52.542493+00:00', updated_at='2026-06-11T15:20:52.542494+00:00')
```

更新同一条数据：

```python
store.put(namespace, user_id, {"name": '小红'})
print(store.get(namespace, user_id))
```

```text
Item(namespace=['users'], key='user-1', value={'name': '小红'},
     created_at='2026-06-11T15:23:11.283981+00:00', updated_at='2026-06-11T15:23:11.283982+00:00')
```

注意到 Item 对象新增了 `created_at` 和 `updated_at` 字段。对于当前版本，InMemoryStore 每次 put 都会创建新的 Item 对象（无论 namespace 和 key 是否相同），所以两者始终一致。

**④ 举例 2：基于 PostgresStore**

PostgresStore 更改数据的逻辑是 update 而非覆盖，因此 `created_at` 固定为 Item 创建时间，`updated_at` 为更新时间，二者可能不同：

```python
from langgraph.store.postgres import PostgresStore

namespace = ("users",)
user_id = "user-11"
DB_URL = "postgresql://langchain_user:abcd1234@118.195.128.47:5432/langchain_db?sslmode=disable"

with PostgresStore.from_conn_string(DB_URL) as store:
    store.setup()
    store.put(namespace, user_id, {"name": "小蓝"})
    print(store.get(namespace, user_id))
```

更新后：

```text
Item(namespace=['users'], key='user-11', value={'name': '小红'},
     created_at='2026-06-11T23:24:31.132342+08:00', updated_at='2026-06-11T23:26:11.956257+08:00')
```

可以看到 `created_at` 没变，`updated_at` 更改了。

#### 3.2.2 search()：检索 API

**① 源码剖析**

```python
def search(
    self,
    namespace_prefix: tuple[str, ...],
    /,
    *,
    query: str | None = None,
    filter: dict[str, Any] | None = None,
    limit: int = 10,
    offset: int = 0,
    refresh_ttl: bool | None = None,
) -> list[SearchItem]:
```

参数说明：

- `namespace_prefix`：命名空间前缀，在该前缀下搜索。
- `query`：语义检索时用于查询的自然语言。
- `filter`：过滤条件，value 中的键值对组合。
- `limit`：可返回 item 的最大条数，效果等同 SQL 中的 limit。
- `offset`：返回结果之前跳过的 item 数量。

支持两种检索方式：按 `filter` 做结构化过滤（用 value 中的键值筛选）；按 `query` 做语义相似度检索（需将输入转换为向量）。返回匹配的 `SearchItem` 列表，并携带匹配分数等检索元信息。

**② 举例 1：按照 namespace 前缀搜索**

准备 store（本节基于 InMemoryStore 测试）：

```python
from langgraph.store.memory import InMemoryStore

store = InMemoryStore()
namespace1 = ("users", "Alice", "memories")
key1 = 'preferences'
value1 = {"course": "计算机组成原理", "sports": "跑步", "food": "紫光园奶皮子酸奶"}
namespace2 = ("users", "Bob", "memories")
key2 = 'preferences'
value2 = {"course": "数字电路与模拟电路", "sports": "跑步", "food": "奶皮子糖葫芦"}
namespace3 = ("users", "Black", "memories")
key3 = 'preferences'
value3 = {"course": "数字电路与模拟电路", "sports": "羽毛球", "food": "紫光园奶皮子酸奶"}
store.put(namespace1, key1, value1)
store.put(namespace2, key2, value2)
store.put(namespace3, key3, value3)
```

按前缀 `("users",)` 搜索会返回全部三条；按 `("users", "Alice")` 搜索只返回 Alice 一条。

**③ 举例 2：按照 filter 过滤**

```python
for item in store.search(("users",), filter={"food": "紫光园奶皮子酸奶"}):
    print(item)
```

按 `food`、`sports`、`course` 等 value 键值均可过滤，返回匹配项。

**④ 举例 3：按照语义搜索**

自定义嵌入函数（目的是查看嵌入向量）：

```python
# 自定义嵌入函数
def embed(text: list[str]) -> list[list[float]]:
    return [[1.0] * 6 for _ in range(len(text))]

index_config = {
    "embed": embed,
    "dims": 6,
    "fields": ["$", "course"]
}
store = InMemoryStore(index=index_config)
# ... put 数据后
for item in store.search(("users",), query="数电模电"):
    print(item)
```

`IndexConfig` 源码：

```python
class IndexConfig(TypedDict, total=False):
    dims: int
    embed: Embeddings | EmbeddingsFunc | AEmbeddingsFunc | str
    fields: list[str] | None
```

- `embed`：将输入文本转换为向量的嵌入函数，可以是自定义函数或嵌入模型对象。
- `dims`：输出向量维度。
- `fields`：用于计算向量的属性列表（指 value 中的 key），取值：`["$"]` 将 value 整体嵌入；`["field1", "field2"]` 指定某个一级字段；`["parent.child"]` 从嵌套对象获取子字段；`["array[*].field"]` 从 JSON 数组每个对象获取子字段。四种形式可同时出现。

也可以使用嵌入模型：

```python
from langgraph.store.memory import InMemoryStore
from langchain.embeddings import init_embeddings

embedding_model = init_embeddings(
    model="openai:text-embedding-3-large",
    api_key=os.getenv("CLOSEAI_API_KEY"),
    base_url=os.getenv("CLOSEAI_BASE_URL"),
)
index_config = {
    "embed": embedding_model,
    "dims": 3072,   # text-embedding-3-large 的嵌入维度
    "fields": ["$"]
}
store = InMemoryStore(index=index_config)
```

注意：如果只指定 `query`，返回的是所有 namespace 前缀满足要求的 item，底层按向量相似度计算 score 并降序排列，可结合 `limit` 或 `filter` 限制条数。

### 3.3 在 Agent 运行图中访问长期记忆

我们可以在工具或中间件中访问长期记忆。

#### 3.3.1 在工具中访问长期记忆

**① 基于 InMemoryStore**

```python
from langchain_core.messages import HumanMessage
from typing import NotRequired
from langchain.agents import create_agent, AgentState
from langchain.tools import tool, ToolRuntime
from langgraph.store.memory import InMemoryStore

store = InMemoryStore()

class CustomState(AgentState):
    user_id: NotRequired[str]

@tool(parse_docstring=True)
def save_user_info(name: str, runtime: ToolRuntime) -> str:
    """
    将用户信息保存在长期记忆中
    Args:
        name: 用户名
    Returns:
        str: 保存状态
    """
    runtime.store.put(("users",), runtime.state["user_id"], {"name": name})
    return "saved"

@tool(parse_docstring=True)
def get_user_info(runtime: ToolRuntime) -> str:
    """
    从长期记忆中读取用户信息
    Returns:
        str: 用户信息
    """
    item = runtime.store.get(("users",), runtime.state["user_id"])
    return str(item.value) if item else "unknown"

agent = create_agent(
    model=model,
    tools=[save_user_info, get_user_info],
    store=store,
    system_prompt="用户提及个人信息时及时记录，用户询问个人信息时尝试用工具检索",
    state_schema=CustomState,
)

response1 = agent.invoke({
    "messages": [HumanMessage("你好，很高兴认识你，我是小花")],
    "user_id": "user-1"
})
response2 = agent.invoke({
    "messages": [HumanMessage("我是谁")],
    "user_id": "user-1"
})
```

其中 `CustomState` 扩展了 Agent 标准状态，额外增加 `user_id` 字段，让 Agent 运行中随时知道当前用户 ID。两次 invoke 没有通过 config 串联，是两个独立会话，但第二个会话可以访问第一个会话写入长期记忆的内容——最终回答“你是小花”。

**② 基于 PostgresStore**

将上面的 `InMemoryStore` 换成 `PostgresStore` 即可：

```python
from langgraph.store.postgres import PostgresStore

DB_URI = "postgresql://langchain_user:abcd1234@118.195.128.47:5432/langchain_db?sslmode=disable"

with PostgresStore.from_conn_string(DB_URI) as store:
    store.setup()
    agent = create_agent(
        model=model,
        tools=[save_user_info, get_user_info],
        store=store,
        system_prompt="用户提及个人信息时及时记录，用户询问个人信息时尝试用工具检索",
        state_schema=CustomState,
    )
    # ... invoke
```

查看 PostgreSQL 数据表（`\dt`）会新增两张 Store 相关的表 `store` 和 `store_migrations`：

| Schema | Name | Type | Owner |
| --- | --- | --- | --- |
| public | checkpoint_blobs | table | langgraph_user |
| public | checkpoint_migrations | table | langgraph_user |
| public | checkpoint_writes | table | langgraph_user |
| public | checkpoints | table | langgraph_user |
| public | store | table | langgraph_user |
| public | store_migrations | table | langgraph_user |

#### 3.3.2 在中间件中访问长期记忆

**① Node-style hooks 中访问**

以 `before_model` 为例，其钩子函数签名：

```python
def before_model(self, state: StateT, runtime: Runtime[ContextT]) -> dict[str, Any] | None:
```

`Runtime` 定义（关键字段）：

```python
@dataclass
class Runtime(Generic[ContextT]):
    context: ContextT = field(default=None)
    """Static context for the graph run, like user_id, db_conn, etc."""
    store: BaseStore | None = field(default=None)
    """Store for the graph run, enabling persistence and memory."""
    stream_writer: StreamWriter = field(default=_no_op_stream_writer)
    previous: Any = field(default=None)
    ...
```

所以可通过 `runtime.store` 在中间件中访问长期记忆。

**② Wrap-style hooks 中访问**

`wrap_model_call` 钩子函数签名：

```python
def wrap_model_call(
    self,
    request: ModelRequest[ContextT],
    handler: Callable[[ModelRequest[ContextT]], ModelResponse[ResponseT]],
) -> ModelResponse[ResponseT] | AIMessage | ExtendedModelResponse[ResponseT]:
```

`ModelRequest` 中携带 `state`、`runtime`、`model`、`messages` 等字段，可通过 `request.runtime.store` 访问长期记忆。

`wrap_tool_call` 钩子函数签名：

```python
def wrap_tool_call(
    self,
    request: ToolCallRequest,
    handler: Callable[[ToolCallRequest], ToolMessage | Command[Any]],
) -> ToolMessage | Command[Any]:
```

`ToolCallRequest` 与 `ToolRuntime` 都携带 `runtime`，同样可通过 `request.runtime.store` 访问长期记忆。

### 3.4 何时写入记忆

官方介绍两种方式：

**1. 在主流程里写（hot path）**

用户发消息，AI 一边回答，一边决定要不要记下来。

- 优点：立即生效；下一轮马上能用；用户可感知，透明。
- 缺点：增加延迟；逻辑变复杂。

**2. 在后台写（background）**

先回答用户，记忆整理放到后台异步做。

- 优点：主流程更快；记忆逻辑更独立；更适合批量整理。
- 缺点：不能立刻生效；要决定多久整理一次；触发时机不好选。

工程上通常这么选：**用户偏好、账号资料**可热路径写；**对话摘要、经验沉淀、行为分析**更适合后台写。

## 四、课后阅读：Static runtime Context

静态运行时上下文（Static runtime Context）表示不可变的数据，如用户元数据、工具和传递给应用程序的数据库连接对象。通常在运行开始时通过 `invoke` / `stream` 的 `context` 参数传递，此类数据在运行期间不会更改。

### 4.1 中间件中访问

#### 4.1.1 Node-style hooks

此类钩子都通过 `runtime.context` 访问上下文对象。用户自定义 ContextSchema 用 `@dataclass` 修饰，在 Agent 创建时通过 `context_schema` 参数传递。

本例从长期记忆中查询用户额度，如果额度用尽则中断流程：

```python
from dataclasses import dataclass
from langchain.agents import create_agent
from langchain.agents.middleware import AgentMiddleware, AgentState, hook_config
from langchain.messages import AIMessage
from langgraph.runtime import Runtime
from langgraph.store.memory import InMemoryStore

store = InMemoryStore()
namespace = ("users", "credits")
key1 = 'Ada Lovelace'
value1 = {"tokens_credit_left": 5000, "user_level": 5}
key2 = 'Blackwell'
value2 = {"tokens_credit_left": 2999, "user_level": 5}
key3 = 'Ampere'
value3 = {"tokens_credit_left": 1000, "user_level": 5}
store.put(namespace, key1, value1)
store.put(namespace, key2, value2)
store.put(namespace, key3, value3)

@dataclass
class UserContext:
    username: str

class CheckCredit(AgentMiddleware):
    @hook_config(can_jump_to=["end"])
    def before_model(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        store = runtime.store
        context = runtime.context
        username = context.username
        credit = store.get(namespace, username)
        if not credit:
            return {"jump_to": "end", "messages": AIMessage("您尚未注册~")}
        if credit.value["tokens_credit_left"] < 3000:
            return {"jump_to": "end", "messages": AIMessage(f"{username}额度不足，请充值")}
        return None

    def after_model(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        username = runtime.context.username
        credit = runtime.store.get(namespace, username)
        usage_metadata = state["messages"][-1].usage_metadata
        token_usage = usage_metadata["input_tokens"] + usage_metadata["output_tokens"] * 6
        credit.value["tokens_credit_left"] -= token_usage
        runtime.store.put(namespace, username, credit.value)
        return None

agent = create_agent(
    model="deepseek-chat",
    middleware=[CheckCredit()],
    store=store,
    context_schema=UserContext
)

response1 = agent.invoke(
    {"messages": ["你好啊，你知道 Ada Lovelace 的贡献吗？"]},
    context=UserContext(username="Ada Lovelace")
)
response2 = agent.invoke(
    {"messages": ["你好啊，你知道 Blackwell 的贡献吗？"]},
    context=UserContext(username="Blackwell")
)
```

输出（关键部分）：Ada Lovelace 正常回答并扣减额度，Blackwell 因额度不足直接返回“Blackwell额度不足，请充值”。

#### 4.1.2 Wrap-style hooks

**① wrap_model_call**

本例通过 context 中记录的用户身份信息调整暴露给模型的工具集，使用 transient request update：

```python
from dataclasses import dataclass
from typing import Callable
from langchain.agents import create_agent
from langchain.agents.middleware import AgentMiddleware, ModelResponse, ModelRequest
from langchain.tools import tool
from langgraph.store.memory import InMemoryStore

store = InMemoryStore()
namespace = ("users", "credits")
key1 = 'Ada Lovelace'
value1 = {"tokens_left": 3000, "get_weather": "yes", "get_news": "no"}
key2 = 'Blackwell'
value2 = {"tokens_left": 2000, "get_weather": "no", "get_news": "yes"}
key3 = 'Ampere'
value3 = {"tokens_left": 3000, "get_weather": "yes", "get_news": "yes"}
store.put(namespace, key1, value1)
store.put(namespace, key2, value2)
store.put(namespace, key3, value3)

@tool
def get_weather(city: str):
    """查询指定城市当日天气"""
    return f"{city} 今天天气不错"

@tool()
def get_news():
    """查询当日新闻"""
    return "美伊尚未达成停战协议"

@dataclass
class UserContext:
    username: str

class CheckCredit(AgentMiddleware):
    def wrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], ModelResponse],
    ) -> ModelResponse:
        context = request.runtime.context
        store = request.runtime.store
        value = store.get(namespace, context.username).value
        tools = []
        for tool in request.tools:
            if value[tool.name] == "yes":
                tools.append(tool)
            else:
                logger.warning(f"{context.username} 无权调用 {tool.name}")
        # 更改调用请求携带的工具集，仅本次生效
        request = request.override(tools=tools)
        return handler(request)

agent = create_agent(
    model="deepseek-chat",
    middleware=[CheckCredit()],
    tools=[get_weather, get_news],
    store=store,
    context_schema=UserContext
)
```

输出：Ada Lovelace 只能查天气（无权 get_news），Blackwell 只能查新闻（无权 get_weather），Ampere 两者均可。

**② wrap_tool_call**

在上述案例基础上补充额度校验和长期记忆更新：

```python
CREDIT_MAP = {
    "get_weather": 10,
    "get_news": 20
}

class ToolGuard(AgentMiddleware):
    def wrap_tool_call(
        self,
        request: ToolCallRequest,
        handler: Callable[[ToolCallRequest], ToolMessage | Command[Any]],
    ) -> ToolMessage | Command[Any]:
        store = request.runtime.store
        username = request.runtime.context.username
        value = store.get(namespace, username).value
        tool_name = request.tool.name
        credits_cost = CREDIT_MAP.get(tool_name)
        credits_left = value["tokens_left"]
        if credits_left < credits_cost:
            logger.warning(f"{username} 额度不足，{tool_name} 调用失败！")
            return Command(
                update={
                    "messages": [
                        ToolMessage(
                            content="额度不足，无法调用工具，请充值~",
                            tool_call_id=request.runtime.tool_call_id
                        )
                    ]
                }
            )
        credits_left -= credits_cost
        value["tokens_left"] = credits_left
        store.put(namespace, username, value)
        return handler(request)

agent = create_agent(
    model="deepseek-chat",
    middleware=[CheckCredit(), ToolGuard()],
    tools=[get_weather, get_news],
    store=store,
    context_schema=UserContext
)
```

#### 4.1.3 特殊的便捷中间件 dynamic_prompt

`@dynamic_prompt` 底层实现机制和通用钩子函数统一，为动态提示词处理提供更便捷的入口。本例通过静态上下文携带的用户信息动态更改系统提示词：

```python
from dataclasses import dataclass
from langchain.agents import create_agent
from langchain.agents.middleware import dynamic_prompt, ModelRequest
from langgraph.store.memory import InMemoryStore

namespace = ("users", "preferences")
key1 = "Ada Lovelace"
value1 = {"chat_preferences": ["不喜欢啰嗦", "尽可能用最精简的文字解释清楚"]}
key2 = "Blackwell"
value2 = {"chat_preferences": ["喜欢长篇大论、引经据典", "不知道的东西要明确说'不知道'，不能胡编乱造"]}
store = InMemoryStore()
store.put(namespace, key1, value1)
store.put(namespace, key2, value2)

@dataclass
class UserContext:
    username: str

@dynamic_prompt
def personalized_prompt(request: ModelRequest) -> str:
    username = request.runtime.context.username
    store = request.runtime.store
    preferences = store.get(namespace, username).value["chat_preferences"]
    custom_prompt = f"# 用户偏好\n{'\n'.join(preferences)}"
    return custom_prompt

agent = create_agent(
    model="deepseek-chat",
    middleware=[personalized_prompt],
    store=store,
    context_schema=UserContext
)
```

`dynamic_prompt` 是动态更新本次调用前的系统提示词，并不会更改消息列表，所以模型输出会受提示词影响，但消息列表看不到相关提示词。

### 4.2 工具中访问

LangChain 底层生成工具 schema 时，如果参数类型注解是 pydantic 模型，也会被一并解析：

```python
from pydantic import BaseModel, Field
from typing import List
from langchain.tools import tool
from langgraph.prebuilt.tool_node import ToolRuntime
from langchain_core.utils.function_calling import convert_to_openai_tool

class UserInfo(BaseModel):
    username: str = Field(description="用户名")
    age: int = Field(description="年龄")
    hobbies: List[str] = Field(description="兴趣爱好")

@tool(parse_docstring=True)
def save_user_info(user_info: UserInfo, runtime: ToolRuntime) -> str:
    """
    保存用户信息
    Args:
        user_info: 用户信息对象
    """
    return "ok"

print(convert_to_openai_tool(save_user_info))
```

下面案例通过工具读写长期记忆中保存的用户信息：

```python
from dataclasses import dataclass
from langchain.agents import create_agent
from langchain.tools import tool
from langchain.messages import HumanMessage, SystemMessage
from langgraph.prebuilt.tool_node import ToolRuntime
from langgraph.store.memory import InMemoryStore
from langgraph.checkpoint.memory import InMemorySaver

@dataclass
class UserContext:
    user_id: str

store = InMemoryStore()
namespace = ("users", "user_info")

class UserInfo(BaseModel):
    username: str = Field(description="用户名", default="unknown")
    age: int = Field(description="年龄", default=0)
    hobbies: List[str] = Field(description="兴趣爱好", default_factory=list)

@tool(parse_docstring=True)
def read_user_info(runtime: ToolRuntime[UserContext, Any]) -> UserInfo | str:
    """读取用户信息，若找到返回 UserInfo 对象，否则返回空字符串。"""
    user_id = runtime.context.user_id
    item = runtime.store.get(namespace, user_id)
    if item:
        return UserInfo(**item.value)
    return ''

@tool(parse_docstring=True)
def write_user_info(user_info: UserInfo, runtime: ToolRuntime[UserContext, Any]) -> bool:
    """将用户信息写入长期记忆，成功返回 True，否则返回 False。"""
    user_id = runtime.context.user_id
    try:
        runtime.store.put(namespace, user_id, user_info.model_dump())
    except Exception as e:
        logger.error(e)
        return False
    return True

agent = create_agent(
    model="deepseek-chat",
    tools=[read_user_info, write_user_info],
    store=store,
    checkpointer=InMemorySaver(),
    context_schema=UserContext
)

config1 = {"configurable": {"thread_id": "thread_1"}}
config2 = {"configurable": {"thread_id": "thread_2"}}

agent.invoke(
    {"messages": [
        SystemMessage("如果输入包含用户信息，抽取并调用工具记录。在记录之前先查找历史信息，和新增信息合并后记录。如果用户提问涉及个人信息，调用工具查找"),
        HumanMessage("你好，我是韩立，我喜欢修仙")
    ]},
    context=UserContext(user_id='user_1'),
    config=config1
)
thread_1_response = agent.invoke(
    {"messages": ["我今年两百岁了，是你们口中的'元婴老怪'，我喜欢跑步"]},
    context=UserContext(user_id='user_1'),
    config=config1
)
thread_2_response = agent.invoke(
    {"messages": ["你还记得我吗？"]},
    context=UserContext(user_id='user_1'),
    config=config2
)
```

分析：

1. 前两次 invoke 通过相同的 `thread_id` 串联为一个会话，共享短期记忆。
2. `context` 是运行时静态配置，每次 invoke 互相独立。
3. 长期记忆可以在任意位置访问，全局共享同一份信息。
4. tool 参数列表中的 `ToolRuntime` 是 LangChain / LangGraph 运行时注入的，在工具 schema 中没有体现。
5. `ToolRuntime` 的默认泛型是 `[None, Any]`，第一个是 Context 泛型，第二个是 State 泛型。若不显式指定上下文类型，底层会认为上下文对象为 None，invoke 时传入 context 会抛警告，因此这里把 `UserContext` 作为第一个泛型传入。

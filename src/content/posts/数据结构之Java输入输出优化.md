---
title: "数据结构之Java输入输出优化"
published: 2026-03-31
description: "Scanner 与 BufferedReader 的性能对比与原因分析，竞赛刷题常用的 Java 快读快写技巧。"
tags: [数据结构, Java, 输入输出]
category: "数据结构"
draft: false
---

# Scanner 和 BufferedReader 对比

> **在10万整数的读入场景下BufferReader比Scanner快约5到8倍**
> **而在100万的整数读入场景下则快10倍以上**
> **纯字符的读入也快三到五倍**

**为什么快这么多？**

1. **缓冲大小**
   - `Scanner` 内部缓冲区默认 **1 KB**
   - `BufferedReader` 默认 **8 KB**，可手动更大
2. **解析逻辑**
   - `Scanner` 使用正则表达式分割、类型校验，**heavy parsing**
   - `BufferedReader` 只读原始字符，**手动 `Integer.parseInt`** 极简
3. **同步开销**
   - `Scanner` 额外同步、越界检查、类型转换
   - `BufferedReader` 只做系统调用 → 用户空间解析

**结论与使用建议：**

- 数据量小（几千以内）、图省事时用 `Scanner` 完全没问题；
- 数据量达到 10⁵ ~ 10⁶ 时务必改用 `BufferedReader` + `StringTokenizer`（按空白切分一行）+ `Integer.parseInt`，输出用 `BufferedWriter` 或 `PrintWriter`，大量输出记得最后 `flush()`；
- 频繁拼接输出时用 `StringBuilder` 攒起来一次性输出，减少 IO 次数，这一点在 Trie、并查集等大量查询的题目中提速明显。

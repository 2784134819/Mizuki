---
title: "算法入门之KMP算法"
published: 2026-03-12
description: "KMP 字符串匹配算法详解，从朴素做法出发引出 next 跳转表，说明如何利用已匹配的信息避免重复比较。"
tags: [算法入门, KMP, 字符串]
category: "算法入门"
draft: false
---



# kmp

## 概念详解

> **KMP 算法**（Knuth-Morris-Pratt）是字符串匹配领域的经典算法。它解决的问题是：给定主串 S 和模式串 P，找出 P 在 S 中出现的所有位置。它的核心价值在于：**当模式串与主串匹配失败时，利用已经匹配过的信息，避免从头开始比较。**
>
> 通俗点说，KMP 就是“不走回头路”。
>
> **为什么朴素做法慢？** 朴素匹配用双循环：外层枚举主串的起点 i，内层逐字符比较。一旦失配，i 只前进 1 位、j 归零重来，前面辛辛苦苦比对成功的字符全部作废。最坏情况下（如 S = "aaaa...ab"、P = "aaaa...a"）每次都要比到最后一个字符才发现不对，时间复杂度高达 O(n·m)。
>
> **KMP 的思路：** 失配时主串指针 i 完全不动，只根据"已匹配部分"的结构信息，把模式串向右滑动到合适的位置继续比。已匹配片段中如果存在"相同的前缀与后缀"，那么滑动后前缀部分可以直接视为已匹配，跳过重复比较。用来指导滑动的表就是 next 数组。KMP 总复杂度为 O(n + m)：主串指针 i 只前进不后退，模式串指针 j 也只前进、仅在失配时回退到 next 位置，而 j 的总回退次数不会超过它的总前进次数。

## 字符串匹配的朴素做法

**暴力匹配的过程：** 枚举主串中的每个起点 i，从该起点开始与模式串逐字符比较；一旦遇到不相同的字符就跳出内层循环，把起点右移一位、模式串从头重新比较。最坏时间复杂度 O(n·m)。

```java
import java.util.*;
public class Main{
    public static void main(String[] args){
        String str1 = "abcdefgbc";//短串
        String str2 = "bc";//长串
        for(int i = 0;i<=str1.length();i++){
            boolean flag = true;
            for (int j = 0; j <=str2.length() ; j++) {
                if(str1.charAt(i) ！= str2.charAt(j)){
                    flag = false;
                    break;
                }
            }
        }
    }
}
```

## 优化做法

**KMP 匹配过程：** 失配时主串下标 i 不回退，模式串下标 j 跳到 `next[j-1]` 继续比较；当 j 累加到模式串长度 m 时说明完全匹配，记录起点 `i - m + 1`，并把 j 回退到 `next[j-1]`，以便继续寻找下一个（允许重叠的）匹配位置。

```java
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class KMP_AllOccurrences {

    /* 构造 next 数组：next[i] 表示前缀 P[0..i] 的最长相同真前后缀长度 */
    public static int[] buildNext(String p) {
        int m = p.length();
        int[] next = new int[m];
        int j = 0;                 // 当前最长前缀长度
        for (int i = 1; i < m; i++) {
            while (j > 0 && p.charAt(i) != p.charAt(j)) j = next[j - 1];
            if (p.charAt(i) == p.charAt(j)) j++;
            next[i] = j;
        }
        return next;
    }

    /* 返回所有匹配位置（0-base） */
    public static List<Integer> kmpSearch(String s, String p) {
        List<Integer> res = new ArrayList<>();
        int n = s.length(), m = p.length();
        //模式串长度为0，或者主串长度小于模式串则直接返回
        if (m == 0 || n < m) return res;
		//构建next数组
        int[] next = buildNext(p);
        int j = 0;                 // 当前匹配长度
        for (int i = 0; i < n; i++) {
            while (j > 0 && s.charAt(i) != p.charAt(j)) j = next[j - 1];
            if (s.charAt(i) == p.charAt(j)) j++;
            if (j == m) {          // 完全匹配
                res.add(i - m + 1);
                j = next[j - 1];   // 继续找下一个（允许重叠）
            }
        }
        return res;
    }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        System.out.print("主串: ");
        String s = br.readLine();
        System.out.print("模式: ");
        String p = br.readLine();

        List<Integer> pos = kmpSearch(s, p);
        if (pos.isEmpty()) {
            System.out.println("未找到匹配");
        } else {
            System.out.println("匹配起始下标: " + pos);
        }
    }
}
```

## KMP 的核心跳表next[i]

先明确几个概念。设字符串 P，它的：

- **前缀**：从第一个字符开始、到任意位置结束的子串，如 "abcab" 的前缀有 "a"、"ab"、"abc"、"abca"、"abcab"；
- **后缀**：从任意位置开始、到最后一个字符结束的子串，如 "abcab" 的后缀有 "b"、"ab"、"cab"、"bcab"、"abcab"；
- **真前缀 / 真后缀**：长度严格小于整个串的前缀 / 后缀（即不含串本身）。

next 数组关心的正是"前缀与后缀相等"这件事。

`next[i]` 唯一的作用是：

> **当模式串 P 的 i 号字符失配时，下一个应该拿 P 的哪一个下标字符继续去匹配。**

换一种更本质的说法：

> `next[i] = k` 表示 **子串 P[0…i] 的最长相同真前缀与真后缀的长度为 k**。

对于模式串 `P = a b a b c a b a`（下标从 0 开始）

```
i        : 0 1 2 3 4 5 6 7
P[i]     : a b a b c a b a
next[i]  : 0 0 1 2 0 1 2 3
```

解释 `next[7]=3`：
前缀 `a b a b c a b a` 的最长 **真前缀 == 真后缀** 是 `a b a`，长度 3。
因此一旦 `P[7]` 失配，就跳到 `P[3]` 继续比，而不是回退主串指针

**代码示例：**

```java
int[] next = new int[m];   // m = 模式长度
next[0] = 0;               // 单字符无真前后缀
int j = 0;                 // j 同时表示“当前最长前缀长度”
for (int i = 1; i < m; i++) {
    while (j > 0 && P[i] != P[j]) j = next[j - 1]; // 回退
    if (P[i] == P[j]) j++;
    next[i] = j;
}
```

- 循环结束后 `next[i]` 里存的就是上面“最长相同真前后缀长度”。
- 失配时直接 `j = next[j - 1]` 即可。

**`next[i]` 就是模式串前缀 `P[0…i]` 的“最长可继续利用的重复前后缀长度”**；
失配时靠它告诉算法“前面多少位已经匹配过，可以跳过”。

>几何意义——“最长可复用斜坡” 把已匹配部分画成一条“斜坡”：
>
>主串：…… abcababcabd …
>模式：     abcabd
>失配处：         ↑ j=5 的 d 对不上
>
>已匹配片段 = “abcab”
>next[4] = 2 表示“abcab”的最长相同真前后缀 = “ab”长度 2
>→ 模式串可直接滑到 j=2 继续比，前面 2 个字符无需再验，因为**它们一定相等**。

**next 数组的构造与匹配共用同一个"自我匹配"思想：** 构造 next 的过程相当于让模式串与自己匹配——i 从 1 开始逐个字符作为"后缀结尾"，j 记录当前能匹配上的最长前缀长度；`P[i]` 与 `P[j]` 相等就 j++，不相等就让 j 回退到 `next[j-1]`。这与主串匹配过程完全同构，所以两端代码几乎一模一样。

**复杂度分析：** 匹配过程中 i 只增不减（共 O(n)）；j 每 +1 必然伴随 i +1，而 j 的回退总次数不会超过它的增加总次数，所以匹配整体是 O(n + m)。这正是 KMP 相对朴素 O(n·m) 的根本优势。

**小结：** 朴素匹配输在"信息浪费"——失配后把已匹配的内容全部丢弃、从头再来；KMP 用 next 数组把"已匹配内容中可复用的部分"记录下来，失配时只滑动模式串、绝不回头扫主串。
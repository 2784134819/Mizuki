---
title: "数据结构之树形DP与记忆化搜索"
published: 2026-03-31
description: "树形 DP（没有上司的舞会）与记忆化搜索（最长滑雪轨迹）的入门讲解与 Java 实现。"
tags: [数据结构, 树形DP, 记忆化搜索]
category: "数据结构"
draft: false
---

# 树形DP与记忆化搜索

## 树形DP

**什么是树形 DP？** 状态定义在树的节点上，利用"子树信息自底向上汇总"的天然结构做动态规划。因为树的递归结构与 DFS 天然契合，树形 DP 的代码几乎总是"先递归所有儿子、再用儿子们的结果更新父亲"。

**经典二元状态：** 很多树上问题按"当前节点选 / 不选"设计状态，如 `f[u][0]` 表示"不选 u、以 u 为根的子树的最大收益"，`f[u][1]` 表示"选 u"的最大收益。转移时：

- 不选 u：每个儿子都可以选或不选，取各自两态的较大者相加；
- 选 u：每个儿子只能不选（否则相邻冲突），全部取 `f[son][0]` 相加。

### 例题：没有上司的舞会（最大独立集）

> # 没有上司的舞会（最大独立集）
>
> ## 题意
> Ural 大学有 $N$ 名职员，编号 $1 \sim N$，关系形成一棵以校长为根的树。  
> 每个职员有快乐指数 $H_i$（$-128 \leq H_i \leq 127$）。  
> **条件**：没有职员愿意和**直接上司**一起参会。  
> 目标：邀请一部分职员，使**快乐指数总和最大**，求这个最大值。
>
> ## 输入格式
> - 第一行：整数 $N$。
> - 接下来 $N$ 行：第 $i$ 行给出 $i$ 号职员的快乐指数 $H_i$。
> - 接下来 $N-1$ 行：每行一对整数 $(L, K)$，表示 $K$ 是 $L$ 的直接上司。
> - 最后一行输入 `0 0`，表示输入结束。
>
> ## 输出格式
> 输出一个整数，表示**最大快乐指数总和**。
>
> ## 数据范围
> $$1 \leq N \leq 6000,\quad -128 \leq H_i \leq 127$$

```java
import java.io.*;
import java.util.StringTokenizer;

public class Main {
    static final int N = 6010;
    static int n, idx = 0;
    static int[] h = new int[N], e = new int[N], ne = new int[N];
    static int[] happy = new int[N];
    static int[][] f = new int[N][2];        // f[u][0/1] : u 不选/选的最大值
    static boolean[] hasFather = new boolean[N];

    /* 邻接表加边：b -> a (b 是 a 的父节点) */
    static void add(int b, int a) {
        e[idx] = a; ne[idx] = h[b]; h[b] = idx++;
    }

    /* 树形 DP */
    static void dfs(int u) {
        f[u][1] = happy[u];                  // 选 u，至少含 u 的快乐值
        for (int i = h[u]; i != -1; i = ne[i]) {
            int j = e[i];
            dfs(j);
            f[u][0] += Math.max(f[j][0], f[j][1]); // 不选 u → 子节点可选可不选
            f[u][1] += f[j][0];                    // 选 u → 子节点只能不选
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        n = Integer.parseInt(br.readLine().trim());
        for (int i = 1; i <= n; i++) happy[i] = Integer.parseInt(br.readLine().trim());

        // 邻接表初始化
        for (int i = 0; i < N; i++) h[i] = -1;
        for (int i = 0; i < n - 1; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            hasFather[a] = true;
            add(b, a);                 // b 是父，a 是子
        }

        // 找根（没有父节点的节点）
        int root = 1;
        while (hasFather[root]) root++;
        dfs(root);

        System.out.println(Math.max(f[root][0], f[root][1]));
    }
}
```

## 记忆化搜索

**什么是记忆化搜索？** 把"递归求解 + 结果缓存"结合起来：递归函数每次先查缓存，算过就直接返回，没算过就计算并把结果存进数组。它适合状态之间依赖关系复杂、不好按固定顺序填表的 DP 问题（例如在网格上向四周转移），本质上就是用递归实现 DP。

**与递推 DP 的区别：** 递推是"自底向上按顺序填表"；记忆化搜索是"自顶向下按需计算"，只计算真正用到的状态，天然省去"哪些状态没被用到"的烦恼，代码也更接近暴力搜索，容易写对。

### 例题：最长滑雪轨迹（记忆化搜索 / 最长递减路径）

> # 最长滑雪轨迹（记忆化搜索 / 最长递减路径）
>
> ## 题意
> 给定一个 $R$ 行 $C$ 列的矩阵，表示滑雪场各区域的高度。  
> 一个人从任意区域出发，每次可向**上下左右**滑动一个单位，**前提是目标区域高度严格低于当前区域**。  
> 求：**最长滑行轨迹的长度**（即沿途经过的最大区域数）。
>
> ## 示例
> 矩阵：
>
> 1  2  3  4  5 
>
> 16 17 18 19 6 
>
> 15 24 25 20 7 
>
> 14 23 22 21 8 
>
> 13 12 11 10 9
>
> 最长轨迹：$25 \to 24 \to 23 \to \dots \to 2 \to 1$，共 **25** 个区域。
>
> ## 输入格式
> 第一行：两个整数 $R, C$。  
> 接下来 $R$ 行：每行 $C$ 个整数，表示矩阵高度。
>
> ## 输出格式
> 输出一个整数，表示**最长滑行轨迹长度**。
>
> ## 数据范围
> $$1 \leq R, C \leq 300,\quad 0 \leq \text{高度} \leq 30000$$

```java
import java.io.*;
import java.util.StringTokenizer;

public class Main {
    static final int N = 310;
    static int n, m;
    static int[][] h = new int[N][N];
    static int[][] f = new int[N][N];      // -1 表示未计算
    static int[] dx = {-1, 0, 1, 0};
    static int[] dy = {0, 1, 0, -1};

    /* 记忆化搜索：返回从 (x,y) 出发的最长递减路径长度 */
    static int dp(int x, int y) {
        int v = f[x][y];
        if (v != -1) return v;               // 已计算，直接返回
        v = 1;                               // 至少包含自己
        for (int i = 0; i < 4; i++) {
            int a = x + dx[i], b = y + dy[i];
            if (a >= 1 && a <= n && b >= 1 && b <= m && h[a][b] < h[x][y])
                v = Math.max(v, dp(a, b) + 1);
        }
        return f[x][y] = v;                  // 记忆化
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        n = Integer.parseInt(st.nextToken());
        m = Integer.parseInt(st.nextToken());

        for (int i = 1; i <= n; i++) {
            st = new StringTokenizer(br.readLine());
            for (int j = 1; j <= m; j++) h[i][j] = Integer.parseInt(st.nextToken());
        }

        // 初始化记忆化数组
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= m; j++) f[i][j] = -1;

        int res = 0;
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= m; j++)
                res = Math.max(res, dp(i, j));

        System.out.println(res);
    }
}
```

**思路：** `dp(x, y)` 表示从 (x, y) 出发能滑行的最长长度；因为只能向**高度严格递减**的方向滑，递归过程中高度单调下降，不会走回头路，因此没有环、不会死循环。每个格子只计算一次（缓存后直接返回），总复杂度 O(R·C)。

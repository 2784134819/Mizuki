---
title: "数据结构之数位统计与状态压缩DP"
published: 2026-03-31
description: "数位统计（按位枚举求数字出现次数）与状态压缩 DP（蒙德里安的梦想、最短 Hamilton 路径）的入门讲解与 Java 实现。"
tags: [数据结构, 动态规划, 数位DP, 状态压缩, Java]
category: "数据结构"
draft: false
---

# 数位统计与状态压缩DP

## 数位统计：数字出现次数

**问题类型：** 统计区间 [a, b] 内所有整数中，数字 0~9 各出现了多少次。区间的上下界可达 10⁸，逐个数枚举显然不可行。

**核心技巧：**

1. **差分转化：** count(n, d) 表示 1 ~ n 中数字 d 的出现次数，则 [a, b] 的答案 = count(b, d) - count(a-1, d)；
2. **按位统计：** 把 n 的每一位拆开（高位在前），对每一位考虑"这一位恰好等于 d"的所有数字。以第 i 位为例，把数字写成"高位 + 当前位 + 低位"三段：
   - **高位任意小于当前前缀：** 高位取 0 ~ 前缀-1（d = 0 时注意前导零修正），低位可取任意 10^i 种，贡献 高位 × 10^i；
   - **当前位 = d：** 贡献 低位 + 1；
   - **当前位 > d：** 贡献 10^i。
3. 把每一类贡献累加，就得到 d 在 1 ~ n 中出现的总次数。枚举 10 个数字 × 位数，复杂度 O(log n)。

> # 数字出现次数统计
>
> ## 题意
> 给定两个整数 $a$ 和 $b$，求 $[a,b]$ 区间内**所有数字中 0~9 的出现次数**。  
> 例如 $a=1024,b=1032$，共 $9$ 个数，其中：
> - 0 出现 10 次
> - 1 出现 10 次
> - 2 出现 7 次
> - 3 出现 3 次
> ……
>
> ## 输入格式
> - 多组测试数据，每组一行两个整数 $a,b$。  
> - 当读入一行为 `0 0` 时，输入终止，且该行不作处理。
>
> ## 输出格式
> 每组输出一行，共十个用空格隔开的数字，依次表示 0~9 的出现次数。
>
> ## 数据范围
> $$1 \leq a,b \leq 10^8 - 1$$

```java
import java.io.*;
import java.util.*;

public class Main {
    static int power10(int x) {
        int res = 1;
        while (x-- > 0) res *= 10;
        return res;
    }

    // 统计数字 x 在 n 中出现的总次数
    static int count(int n, int x) {
        if (n == 0) return 0;
        List<Integer> num = new ArrayList<>();
        while (n != 0) {
            num.add(n % 10);
            n /= 10;
        }
        Collections.reverse(num);          // 高位在前
        int nLen = num.size();
        int res = 0;
        for (int i = 0; i <= nLen - 1 - (x >= 0 ? 0 : 0); i++) {   // 原逻辑：i 从 0 到 n-1-x≥0
            // (1) 高位部分 < 当前前缀
            if (i < nLen - 1) {
                int higher = (i == 0 ? 0 : Integer.parseInt(joinSub(num, 0, i)));
                res += higher * power10(i);
                if (x != 0) res -= power10(i);          // 前导 0 修正
            }
            // (2) 当前位判断
            int cur = num.get(i);
            if (cur == x) {
                int lower = (i == 0 ? 0 : Integer.parseInt(joinSub(num, 0, i)));
                res += lower + 1;
            } else if (cur > x) {
                res += power10(i);
            }
        }
        return res;
    }

    // 辅助：把 num[l..r] 拼成整数
    private static int joinSub(List<Integer> num, int l, int r) {
        int ans = 0;
        for (int i = l; i <= r; i++) ans = ans * 10 + num.get(i);
        return ans;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        PrintWriter pw = new PrintWriter(System.out);
        String line;
        while ((line = br.readLine()) != null) {
            String[] sp = line.trim().split("\\s+");
            int a = Integer.parseInt(sp[0]);
            int b = Integer.parseInt(sp[1]);
            if (a == 0 && b == 0) break;
            int[] ans = new int[10];
            for (int d = 0; d < 10; d++)
                ans[d] = count(b, d) - count(a - 1, d);   // [a,b] 差分
            for (int i = 0; i < 10; i++) {
                if (i > 0) pw.print(' ');
                pw.print(ans[i]);
            }
            pw.println();
        }
        pw.flush();
    }
}
```

> 解释
>
> 给定上限 $n = abcdefg$（7 位数字），求
> $$1 \leq xxx1yyy \leq abcdefg$$
> 中数字 **1** 出现在 **第 4 位**（从高位数，千位）的次数。
>
> 拆分情况（完全覆盖）
>
> | 情况  | 范围                                 | 计数公式          |
> | ----- | ------------------------------------ | ----------------- |
> | (1)   | xxx = 000 ~ abc-1, yyy = 000 ~ 999   | $abc \times 1000$ |
> | (2.1) | xxx = abc, d &lt; 1                  | $0$               |
> | (2.2) | xxx = abc, d = 1, yyy = 000 ~ efg    | $efg + 1$         |
> | (2.3) | xxx = abc, d &gt; 1, yyy = 000 ~ 999 | $1000$            |

## 状压DP

**什么是状态压缩？** 用二进制的每一位表示集合中某个元素"选 / 不选"（或某种 0/1 状态），把一个集合编码成一个整数，于是"枚举子集、转移状态"都变成整数上的位运算。当问题中元素个数 n 较小（一般 n ≤ 20，2^n ≤ 10⁶）时，可以用 `f[mask]` 或 `f[mask][i]` 这样的数组做 DP。

**常用位运算：** `1 << i` 表示第 i 位；`mask >> i & 1` 取第 i 位；`mask | (1 << i)` 加入元素；`mask & (mask - 1)` 去掉最低位 1；枚举 mask 的所有子集用 `for (int sub = mask; sub > 0; sub = (sub - 1) & mask)`。

### 例题1：蒙德里安的梦想

> ## 题意
>给定一个 $N \times M$ 的棋盘，用若干个 $1 \times 2$ 的长方形（多米诺骨牌）**完全覆盖**，求**方案总数**。
> 
> 例如：
>- $N=2,\ M=4$ 时，共有 **5 种**方案；
> - $N=2,\ M=3$ 时，共有 **3 种**方案。
> 
> ## 输入格式
>- 多组测试用例，每行两个整数 $N, M$；
> - 当输入为 `0 0` 时，输入终止，无需处理。
> 
> ## 输出格式
>每个测试用例输出一行结果，表示**方案总数**。
> 
> ## 数据范围
>$$1 \leq N, M \leq 11$$

  ```java
  import java.io.*;
  import java.util.StringTokenizer;
  
  public class Main {
      static final int N = 12;
      static final int M = 1 << N;
      static long[][] f = new long[N][M];
      static boolean[] st = new boolean[M];
  
      public static void main(String[] args) throws IOException {
          BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
          PrintWriter pw = new PrintWriter(new OutputStreamWriter(System.out));
          StringTokenizer stok;
          int n, m;
          while (true) {
              stok = new StringTokenizer(br.readLine());
              n = Integer.parseInt(stok.nextToken());
              m = Integer.parseInt(stok.nextToken());
              if (n == 0 && m == 0) break;
  
              // 预处理：判断每一行二进制状态是否合法（连续 0 为偶数）
              for (int i = 0; i < 1 << n; i++) {
                  st[i] = true;
                  int cnt = 0;
                  for (int j = 0; j < n; j++) {
                      if (((i >> j) & 1) == 1) {
                          if ((cnt & 1) == 1) st[i] = false;
                          cnt = 0;
                      } else {
                          cnt++;
                      }
                  }
                  if ((cnt & 1) == 1) st[i] = false;
              }
  
              // 轮廓线 DP
              for (int i = 0; i <= m; i++)
                  for (int j = 0; j < 1 << n; j++) f[i][j] = 0L;
              f[0][0] = 1L;
  
              for (int i = 1; i <= m; i++) {
                  for (int j = 0; j < 1 << n; j++) {
                      if (f[i - 1][j] == 0) continue;
                      for (int k = 0; k < 1 << n; k++) {
                          if ((j & k) != 0 || !st[j | k]) continue;
                          f[i][k] += f[i - 1][j];
                      }
                  }
              }
  
              pw.println(f[m][0]);
          }
          pw.flush();
      }
  }
  ```

**思路：** 按列 DP。`f[i][j]` 表示"摆完前 i-1 列、第 i-1 列伸到第 i 列的骨牌状态为 j"的方案数；j 的二进制第 k 位为 1 表示该行有一个横向骨牌跨到当前列。枚举上一状态 j 与当前状态 k：`j & k == 0`（同一行不能重叠），且 `j | k` 中连续的 0 必须是偶数段（竖着放的骨牌要占 2 行）。最终答案 `f[m][0]`。

### 例题2：最短 Hamilton 路径

> # 最短 Hamilton 路径
>
> ## 题意
> 给定一张 $n$ 个点的**带权无向图**，点编号 $0 \sim n-1$。  
> 求从**起点 $0$** 到**终点 $n-1$** 的**最短 Hamilton 路径**：
> &gt; 不重不漏地**经过每个点恰好一次**。
>
> ## 输入格式
> 第一行：整数 $n$。  
> 接下来 $n$ 行：每行 $n$ 个整数，其中第 $i$ 行第 $j$ 个整数表示点 $i$ 到点 $j$ 的距离 $a[i,j]$。  
> 保证：
>
> - $a[x,x] = 0$
> - $a[x,y] = a[y,x]$
> - $a[x,y] + a[y,z] \geq a[x,z]$（三角不等式）
>
> ## 输出格式
> 输出一个整数，表示**最短 Hamilton 路径长度**。
>
> ## 数据范围
> $$1 \leq n \leq 20,\quad 0 \leq a[i,j] \leq 10^7$$

```java
import java.io.*;
import java.util.StringTokenizer;

public class Main {
    static final int N = 20;
    static final int M = 1 << N;
    static int n;
    static int[][] w = new int[N][N];
    static int[][] f = new int[M][N];

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        PrintWriter pw = new PrintWriter(new OutputStreamWriter(System.out));

        n = Integer.parseInt(br.readLine().trim());
        for (int i = 0; i < n; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            for (int j = 0; j < n; j++) w[i][j] = Integer.parseInt(st.nextToken());
        }

        // 初始化：无穷大
        for (int i = 0; i < (1 << n); i++)
            for (int j = 0; j < n; j++) f[i][j] = Integer.MAX_VALUE / 2;
        f[1][0] = 0;                       // 起点 0，只经过点 0

        // 状压 DP
        for (int i = 0; i < (1 << n); i++) {
            for (int j = 0; j < n; j++) {
                if ((i >> j & 1) == 0) continue;                     // j 不在集合里
                for (int k = 0; k < n; k++) {
                    if (((i - (1 << j)) >> k & 1) == 0) continue;    // k 不在子集里
                    f[i][j] = Math.min(f[i][j], f[i - (1 << j)][k] + w[k][j]);
                }
            }
        }

        pw.println(f[(1 << n) - 1][n - 1]);
        pw.flush();
    }
}

```

**思路：** `f[mask][j]` 表示"已经走过的点集为 mask、当前停在点 j"的最短路径长度。转移：枚举上一个到达的点 k（k 在 mask \ {j} 中），`f[mask][j] = min(f[mask ^ (1<<j)][k] + w[k][j])`。答案为走完全部点集后停在终点 n-1 的 `f[(1<<n)-1][n-1]`。复杂度 O(2ⁿ·n²)。

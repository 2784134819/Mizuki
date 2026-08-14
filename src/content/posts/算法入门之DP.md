---
title: "算法入门之DP"
published: 2026-03-12
description: "动态规划入门笔记，涵盖 0-1 背包、完全背包、多重背包、分组背包，以及线性 DP、区间 DP 与数位 DP 的状态转移与实现。"
tags: [算法入门, 动态规划, 背包问题]
category: "算法入门"
draft: false
---



# 动态规划（DP）

动态规划（Dynamic Programming，简称 DP）是算法竞赛中最重要的一类思想。它的核心思路可以概括为：

**把一个大问题拆成若干相互关联的子问题，先求出每个子问题的最优解并保存下来，再用这些已保存的结果一步步推出大问题的最优解。**

一个能用 DP 解决的问题通常具备三个特征：

1. **最优子结构：** 大问题的最优解可以由若干子问题的最优解组合得到。例如背包问题中，"前 i 件物品的最优方案"可以由"前 i-1 件物品的最优方案"推出。
2. **无后效性：** 一个状态一旦确定，之后的转移只取决于当前状态本身，与"当初是怎么到达这个状态的"无关。
3. **重叠子问题：** 不同的大问题会反复用到相同的子问题，把子问题的结果存起来（记忆化）就能避免重复计算——这也是 DP 比直接递归/搜索快的关键。

**写 DP 题的基本套路：**

- **状态表示（定义 f 的含义）：** 想清楚"用几维、每维代表什么、f 存的是什么值"。例如 `f[i][j]` 表示"只考虑前 i 个物品、背包容量为 j 时的最大价值"。状态定义是 DP 的起点，定义对了，转移往往水到渠成。
- **状态计算（写出转移方程）：** 枚举当前状态能由哪些"前驱状态"转移而来并取最优。例如 `f[i][j] = max(f[i-1][j], f[i-1][j-v[i]] + w[i])`。
- **确定边界与目标：** 初始状态是什么（如 `f[0][j] = 0`）、最终答案从哪个状态取（如 `f[N][V]` 或 `max(f[N][i])`）。
- **按依赖顺序计算：** 保证计算某个状态时它依赖的状态已经算好——背包按物品顺序算、区间 DP 按区间长度算、数位 DP 按位算。

**DP 与贪心、分治的区别：** 贪心每步只做当前最优选择、绝不回看；分治把问题切成互不重叠的子问题；DP 的子问题则相互重叠、层层依赖，用"填表"的方式由小到大求解。下面从最经典的背包 DP 开始。

## 背包DP

###  0-1 背包

0-1 背包是最基础的背包模型：有 N 件物品，每件物品**只能选 0 次或 1 次**（"0-1"由此得名），第 i 件物品有体积 v[i] 和价值 w[i]，背包总容量为 V，问在总体积不超过 V 的前提下能装出的最大价值。

**状态定义：** 设 `f[i][j]` 表示"只考虑前 i 件物品、背包容量为 j 时能获得的最大价值"。

**状态转移——对第 i 件物品做"选或不选"的决策：**

- **不选第 i 件：** 容量和价值都不变，直接从上一层继承，价值为 `f[i-1][j]`；
- **选第 i 件：** 需要先预留出 v[i] 的容量，即从"前 i-1 件物品、容量 j - v[i]"的状态转移而来，价值为 `f[i-1][j-v[i]] + w[i]`（前提是 j ≥ v[i] 才装得下）。

两种决策取较大者，得到 **0-1 背包的状态转移方程**：

`f[i][j] = max(f[i-1][j], f[i-1][j-v[i]] + w[i])`

初始化 `f[0][j] = 0`（一件物品都不考虑时价值为 0），答案就是 `f[N][V]`。

**滚动数组优化（二维 → 一维）：** 观察转移方程可以发现，计算第 i 层任何状态 `f[i][j]` 时，只用到第 i-1 层的值，更早的层完全用不到。于是可以只保留一维数组 `f[j]`（表示"处理到当前物品时、容量为 j 的最大价值"），方程变为：

`f[j] = max(f[j], f[j-v[i]] + w[i])`

**关键细节——必须逆序（从大到小）枚举容量 j：** 一维数组中 `f[j-v[i]]` 既可能是"上一层的旧值"（我们需要的），也可能是"本层刚更新的新值"。如果 j 从小到大枚举，`f[j-v[i]]` 在本轮中已经被更新过，等价于第 i 件物品可以被**多次选择**，就退化成了完全背包；只有 j 从大到小枚举，才能保证 `f[j-v[i]]` 仍是上一层（前 i-1 件物品）的旧值，从而严格满足"每件物品最多选一次"。

**务必牢记并理解这个转移方程，因为大部分背包问题的转移方程都是在此基础上推导出来的。**

**例题**

> **题目描述**
>
> 有 $N$ 件物品和一个容量为 $V$ 的背包。每件物品**只能使用一次**。  
> 第 $i$ 件物品的体积为 $V_i$，价值为 $W_i$。  
> 求解将哪些物品装入背包，可使这些物品的总体积**不超过背包容量**，且**总价值最大**。  
> 输出最大价值。
>
> **输入格式**
>
> 第一行两个整数 $N, V$，用空格隔开，分别表示物品数量和背包容积。  
> 接下来 $N$ 行，每行两个整数 $V_i, W_i$，用空格隔开，分别表示第 $i$ 件物品的体积和价值。
>
> **输出格式**
>
> 输出一个整数，表示最大价值。
>
> **数据范围**
>
> $$1 \leq N, V \leq 1000,\quad 1 \leq V_i, W_i \leq 1000$$

```java
import java.util.*;
import java.io.*;
public class Main{
    //朴素版01背包代码
    static int N = 1010;
    static int[] v = new int[N],w = new int[N];
    static int[][] f = new int[N][N];
    public static void main(String[] args ){
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] nm = br.readLine().trim().split("\\s+");
        int n = Integer.parseInt(nm[0]);
        int m = Integer.parseInt(nm[1]);
        for(int i = 1;i<=n;i++) {
            String[] vw = br.readLine().trim().split("\\s+");
            int v= Integer.parseInt(vw[0]);
            int w = Integer.parseInt(vw[1]);
            v[i] = v;
            w[i] = w;
		}
        for(int i = 1;i<=n;i++){
            for(int j = 0;j<=m;j++){
                f[i][j] = f[i -1][j];
                if(v[i] <= j) f[i][j] = Math.max(f[i][j],f[i-1][j-v[i]] + w[i]);
            }
        }
        
        //输出f[n][m]
    }
}
```

```java
import java.util.*;
import java.io.*;
public class Main{
    //优化版01背包代码,时间没变，空间优化
    static int N = 1010;
    static int[] v = new int[N],w = new int[N];
    static int[] f = new int[N];
    public static void main(String[] args ){
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] nm = br.readLine().trim().split("\\s+");
        int n = Integer.parseInt(nm[0]);
        int m = Integer.parseInt(nm[1]);
        for(int i = 1;i<=n;i++) {
            String[] vw = br.readLine().trim().split("\\s+");
            int v= Integer.parseInt(vw[0]);
            int w = Integer.parseInt(vw[1]);
            v[i] = v;
            w[i] = w;
		}
        for(int i = 1;i<=n;i++){
            for(int j = m;j >= v[i];j--){
               	f[j] = Math.max(f[j],[j-v[i]] + w[i]);
            }
        }
        
        //输出f[n][m]
    }
}
```

> 对于此处优化的解释
>
> 因为计算 **第 i 层** 任何位置 `j` 时，**只用第 i-1 层** 的两个值（`f[i-1][j]` 与 `f[i-1][j-v[i]]`），而其他层的值并未被访问使用，因此每次计算都只需要使用两层数组空间，由此可以使用滚动数组来进行优化。
>
> 再进一步，可以直接在一个一维数组中完成更新。
>
> 但是要注意更新的顺序：要避免"用本层已更新的值去更新本层"，即用第 i 层的值去更新第 i 层的值——那样就会出现某件物品被重复使用，不符合 01 背包"每件物品只能选一次"的定义。
>
> 这也是为什么一维优化必须逆序（降序）遍历 j 的原因。

### 完全背包问题

> 完全背包模型与 0-1 背包类似，与 0-1 背包的区别仅在于一个物品可以选取无限次，而非仅能选取一次。
>
> 我们可以借鉴 0-1 背包的思路，进行状态定义：设 `f[i][j]` 为只能选前 i 个物品时，容量为 j 的背包可以达到的最大价值。
>
> 需要注意的是，虽然定义与 0-1 背包类似，但是其状态转移方程与 0-1 背包并不相同。
>
> **朴素做法：** 对于第 i 件物品，枚举它选了多少个 k（k = 0, 1, 2, …，且 k×v[i] ≤ j）来转移：
>
> `f[i][j] = max( f[i-1][j - k*v[i]] + w[i]*k )`
>
> 每个状态要枚举约 V 种 k，总复杂度 O(N·V²)，太慢。
>
> **优化——把"枚举个数"的循环消掉：** 观察发现 `f[i][j]` 与 `f[i][j-v[i]]` 之间存在重叠：`f[i][j]` 枚举的是"选 k 个第 i 件物品"，而 `f[i][j-v[i]]` 已经枚举过"选 k-1 个第 i 件物品"。既然 `f[i][j-v[i]]` 本身已经充分考虑了第 i 件物品的各种选取次数，只要从它转移一次即可，因此状态转移方程化简为：
>
> `f[i][j] = max(f[i-1][j], f[i][j-v[i]] + w[i])`
>
> 理由是当我们这样转移时，`f[i][j-v[i]]` 已经由 `f[i][j-2*v[i]]` 更新过，`f[i][j-2*v[i]]` 又由 `f[i][j-3*v[i]]` 更新过……依次往前追溯，等于把"选 0 个、1 个、2 个……"的所有情况都间接考虑了一遍。换言之，我们通过局部最优子结构的性质重复使用了之前的枚举过程，把复杂度优化到 O(N·V)。
>
> 与 0-1 背包相同，我们可以将第一维去掉来优化空间复杂度。如果理解了 0-1 背包的优化方式，就不难明白压缩后的完全背包循环是**正向**的：正序枚举 j 时，`f[j-v[i]]` 恰好是本层刚更新过的值，正好对应"第 i 件物品可以选多次"的语义（也就是上文中提到的"错误优化"在完全背包里反而是正确做法）。

**例题**

> **题意**
>
> 有 $N$ 种物品和一个容量为 $V$ 的背包，**每种物品有无限件**。  
> 第 $i$ 种物品的体积为 $V_i$，价值为 $W_i$。  
> 求解：总体积不超过 $V$ 的前提下，**总价值最大**是多少？
>
> **输入格式**
>
> 第一行两个整数 $N, V$，分别表示**物品种数**和**背包容积**。  
> 接下来 $N$ 行，每行两个整数 $V_i, W_i$，表示第 $i$ 种物品的体积和价值。
>
> **输出格式**
>
> 输出一个整数，表示**最大总价值**。
>
> **数据范围**
>
> $$1 \leq N, V \leq 1000,\quad 1 \leq V_i, W_i \leq 1000$$

```java
import java.util.*;
import java.io.*;
public class Main{
    //朴素版完全背包代码,时间没变，空间优化
    static int N = 1010;
    static int[] v = new int[N],w = new int[N];
    static int[][] f = new int[N][N];
    public static void main(String[] args){
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] nm = br.readLine().trim().split("\\s+");
        int n = Integer.parseInt(nm[0]);
        int m = Integer.parseInt(nm[1]);
        for(int i = 1;i<=n;i++) {
            String[] vw = br.readLine().trim().split("\\s+");
            int v= Integer.parseInt(vw[0]);
            int w = Integer.parseInt(vw[1]);
            v[i] = v;
            w[i] = w;
		}
        for(int i = 1;i<=n;i++){
            for(int j = 0;j <= m;j++){
               	for(int k = 0;k*v[i] < j;k++ ){
                    f[i][j] = Math.max(f[i][j],f[i - 1][j - v[i] * k] + w[i] * k);
                }
            }
        }
        
        //输出f[n][m]
    }
}
```

```java
import java.util.*;
import java.io.*;
public class Main{
    //优化版完全背包代码,时间没变，空间优化
    static int N = 1010;
    static int[] v = new int[N],w = new int[N];
    static int[] f = new int[N];
    public static void main(String[] args){
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] nm = br.readLine().trim().split("\\s+");
        int n = Integer.parseInt(nm[0]);
        int m = Integer.parseInt(nm[1]);
        for(int i = 1;i<=n;i++) {
            String[] vw = br.readLine().trim().split("\\s+");
            int v= Integer.parseInt(vw[0]);
            int w = Integer.parseInt(vw[1]);
            v[i] = v;
            w[i] = w;
		}
        for(int i = 1;i<=n;i++){
            for(int j = v[i];j <= m;j++){
               f[j] = Math.max(f[j],f[j - v[i]] + w[i]);
            }
        }
        
        //输出f[n][m]
    }
}
```

### 多重背包问题

> **多重背包问题（Multiple Knapsack Problem）** 是 0-1 背包问题的进阶版。
>
> 在 0-1 背包中，每种物品只有 **1** 件；在完全背包中，每种物品有 **无限** 件；而在**多重背包**中，第 $i$ 种物品有固定的 **$S_i$** 件。
>
> **朴素做法：** 借用完全背包"枚举个数"的思路，对第 i 种物品枚举选 k 个（k = 0, 1, …, min(S[i], j / v[i])）来转移，复杂度 O(N·V·S)。
>
> **二进制分组优化（重点）：** 枚举个数太慢，能否把每种物品"拆开"后用 0-1 背包解？如果把 S[i] 件逐个拆成 S[i] 个单件物品，总物品数依然太大。二进制分组的思想是：把 S[i] 件物品按 `1, 2, 4, 8, …, 2^k` 以及最后的余数（S[i] 减掉这些数后剩余的部分）打包成若干个"大物品"，每个大物品的体积、价值都是原物品的对应倍数。
>
> 为什么这样打包不重不漏？因为 `1, 2, 4, …, 2^k` 这些数通过"取或不取"可以组合出 `0 ~ 2^(k+1)-1` 之间的**任意整数**，再加上最后的余数包，就能组合出 `0 ~ S[i]` 之间的任意个数——也就是说，原物品"选任意不超过 S[i] 个"的所有情况都能被这 O(log S[i]) 个包裹表示。于是问题被转化为一个 0-1 背包：对每个包裹做"选或不选"，总复杂度 O(V × Σlog S[i])，比朴素枚举快得多。

**例题**

> **题意**
>
> 有 $N$ 种物品和一个容量为 $V$ 的背包。  
> 第 $i$ 种物品**最多有 $S_i$ 件**，每件体积为 $V_i$，价值为 $W_i$。  
> 求解：物品体积总和不超过 $V$ 的前提下，**价值总和最大**是多少？
>
> **输入格式**
>
> 第一行两个整数 $N, V$，分别表示**物品种数**和**背包容积**。  
> 接下来 $N$ 行，每行三个整数 $V_i, W_i, S_i$，分别表示第 $i$ 种物品的**体积、价值、最大数量**。
>
> **输出格式**
>
> 输出一个整数，表示**最大总价值**。
>
> **数据范围**
>
> $$1 \leq N, V \leq 100,\quad 1 \leq V_i, W_i, S_i \leq 100$$

```java
import java.util.*;
import java.io.*;
public class Main{
    //朴素版完全背包代码,时间没变，空间优化
    static int N = 110;
    static int[] v = new int[N],w = new int[N], s = new int[N];
    static int[][] f = new int[N][N];
    public static void main(String[] args){
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] nm = br.readLine().trim().split("\\s+");
        int n = Integer.parseInt(nm[0]);
        int m = Integer.parseInt(nm[1]);
        for(int i = 1;i<=n;i++) {
            String[] vws = br.readLine().trim().split("\\s+");
            int v= Integer.parseInt(vw[0]);
            int w = Integer.parseInt(vw[1]);
            int s = Integer.parseInt(vw[2]);
            v[i] = v;
            w[i] = w;
            s[i] = s;
		}
        for(int i = 1;i<=n;i++){
            for(int j = 0;j <= m;j++){
               	for(int k = 0;k*v[i] < j&& k < s[i];k++ ){
                    f[i][j] = Math.max(f[i][j],f[i - 1][j - v[i] * k] + w[i] * k);
                }
            }
        }
        
        //输出f[n][m]
    }
}
```

```java
import java.util.*;
import java.io.*;
public class Main{
    //二进制分组优化版
    static int N = 25000,M = 2010; 
    static int[] v = new int[N],w = new int[N];
    static int[] f = new int[N];
    public static void main(String[] args){
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] nm = br.readLine().trim().split("\\s+");
        int n = Integer.parseInt(nm[0]);
        int m = Integer.parseInt(nm[1]);
        int cnt = 0;
        for(int i = 1;i<=n;i++) {
            String[] abs = br.readLine().trim().split("\\s+");
            int a = Integer.parseInt(vw[0]);
            int b = Integer.parseInt(vw[1]);
            int s = Integer.parseInt(vw[2]);
            int k = 1;
            while(k <= s){
                cnt ++;
                v[cnt] = a * k;
                w[cnt] = b * k;
                s -= k;
                k *= 2;
            }
		}
        if(s > 0) {
            cnt++;
            v[cnt] = a*s;
            w[cnt] = b*s;
        }
        n = cnt;
        
        for(int i = 1;i<=n;i++){
            for(int j = m;j >= v[i];j--){
               	f[j] = Math.max(f[j],f[j - v[i]] + w[i]);
            }
        }
        
        //输出f[n][m]
    }
}
```

### 分组背包问题

> **分组背包问题（Grouped Knapsack Problem）** 是背包问题的一个重要变体。它的规则是：将物品分为若干**组**，每组内部有多个物品，但**每组最多只能选一个物品**装入背包。
>
> 这非常像是在食堂点餐：你可以选套餐 A、套餐 B 或套餐 C，但每组（比如“主食类”）你只能选其中一种，不能全都要。
>
> **状态定义与转移：** 设 `f[j]` 为容量为 j 时的最大价值。外层循环枚举每一个组；然后**先枚举容量 j（逆序）**，最后枚举该组内的物品 k 做决策：`f[j] = max(f[j], f[j - v[i][k]] + w[i][k])`。
>
> **循环顺序为什么是"组 → 容量 → 组内物品"？** 组内物品的循环必须放在容量循环的**里面**：容量 j 从大到小枚举时，`f[j - v[i][k]]` 来自上一层（前 i-1 组）的结果，这样同一组内**最多只有一个物品**被选中；如果先枚举物品再枚举容量，某组内的多个物品就会在同一层中被先后选中，违背"每组最多选一个"的限制。

**例题**

> **题目描述**
>
> 有 $N$ 组物品和一个容量为 $V$ 的背包。  
> **每组物品有若干个，同一组内的物品最多选一件**。  
> 第 $i$ 组第 $j$ 件物品的体积为 $V_{i,j}$，价值为 $W_{i,j}$。
>
> 求解：总体积不超过 $V$ 的前提下，**最大总价值**是多少？
>
> **输入格式**
>
> 第一行两个整数 $N, V$，分别表示**组数**和**背包容积**。  
> 接下来 $N$ 组数据：
>
> - 每组第一行一个整数 $s_i$，表示第 $i$ 组物品个数；
> - 接下来 $s_i$ 行，每行两个整数 $V_{i,j}, W_{i,j}$，分别表示该组第 $j$ 件物品的体积和价值。
>
> **输出格式**
>
> 输出一个整数，表示**最大总价值**。
>
> **数据范围**
>
> $$1 \leq N, V \leq 100,\quad 1 \leq s_i \leq 100,\quad 1 \leq V_{i,j}, W_{i,j} \leq 100$$

```java
import java.util.*;
import java.io.*;
public class Main{
    static int N = 110;
    static int[][] v = new int[N][N], w = new int[N][N];
    static int[] f= new int[N],s = new int[N];
    public static void main(String[] args ){
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] nm = br.readLine().trim().split("\\s+");
        int n = Integer.parseInt(nm[0]);
        int m = Integer.parseInt(nm[1]);
        for(int i  =1;i<=n;i++){
            String[] s = br.readLine().trim().split("\\s+");
            s[i]  = Integer.parseInt(s[0]);
            for(int j = 0;j < s[i];j++){
                String[] vw = br.readLine().trim().split("\\s+");
                v[i][j] = Integer.parseInt(vw[0]);
                w[i][j] = Integer.parseInt(vw[1]);
            }
            for(int i = 1;i <=n;i++){
                for(int j = m;j>=0;j--){
                    for(int k = 0;k < s[i];k++){
                        if(v[i][k] <= j){
                            f[j] = Math.max(f[j] ,f[j - v[i][k]] + w[i][k]);
                        }
                    }
                }
            }
        }
    }
}

```

## 线性DP

> **线性动态规划（Linear Dynamic Programming）** 是动态规划中最基础、也是最核心的类别。
>
> 它的特征非常明显：状态的推导是按照**线性方向**（如数组下标、时间顺序）进行的。
>
> 线性 DP 的常见套路：
>
> - **一维状态（以位置结尾）：** 如最长上升子序列 `f[i]` 表示"以第 i 个数结尾的 LIS 长度"，答案要对所有 `f[i]` 取 max；又如爬楼梯 `f[i] = f[i-1] + f[i-2]`。
> - **二维状态（网格 / 双串）：** 如数字三角形 `f[i][j]` 表示"走到第 i 行第 j 列的最大路径和"，由左上方与右上方的两个前驱转移而来；如 LCS 用 `f[i][j]` 表示"第一个串前 i 个字符与第二个串前 j 个字符的最长公共子序列"，根据两个当前字符是否相等分情况转移；编辑距离则是"插入 / 删除 / 替换"三种操作对应的三路转移。
> - **注意状态边界：** 三角形中不存在的格子要初始化为 -INF，防止非法状态参与转移；LIS 的 `f[i]` 初始为 1（自己单独成串）；LCS / 编辑距离要额外处理 i = 0 或 j = 0 的边界行。
>
> 线性 DP 是后面区间 DP、树形 DP、数位 DP 的基础——它们本质上都是"按照某种顺序填表"，只是状态的维度和组织方式不同。

**例题1数字三角形最大值路径**

> **题意**
>
> 给定一个数字三角形，从顶部出发，在每一结点可以选择**向左下方**或**向右下方**移动，一直走到底层。  
> 要求找出一条路径，使路径上的**数字和最大**。
>
> **输入格式**
>
> 第一行一个整数 $n$，表示三角形的层数。  
> 接下来 $n$ 行，其中第 $i$ 行包含 $i$ 个整数，表示三角形第 $i$ 层的数字。
>
> **输出格式**
>
> 输出一个整数，表示**最大路径数字和**。
>
> **数据范围**
>
> $$1 \leq n \leq 500,\quad -10000 \leq \text{三角形中的整数} \leq 10000$$

```java
import java.io.*;
import java.util.StringTokenizer;

public class Main {
    static final int N   = 510;
    static final int INF = (int)1e9;

    static int n;
    static int[][] a = new int[N][N];
    static int[][] f = new int[N][N];

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        n = Integer.parseInt(br.readLine().trim());

        // 读入三角形
        for (int i = 1; i <= n; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            for (int j = 1; j <= i; j++) a[i][j] = Integer.parseInt(st.nextToken());
        }

        // 初始化 dp 数组
        for (int i = 0; i <= n; i++)
            for (int j = 0; j <= i; j++) f[i][j] = -INF;
        f[1][1] = a[1][1];

        // 状态转移
        for (int i = 2; i <= n; i++)
            for (int j = 1; j <= i; j++)
                f[i][j] = Math.max(f[i - 1][j - 1] + a[i][j],
                                   f[i - 1][j]     + a[i][j]);

        // 答案：底层最大值
        int res = -INF;
        for (int i = 1; i <= n; i++) res = Math.max(res, f[n][i]);
        System.out.println(res);
    }
}

```

**例题2最长严格递增子序列 (LIS)**

> **题意**
>
> 给定一个长度为 $N$ 的数列，求**数值严格单调递增**的子序列的**最大长度**。
>
> **输入格式**
>
> 第一行：整数 $N$。  
> 第二行：$N$ 个整数，表示完整序列。
>
> **输出格式**
>
> 输出一个整数，表示**最大长度**。
>
> **数据范围**
>
> $$1 \leq N \leq 1000,\quad -10^9 \leq \text{数列中的数} \leq 10^9$$

```java
import java.io.*;
import java.util.StringTokenizer;

public class Main {
    static final int N = 1010;
    static int n;
    static int[] a = new int[N];
    static int[] f = new int[N];

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        n = Integer.parseInt(br.readLine().trim());
        StringTokenizer st = new StringTokenizer(br.readLine());
        for (int i = 1; i <= n; i++) a[i] = Integer.parseInt(st.nextToken());

        // 经典 O(n²) LIS
        for (int i = 1; i <= n; i++) {
            f[i] = 1;                           // 只有 a[i] 一个数
            for (int j = 1; j < i; j++)
                if (a[j] < a[i])
                    f[i] = Math.max(f[i], f[j] + 1);
        }

        int res = 0;
        for (int i = 1; i <= n; i++) res = Math.max(res, f[i]);
        System.out.println(res);
    }
}
```

**例题3最长公共子序列 (LCS)**

> **题意**
>
> 给定两个长度分别为 $N$ 和 $M$ 的字符串 $A$ 和 $B$，求**既是 $A$ 的子序列又是 $B$ 的子序列**的字符串长度最长是多少。
>
> **输入格式**
>
> 第一行：两个整数 $N, M$。  
> 第二行：长度为 $N$ 的字符串 $A$。  
> 第三行：长度为 $M$ 的字符串 $B$。  
> 字符串均由小写字母构成。
>
> **输出格式**
>
> 输出一个整数，表示**最大长度**。
>
> **数据范围**
>
> $$1 \leq N, M \leq 1000$$

```java
import java.io.*;
import java.util.StringTokenizer;

public class Main {
    static final int N = 1010;
    static int n, m;
    static char[] a = new char[N];
    static char[] b = new char[N];
    static int[][] f = new int[N][N];

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        n = Integer.parseInt(st.nextToken());
        m = Integer.parseInt(st.nextToken());
        a = br.readLine().toCharArray();
        b = br.readLine().toCharArray();

        // 下标从 1 开始，与 C++ 保持一致
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                f[i][j] = Math.max(f[i - 1][j], f[i][j - 1]);
                if (a[i - 1] == b[j - 1]) f[i][j] = Math.max(f[i][j], f[i - 1][j - 1] + 1);
            }
        }
        System.out.println(f[n][m]);
    }
}
```

**例题4编辑距离计数（Levenshtein Distance）**

> **题意**
>
> 给定 $n$ 个长度不超过 $10$ 的字符串以及 $m$ 次询问。  
> 每次询问给出一个字符串 $t$ 和一个操作次数上限 $k$。  
> 求：有多少个给定字符串可以在 **最多 $k$ 次操作** 内变成 $t$。  
> **单次操作**：插入 / 删除 / 替换 **一个字符**。
>
> **输入格式**
>
> 第一行：两个整数 $n, m$。  
> 接下来 $n$ 行：每行一个字符串，表示给定集合。  
> 再接下来 $m$ 行：每行一个字符串 $t$ 和一个整数 $k$，表示一次询问。  
> 所有字符串只包含小写字母，且长度 $\leq 10$。
>
> **输出格式**
>
> 共 $m$ 行，每行一个整数，表示**满足条件的字符串个数**。
>
> **数据范围**
>
> $$1 \leq n, m \leq 1000$$

```java

```

## 区间DP

**区间 DP 的思想：** 状态定义在"区间"上，`f[l][r]` 表示区间 [l, r] 上的某种最优值；转移时枚举一个**分割点 k**，把 [l, r] 拆成 [l, k] 和 [k+1, r] 两个更小的区间，用它们的最优值拼出 [l, r] 的最优值。

**为什么必须"按区间长度从小到大"枚举？** 计算 `f[l][r]` 需要用到所有更短区间的结果（[l, k] 和 [k+1, r] 都比 [l, r] 短）。所以外层循环枚举区间长度 len（从 2 到 n），内层枚举左端点 l（右端点 r = l + len - 1），这样能保证每个小区间都在大区间之前算好。这是区间 DP 的标志性写法。

**常见应用：** 石子合并、矩阵连乘、括号匹配、回文串问题等。环形问题（如石子排成一圈）通常用"把数组复制一倍接在后面"的技巧，转化为长度为 2n 的链，最后在所有长度为 n 的区间中取最优值。

> # 石子合并（相邻堆）
>
> ## 题意
>
> 有 $N$ 堆石子排成一排，编号 $1, 2, \dots, N$。  
> 每堆石子有一个质量（整数）。  
> 每次**只能合并相邻的两堆**，代价为这两堆质量之和。  
> 目标：将所有石子合并成一堆，使**总代价最小**。
>
> ## 输入格式
>
> 第一行：整数 $N$，表示石子堆数。  
> 第二行：$N$ 个整数，表示每堆石子的质量（均 $\leq 1000$）。
>
> ## 输出格式
>
> 输出一个整数，表示**最小总代价**。
>
> ## 数据范围
>
> $$1 \leq N \leq 300,\quad 1 \leq \text{石子质量} \leq 1000$$

```java
import java.io.*;
import java.util.StringTokenizer;

public class Main {
    static final int N = 310;
    static int n;
    static int[] s = new int[N];
    static int[][] f = new int[N][N];

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        n = Integer.parseInt(br.readLine().trim());
        StringTokenizer st = new StringTokenizer(br.readLine());
        for (int i = 1; i <= n; i++) s[i] = Integer.parseInt(st.nextToken());

        // 前缀和
        for (int i = 1; i <= n; i++) s[i] += s[i - 1];

        // 区间 DP：len 从 2 到 n
        for (int len = 2; len <= n; len++) {
            for (int i = 1; i + len - 1 <= n; i++) {
                int l = i, r = i + len - 1;
                f[l][r] = Integer.MAX_VALUE;
                for (int k = l; k < r; k++)
                    f[l][r] = Math.min(f[l][r],
                                       f[l][k] + f[k + 1][r] + s[r] - s[l - 1]);
            }
        }

        System.out.println(f[1][n]);
    }
}
```

## 数位DP

**数位 DP 解决的问题：** 统计某个范围内满足特定条件的数的个数（或和），例如"1 到 n 中不含数字 4 的数有多少个"、"1 到 n 中数位和为 k 的数有多少个"。范围通常很大（n 可达 10^18），不可能逐个枚举，必须按"数位"一位一位地统计。

**核心思想：** 把 n 的十进制（或二进制）表示拆成一位一位，从最高位向最低位枚举每一位填什么数字，配合**记忆化搜索**：

- 状态一般包含：当前处理到第几位（pos）、前面数位的某种前缀信息（如前缀的数位和、是否已经出现过某数字等），以及两个关键布尔量：
- **tight（是否贴着上限）：** 如果前面每一位都恰好与 n 相同，当前位就只能填 0 ~ n 的这一位；否则当前位可以填 0 ~ 9。
- **leading zero（前导零）：** 前导零通常不应算作数字的一部分（如 00123 应看作 123，前导零不参与数位和等统计），需要单独处理。
- 记忆化只在 `tight = false`（且与 leading zero 无关）时进行，因为只有不受上限约束的部分结果是可复用的。
- 枚举到最低位之后，检查前缀信息是否满足题目条件，满足则返回 1（这是一个合法数字），否则返回 0。

**复杂度：** 状态数约为"位数 × 前缀状态取值数"，远小于直接枚举 n 个数字。

**写数位 DP 的步骤：** ① 把 n 拆成数位数组；② 设计 dfs(pos, 前缀信息, tight, leading zero)；③ 用记忆化数组缓存 `tight = false` 的状态；④ 调用 dfs(最高位, …, true, true) 得到答案。
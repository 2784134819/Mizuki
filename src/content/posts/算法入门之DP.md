---
title: "算法入门之DP"
published: 2026-03-12
description: "动态规划入门笔记，涵盖 0-1 背包、完全背包、多重背包、分组背包，以及线性 DP、区间 DP 与数位 DP 的状态转移与实现。"
tags: [算法, 动态规划, DP, 背包问题, Java]
category: "算法入门"
draft: false
---



## 背包DP

###  0-1 背包

例题中已知条件有第 𝑖![i](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 个物品的重量 𝑤𝑖![w_{i}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)，价值 𝑣𝑖![v_{i}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)，以及背包的总容量 𝑊![W](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)。

设 DP 状态 𝑓𝑖,𝑗![f_{i,j}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 为在只能放前 𝑖![i](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 个物品的情况下，容量为 𝑗![j](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 的背包所能达到的最大总价值。

考虑转移。假设当前已经处理好了前 𝑖 −1![i-1](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 个物品的所有状态，那么对于第 𝑖![i](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 个物品，当其不放入背包时，背包的剩余容量不变，背包中物品的总价值也不变，故这种情况的最大价值为 𝑓𝑖−1,𝑗![f_{i-1,j}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)；当其放入背包时，背包的剩余容量会减小 𝑤𝑖![w_{i}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)，背包中物品的总价值会增大 𝑣𝑖![v_{i}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)，故这种情况的最大价值为 𝑓𝑖−1,𝑗−𝑤𝑖 +𝑣𝑖![f_{i-1,j-w_{i}}+v_{i}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)。

由此可以得出状态转移方程：

𝑓𝑖,𝑗=max(𝑓𝑖−1,𝑗,𝑓𝑖−1,𝑗−𝑤𝑖+𝑣𝑖)![ f_{i,j}=\max(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) ](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)

这里如果直接采用二维数组对状态进行记录，会出现 MLE。可以考虑改用滚动数组的形式来优化。

由于对 𝑓𝑖![f_i](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 有影响的只有 𝑓𝑖−1![f_{i-1}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)，可以去掉第一维，直接用 𝑓𝑖![f_{i}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 来表示处理到当前物品时背包容量为 𝑖![i](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 的最大价值，得出以下方程：

𝑓𝑗=max(𝑓𝑗,𝑓𝑗−𝑤𝑖+𝑣𝑖)![ f_j=\max \left(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) ](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)

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
> 因为计算 **第 i 层** 任何位置 `j` 时，**只用第 i-1 层** 的两个值 ，而其他层的值并为被访问使用，因此每次计算都只需要使用两层数组空间，由此可以使用滚动数组来进行优化
>
> 再进一步可以直接在一个一维数组中完成更新
>
> 但是要注意更新的顺序，要避免使用已更新的值来更新，即使用第i层的值来更新第i层的值，这样就会出现有物品被重复使用这不符合01背包的定义
>
> 这也是为什么降序遍历的原因

### 完全背包问题

> 完全背包模型与 0-1 背包类似，与 0-1 背包的区别仅在于一个物品可以选取无限次，而非仅能选取一次。
>
> 我们可以借鉴 0-1 背包的思路，进行状态定义：设 𝑓𝑖,𝑗![f_{i,j}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 为只能选前 𝑖![i](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 个物品时，容量为 𝑗![j](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 的背包可以达到的最大价值。
>
> 需要注意的是，虽然定义与 0-1 背包类似，但是其状态转移方程与 0-1 背包并不相同。
>
> 可以考虑一个朴素的做法：对于第 𝑖![i](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 件物品，枚举其选了多少个来转移。这样做的时间复杂度是 𝑂(𝑛3)![O(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 的。
>
> 状态转移方程如下：
>
> 𝑓𝑖,𝑗=+∞max𝑘=0(𝑓𝑖−1,𝑗−𝑘×𝑤𝑖+𝑣𝑖×𝑘)![ f_{i,j}=\max_{k=0}^{+\infty}(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) ](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)
>
> 考虑做一个简单的优化。可以发现，对于 𝑓𝑖,𝑗![f_{i,j}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)，只要通过 𝑓𝑖,𝑗−𝑤𝑖![f_{i,j-w_i}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 转移就可以了。因此状态转移方程为：
>
> 𝑓𝑖,𝑗=max(𝑓𝑖−1,𝑗,𝑓𝑖,𝑗−𝑤𝑖+𝑣𝑖)![ f_{i,j}=\max(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) ](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)
>
> 理由是当我们这样转移时，𝑓𝑖,𝑗−𝑤𝑖![f_{i,j-w_i}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 已经由 𝑓𝑖,𝑗−2×𝑤𝑖![f_{i,j-2\times w_i}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 更新过，那么 𝑓𝑖,𝑗−𝑤𝑖![f_{i,j-w_i}](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 就是充分考虑了第 𝑖![i](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7) 件物品所选次数后得到的最优结果。换言之，我们通过局部最优子结构的性质重复使用了之前的枚举过程，优化了枚举的复杂度。
>
> 与 0-1 背包相同，我们可以将第一维去掉来优化空间复杂度。如果理解了 0-1 背包的优化方式，就不难明白压缩后的循环是正向的（也就是上文中提到的错误优化）。

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
> 在 0-1 背包中，每种物品只有 **1** 件；在完全背包中，每种物品有 **无限** 件；而在**多重背包**中，第 $i$ 种物品有固定的 **$C_i$** 件。

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
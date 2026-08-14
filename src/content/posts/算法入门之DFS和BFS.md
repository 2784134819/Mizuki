---
title: "算法入门之DFS和BFS"
published: 2026-03-12
description: "深度优先搜索与广度优先搜索入门，包括全排列、N 皇后、单词搜索与走迷宫等经典例题的讲解与 Java 实现。"
tags: [算法入门, DFS, BFS]
category: "算法入门"
draft: false
---



## DFS-深度优先搜索

> DFS即Depth First Search，深度优先搜索。简单地理解为一条路走到黑。那么什么叫一条路走到黑呢？假设我们想在如下的地图中走出一条最长的路，那么最粗暴的方式就是枚举出每一种情况。
>
> 先走A，然后到B，到了B有三种情况，意味着这条路还没走完，那我就接着走，从B走到E，走到E之后没路了。那我就回溯到B,为什么呢？
> 因为我原本走到B的时候就有三种情况，但是刚刚只走了一种情况，因此我要回到B再去尝试第二条路，于是我们就从E回到B，然后从B去F。到了F，又没路了，那我们就回到B走第三种情况，从B到G。这样我们就走完了从A->B的三种情况。又因为在A处其实还有三种情况，因此我们走完B的三种情况后，回到A,去走除了从A->B的第二种情况，即A->C。由此以往。
>
> 简而言之，就是我们一头扎进去，撞了南墙，我就退一步，但是决不放弃，在原基础上做出局部的改变去尝试第二条路，直到所有的情况我都试了，实在没有其他情况了，那我就回到A，从头出发，再做选择，再一头扎进去，直到成功。

把上面的过程抽象一下，DFS 本质上是在遍历一棵**搜索树（状态空间树）**：

- 每个节点代表一种"中间状态"（比如"已经选好了前 u 位数字"）；
- 从节点伸出的每条边代表一次"选择"（比如"第 u+1 位选哪个数"）；
- 走到叶子节点（没有更多选择可做）时，就得到了一种完整方案。

**DFS 的实现要点：**

1. **递归实现，系统栈天然帮我们"记住来路"。** 每进入一层递归，相当于沿着一条边向下走一步；递归返回时自动回到上一层节点，这就是"回溯"。
2. **先写递归出口。** 到达目标状态（如 u == n）就输出/记录答案并 return，这是避免无限递归的关键。
3. **枚举当前节点的所有合法选择，选一个、递归进入下一层。** 一般用 for 循环枚举。
4. **恢复现场（回溯的关键一步）。** 从下一层递归返回后，要把这次选择留下的痕迹擦掉（如 `mark[i] = false`、`ans[u] = 0`），让兄弟分支在干净的现场上做选择。如果忘记恢复，前面分支的修改会"污染"后面的分支，导致漏解或错解。
5. **剪枝（优化）。** 在进入某条边之前先判断这条路有没有必要走（如单词搜索中先统计字符个数、N 皇后中先判断列与斜线是否被占用），把注定无解的分支提前砍掉，可以大幅减少搜索量。

**DFS 适合做什么：** 求"所有方案 / 所有路径"、枚举排列组合、图与树的遍历、连通块计数、检测环等。

**复杂度：** DFS 遍历整个状态空间，时间通常与状态数量成正比——全排列是 O(n·n!)，N 皇后最坏接近 O(n!)，是指数级增长，所以这类题目的 n 都很小（例如全排列 n ≤ 7）。剪枝的好坏直接决定实际运行速度；空间主要消耗在递归调用栈上，深度为递归层数（全排列为 O(n)）。

## **(1) 全排列问题**

给定一个整数 $n$，将数字 $1 \sim n$ 排成一排，将会有很多种排列方法。

现在，请你按照字典序将所有的排列方法输出。

**输入格式**

共一行，包含一个整数 $n$。

**输出格式**

按字典序输出所有排列方案，每个方案占一行。

**数据范围**

$1 \le n \le 7$

输入样例

> 3
>
> 1 2 3
>
> 1 3 2 
>
> 2 1 3 
>
> 2 3 1 
>
> 3 1 2 
>
> 3 2 1

```java
package JUC;
import java.util.Scanner;

public class Main {
    public static int n = 0;
    public static int[] ans = new int[20];
    public static boolean[] mark = new boolean[20];
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        n = sc.nextInt();
        dfs(0);
    }
    public static void dfs(int u){
        if(n == u){
            for (int i = 0; i < n ; i++) {
                System.out.print(ans[i]);
            }
            System.out.println();
            return;
        }
        for (int i = 1; i <= n; i++) {
            if(mark[i] == false){
                ans[u] = i;
                mark[i] = true;
                dfs(u+1);
                mark[i]=false;
                ans[u] = 0;
            }
        }
    }
}
```

## **(2) N皇后问题**

> **n-皇后问题**是指将 n 个皇后放在 n×n 的国际象棋棋盘上，使得皇后不能相互攻击，即任意两个皇后都不能处于同一行、同一列或同一斜线上。
>
> 现在给定整数 n，请你输出所有满足条件的棋子摆法。
>
> ### 输入格式
>
> 共一行，包含整数 n。
>
> ### 输出格式
>
> 每个解决方案占 n 行，每行输出一个长度为 n 的字符串，用来表示完整的棋盘状态。
> 其中`.`表示某一个位置的方格状态为空，`Q`表示某一个位置的方格上摆着皇后。
> 每个方案输出完成后，输出一个空行。

```java
import java.util.Scanner;

public class Main {
    public static int n = 0;
    public static char[][] g = new char[20][20];
    public static boolean[] col = new boolean[20],dg = new boolean[20],udg = new boolean[20];
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        n = sc.nextInt();
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                g[i][j] = '.';
            }
        }
        dfs(0);
    }
    public static void dfs(int u){
        if(n == u){
            for (int i = 0; i < n ; i++) {
                System.out.println(new String(g[i],0,n));
            }
            System.out.println();
            return;
        }
        for (int i = 0; i < n; i++) {
            if(!col[i] && !dg[u+i] && !udg[n - u + i]){
                g[u][i] = 'Q';
                col[i] = dg[u + i] = udg[n - u + i] = true;
                dfs(u+1);
                col[i] = dg[u + i] = udg[n - u + i] = false;
                g[u][i] = '.';
            }
        }
    }
}
```

## (3)单词搜索

> 给定一个 $m \times n$ 二维字符网格 `board` 和一个字符串单词 `word`。如果 `word` 存在于网格中，返回 `true`；否则，返回 `false`。
>
> 单词必须按照字母顺序，通过相邻的单元格内的字母构成，其中"相邻"单元格是那些水平相邻或垂直相邻的单元格。同一个单元格内的字母不允许被重复使用。
>
> **输入：** `board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"`
>
> **输出：** `true`

```java
package JUC;

import com.mysql.cj.util.DnsSrv;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Map;

class Solution {
    public boolean exist(char[][] board, String word) {
        int leny = board.length;
        int lenx = board[0].length;
        boolean[][] mark = new boolean[leny][lenx];
        char[] words = word.toCharArray();

        //统计board中字符出现的次数
        int[] count = new int[128];
        for (char[] cs : board) {
            for (char c : cs) {
                count[c]++;
            }
        }
        //若word中出现的字符的个数大于board中出现的次数直接返回
        int[] wordCount = new int[128];
        for (char c : words) {
            if(++wordCount[c] > count[c]){
                return false;
            }
        }
        
        //若word中头字母出现次数大于尾字幕出现次数就反转字符串
        if (count[words[0]] > count[words[words.length - 1]]) {
            word = new StringBuilder(word).reverse().toString();
        }
        
        for (int i = 0; i < leny; i++) {
            for (int j = 0; j < lenx; j++) {
                if(board[i][j] == word.charAt(0)){
                    boolean isexit =  dfs(0,word,board,mark,i,j);
                    if(isexit){
                        return true;
                    }
                }
            }
        }
        return false;
    }
    public boolean dfs(int n,String word,char[][] board , boolean[][] mark,int targetX,int targetY){
       if(board[targetX][targetY] != word.charAt(n)){
           return false;
       } else if (n == word.length()-1) {
           return true;
       }
       mark[targetX][targetY] = true;
       int[] x = {0,0,1,-1};
       int[] y = {1,-1,0,0};
       boolean result = false;
       //对每个方向进行dfs
        for (int i = 0; i < 4; i++) {
            int nextX = targetX + x[i];
            int nextY = targetY + y[i];

            if (nextX >= 0 && nextX < board.length && nextY >= 0 && nextY < board[0].length && mark[nextX][nextY] == false) {
                boolean dfs = dfs(n + 1, word, board, mark, nextX, nextY);
                if (dfs) {
                    result = true;
                    break;
                }
            }
        }
        mark[targetX][targetY] = false;
        return result;
      }
}
```

## BFS-广度优先搜索

>BFS即Breadth First Search，即广度优先搜索。如果说DFS是一条路走到黑的话，BFS就完全相反了。BFS会在每个岔路口都各向前走一步。因此其遍历顺序如下图所示：
>
>我们发现每次搜索的位置都是距离当前节点最近的点。因此，BFS是具有最短路的性质的。为什么呢？这就类似于我们后面要学习的贪心策略。这里简单地介绍一下贪心，假设我们可以做出12次选择。我们想得到一个最好的方案。那么我们可以在第一次选择的时候，做出当前最好的选择，在第二次选择的时候，再做出那时候最好的选择，由此积累。当我们在每次的选择面前，都做到了当前最好的选择，那么我们就可以由局部最优推出整体最优。
>
>这里也是类似的，我们可以在每次出发的时候，走到离自己最近的点，由此我们每次都保证走最近的，那从局部最近推整体最近，必有一条路是整体最近的。所以我们可以利用BFS做最短路问题。

BFS 的实现靠的是**队列**而不是递归：

1. 把起点放入队列并标记已访问；
2. 取出队头节点，枚举它的所有邻居，把还没访问过的邻居入队并标记；
3. 重复直到队列为空（或提前找到目标）。

**为什么 BFS 能求最短路？** 队列"先进先出"的特性保证了节点的出队顺序就是**离起点的距离从小到大**：距离为 0 的起点先出队，然后是所有距离为 1 的点，再是距离为 2 的点……当目标节点第一次被访问时，走过的距离就是最短距离。严格来说，这要求**每条边的代价都相同**（比如走迷宫每步代价都是 1）。如果边权不同，BFS 就不再适用，需要改用后面要学的 Dijkstra 等最短路算法。

**实现细节：**

- 常用一个距离数组 `dist` 同时兼任访问标记：`dist = -1` 表示还没到过，其他值表示到起点的距离。这样第一次到达某个点时记录的距离一定就是最短距离，不需要反复更新。
- 每个节点最多入队一次，因此总复杂度为 O(点数 + 边数)，即 O(V + E)。
- BFS 适合求最短步数、最少操作次数、层序遍历、无向无权图的连通性等问题。

**DFS 与 BFS 对比：**

| 对比项 | DFS | BFS |
|--------|-----|-----|
| 使用的数据结构 | 递归（系统栈） | 队列 |
| 遍历顺序 | 一条路走到黑，再回溯 | 一层一层向外扩散 |
| 找最短路（边权相同） | 不保证 | 第一次到达即为最短 |
| 空间 | 递归深度 O(h) | 可能同时存下一整层节点 O(w) |
| 典型用途 | 枚举所有方案、回溯、连通块 | 最短步数、最少操作、层序遍历 |

## (1)走迷宫

> ---
>
> 给定一个 $n \times m$ 的二维整数数组，用来表示一个迷宫，数组中只包含 $0$ 或 $1$，其中 $0$ 表示可以走的路，$1$ 表示不可通过的墙壁。
>
> 最初，有一个人位于左上角 $(1,1)$ 处，已知该人每次可以向上、下、左、右任意一个方向移动一个位置。
>
> 请问，该人从左上角移动至右下角 $(n,m)$ 处，至少需要移动多少次。
>
> 数据保证 $(1,1)$ 处和 $(n,m)$ 处的数字为 $0$，且一定至少存在一条通路。
>
> ### 输入格式
>
> 第一行包含两个整数 $n$ 和 $m$。
>
> 接下来 $n$ 行，每行包含 $m$ 个整数（$0$ 或 $1$），表示完整的二维数组迷宫。
>
> ### 输出格式
>
> 输出一个整数，表示从左上角移动至右下角的最少移动次数。
>
> ### 数据范围
>
> $1 \le n,m \le 100$
>
> ### 输入样例：
>
> 5 5 
>
> 0 1 0 0 0 
>
> 0 1 0 1 0 
>
> 0 0 0 0 0 
>
> 0 1 1 1 0 
>
> 0 0 0 1 0



```java
package JUC;
import java.util.ArrayDeque;
import java.util.LinkedList;
import java.util.Queue;
import java.util.Scanner;

public class Main {
    public static int n1;
    public static int m1;
    public static int[] x = {-1, 0, 1, 0};
    public static int[] y = {0, 1, 0, -1};
    public static int[][] map = new int[30][30];
    public static int[][] mark = new int[30][30];

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        n1 = sc.nextInt();
        m1 = sc.nextInt();
        for (int i = 0; i < 30; i++) {
            for (int j = 0; j < 30; j++) {
                mark[i][j] = -1;
            }
        }
        for (int i = 0; i < n1; i++) {
            for (int j = 0; j < m1; j++) {
                map[i][j] = sc.nextInt();
            }
        }

        Main main = new Main();
        main.bfs();
    }

    public void bfs() {
        LinkedList<Pair> arrayDeque = new LinkedList<>();
        arrayDeque.offer(new Pair(0, 0));
        mark[0][0] = 0;
        while (!arrayDeque.isEmpty()) {
            Pair top = arrayDeque.peek();
            for (int i = 0; i < 4; i++) {
                int nex = top.x + x[i];
                int ney = top.y + y[i];
                if (nex >= 0 && nex < n1 && ney >= 0 && ney < m1 && mark[nex][ney] == -1 && map[nex][ney] == 0) {

                    mark[nex][ney] = mark[top.x][top.y] + 1;
                    arrayDeque.offer(new Pair(nex, ney));
                }
            }
            arrayDeque.poll();
        }
        System.out.println(mark[n1 - 1][m1 - 1]);
    }
    class Pair {
        public int x;
        public int y;

        public Pair(int x, int y) {
            this.x = x;
            this.y = y;
        }
    }

}

```

## 总结

- **DFS = 递归 + 回溯 + 剪枝**，适合"穷举所有方案"类问题；写 DFS 时牢记四步：递归出口 → 枚举选择 → 进入下一层 → 恢复现场。
- **BFS = 队列 + 距离数组**，适合"最少步数 / 最短路（边权相同）"类问题；每个节点只入队一次，第一次到达即为最短距离。
- 二者的本质都是遍历状态空间：DFS 纵向深入，BFS 横向铺开。选哪个，取决于题目要"所有方案"还是"最短方案"。
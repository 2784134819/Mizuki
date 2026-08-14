---
title: "算法入门之Trie树"
published: 2026-03-12
description: "Trie 字典树入门，讲解如何利用公共前缀高效存储与查找字符串集合，附插入与查询的 Java 实现。"
tags: [算法入门, Trie, 字典树]
category: "算法入门"
draft: false
---



## Trie树

>  Trie树（字典树）是用来快速存储和查找字符串集合的数据结构。
>
>  Trie 树把“公共前缀”变成共享路径，用空间换时间，**所有前缀相关操作**都能 O(L) 搞定（L 为字符串长度）。
>
>  举例来说，在下面这组字符串中，"abcdef"、"abdef"、"abcx" 都以 "ab" 开头，于是它们在树中共享同一条 "a → b" 的路径，之后再各自分叉。这样做一方面避免了公共前缀的重复存储，另一方面让"查找某个字符串是否出现过 / 出现过几次"只需要顺着路径走一遍——复杂度只与字符串长度有关，与集合里存了多少个字符串无关。
>
>  在 Trie 树中：
>
>  1. **根节点**不包含字符，除根节点外的每一个节点都只包含一个字符。
>  2. 从根节点到某一个节点，路径上经过的字符连接起来，为该节点对应的**字符串**。
>  3. 每个节点的所有子节点包含的字符都不相同。
>  4. 通常在节点中设置一个布尔标志 `isEndOfWord`，标记该节点是否为一个单词的结尾。（在下面的代码实现中，这个标志就是 `cnt[p]`：在结尾节点上计数，`cnt[p] > 0` 表示存在以该节点结尾的单词，数值则表示该单词出现的次数。）
>

```
abcdef
abdef
aced
bcgg
ffgc
abcx
jihu
```

**Trie 的插入与查询流程（结合下面的代码理解）：**

- 用 `son[p][u]` 记录"节点 p 的第 u 条边指向的子节点编号"，`u` 由字符映射而来（如小写字母 `str.charAt(i) - 'a'`，取值 0~25）；`son[p][u] == 0` 表示这条边还不存在。
- 用一个全局计数器 `idx` 做**动态开点**：每次需要新建节点时就 `++idx` 分配一个新编号。根节点固定为编号 0。
- **插入 insert：** 从根节点 0 出发，逐字符沿边走；边不存在就新建节点；走到最后一个字符时，在结尾节点上执行 `cnt[p]++`，表示"又多了一个以这里结尾的单词"。
- **查询 query：** 同样从根节点出发逐字符沿边走；中途只要某条边不存在，说明集合里没有这个字符串，直接返回 0；走完全部字符后返回 `cnt[p]`，即该字符串出现的次数。
- **复杂度：** 插入与查询都只与字符串长度 L 成正比，为 O(L)；若字符串全由小写字母组成，每个节点最多 26 条边，总空间约 O(字符串总长度 × 26)。

**Trie 的典型应用：** 字符串集合的插入 / 查询 / 计数、判断某串是否为前缀、统计前缀出现次数、按字典序遍历输出、最大异或对（把二进制数当作 01 串建树）等。

> ### 题目描述
>
> 维护一个字符串集合，支持两种操作：
>
> 1. `I x`：向集合中插入一个字符串 `x`；
> 2. `Q x`：询问一个字符串 `x` 在集合中出现了多少次。
>
> 共有 `N` 个操作，输入的字符串总长度不超过 10^5，字符串仅由小写英文字母组成。
>
> ------
>
> ### 输入格式
>
> 第一行包含一个整数 `N`，表示操作数。
> 接下来 `N` 行，每行包含一个操作指令，指令为 `"I x"` 或 `"Q x"` 中的一种。
>
> ------
>
> ### 输出格式
>
> 对于每个询问指令 `"Q x"`，都要输出一个整数作为结果，表示 `x` 在集合中出现的次数。每个结果占一行。

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;
public class Main{
    static int idx = 0;//记录当前用到了哪个节点
    static int[][] son = new int[100010][26];//节点 p 的 第 u 条边指向的子节点编号（0 表示空）
    static int[] cnt  = new int[100010];//以节点 p 结尾的单词出现次数


    public static void insert(String str){
        int p = 0;
        for(int i = 0 ;i<str.length();i++){
            int u = str.charAt(i) - 'a';
            if(son[p][u] == 0 ) son[p][u] = ++idx;
            p = son[p][u];
        }
        cnt[p]++;

    }
    public static int query(String str){
        int p = 0;
        for(int i = 0;i<str.length();i++){
            int u = str.charAt(i) - 'a';
            if(son[p][u] == 0) return 0;
            p = son[p][u];

        }
        return cnt[p];
    }
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int N = Integer.parseInt(br.readLine());
        StringBuilder out = new StringBuilder();
        //用来累积所有查询结果，最后 一次性输出，减少 IO 次数，提速。
        while (N-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            //把一行按 空格 切成多个 token，比 split() 更快。
            char op = st.nextToken().charAt(0);
            String str = st.nextToken();
            if (op == 'I') insert(str);
            else{
                out.append(query(str)).append('\n');
            }           
        }
        System.out.print(out);
    }
}
```

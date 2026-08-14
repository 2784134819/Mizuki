---
title: "算法入门之Trie树"
published: 2026-03-12
description: "Trie 字典树入门，讲解如何利用公共前缀高效存储与查找字符串集合，附插入与查询的 Java 实现。"
tags: [算法, 数据结构, 字典树, Trie, Java]
category: "算法入门"
draft: false
---



## Trie树

>  Trie树是用来快速存储和查找字符串集合的数据结构
>
>  Trie 树把“公共前缀”变成共享路径，用空间换时间，**所有前缀相关操作**都能 O(L) 搞定
>
>  在 Trie 树中：
>
>  1. **根节点**不包含字符，除根节点外的每一个节点都只包含一个字符。
>  2. 从根节点到某一个节点，路径上经过的字符连接起来，为该节点对应的**字符串**。
>  3. 每个节点的所有子节点包含的字符都不相同。
>  4. 通常在节点中设置一个布尔标志 `isEndOfWord`，标记该节点是否为一个单词的结尾。
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

# 第 2 块板「nextval 先按你的理解写」

老师写在板顶的话：next 全对。还是这个串，规则我先不讲：nextval 你按自己现在的理解写一遍，写错了没关系，我要看你是怎么想的。

六个数空格隔开。交上来以后，再用一句话告诉我：你是怎么从 next 得到 nextval 的？

## nextval 先按你的理解写
模式串 $T=$ `ababaa`，你刚求出的 next（页面判过对）：

| $j$ | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| $T[j]$ | a | b | a | b | a | a |
| $next[j]$ | 0 | 1 | 1 | 2 | 3 | 4 |

【演示 kmp q-nv1】写出 nextval 数组
  输入：pattern: ababaa
  写出模式串 ababaa 的 nextval 数组（从 j = 1 开始）。
  （写出结果）


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）
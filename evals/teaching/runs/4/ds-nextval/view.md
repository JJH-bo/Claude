# 第 1 块板「热身：先求 next」

老师写在板顶的话：nextval 是从 next 来的，所以先热身：这个短串的 next 你自己写一遍，口径照王道（从 1 数，$next[1]=0$）。

六个数用空格隔开写，写完交上来；拿不准的格子也先按你的想法填。

## 热身：先求 next
模式串 $T=$ `ababaa`，位置从 1 数。

【演示 kmp q-next1】写出 next 数组
  输入：pattern: ababaa
  写出模式串 ababaa 的 next 数组（从 j = 1 开始）。
  （写出结果）


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）
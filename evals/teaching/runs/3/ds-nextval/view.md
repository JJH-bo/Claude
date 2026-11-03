# 第 1 块板「热身：求 next」

老师写在板顶的话：好，先热个身：nextval 是从 next 来的，我们先把 next 算一遍。下面这个串，你写出它的 next 数组。

六个数按位置 1 到 6 写，空格隔开就行。

## 热身：求 next
【演示 kmp q-next1】写出 next 数组
  输入：pattern: aabaac
  写出模式串 aabaac 的 next 数组（从 j = 1 开始）。
  （写出结果）

# 常驻栏
## 口径（王道）
位置从 1 数；$next[1]=0$；$next[j]$ = $T[1..j-1]$ 最长相等前后缀的长度 $+1$。


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）
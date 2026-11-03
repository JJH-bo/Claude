# 第 5 块板「一格格求 nextval」

老师写在板顶的话：对，停在 2，理由也说清了：相同就接着退，遇到不同（或退到 0）就停。我把「什么时候停」补进常驻栏。现在把一整个串的 nextval 从左到右求一遍，每一格先你猜，再看页面怎么算。

每一格照你刚才的退法猜；猜完留意页面每一格是怎么得出来的，有没有比一路退更快的办法。

## 一格格求 nextval
【演示 kmp k-nv1】ababaab 的 nextval
  输入：pattern: ababaab
  第 6 步：T[1..5] = ababa：最长的相等前后缀是「aba」（长 3），所以 next[6] = 3 + 1 = 4。
  第 7 步：T[1..6] = ababaa：最长的相等前后缀是「a」（长 1），所以 next[7] = 1 + 1 = 2。
  第 8 步：再求 nextval：nextval[1] = 0；j ≥ 2 时，如果 T[j] = T[next[j]]，失配后退到 next[j] 还是会失配，所以 nextval[j] = nextval[next[j]]；不相等就是 next[j]。
  第 9 步：nextval[1] = 0。
  第 1 / 6 问（走到第 10 步之前）：nextval[2] 是多少？
  （写出来）

# 常驻栏
## 口径（王道）
位置从 1 数；$next[1]=0$；$next[j]$ = $T[1..j-1]$ 最长相等前后缀的长度 $+1$。
## 白比和停下
在 $j$ 失配、退到 $k=next[j]$：若 $T[k]=T[j]$，必然失配（白比），接着退；$T[k]\ne T[j]$ 或退到 0 就停。停下的位置就是 $nextval[j]$。


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）
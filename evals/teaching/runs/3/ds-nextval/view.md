# 第 5 块板「一格格求 nextval」

老师写在板顶的话：对，$T[2]\ne T[1]$，不白比，停在 $next[2]=1$。接着点「下一步」，后面几格照样先猜，猜的时候说一句你退到了哪。

## 一格格求 nextval
【演示 kmp k-nv1】ababaab 的 nextval
  输入：pattern: ababaab
  第 7 步：T[1..6] = ababaa：最长的相等前后缀是「a」（长 1），所以 next[7] = 1 + 1 = 2。
  第 8 步：再求 nextval：nextval[1] = 0；j ≥ 2 时，如果 T[j] = T[next[j]]，失配后退到 next[j] 还是会失配，所以 nextval[j] = nextval[next[j]]；不相等就是 next[j]。
  第 9 步：nextval[1] = 0。
  第 10 步：T[2] = 'b' 和 T[1] = 'a' 不相等：nextval[2] = next[2] = 1。
  第 2 / 6 问（走到第 11 步之前）：nextval[3] 是多少？
  （写出来）

# 常驻栏
## 口径（王道）
位置从 1 数；$next[1]=0$；$next[j]$ = $T[1..j-1]$ 最长相等前后缀的长度 $+1$。
## 白比和停下
在 $j$ 失配、退到 $k=next[j]$：若 $T[k]=T[j]$，必然失配（白比），接着退；$T[k]\ne T[j]$ 或退到 0 就停。停下的位置就是 $nextval[j]$。


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）
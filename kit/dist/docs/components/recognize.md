### recognize：认方法快练（只认方法，不计算）

一次出一题，我点一个方法，再写一句「凭题目里的什么特征」，马上看对错、标准方法和原因（练认不出该用哪个方法）。

```recognize
id: rec-power-1
title: 认方法
methods: 秩一公式 | 试算低次幂 | 拆 kE+B 二项展开 | 分块对角 | 其他
reason: true
shuffle: true

item: $A=\begin{bmatrix}1&-1&1\\-1&1&-1\\1&-1&1\end{bmatrix}$，求 $A^{10}$
answer: 秩一公式
why: 三行成比例，$A^n=[\operatorname{tr}A]^{n-1}A$

```

`answer:` 可以用 `|` 写多个可接受的方法（必须是 `methods` 里的名字）。

- `reason: true` 时要写理由，`shuffle: true` 打乱题序。每题计时（不扣分），做完有小结，可以「只重做错的」。题目之间空一行，每题 `item:` / `answer:` / `why:`。

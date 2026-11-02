# 模拟课 la-outer（线代，计划块开）

## 第 1 轮 · 老师

````board plan
目标：学生自己推出 A=αβᵀ 时 A²=(βᵀα)A、Aⁿ=(βᵀα)ⁿ⁻¹A，再用 tr A=βᵀα 做 3 维真题
猜：还不确定；常见卡点是把 βᵀα 当成矩阵、分不清 αβᵀ 和 βᵀα 的形状
证实：先让学生亲手算具体 2×2 的 A²，看能否自己发现 A² 是 A 的 5 倍
````

好，我们从一个具体的矩阵开始。先别管公式，自己动手算一下 $A^2$。

````board pin id=k1 title="这节课的记号"
$\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$
````

````board new id=b1 title="先算一个 A²"
```let
a = [1, 3]
b = [2, 1]
A = a*b'
```

$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\begin{bmatrix}1\\3\end{bmatrix}\begin{bmatrix}2&1\end{bmatrix}=\calc{A}$

```draft
id: dr-b1
title: 草稿区
note: 用 Apple Pencil 在这里演算。
height: 200
```

```answer
id: q-b1
title: 算 A²
q: 设 $A=\calc{A}$，计算 $A^2$。
answer: A^2
before: A^2 =
hint: $A^2$ 的 $(1,1)$ 位是 $A$ 的第一行和第一列的点积：$2\cdot2+1\cdot6$。
explain: $A^2=\calc{A^2}$。
```
````

算完填进格子，点「检查」。


### 学生看到的

# 第 1 块板「先算一个 A²」

老师写在板顶的话：好，我们从一个具体的矩阵开始。先别管公式，自己动手算一下 $A^2$。

算完填进格子，点「检查」。

## 先算一个 A²
$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\begin{bmatrix}1\\3\end{bmatrix}\begin{bmatrix}2&1\end{bmatrix}=\calc{A}$

【draft dr-b1】
  id: dr-b1
  title: 草稿区
  note: 用 Apple Pencil 在这里演算。
  height: 200

【作答题 q-b1】算 A²
  设 $A=\calc{A}$，计算 $A^2$。
  （写出答案）

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 2 轮 · 学生

[作答] b1 里的 answer q-b1「算 A²」：填了 [[10,5],[30,15]]（对，第 1 次）
[动作] b1 里的组件 q-b1：学生标了「有把握」

## 第 3 轮 · 老师

算对了。把你的 $A^2$ 和 $A$ 摆在一起看，有什么关系？

````board add id=b2 title="A² 和 A 比一比"
$A=\calc{A}\qquad A^2=\calc{A^2}$

```answer
id: q-b2
title: A² 是 A 的几倍
q: 你算出的 $A^2$ 能写成 $k\,A$ 吗？$k$ 是多少？
answer: 5
before: A^2 =
after: \,A
hint: 每个位置都拿 $A^2$ 的数除以 $A$ 的数，比如 $(1,1)$ 位：$10\div 2$。
```
````


### 学生看到的

# 第 1 块板「先算一个 A²」

老师写在板顶的话：算对了。把你的 $A^2$ 和 $A$ 摆在一起看，有什么关系？

## 先算一个 A²
$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\begin{bmatrix}1\\3\end{bmatrix}\begin{bmatrix}2&1\end{bmatrix}=\calc{A}$

【draft dr-b1】
  id: dr-b1
  title: 草稿区
  note: 用 Apple Pencil 在这里演算。
  height: 200

【作答题 q-b1】算 A²
  设 $A=\calc{A}$，计算 $A^2$。
  （写出答案）

## A² 和 A 比一比
$A=\calc{A}\qquad A^2=\calc{A^2}$

【作答题 q-b2】A² 是 A 的几倍
  你算出的 $A^2$ 能写成 $k\,A$ 吗？$k$ 是多少？
  （写出答案）

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 4 轮 · 学生

每个数都是A里对应的5倍，好像是5？
[作答] b2 里的 answer q-b2「A² 是 A 的几倍」：填了 5（对，第 1 次）
[动作] b2 里的组件 q-b2：学生标了「没把握」——这题答对了，但没把握，按没过处理（红线 5）

## 第 5 轮 · 老师

你的理由是对的：每个元素都是 $A$ 的 5 倍，这正是数乘 $5A$（scalar multiple）的意思，所以 $A^2=5A$。再用它往前走一步，不用再乘矩阵：

````board new id=b3 title="再多乘一次"
```let
a = [1, 3]
b = [2, 1]
A = a*b'
```

刚才得到：$A^2=\calc{A^2}=\boxed{5A}$

```answer
id: q-b3
title: A³ 是 A 的几倍
q: 已知 $A^2=5A$，不算矩阵乘法，$A^3$ 能写成 $k\,A$，$k$ 是多少？写一句你怎么得的。
answer: 25
before: A^3 =
after: \,A
hint: $A^3=A^2\cdot A$，先把 $A^2$ 换成 $5A$。
explain: $A^3=A^2A=(5A)A=5A^2=5\cdot5A=\calc{25}A$。
```
````


### 学生看到的

# 第 2 块板「再多乘一次」

老师写在板顶的话：你的理由是对的：每个元素都是 $A$ 的 5 倍，这正是数乘 $5A$（scalar multiple）的意思，所以 $A^2=5A$。再用它往前走一步，不用再乘矩阵：

## 再多乘一次
刚才得到：$A^2=\calc{A^2}=\boxed{5A}$

【作答题 q-b3】A³ 是 A 的几倍
  已知 $A^2=5A$，不算矩阵乘法，$A^3$ 能写成 $k\,A$，$k$ 是多少？写一句你怎么得的。
  （写出答案）

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 6 轮 · 学生

A³=A²·A=5A·A=5A²，A²又是5A，所以25A
[作答] b3 里的 answer q-b3「A³ 是 A 的几倍」：填了 25，A³=A²·A=5A·A=5A²=25A（第 1 次）
[动作] b3 里的组件 q-b3：学生标了「有把握」

## 第 7 轮 · 老师

对，每多乘一个 $A$ 就多一个因子 5。现在的问题是：这个 5 是从哪来的？回到 $A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$ 看。

````board new id=b4 title="5 从哪来"
```let
a = [1, 3]
b = [2, 1]
A = a*b'
```

```steps
id: ex-b4
title: 拆开 A²
q: $\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$。看 $A^2$ 里的 5 是怎么出来的。

step: 写成四个因子
ask: 不算数，$A^2$ 用 $\boldsymbol\alpha$、$\boldsymbol\beta$ 怎么写？
show: $A^2=(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})=\boldsymbol\alpha\,\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha\,\boldsymbol\beta^{\mathrm T}$

step: 换个括号
ask: 按结合律，中间的 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 可以先乘。它乘出来是什么形状？
choices: 一个数（1×1） | 一个 2×2 矩阵 | 一个 1×2 行向量
answer: 一个数（1×1）
show: $A^2=\boldsymbol\alpha\,(\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha)\,\boldsymbol\beta^{\mathrm T}$，$\boldsymbol\beta^{\mathrm T}$ 是 1×2、$\boldsymbol\alpha$ 是 2×1，乘出来 1×1，就是一个数。

step: 算出这个数
do: true
ask: $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 等于多少？
answer: b'*a
```
````

一步一步来：先在每一步写下你的想法，再揭开。


### 学生看到的

# 第 3 块板「5 从哪来」

老师写在板顶的话：对，每多乘一个 $A$ 就多一个因子 5。现在的问题是：这个 5 是从哪来的？回到 $A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$ 看。

一步一步来：先在每一步写下你的想法，再揭开。

## 5 从哪来
【分步例题 ex-b4】拆开 A²
  $\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$。看 $A^2$ 里的 5 是怎么出来的。
  第 1 步 写成四个因子：不算数，$A^2$ 用 $\boldsymbol\alpha$、$\boldsymbol\beta$ 怎么写？
  （写一句你的想法）

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 8 轮 · 学生

[作答] b4 里的 steps ex-b4「拆开 A²」第 1 步（写成四个因子）：填了 （第 1 次）
[动作] b4 里的组件 ex-b4：学生标了「有把握」

## 第 9 轮 · 老师

第 1 步你交上来的是空的。先确认一下：把 $A^2=A\cdot A$ 里的每个 $A$ 换成 $\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$，就是揭开的那一行，这一步你认同吗？

接着做第 2 步：选之前先想 $\boldsymbol\beta^{\mathrm T}$ 是几行几列、$\boldsymbol\alpha$ 是几行几列，在框里写一句再选。


### 学生看到的

# 第 3 块板「5 从哪来」

老师写在板顶的话：第 1 步你交上来的是空的。先确认一下：把 $A^2=A\cdot A$ 里的每个 $A$ 换成 $\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$，就是揭开的那一行，这一步你认同吗？

接着做第 2 步：选之前先想 $\boldsymbol\beta^{\mathrm T}$ 是几行几列、$\boldsymbol\alpha$ 是几行几列，在框里写一句再选。

## 5 从哪来
【分步例题 ex-b4】拆开 A²
  $\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$。看 $A^2$ 里的 5 是怎么出来的。
  第 1 步 写成四个因子：$A^2=(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})=\boldsymbol\alpha\,\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha\,\boldsymbol\beta^{\mathrm T}$
  第 2 步 换个括号：按结合律，中间的 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 可以先乘。它乘出来是什么形状？
  选项：一个数（1×1） / 一个 2×2 矩阵 / 一个 1×2 行向量

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 10 轮 · 学生

认同，把A换成αβᵀ就行。βᵀ是一行两列，α是两行一列，乘出来应该是2×2的矩阵吧
[作答] b4 里的 steps ex-b4「拆开 A²」第 2 步（换个括号）：填了 一个 2×2 矩阵（错，第 1 次）
[动作] b4 里的组件 ex-b4：学生标了「没把握」

## 第 11 轮 · 老师

````board plan
目标：学生自己推出 A²=(βᵀα)A、Aⁿ=(βᵀα)ⁿ⁻¹A，再用 tr A=βᵀα 做 3 维真题
猜：形状都认对了（1×2、2×1），但把 βᵀα 和 αβᵀ 的乘积形状弄混，以为 (1×2)(2×1) 是 2×2——缺「外面两个数决定形状」这条知识
证实：讲清形状规则后用 3 维的 uᵀv / uvᵀ 选一个数；对了再回去算 βᵀα=5
````

你的两个形状都对，错在最后一步：乘积的形状看**外面**两个数，里面两个数相等、乘完就消掉。看板上这两行对比：

````board new id=b5 title="乘积是什么形状"
$$\underbrace{\boldsymbol\beta^{\mathrm T}}_{1\times\chalk{pink}{2}}\;\underbrace{\boldsymbol\alpha}_{\chalk{pink}{2}\times 1}\;\longrightarrow\;\chalk{yellow}{1\times1}\ \text{（一个数）}$$

$$\underbrace{\boldsymbol\alpha}_{2\times\chalk{pink}{1}}\;\underbrace{\boldsymbol\beta^{\mathrm T}}_{\chalk{pink}{1}\times 2}\;\longrightarrow\;\chalk{yellow}{2\times2}\ \text{（就是 }A\text{）}$$

规则：$(m\times \chalk{pink}{n})(\chalk{pink}{n}\times p)$ 得 $\chalk{yellow}{m\times p}$。

```quiz
id: q-b5
q: 设 $\mathbf u$、$\mathbf v$ 都是 3 维列向量。下面哪一个是**一个数**？
- [x] $\mathbf u^{\mathrm T}\mathbf v$
- [ ] $\mathbf u\mathbf v^{\mathrm T}$
explain: $\mathbf u^{\mathrm T}\mathbf v$ 是 $(1\times3)(3\times1)=1\times1$；$\mathbf u\mathbf v^{\mathrm T}$ 是 $(3\times1)(1\times3)=3\times3$ 的矩阵。
```
````

选的时候，先在心里写出两个形状再看外面的数。


### 学生看到的

# 第 4 块板「乘积是什么形状」

老师写在板顶的话：你的两个形状都对，错在最后一步：乘积的形状看**外面**两个数，里面两个数相等、乘完就消掉。看板上这两行对比：

选的时候，先在心里写出两个形状再看外面的数。

## 乘积是什么形状
$$\underbrace{\boldsymbol\beta^{\mathrm T}}_{1\times\chalk{pink}{2}}\;\underbrace{\boldsymbol\alpha}_{\chalk{pink}{2}\times 1}\;\longrightarrow\;\chalk{yellow}{1\times1}\ \text{（一个数）}$$

$$\underbrace{\boldsymbol\alpha}_{2\times\chalk{pink}{1}}\;\underbrace{\boldsymbol\beta^{\mathrm T}}_{\chalk{pink}{1}\times 2}\;\longrightarrow\;\chalk{yellow}{2\times2}\ \text{（就是 }A\text{）}$$

规则：$(m\times \chalk{pink}{n})(\chalk{pink}{n}\times p)$ 得 $\chalk{yellow}{m\times p}$。

【选择题 q-b5】
  设 $\mathbf u$、$\mathbf v$ 都是 3 维列向量。下面哪一个是**一个数**？
  A. $\mathbf u^{\mathrm T}\mathbf v$
  B. $\mathbf u\mathbf v^{\mathrm T}$

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 12 轮 · 学生

哦，外面是1和1，所以是1×1？那uᵀv是数，选A
[作答] b5 里的 quiz q-b5：「设 $\mathbf u$、$\mathbf v$ 都是 3 维列向量。下面哪一个是**一个数**？」做对了（共 1 次）
[动作] b5 里的组件 q-b5：学生标了「没把握」——这题答对了，但没把握，按没过处理（红线 5）

## 第 13 轮 · 老师

你的理由对：外面是 1 和 1，所以是 1×1。光选还不够踏实，我们直接把 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 算出来，看它到底是不是一个数。

````board new id=b6 title="算出 βᵀα"
```let
a = [1, 3]
b = [2, 1]
A = a*b'
```

$\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha=\begin{bmatrix}2&1\end{bmatrix}\begin{bmatrix}1\\3\end{bmatrix}$：一行乘一列，对应相乘再相加。

```answer
id: q-b6
title: 算 βᵀα
q: $\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，计算 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$。
answer: b'*a
before: \boldsymbol\beta^{\mathrm T}\boldsymbol\alpha =
hint: $2\cdot1+1\cdot3$。
```
````

算出来以后，看看这个数在前面哪里出现过。


### 学生看到的

# 第 5 块板「算出 βᵀα」

老师写在板顶的话：你的理由对：外面是 1 和 1，所以是 1×1。光选还不够踏实，我们直接把 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 算出来，看它到底是不是一个数。

算出来以后，看看这个数在前面哪里出现过。

## 算出 βᵀα
$\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha=\begin{bmatrix}2&1\end{bmatrix}\begin{bmatrix}1\\3\end{bmatrix}$：一行乘一列，对应相乘再相加。

【作答题 q-b6】算 βᵀα
  $\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，计算 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$。
  （写出答案）

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 14 轮 · 学生

算出来是5，和前面那个5一样？
[作答] b6 里的 answer q-b6「算 βᵀα」：填了 5（对，第 1 次）
[动作] b6 里的组件 q-b6：学生标了「有把握」

## 第 15 轮 · 老师

对，就是同一个 5。看板上这一行：中间那个 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 是一个数，可以提到最前面，于是 $A^2=5A$。

````board new id=b7 title="5 就是 βᵀα"
```let
a = [1, 3]
b = [2, 1]
A = a*b'
```

```derive
id: d-b7
title: 拆开 A²
start: all
A^2 = (\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})
    = \boldsymbol\alpha\,\hl{mid}{(\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha)}\,\boldsymbol\beta^{\mathrm T}   // 结合律：中间先乘
    = \calc{b'*a}\,\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}   // 一个数可以提到前面
    = \calc{b'*a}\,A
```

```answer
id: q-b7
title: 推到 n 次
q: 已知 $A^2=5A$、$A^3=25A$。写出 $A^n$（$n\ge1$），用含 $n$ 的式子乘 $A$。
formula: n
answer: 5^(n-1)*A
before: A^n =
hint: 每多乘一个 $A$，就多一个因子 5。$A^1$ 里有几个 5？$A^2$ 里有几个？
explain: $A^n=5^{\,n-1}A=(\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha)^{n-1}A$。
```
````

````board mark target=d-b7 term=mid note="1×1：一个数，=5"
````

先用 $n=1,2,3$ 对一对你的式子，再交。


### 学生看到的

# 第 6 块板「5 就是 βᵀα」

老师写在板顶的话：对，就是同一个 5。看板上这一行：中间那个 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 是一个数，可以提到最前面，于是 $A^2=5A$。

先用 $n=1,2,3$ 对一对你的式子，再交。

## 5 就是 βᵀα
【derive d-b7】
  id: d-b7
  title: 拆开 A²
  start: all
  A^2 = (\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})
      = \boldsymbol\alpha\,\hl{mid}{(\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha)}\,\boldsymbol\beta^{\mathrm T}   // 结合律：中间先乘
      = \calc{b'*a}\,\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}   // 一个数可以提到前面
      = \calc{b'*a}\,A

【作答题 q-b7】推到 n 次
  已知 $A^2=5A$、$A^3=25A$。写出 $A^n$（$n\ge1$），用含 $n$ 的式子乘 $A$。
  （写出答案）

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,3)^{\mathrm T}$，$\boldsymbol\beta=(2,1)^{\mathrm T}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）
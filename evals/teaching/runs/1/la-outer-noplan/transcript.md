# 模拟课 la-outer（线代，计划块关）

## 第 1 轮 · 老师

好，我们从一个具体的矩阵开始。先动手算一下它的平方，算完留意一下结果和 $A$ 本身像不像。

````board pin id=k1 title="这节课的例子"
```let
a = [1, 3]
b = [2, 1]
A = a*b'
```
$\boldsymbol\alpha=\begin{bmatrix}1\\3\end{bmatrix}$，$\boldsymbol\beta=\begin{bmatrix}2\\1\end{bmatrix}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\calc{A}$
````

````board new id=b1 title="先算 A²"
$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$ 是一个列向量乘一个行向量（外积 outer product），这样的矩阵叫秩一矩阵（rank-one matrix）。

```answer
id: q-a2
title: 算 A²
q: 设 $A=\calc{A}$，直接按矩阵乘法算 $A^2$。
answer: A^2
before: A^2 =
hint: $A^2$ 的 $(1,1)$ 位是 $A$ 的第一行 $\calc{row(A, 1)}$ 和第一列 $\calc{col(A, 1)}$ 的点积。
```
````

可以先在纸上算，再填进格子。


### 学生看到的

# 第 1 块板「先算 A²」

老师写在板顶的话：好，我们从一个具体的矩阵开始。先动手算一下它的平方，算完留意一下结果和 $A$ 本身像不像。

可以先在纸上算，再填进格子。

## 先算 A²
$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$ 是一个列向量乘一个行向量（外积 outer product），这样的矩阵叫秩一矩阵（rank-one matrix）。

【作答题 q-a2】算 A²
  设 $A=\calc{A}$，直接按矩阵乘法算 $A^2$。
  （写出答案）

# 常驻栏
## 这节课的例子
$\boldsymbol\alpha=\begin{bmatrix}1\\3\end{bmatrix}$，$\boldsymbol\beta=\begin{bmatrix}2\\1\end{bmatrix}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\calc{A}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 2 轮 · 学生

算出来是 [[10,5],[30,15]]，感觉和 A 有点像，每个数都大了点？
[作答] b1 里的 answer q-a2「算 A²」：填了 [[10,5],[30,15]]（对，第 1 次）
[动作] b1 里的组件 q-a2：学生标了「有把握」

## 第 3 轮 · 老师

算对了。「大了点」可以说得更准：每个数都大了同样的倍数吗？

````board add id=b2 title="大了多少"
把 $A^2=\calc{A^2}$ 和 $A=\calc{A}$ 一格一格对着看。

```answer
id: q-k
title: A² 是 A 的几倍
q: 如果 $A^2=kA$，$k$ 是多少？
answer: b'*a
before: A^2 = 
after: A
hint: 拿同一个位置的两个数比一比，比如 $(1,1)$ 位。
```
````


### 学生看到的

# 第 1 块板「先算 A²」

老师写在板顶的话：算对了。「大了点」可以说得更准：每个数都大了同样的倍数吗？

## 先算 A²
$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$ 是一个列向量乘一个行向量（外积 outer product），这样的矩阵叫秩一矩阵（rank-one matrix）。

【作答题 q-a2】算 A²
  设 $A=\calc{A}$，直接按矩阵乘法算 $A^2$。
  （写出答案）

## 大了多少
把 $A^2=\calc{A^2}$ 和 $A=\calc{A}$ 一格一格对着看。

【作答题 q-k】A² 是 A 的几倍
  如果 $A^2=kA$，$k$ 是多少？
  （写出答案）

# 常驻栏
## 这节课的例子
$\boldsymbol\alpha=\begin{bmatrix}1\\3\end{bmatrix}$，$\boldsymbol\beta=\begin{bmatrix}2\\1\end{bmatrix}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\calc{A}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 4 轮 · 学生

对，每格都是 5 倍。10/2、5/1、30/6、15/3 都是 5。
[作答] b2 里的 answer q-k「A² 是 A 的几倍」：填了 5（对，第 1 次）
[动作] b2 里的组件 q-k：学生标了「有把握」

## 第 5 轮 · 老师

对。那这个 5 是从哪来的？不用数字，用 $\boldsymbol\alpha$、$\boldsymbol\beta$ 推一推。

````board new id=b3 title="5 从哪来"
```steps
id: ex-a2
title: 用 α、β 写 A²
q: $A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$，$\boldsymbol\alpha=\calc{a}$，$\boldsymbol\beta=\calc{b}$。说明为什么 $A^2$ 是 $A$ 的倍数。

step: 写出 A²
ask: 先别算矩阵。$A^2$ 用 $\boldsymbol\alpha$、$\boldsymbol\beta$ 怎么写？
show: $A^2=(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$

step: 换个括号
ask: 四个因子排成一排，中间的 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 先乘，乘出来是什么形状？
choices: 一个数 | 一个 2×2 矩阵 | 一个 1×2 行向量
answer: 一个数
show: 结合律（associativity）：$A^2=\boldsymbol\alpha\,(\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha)\,\boldsymbol\beta^{\mathrm T}$，$\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 是 $1\times2$ 乘 $2\times1$，一个数。

step: 算出这个数
do: true
ask: 用 $\boldsymbol\alpha$、$\boldsymbol\beta$ 的数算 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$。
answer: b'*a
show: $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha=\calc{b'*a}$，数可以提到前面：$A^2=(\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha)\,\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\calc{b'*a}A$
```
````

每一步先写你的想法，再揭开。


### 学生看到的

# 第 2 块板「5 从哪来」

老师写在板顶的话：对。那这个 5 是从哪来的？不用数字，用 $\boldsymbol\alpha$、$\boldsymbol\beta$ 推一推。

每一步先写你的想法，再揭开。

## 5 从哪来
【分步例题 ex-a2】用 α、β 写 A²
  $A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$，$\boldsymbol\alpha=\calc{a}$，$\boldsymbol\beta=\calc{b}$。说明为什么 $A^2$ 是 $A$ 的倍数。
  第 1 步 写出 A²：先别算矩阵。$A^2$ 用 $\boldsymbol\alpha$、$\boldsymbol\beta$ 怎么写？
  （写一句你的想法）

# 常驻栏
## 这节课的例子
$\boldsymbol\alpha=\begin{bmatrix}1\\3\end{bmatrix}$，$\boldsymbol\beta=\begin{bmatrix}2\\1\end{bmatrix}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\calc{A}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 6 轮 · 学生

A² 就是 A 乘 A，所以是 αβᵀαβᵀ，后面不知道怎么往下化。
[作答] b3 里的 steps ex-a2「用 α、β 写 A²」第 1 步（写出 A²）：填了 （第 1 次）
[动作] b3 里的组件 ex-a2：学生标了「没把握」

## 第 7 轮 · 老师

第一步写对了，$\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$ 就是 $A^2$。往下化的线索在形状上：矩阵乘法可以随便加括号，挑哪两个相邻的先乘都行。

````board add id=b4 title="提示：看形状"
$$\underbrace{\boldsymbol\alpha}_{2\times1}\;\underbrace{\boldsymbol\beta^{\mathrm T}}_{1\times2}\;\underbrace{\boldsymbol\alpha}_{2\times1}\;\underbrace{\boldsymbol\beta^{\mathrm T}}_{1\times2}$$

相邻的两个乘起来，哪一对乘出来最「小」？
````

带着这个想法，把第 2 步的选项选一下。


### 学生看到的

# 第 2 块板「5 从哪来」

老师写在板顶的话：第一步写对了，$\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$ 就是 $A^2$。往下化的线索在形状上：矩阵乘法可以随便加括号，挑哪两个相邻的先乘都行。

带着这个想法，把第 2 步的选项选一下。

## 5 从哪来
【分步例题 ex-a2】用 α、β 写 A²
  $A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$，$\boldsymbol\alpha=\calc{a}$，$\boldsymbol\beta=\calc{b}$。说明为什么 $A^2$ 是 $A$ 的倍数。
  第 1 步 写出 A²：$A^2=(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$
  第 2 步 换个括号：四个因子排成一排，中间的 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 先乘，乘出来是什么形状？
  选项：一个数 / 一个 2×2 矩阵 / 一个 1×2 行向量

## 提示：看形状
$$\underbrace{\boldsymbol\alpha}_{2\times1}\;\underbrace{\boldsymbol\beta^{\mathrm T}}_{1\times2}\;\underbrace{\boldsymbol\alpha}_{2\times1}\;\underbrace{\boldsymbol\beta^{\mathrm T}}_{1\times2}$$

相邻的两个乘起来，哪一对乘出来最「小」？

# 常驻栏
## 这节课的例子
$\boldsymbol\alpha=\begin{bmatrix}1\\3\end{bmatrix}$，$\boldsymbol\beta=\begin{bmatrix}2\\1\end{bmatrix}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\calc{A}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 8 轮 · 学生

β转置乘α……应该还是个 2×2 的矩阵吧？
[作答] b3 里的 steps ex-a2「用 α、β 写 A²」第 2 步（换个括号）：填了 一个 2×2 矩阵（错，第 1 次）
[动作] b3 里的组件 ex-a2：学生标了「没把握」

## 第 9 轮 · 老师

2×2 的是 $\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$（就是 $A$）。顺序反过来，形状就不一样了：乘积的形状看两头。

````board add id=b5 title="顺序一换，形状就变"
$(m\times n)(n\times p)\to m\times p$：中间的 $n$ 对上就消掉，留下两头。

$$\underbrace{\boldsymbol\alpha}_{2\times1}\underbrace{\boldsymbol\beta^{\mathrm T}}_{1\times2}\to 2\times2\qquad \underbrace{\boldsymbol\beta^{\mathrm T}}_{1\times2}\underbrace{\boldsymbol\alpha}_{2\times1}\to\ ?$$

```answer
id: q-bta
title: 用数算一下
q: 用 $\boldsymbol\beta=\calc{b}$、$\boldsymbol\alpha=\calc{a}$ 算 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$。
answer: b'*a
before: \boldsymbol\beta^{\mathrm T}\boldsymbol\alpha=\calc{b'}\calc{a}=
```
````


### 学生看到的

# 第 2 块板「5 从哪来」

老师写在板顶的话：2×2 的是 $\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$（就是 $A$）。顺序反过来，形状就不一样了：乘积的形状看两头。

## 5 从哪来
【分步例题 ex-a2】用 α、β 写 A²
  $A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$，$\boldsymbol\alpha=\calc{a}$，$\boldsymbol\beta=\calc{b}$。说明为什么 $A^2$ 是 $A$ 的倍数。
  第 1 步 写出 A²：$A^2=(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$
  第 2 步 换个括号：结合律（associativity）：$A^2=\boldsymbol\alpha\,(\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha)\,\boldsymbol\beta^{\mathrm T}$，$\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 是 $1\times2$ 乘 $2\times1$，一个数。
  第 3 步 算出这个数：用 $\boldsymbol\alpha$、$\boldsymbol\beta$ 的数算 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$。
  （自己写出这一步的结果）

## 提示：看形状
$$\underbrace{\boldsymbol\alpha}_{2\times1}\;\underbrace{\boldsymbol\beta^{\mathrm T}}_{1\times2}\;\underbrace{\boldsymbol\alpha}_{2\times1}\;\underbrace{\boldsymbol\beta^{\mathrm T}}_{1\times2}$$

相邻的两个乘起来，哪一对乘出来最「小」？

## 顺序一换，形状就变
$(m\times n)(n\times p)\to m\times p$：中间的 $n$ 对上就消掉，留下两头。

$$\underbrace{\boldsymbol\alpha}_{2\times1}\underbrace{\boldsymbol\beta^{\mathrm T}}_{1\times2}\to 2\times2\qquad \underbrace{\boldsymbol\beta^{\mathrm T}}_{1\times2}\underbrace{\boldsymbol\alpha}_{2\times1}\to\ ?$$

【作答题 q-bta】用数算一下
  用 $\boldsymbol\beta=\calc{b}$、$\boldsymbol\alpha=\calc{a}$ 算 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$。
  （写出答案）

# 常驻栏
## 这节课的例子
$\boldsymbol\alpha=\begin{bmatrix}1\\3\end{bmatrix}$，$\boldsymbol\beta=\begin{bmatrix}2\\1\end{bmatrix}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\calc{A}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 10 轮 · 学生

按乘法规则算 2×1+1×3=5。和刚才的 5 一样，巧合吗？不过我还是没看懂为什么能把中间这块提出来。
[作答] b5 里的 answer q-bta「用数算一下」：填了 5（对，第 1 次）
[作答] b3 里的 steps ex-a2「用 α、β 写 A²」第 3 步（算出这个数）：填了 （对，第 1 次）
[动作] b5 里的组件 q-bta：学生标了「有把握」
[动作] b3 里的组件 ex-a2：学生标了「没把握」——这题答对了，但没把握，按没过处理（红线 5）

## 第 11 轮 · 老师

不是巧合，这两个 5 就是同一个数。为什么能提出来，靠两条规则，一行一行看。

````board new id=b6 title="为什么能提出来"
```derive
id: d-a2
title: A² 一行一行化
A^2 = (\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})
    = \boldsymbol\alpha\,(\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha)\,\boldsymbol\beta^{\mathrm T}   // 结合律：只换括号，四个因子的**顺序没动**
    = \boldsymbol\alpha\,\calc{b'*a}\,\boldsymbol\beta^{\mathrm T}   // $1\times1$ 的矩阵就是一个数
    = \calc{b'*a}\,\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}   // 数乘矩阵就是每个元素都乘它，写在前面后面都一样
    = \calc{b'*a}A
```

```quiz
id: q-why
q: 第 3 行到第 4 行，能把 $\calc{b'*a}$ 挪到最前面，是因为：
- [ ] 矩阵乘法可以交换顺序
- [x] $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 是一个数，数乘可以写在任何位置
- [ ] $\boldsymbol\alpha$ 和 $\boldsymbol\beta$ 正好垂直
explain: 矩阵一般不能交换（$\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$ 和 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 连形状都不同），能挪的只有数。
```
````

点「下一行」看完，再选一下。


### 学生看到的

# 第 3 块板「为什么能提出来」

老师写在板顶的话：不是巧合，这两个 5 就是同一个数。为什么能提出来，靠两条规则，一行一行看。

点「下一行」看完，再选一下。

## 为什么能提出来
【derive d-a2】
  id: d-a2
  title: A² 一行一行化
  A^2 = (\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})
      = \boldsymbol\alpha\,(\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha)\,\boldsymbol\beta^{\mathrm T}   // 结合律：只换括号，四个因子的**顺序没动**
      = \boldsymbol\alpha\,\calc{b'*a}\,\boldsymbol\beta^{\mathrm T}   // $1\times1$ 的矩阵就是一个数
      = \calc{b'*a}\,\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}   // 数乘矩阵就是每个元素都乘它，写在前面后面都一样
      = \calc{b'*a}A

【选择题 q-why】
  第 3 行到第 4 行，能把 $\calc{b'*a}$ 挪到最前面，是因为：
  A. 矩阵乘法可以交换顺序
  B. $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 是一个数，数乘可以写在任何位置
  C. $\boldsymbol\alpha$ 和 $\boldsymbol\beta$ 正好垂直

# 常驻栏
## 这节课的例子
$\boldsymbol\alpha=\begin{bmatrix}1\\3\end{bmatrix}$，$\boldsymbol\beta=\begin{bmatrix}2\\1\end{bmatrix}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\calc{A}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 12 轮 · 学生

选 B，看第三行写的 1×1 就是一个数。但我之前一直以为 β转置乘α 也是个矩阵，现在有点绕。
[作答] b6 里的 quiz q-why：「第 3 行到第 4 行，能把 $\calc{b'*a}$ 挪到最前面，是因为：」做对了（共 1 次）
[动作] b6 里的组件 q-why：学生标了「没把握」——这题答对了，但没把握，按没过处理（红线 5）

## 第 13 轮 · 老师

你以前的想法没错：$\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 确实是矩阵，只不过是 $1\times1$ 的，只有一个元素，所以当数用。换一组数，自己走一遍。

````board new id=b7 title="换一组数"
```let
p = [2, -1]
q = [1, 4]
B = p*q'
```

```key
$1\times1$ 的矩阵 $[\,5\,]$ 和数 $5$ 当成一回事：乘别的矩阵时，就是数乘。
```

```answer
id: q-k2
title: 不乘矩阵，求倍数
q: $\boldsymbol\alpha=\calc{p}$，$\boldsymbol\beta=\calc{q}$，$B=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\calc{B}$。不算 $B\cdot B$，直接写出 $B^2=kB$ 里的 $k$。
answer: q'*p
before: k =
hint: $k$ 就是那个 $1\times1$ 的：$\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$，行乘列。
explain: $k=\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha=\calc{q'*p}$，所以 $B^2=\calc{q'*p}B=\calc{B^2}$。
```
````


### 学生看到的

# 第 4 块板「换一组数」

老师写在板顶的话：你以前的想法没错：$\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$ 确实是矩阵，只不过是 $1\times1$ 的，只有一个元素，所以当数用。换一组数，自己走一遍。

## 换一组数
【key （没写 id）】
  $1\times1$ 的矩阵 $[\,5\,]$ 和数 $5$ 当成一回事：乘别的矩阵时，就是数乘。

【作答题 q-k2】不乘矩阵，求倍数
  $\boldsymbol\alpha=\calc{p}$，$\boldsymbol\beta=\calc{q}$，$B=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\calc{B}$。不算 $B\cdot B$，直接写出 $B^2=kB$ 里的 $k$。
  （写出答案）

# 常驻栏
## 这节课的例子
$\boldsymbol\alpha=\begin{bmatrix}1\\3\end{bmatrix}$，$\boldsymbol\beta=\begin{bmatrix}2\\1\end{bmatrix}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\calc{A}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 14 轮 · 学生

老师，这题的 α、β 和 B 我这边没显示出具体数字（只看到空的），算不了 k，能再给一下吗？
[作答] b7 里的 answer q-k2「不乘矩阵，求倍数」：填了 （空）
[动作] b7 里的组件 q-k2：学生标了「没把握」

## 第 15 轮 · 老师

抱歉，是我写的那段没显示出来，已经重写了。这题是 $\boldsymbol\alpha=(2,-1)^{\mathrm T}$，$\boldsymbol\beta=(1,4)^{\mathrm T}$。

````board replace id=b7 title="换一组数"
```key
$1\times1$ 的矩阵 $[\,5\,]$ 和数 $5$ 当成一回事：乘别的矩阵时，就是数乘。
```

```answer
id: q-k2
title: 不乘矩阵，求倍数
let u = [2, -1]
let v = [1, 4]
let B = u*v'
q: $\boldsymbol\alpha=\begin{bmatrix}2\\-1\end{bmatrix}$，$\boldsymbol\beta=\begin{bmatrix}1\\4\end{bmatrix}$，$B=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\calc{B}$。不算 $B\cdot B$，直接写出 $B^2=kB$ 里的 $k$。
answer: v'*u
before: k =
hint: $k$ 就是那个 $1\times1$ 的：$\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$，行乘列。
explain: $k=\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha=\calc{v'*u}$，所以 $B^2=\calc{v'*u}B=\calc{B^2}$。
```
````


### 学生看到的

# 第 4 块板「换一组数」

老师写在板顶的话：抱歉，是我写的那段没显示出来，已经重写了。这题是 $\boldsymbol\alpha=(2,-1)^{\mathrm T}$，$\boldsymbol\beta=(1,4)^{\mathrm T}$。

## 换一组数
【key （没写 id）】
  $1\times1$ 的矩阵 $[\,5\,]$ 和数 $5$ 当成一回事：乘别的矩阵时，就是数乘。

【作答题 q-k2】不乘矩阵，求倍数
  $\boldsymbol\alpha=\begin{bmatrix}2\\-1\end{bmatrix}$，$\boldsymbol\beta=\begin{bmatrix}1\\4\end{bmatrix}$，$B=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\calc{B}$。不算 $B\cdot B$，直接写出 $B^2=kB$ 里的 $k$。
  （写出答案）

# 常驻栏
## 这节课的例子
$\boldsymbol\alpha=\begin{bmatrix}1\\3\end{bmatrix}$，$\boldsymbol\beta=\begin{bmatrix}2\\1\end{bmatrix}$，$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\begin{bmatrix}2 & 1 \\ 6 & 3\end{bmatrix}$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）
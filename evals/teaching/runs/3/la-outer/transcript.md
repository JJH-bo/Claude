# 模拟课 la-outer（线代，计划块关）

## 第 1 轮 · 老师

好，今天看秩一矩阵（rank-one matrix）$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$ 的幂。先从形状开始：同样两个向量，乘的顺序一换，出来的东西完全不同。

````board pin id=k1 title="这节课的记号"
```let
a = [1, 2]
b = [3, 1]
A = a*b'
```
$\boldsymbol\alpha=(1,2)^{\mathrm T}$，$\boldsymbol\beta=(3,1)^{\mathrm T}$，都是 $2\times1$ 的列向量
````

````board new id=b1 title="先看形状"
$\boldsymbol\alpha$、$\boldsymbol\beta$ 都是 $2\times1$ 的列向量，$\boldsymbol\beta^{\mathrm T}$ 是 $1\times2$ 的行。

```quiz
id: q-shape1
q: $\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$（列在前、行在后）乘出来是什么形状？
- [ ] 一个数（$1\times1$）
- [x] $2\times2$ 的矩阵
- [ ] $2\times1$ 的列向量
- [ ] 乘不了
explain: $(2\times1)(1\times2)$：外面的两个数决定形状，是 $2\times2$。
```
````

不用算具体的数，选一个就行。


### 学生看到的

# 第 1 块板「先看形状」

老师写在板顶的话：好，今天看秩一矩阵（rank-one matrix）$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$ 的幂。先从形状开始：同样两个向量，乘的顺序一换，出来的东西完全不同。

不用算具体的数，选一个就行。

## 先看形状
$\boldsymbol\alpha$、$\boldsymbol\beta$ 都是 $2\times1$ 的列向量，$\boldsymbol\beta^{\mathrm T}$ 是 $1\times2$ 的行。

【选择题 q-shape1】
  $\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$（列在前、行在后）乘出来是什么形状？
  A. 一个数（$1\times1$）
  B. $2\times2$ 的矩阵
  C. $2\times1$ 的列向量
  D. 乘不了

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,2)^{\mathrm T}$，$\boldsymbol\beta=(3,1)^{\mathrm T}$，都是 $2\times1$ 的列向量


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 2 轮 · 学生

列在前行在后，应该是 2×2 的矩阵吧。
[作答] b1 里的 quiz q-shape1：「$\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$（列在前、行在后）乘出来是什么形状？」做对了（共 1 次）
[动作] b1 里的组件 q-shape1：学生标了「有把握」

## 第 3 轮 · 老师

对，$(2\times1)(1\times2)$ 是 $2\times2$。现在把顺序反过来，行在前、列在后。

````board add id=b2 title="顺序反过来"
```quiz
id: q-shape2
q: $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$（行在前、列在后）乘出来是什么形状？
- [x] 一个数（$1\times1$）
- [ ] $2\times2$ 的矩阵
- [ ] $1\times2$ 的行向量
- [ ] 和 $\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$ 一样
explain: $(1\times2)(2\times1)$ 是 $1\times1$：一个数，就是 $\boldsymbol\beta$ 和 $\boldsymbol\alpha$ 的内积。
```
````


### 学生看到的

# 第 1 块板「先看形状」

老师写在板顶的话：对，$(2\times1)(1\times2)$ 是 $2\times2$。现在把顺序反过来，行在前、列在后。

## 先看形状
$\boldsymbol\alpha$、$\boldsymbol\beta$ 都是 $2\times1$ 的列向量，$\boldsymbol\beta^{\mathrm T}$ 是 $1\times2$ 的行。

【选择题 q-shape1】
  $\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$（列在前、行在后）乘出来是什么形状？
  A. 一个数（$1\times1$）
  B. $2\times2$ 的矩阵
  C. $2\times1$ 的列向量
  D. 乘不了

## 顺序反过来
【选择题 q-shape2】
  $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$（行在前、列在后）乘出来是什么形状？
  A. 一个数（$1\times1$）
  B. $2\times2$ 的矩阵
  C. $1\times2$ 的行向量
  D. 和 $\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$ 一样

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,2)^{\mathrm T}$，$\boldsymbol\beta=(3,1)^{\mathrm T}$，都是 $2\times1$ 的列向量


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 4 轮 · 学生

也是矩阵吧，3×3那种？这里是2×2。不太确定。
[作答] b2 里的 quiz q-shape2：「$\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$（行在前、列在后）乘出来是什么形状？」没做对，看了解析（共 1 次），选错过：「B」
[动作] b2 里的组件 q-shape2：学生标了「没把握」

## 第 5 轮 · 老师

这里缺的是一条规则：乘积的形状只看两头，中间那两个相同的数「对掉」。行乘列，对掉以后剩 $1\times1$，就是一个数。

````board new id=b3 title="形状怎么定"
$(m\times \chalk{yellow}{k})(\chalk{yellow}{k}\times n)\;\to\; m\times n$：中间的 $k$ 要相等，结果的形状是两头的 $m\times n$。

- $\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$：$(2\times\chalk{yellow}{1})(\chalk{yellow}{1}\times2)\to 2\times2$
- $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$：$(1\times\chalk{yellow}{2})(\chalk{yellow}{2}\times1)\to 1\times1$，一行乘一列，只有一个数

```matrix
id: m-bta
title: βᵀα：点一下结果里的数
let R = [[3, 1]]
let C = [[1], [2]]
product R C name=S
```

```quiz
id: q-dot3
q: 换一组 3 维的：$\mathbf u=(2,-1,3)^{\mathrm T}$，$\mathbf v=(1,4,2)^{\mathrm T}$。$\mathbf u^{\mathrm T}\mathbf v$ 等于多少？
answer: 4
explain: $(1\times3)(3\times1)\to1\times1$：$2\cdot1+(-1)\cdot4+3\cdot2=\calc{2*1+(-1)*4+3*2}$，是一个数。
```
````

上面那个乘积可以点结果看它怎么来的；下面那题填一个答案。


### 学生看到的

# 第 2 块板「形状怎么定」

老师写在板顶的话：这里缺的是一条规则：乘积的形状只看两头，中间那两个相同的数「对掉」。行乘列，对掉以后剩 $1\times1$，就是一个数。

上面那个乘积可以点结果看它怎么来的；下面那题填一个答案。

## 形状怎么定
$(m\times \chalk{yellow}{k})(\chalk{yellow}{k}\times n)\;\to\; m\times n$：中间的 $k$ 要相等，结果的形状是两头的 $m\times n$。

- $\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$：$(2\times\chalk{yellow}{1})(\chalk{yellow}{1}\times2)\to 2\times2$
- $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$：$(1\times\chalk{yellow}{2})(\chalk{yellow}{2}\times1)\to 1\times1$，一行乘一列，只有一个数

【matrix m-bta】
  id: m-bta
  title: βᵀα：点一下结果里的数
  let R = [[3, 1]]
  let C = [[1], [2]]
  product R C name=S

【选择题 q-dot3】
  换一组 3 维的：$\mathbf u=(2,-1,3)^{\mathrm T}$，$\mathbf v=(1,4,2)^{\mathrm T}$。$\mathbf u^{\mathrm T}\mathbf v$ 等于多少？

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,2)^{\mathrm T}$，$\boldsymbol\beta=(3,1)^{\mathrm T}$，都是 $2\times1$ 的列向量


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 6 轮 · 学生

按乘法规则算：2×1 + (-1)×4 + 3×2 = 4。
[作答] b3 里的 quiz q-dot3：「换一组 3 维的：$\mathbf u=(2,-1,3)^{\mathrm T}$，$\mathbf v=(1,4,2)^{\mathrm T}$。$\mathbf u^{\mathrm T}\mathbf v$ 等于多少？」做对了（共 1 次）
[动作] b3 里的组件 q-dot3：学生标了「没把握」——这题答对了，但没把握，按没过处理（红线 5）

## 第 7 轮 · 老师

算的过程没问题，结果是 4。你标了「没把握」：是哪一点让你不踏实？在下面输入框里用一句话说说就行。


### 学生看到的

# 第 2 块板「形状怎么定」

老师写在板顶的话：算的过程没问题，结果是 4。你标了「没把握」：是哪一点让你不踏实？在下面输入框里用一句话说说就行。

## 形状怎么定
$(m\times \chalk{yellow}{k})(\chalk{yellow}{k}\times n)\;\to\; m\times n$：中间的 $k$ 要相等，结果的形状是两头的 $m\times n$。

- $\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$：$(2\times\chalk{yellow}{1})(\chalk{yellow}{1}\times2)\to 2\times2$
- $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha$：$(1\times\chalk{yellow}{2})(\chalk{yellow}{2}\times1)\to 1\times1$，一行乘一列，只有一个数

【matrix m-bta】
  id: m-bta
  title: βᵀα：点一下结果里的数
  let R = [[3, 1]]
  let C = [[1], [2]]
  product R C name=S

【填空题 q-dot3】
  换一组 3 维的：$\mathbf u=(2,-1,3)^{\mathrm T}$，$\mathbf v=(1,4,2)^{\mathrm T}$。$\mathbf u^{\mathrm T}\mathbf v$ 等于多少？
  （写出答案）

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,2)^{\mathrm T}$，$\boldsymbol\beta=(3,1)^{\mathrm T}$，都是 $2\times1$ 的列向量


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 8 轮 · 学生

数是照规则乘出来的，但我不太懂它为什么就算「一个数」，感觉它还是个矩阵，只是里面算出个4。
[作答] b3 里的 quiz q-dot3：「换一组 3 维的：$\mathbf u=(2,-1,3)^{\mathrm T}$，$\mathbf v=(1,4,2)^{\mathrm T}$。$\mathbf u^{\mathrm T}\mathbf v$ 等于多少？」做对了（共 2 次）
[动作] b3 里的组件 q-dot3：学生标了「没把握」——这题答对了，但没把握，按没过处理（红线 5）

## 第 9 轮 · 老师

你的感觉没错：严格说它是一个 $1\times1$ 的矩阵 $[4]$。要看的是它和数 $4$ 用起来有没有区别，自己乘一次看看。

````board new id=b4 title="[5] 和 5 一样吗"
常驻栏里 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha=[\,\calc{b'*a}\,]$，一个 $1\times1$ 矩阵。

```answer
id: q-a11
title: 按矩阵乘法乘
q: 按矩阵乘法规则算 $(2\times1)(1\times1)$：$\begin{bmatrix}1\\2\end{bmatrix}\begin{bmatrix}\calc{b'*a}\end{bmatrix}$ 等于多少？
answer: (b'*a)*a
before: \begin{bmatrix}1\\2\end{bmatrix}\begin{bmatrix}\calc{b'*a}\end{bmatrix} =
hint: 结果是 $2\times1$：第 $i$ 行 = 左边第 $i$ 行的那个数 × 右边那一列的那个数。
explain: 第 1 行 $1\cdot\calc{b'*a}$，第 2 行 $2\cdot\calc{b'*a}$。
```
````

算完以后，拿结果和 $\boldsymbol\alpha=(1,2)^{\mathrm T}$ 比一比。


### 学生看到的

# 第 3 块板「[5] 和 5 一样吗」

老师写在板顶的话：你的感觉没错：严格说它是一个 $1\times1$ 的矩阵 $[4]$。要看的是它和数 $4$ 用起来有没有区别，自己乘一次看看。

算完以后，拿结果和 $\boldsymbol\alpha=(1,2)^{\mathrm T}$ 比一比。

## [5] 和 5 一样吗
常驻栏里 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha=[\,5\,]$，一个 $1\times1$ 矩阵。

【作答题 q-a11】按矩阵乘法乘
  按矩阵乘法规则算 $(2\times1)(1\times1)$：$\begin{bmatrix}1\\2\end{bmatrix}\begin{bmatrix}5\end{bmatrix}$ 等于多少？
  （写出答案）

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,2)^{\mathrm T}$，$\boldsymbol\beta=(3,1)^{\mathrm T}$，都是 $2\times1$ 的列向量


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 10 轮 · 学生

2×1 乘 1×1，中间都是1，结果 2×1：[5, 10] 的列。
[作答] b4 里的 answer q-a11「按矩阵乘法乘」：填了 [[5],[10]]（对，第 1 次）
[动作] b4 里的组件 q-a11：学生标了「有把握」

## 第 11 轮 · 老师

形状和数都对。再往前一步：把 $(5,10)^{\mathrm T}$ 和 $\boldsymbol\alpha=(1,2)^{\mathrm T}$ 放一起看——乘 $1\times1$ 矩阵 $[5]$，和直接乘数 $5$，结果有区别吗？在输入框里一句话说说。


### 学生看到的

# 第 3 块板「[5] 和 5 一样吗」

老师写在板顶的话：形状和数都对。再往前一步：把 $(5,10)^{\mathrm T}$ 和 $\boldsymbol\alpha=(1,2)^{\mathrm T}$ 放一起看——乘 $1\times1$ 矩阵 $[5]$，和直接乘数 $5$，结果有区别吗？在输入框里一句话说说。

## [5] 和 5 一样吗
常驻栏里 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha=[\,5\,]$，一个 $1\times1$ 矩阵。

【作答题 q-a11】按矩阵乘法乘
  按矩阵乘法规则算 $(2\times1)(1\times1)$：$\begin{bmatrix}1\\2\end{bmatrix}\begin{bmatrix}5\end{bmatrix}$ 等于多少？
  （写出答案）

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,2)^{\mathrm T}$，$\boldsymbol\beta=(3,1)^{\mathrm T}$，都是 $2\times1$ 的列向量


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 12 轮 · 学生

好像没区别，都是 α 的每个数乘5，得到 (5,10)。所以 [5] 当成5用也行？

## 第 13 轮 · 老师

对，没区别：$1\times1$ 矩阵 $[c]$ 乘上去，效果就是每个数乘 $c$，所以就把它当数 $c$ 用，还可以写到最前面。这条记在常驻栏里。下面回到这节课的 $A$，先算一个具体的 $A^2$。

````board pin id=k2 title="1×1 矩阵当数用"
$\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha=[\,c\,]$ 就当数 $c$：$\boldsymbol\alpha\,[\,c\,]=c\,\boldsymbol\alpha$
````

````board new id=b5 title="算一个 A²"
$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\begin{bmatrix}1\\2\end{bmatrix}\begin{bmatrix}3&1\end{bmatrix}=\calc{A}$

```answer
id: q-a2
title: 算 A²
q: 按矩阵乘法算 $A^2=AA$，其中 $A=\calc{A}$。
answer: A*A
before: A^2 =
hint: $(1,1)$ 位是 $A$ 的第一行和第一列的点积。
explain: $A^2=\calc{A*A}$。
```
````

算出来以后，看看它和 $A$ 长得像不像。


### 学生看到的

# 第 4 块板「算一个 A²」

老师写在板顶的话：对，没区别：$1\times1$ 矩阵 $[c]$ 乘上去，效果就是每个数乘 $c$，所以就把它当数 $c$ 用，还可以写到最前面。这条记在常驻栏里。下面回到这节课的 $A$，先算一个具体的 $A^2$。

算出来以后，看看它和 $A$ 长得像不像。

## 算一个 A²
$A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=\begin{bmatrix}1\\2\end{bmatrix}\begin{bmatrix}3&1\end{bmatrix}=\begin{bmatrix}3 & 1 \\ 6 & 2\end{bmatrix}$

【作答题 q-a2】算 A²
  按矩阵乘法算 $A^2=AA$，其中 $A=\begin{bmatrix}3 & 1 \\ 6 & 2\end{bmatrix}$。
  （写出答案）

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,2)^{\mathrm T}$，$\boldsymbol\beta=(3,1)^{\mathrm T}$，都是 $2\times1$ 的列向量
## 1×1 矩阵当数用
$\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha=[\,c\,]$ 就当数 $c$：$\boldsymbol\alpha\,[\,c\,]=c\,\boldsymbol\alpha$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 14 轮 · 学生

算出来是 [[15,5],[30,10]]，好像是 A 的 5 倍？
[作答] b5 里的 answer q-a2「算 A²」：填了 [[15,5],[30,10]]（对，第 1 次）
[动作] b5 里的组件 q-a2：学生标了「有把握」

## 第 15 轮 · 老师

对，正好是 $5A$。这个 $5$ 前面出现过。下面不看具体的数，用 $\boldsymbol\alpha$、$\boldsymbol\beta$ 推一遍，看 $5$ 是从哪来的。

````board new id=b6 title="5 从哪来"
```steps
id: ex-a2
title: 用 α、β 推 A²
q: $A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$，$\boldsymbol\alpha$、$\boldsymbol\beta$ 是列向量。说明 $A^2$ 是 $A$ 的倍数，并说出是几倍。

step: 写出 A²
ask: 先别算矩阵。$A^2$ 用 $\boldsymbol\alpha$、$\boldsymbol\beta$ 怎么写？
show: $A^2=(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})(\boldsymbol\alpha\boldsymbol\beta^{\mathrm T})=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$

step: 换个括号
ask: 结合律允许随便加括号。四个里面，中间哪两个先乘最省事？乘出来是什么形状？
choices: 一个数 | 一个 2×2 矩阵 | 一个 1×2 行向量
answer: 一个数
show: $A^2=\boldsymbol\alpha\,\hl{mid}{(\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha)}\,\boldsymbol\beta^{\mathrm T}$，中间是 $(1\times2)(2\times1)$，一个数。

step: 把数提到前面
ask: 用常驻栏 k2 那条，把 $A^2$ 写成「一个数 × $A$」。这个数是什么？为什么能挪到前面？一句话。
show: $A^2=(\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha)\,\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}=(\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha)\,A$；这里 $\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha=\calc{b'*a}$，所以 $A^2=\calc{b'*a}A$。
```
````

每一步先在框里写你的想法，再揭开。


### 学生看到的

# 第 5 块板「5 从哪来」

老师写在板顶的话：对，正好是 $5A$。这个 $5$ 前面出现过。下面不看具体的数，用 $\boldsymbol\alpha$、$\boldsymbol\beta$ 推一遍，看 $5$ 是从哪来的。

每一步先在框里写你的想法，再揭开。

## 5 从哪来
【分步例题 ex-a2】用 α、β 推 A²
  $A=\boldsymbol\alpha\boldsymbol\beta^{\mathrm T}$，$\boldsymbol\alpha$、$\boldsymbol\beta$ 是列向量。说明 $A^2$ 是 $A$ 的倍数，并说出是几倍。
  第 1 步 写出 A²：先别算矩阵。$A^2$ 用 $\boldsymbol\alpha$、$\boldsymbol\beta$ 怎么写？
  （写一句你的想法）

# 常驻栏
## 这节课的记号
$\boldsymbol\alpha=(1,2)^{\mathrm T}$，$\boldsymbol\beta=(3,1)^{\mathrm T}$，都是 $2\times1$ 的列向量
## 1×1 矩阵当数用
$\boldsymbol\beta^{\mathrm T}\boldsymbol\alpha=[\,c\,]$ 就当数 $c$：$\boldsymbol\alpha\,[\,c\,]=c\,\boldsymbol\alpha$


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）
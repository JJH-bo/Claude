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
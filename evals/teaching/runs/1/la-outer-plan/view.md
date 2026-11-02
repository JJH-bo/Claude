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
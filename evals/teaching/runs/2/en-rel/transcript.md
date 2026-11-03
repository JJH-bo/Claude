# 模拟课 en-rel（英语，计划块关）

## 第 1 轮 · 老师

先看两句只差两个逗号的句子，不用翻译，想一想说话的人家里的情况有什么不同。

````board new id=b1 title="差两个逗号"
**A.** My brother **who lives in Beijing** is a doctor.

**B.** My brother**, who lives in Beijing,** is a doctor.

```quiz
id: q-b1
q: 哪一句暗示说话的人**不止一个**哥哥（有一个在北京，可能还有别的在别处）？
- [x] A（没有逗号）
- [ ] B（有逗号）
- [ ] 两句一样，看不出区别
explain: A 里 who lives in Beijing 用来**挑出**是哪一个哥哥（住北京的那个），说明还有别的哥哥；B 里逗号把它隔开，只是**顺便补充**一句：我（唯一的）哥哥是医生，他住北京。
```
````

选一个就行，我们从你的选择往下说。


### 学生看到的

# 第 1 块板「差两个逗号」

老师写在板顶的话：先看两句只差两个逗号的句子，不用翻译，想一想说话的人家里的情况有什么不同。

选一个就行，我们从你的选择往下说。

## 差两个逗号
**A.** My brother **who lives in Beijing** is a doctor.

**B.** My brother**, who lives in Beijing,** is a doctor.

【选择题 q-b1】
  哪一句暗示说话的人**不止一个**哥哥（有一个在北京，可能还有别的在别处）？
  A. A（没有逗号）
  B. B（有逗号）
  C. 两句一样，看不出区别


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 2 轮 · 学生

我选A，没逗号的像是在区分哪一个哥哥，所以应该不止一个吧
[作答] b1 里的 quiz q-b1：「哪一句暗示说话的人**不止一个**哥哥（有一个在北京，可能还有别的在别处）？」做对了（共 1 次）
[动作] b1 里的组件 q-b1：学生标了「没把握」——这题答对了，但没把握，按没过处理（红线 5）

## 第 3 轮 · 老师

你的理由是对的：没逗号的从句在**挑出哪一个**。你标了没把握，是不确定「有逗号就只有一个」这一边吗？先换一对句子再试一次，顺便一句话告诉我哪里不踏实。

````board new id=b2 title="换一对句子"
**A.** The students **who passed the exam** went home early.

**B.** The students**, who passed the exam,** went home early.

```quiz
id: q-b2
q: 哪一句说的是**全班学生都考过了**，而且都早早回家了？
- [ ] A（没有逗号）
- [x] B（有逗号）
- [ ] 两句一样
explain: B 的逗号把 who passed the exam 隔开，只是补充说明「这些学生（全体）都考过了」；A 没有逗号，是从学生里**挑出**考过的那部分，没考过的可能还在学校。
```
````


### 学生看到的

# 第 2 块板「换一对句子」

老师写在板顶的话：你的理由是对的：没逗号的从句在**挑出哪一个**。你标了没把握，是不确定「有逗号就只有一个」这一边吗？先换一对句子再试一次，顺便一句话告诉我哪里不踏实。

## 换一对句子
**A.** The students **who passed the exam** went home early.

**B.** The students**, who passed the exam,** went home early.

【选择题 q-b2】
  哪一句说的是**全班学生都考过了**，而且都早早回家了？
  A. A（没有逗号）
  B. B（有逗号）
  C. 两句一样


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 4 轮 · 学生

选B。不踏实的是有逗号是不是就一定只有一个、没有别的可选，感觉有点绕
[作答] b2 里的 quiz q-b2：「哪一句说的是**全班学生都考过了**，而且都早早回家了？」做对了（共 1 次）
[动作] b2 里的组件 q-b2：学生标了「没把握」——这题答对了，但没把握，按没过处理（红线 5）

## 第 5 轮 · 老师

关键不在「几个」，在于**名词本身是不是已经确定是谁**。用「删掉试试」来判断，看板上。

````board new id=b3 title="删掉试试"
把从句删掉，看前面的名词还能不能让人知道说的是谁：

- B 句删掉后：*My brother is a doctor.* 听的人知道是谁（我就那一个哥哥）→ 从句只是**补充**，加逗号。
- A 句删掉后：*My brother is a doctor.* 如果我有三个哥哥，就不知道是哪个了 → 从句在**挑出**是哪个，不加逗号。

所以「只有一个」是结果：名词已经确定（专有名词、my mother、全体学生……），从句就只能补充。

```quiz
id: q-b3
q: 哪一句写得自然？
- [ ] My mother who is a teacher lives in Shanghai.
- [x] My mother, who is a teacher, lives in Shanghai.
explain: 每个人只有一位母亲，my mother 已经确定是谁，删掉 who is a teacher 也知道说的是谁，从句只是补充，要加逗号。不加逗号会让人以为你有好几位母亲，要挑出当老师的那位。
```
````

````board pin id=k1 title="有没有逗号"
删掉从句，名词还知道是谁 → 补充说明，**加逗号**（非限制性 non-restrictive）
删掉就不知道是谁 → 挑出是哪个，**不加逗号**（限制性 restrictive）
````

选完用一句话说说：你是怎么判断的？


### 学生看到的

# 第 3 块板「删掉试试」

老师写在板顶的话：关键不在「几个」，在于**名词本身是不是已经确定是谁**。用「删掉试试」来判断，看板上。

选完用一句话说说：你是怎么判断的？

## 删掉试试
把从句删掉，看前面的名词还能不能让人知道说的是谁：

- B 句删掉后：*My brother is a doctor.* 听的人知道是谁（我就那一个哥哥）→ 从句只是**补充**，加逗号。
- A 句删掉后：*My brother is a doctor.* 如果我有三个哥哥，就不知道是哪个了 → 从句在**挑出**是哪个，不加逗号。

所以「只有一个」是结果：名词已经确定（专有名词、my mother、全体学生……），从句就只能补充。

【选择题 q-b3】
  哪一句写得自然？
  A. My mother who is a teacher lives in Shanghai.
  B. My mother, who is a teacher, lives in Shanghai.

# 常驻栏
## 有没有逗号
删掉从句，名词还知道是谁 → 补充说明，**加逗号**（非限制性 non-restrictive）
删掉就不知道是谁 → 挑出是哪个，**不加逗号**（限制性 restrictive）


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 6 轮 · 学生

选B。我只有一个妈妈，删掉从句也知道是谁，所以加逗号
[作答] b3 里的 quiz q-b3：「哪一句写得自然？」做对了（共 1 次）
[动作] b3 里的组件 q-b3：学生标了「有把握」

## 第 7 轮 · 老师

判断依据说得准。下面换成你来填关系词，注意每句有没有逗号。

````board new id=b4 title="填关系词"
```cloze
id: cz-b4
title: 填一个关系词
q: 每个空填一个关系词（who / which / that 里选）。
text: 1. Beijing, {{which|!that=这里前面有逗号，是补充说明|!who=Beijing 是地方不是人}} is the capital of China, has a history of over 3,000 years.
  2. Lu Xun, {{who|!that=这里前面有逗号，是补充说明|!which=Lu Xun 是人}} wrote *The True Story of Ah Q*, was born in Shaoxing.
  3. The book {{that|which|!who=book 是物不是人}} I bought yesterday is very interesting.
explain: 1、2 前面有逗号，是补充说明（非限制性），指物用 which、指人用 who，不用 that；3 没有逗号，在挑出是哪本书（限制性），that 和 which 都行。
```
````


### 学生看到的

# 第 4 块板「填关系词」

老师写在板顶的话：判断依据说得准。下面换成你来填关系词，注意每句有没有逗号。

## 填关系词
【填空 cz-b4】填一个关系词
  每个空填一个关系词（who / which / that 里选）。
  1. Beijing, （1）____ is the capital of China, has a history of over 3,000 years.
  （按顺序写每个空，用 | 隔开，比如 "who | has lived"）

# 常驻栏
## 有没有逗号
删掉从句，名词还知道是谁 → 补充说明，**加逗号**（非限制性 non-restrictive）
删掉就不知道是谁 → 挑出是哪个，**不加逗号**（限制性 restrictive）


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 8 轮 · 学生

[作答] b4 里的填空 cz-b4「填一个关系词」：「每个空填一个关系词（who / which / that 里选）。」写了 that（错，第 1 次）（第 1 空：这里前面有逗号，是补充说明）；页面看出来：第 1 空写成「that」：这里前面有逗号，是补充说明
[动作] b4 里的组件 cz-b4：学生标了「有把握」——答错了却有把握：多半是一个误解，先弄清学生是怎么想的

## 第 9 轮 · 老师

先别改。第 1 空你填 that 而且很有把握，我想知道你是怎么想的：用一句话说说，你选 that 的理由是什么？（比如「that 指人指物都行」，或者别的。）

````board mark target=cz-b4 blank=1 note="为什么是 that？"
````


### 学生看到的

# 第 4 块板「填关系词」

老师写在板顶的话：先别改。第 1 空你填 that 而且很有把握，我想知道你是怎么想的：用一句话说说，你选 that 的理由是什么？（比如「that 指人指物都行」，或者别的。）

## 填关系词
【填空 cz-b4】填一个关系词
  每个空填一个关系词（who / which / that 里选）。
  1. Beijing, （1）____ is the capital of China, has a history of over 3,000 years.
  （按顺序写每个空，用 | 隔开，比如 "who | has lived"）

# 常驻栏
## 有没有逗号
删掉从句，名词还知道是谁 → 补充说明，**加逗号**（非限制性 non-restrictive）
删掉就不知道是谁 → 挑出是哪个，**不加逗号**（限制性 restrictive）


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 10 轮 · 学生

我觉得 that 比较万能，指物指人都行，所以不确定用 which 还是 that 的时候我就都写 that。北京是物，那用 that 应该也可以吧？

## 第 11 轮 · 老师

「that 万能」只在**没有逗号**的限制性从句里成立。逗号后面的非限制性从句有一条硬规定：**不用 that**，指物用 which，指人用 who。所以北京那句只能是 which。看板上，再填一组。

````board new id=b5 title="逗号后面不用 that"
| | 没逗号（限制性） | 有逗号（非限制性） |
|---|---|---|
| 指物 | that / which | **which**（不用 that） |
| 指人 | who / that | **who**（不用 that） |

```cloze
id: cz-b5
title: 再填一组
q: 每个空填一个关系词（who / which / that）。
text: 1. My father, {{who|!that=前面有逗号，不用 that|!which=father 是人}} works in a hospital, often comes home late.
  2. The Yangtze River, {{which|!that=前面有逗号，不用 that|!who=river 是物}} flows through Wuhan, is the longest river in China.
  3. The man {{who|that|!which=man 是人}} helped me yesterday is my teacher.
explain: 1、2 有逗号，是补充说明：指人 who、指物 which，不用 that；3 没有逗号，在挑出是哪个人，who 和 that 都行。
```
````

````board pin id=k1 title="有没有逗号"
删掉从句，名词还知道是谁 → 补充说明，**加逗号**（非限制性 non-restrictive）：指人 who，指物 which，**不用 that**
删掉就不知道是谁 → 挑出是哪个，**不加逗号**（限制性 restrictive）：that 也行
````

填完一句话告诉我：第 3 空为什么 that 可以？


### 学生看到的

# 第 5 块板「逗号后面不用 that」

老师写在板顶的话：「that 万能」只在**没有逗号**的限制性从句里成立。逗号后面的非限制性从句有一条硬规定：**不用 that**，指物用 which，指人用 who。所以北京那句只能是 which。看板上，再填一组。

填完一句话告诉我：第 3 空为什么 that 可以？

## 逗号后面不用 that
| | 没逗号（限制性） | 有逗号（非限制性） |
|---|---|---|
| 指物 | that / which | **which**（不用 that） |
| 指人 | who / that | **who**（不用 that） |

【填空 cz-b5】再填一组
  每个空填一个关系词（who / which / that）。
  1. My father, （1）____ works in a hospital, often comes home late.
  （按顺序写每个空，用 | 隔开，比如 "who | has lived"）

# 常驻栏
## 有没有逗号
删掉从句，名词还知道是谁 → 补充说明，**加逗号**（非限制性 non-restrictive）：指人 who，指物 which，**不用 that**
删掉就不知道是谁 → 挑出是哪个，**不加逗号**（限制性 restrictive）：that 也行


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 12 轮 · 学生

填 who。逗号后面不能用 that。不过这里只有一个空，没有第3空；另外我还不太懂为什么逗号后面就不行，只是照表上记
[作答] b5 里的填空 cz-b5「再填一组」：「每个空填一个关系词（who / which / that）。」做对了（共 1 次）
[动作] b5 里的组件 cz-b5：学生标了「没把握」——这题答对了，但没把握，按没过处理（红线 5）

## 第 13 轮 · 老师

那题是我写的问题，只显示了一个空，你填的 who 是对的。至于「为什么逗号后面不行」：that 引导从句时只有「挑出是哪一个」这一种用法；逗号的意思恰好是「不挑，只补充」，两者冲突，所以英语里规定逗号后面换成 which / who。看板上这一句，两个空一个挑、一个补充。

````board new id=b6 title="一句里两个空"
```cloze
id: cz-b6
title: 一个挑，一个补充
q: 每个空填一个关系词（who / which / that），能填 that 的地方就填 that。
text: The phone {{that|which|!who=phone 是物}} I bought last week has broken, but my old phone, {{which|!that=前面有逗号，是补充说明，不用 that|!who=phone 是物}} I have used for five years, still works.
explain: 第 1 空没有逗号，从我的手机里挑出「上周买的那部」，that / which 都行；第 2 空有逗号，my old phone 已经确定是哪部，从句只是补充，只能用 which。
```
````

填完用一句话说：第 1 空为什么 that 可以？


### 学生看到的

# 第 6 块板「一句里两个空」

老师写在板顶的话：那题是我写的问题，只显示了一个空，你填的 who 是对的。至于「为什么逗号后面不行」：that 引导从句时只有「挑出是哪一个」这一种用法；逗号的意思恰好是「不挑，只补充」，两者冲突，所以英语里规定逗号后面换成 which / who。看板上这一句，两个空一个挑、一个补充。

填完用一句话说：第 1 空为什么 that 可以？

## 一句里两个空
【填空 cz-b6】一个挑，一个补充
  每个空填一个关系词（who / which / that），能填 that 的地方就填 that。
  The phone （1）____ I bought last week has broken, but my old phone, （2）____ I have used for five years, still works.
  （按顺序写每个空，用 | 隔开，比如 "who | has lived"）

# 常驻栏
## 有没有逗号
删掉从句，名词还知道是谁 → 补充说明，**加逗号**（非限制性 non-restrictive）：指人 who，指物 which，**不用 that**
删掉就不知道是谁 → 挑出是哪个，**不加逗号**（限制性 restrictive）：that 也行


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）

## 第 14 轮 · 学生

第1空没有逗号，是在挑出是哪一部手机（上周买的那部），所以 that 可以；第2空有逗号只是补充，要用 which。这样 that 就不是万能的了，我有点明白了
[作答] b6 里的填空 cz-b6「一个挑，一个补充」：「每个空填一个关系词（who / which / that），能填 that 的地方就填 that。」做对了（共 1 次）
[动作] b6 里的组件 cz-b6：学生标了「有把握」

## 第 15 轮 · 老师

第 1 空的理由说得对：没有逗号，是在挑出哪一部。下面换成改错：句子里有一处关系词用错了，先点出来，再改。

````board new id=b7 title="找出用错的词"
```errfind
id: ef-b7
q: 句中有一个关系词用错了，点出来并改正。
text: I visited the museum that my teacher recommended, that was built in 1925.
wrong: that#2
fix: which | !who=museum 是物，不是人
decoys: that=这里没有逗号，是在挑出哪一座博物馆，that 没错
explain: 第一个 that 前面没有逗号，挑出「老师推荐的那座」，that 可以；第二个 that 前面有逗号，只是补充「它建于 1925 年」，要用 which。
```
````


### 学生看到的

# 第 7 块板「找出用错的词」

老师写在板顶的话：第 1 空的理由说得对：没有逗号，是在挑出哪一部。下面换成改错：句子里有一处关系词用错了，先点出来，再改。

## 找出用错的词
【改错 ef-b7】句中有一个关系词用错了，点出来并改正。
  I visited the museum that my teacher recommended, that was built in 1925.
  （写成 "错的词 → 改成什么"，比如 "are → is"）

# 常驻栏
## 有没有逗号
删掉从句，名词还知道是谁 → 补充说明，**加逗号**（非限制性 non-restrictive）：指人 who，指物 which，**不用 that**
删掉就不知道是谁 → 挑出是哪个，**不加逗号**（限制性 restrictive）：that 也行


（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）
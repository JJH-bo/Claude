# 教学尺子（模拟学生）

`evals/` 量的是「老师写的东西对不对」（一次写对率）；这里量的是**老师教得好不好**：给一个带着设定好的误解的模拟学生上课，看老师多久把误解问出来、是不是针对它讲、守没守红线。见 `docs/learning-plan.md` 第 4 节。

## 怎么搭的

- `scenarios/*.json`：一个场景一个文件：科目、资料包（`pack`，和真课一样）、学生的设定（`persona`，只给扮学生的子代理看）、误解（`misconception`）和评分细则（`rubric`，只给评卷人看）。
- `tools/teach-sim.mjs`：一节模拟课的「页面」。老师和学生不直接对话，都经过它：
  - 老师的输出用真的 `protocol.js` 读、按真的规矩上黑板；
  - 学生看到的板面去掉了答案（`answer:`、`[x]`、`show:` 这些都不给）；
  - 学生的作答由它判分（steps 的选项、quiz、answer 的数和矩阵），用真的 `actionText` 写成课堂里一样的 `[作答]` / `[动作]` 行，连同真的「黑板现状」（和教学计划）发回给老师。
- 老师：子代理（和课堂一样的模型），开头读一次整份课堂说明 `system.md`（真的 `buildSystem` 拼的），之后每一轮读页面发来的 `to-teacher.md`。和真课的差别：真课每一轮整份说明重发，这里只发一次、之后发变化的部分（黑板现状、计划、学生）。
- 学生：子代理（便宜一点的模型），照 `persona` 演，误解前后一致、不主动说出来。
- 模拟课里学生只能答 `steps`、`quiz`、`answer`（演示组件、图、英语的四个组件判不了分），老师的说明里写了。

## 跑一轮

```bash
node tools/teach-sim.mjs init evals/teaching/runs/<轮>/<场景>-plan evals/teaching/scenarios/<场景>.json
node tools/teach-sim.mjs init evals/teaching/runs/<轮>/<场景>-noplan evals/teaching/scenarios/<场景>.json --no-plan
```

1. 每个目录开一个老师子代理、一个学生子代理（说明照 `runs/1/` 那一轮的写法：老师不许看场景文件和学生那边的文件，学生不许看老师那边的）。
2. 轮流：老师写 `t-N.txt` → `teach-sim.mjs teacher`；学生写 `s-N.json` → `teach-sim.mjs student`。每节 8 轮左右。
3. `node tools/teach-sim.mjs transcript <目录>` 写 `transcript.md`；`node tools/teach-sim.mjs score <目录…>` 出页面能算的指标。
4. 一个评卷子代理读 `transcript.md` 和场景的 `misconception`、`rubric`，照下面的细则打分。
5. 结果写进 `results.md`。

只在改了课堂的提示词、教法、协议时跑；一轮 6 节课大约相当于上一两节真课的额度（花的是开发会话的额度，不是上课的）。

## 评卷细则（每节课）

- **看出误解**：第几轮老师第一次用一个具体的问题把误解暴露出来（问形状、设计出能区分两种做法的那一步……）；暴露以后第几轮老师明确说出（或在计划里写出）学生是怎么想的。没看出来记「没有」。
- **针对着讲**：看出来以后是针对那一条讲（1–3 分：3 = 只讲错的那一步、用一个具体例子说服；1 = 整段重讲定义）。
- **确认**：讲完有没有换一道新题让学生自己再做一遍（有 / 没有）。
- **红线**：红线 1（一次只推进一件事）、2（学生没作答不往下推）、5（「没把握」按没过处理）、6（不宣布掌握）、8（话要短），各犯了几次，举出轮次。
- **总体**：1–5 分，一句话理由。

### errfind：英语改错（点出用错的词，再写改成什么）

```errfind
id: e-neither
q: 找出句中的错误并改正。
text: Neither of the answers are correct.
wrong: are
fix: is
explain: neither of 做主语，谓语用单数。
```

- `wrong:` 写 `text` 里用错的那个词（同一个词出现几次时写 `are#2`）；`fix:` 写改成什么（几种都对时 `a | b`），不写 `fix:` 就只要求点出来。
- 我点错了词，页面只说「这个词用得没错」；点对了、改错了说「找对了，改得不对」。
- 多了一个词的错（`which I bought it` 里的 `it`）：`fix: 删掉`，我点「删掉这个词」或写「删」都算对。
- 常见的错法：`fix: is | !were=neither 做主语看成单数`（改成常见的错写法时的提示）；`decoys: Neither=neither 本身没错，看谓语`（常被误点的词和为什么它没错，几个用 `;` 隔开，出现几次的写 `the#2`）。

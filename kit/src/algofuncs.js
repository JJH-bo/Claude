// 表达式里的算法函数：next(s)、nextval(s)、faults(refs, 块数, 算法)、victims(…)、wpl(权值)。
// 用演示组件的引擎算（和画面上的一模一样），practice 的 where 拿它保证题目能分开两种想法：
//   pick v = seq(12, 0, 5)
//   where faults(v, 3, lru) != faults(v, 3, fifo)
// \calc 里也能用：$\calc{list(nextval(p))}$。exact.js 不能 import 引擎（会绕成圈），这里注册进去（useFuncs）
import { Q, isQ, useFuncs } from './exact.js';
import { kmpEngine } from './engines/search.js';
import { pagingEngine } from './engines/os.js';
import { huffmanEngine } from './engines/huffman.js';

// 参数 → 文字：取到的词 / 串（Shown 的 digits）、数、向量（空格隔开）
const text = (x, what) => {
  if (Array.isArray(x)) return x.map((y) => text(y, what)).join(' ');
  if (isQ(x)) return x.toString();
  if (x && typeof x.digits === 'string') return x.digits;
  throw new Error(`${what}写不出来`);
};
const nums = (arr) => arr.slice(1).map((v) => Q.int(v));

function kmp(s, show) {
  const pattern = text(s, 'next() 里的模式串');
  const r = kmpEngine.run(kmpEngine.parse({ pattern, show }));
  return r;
}
function paging(refs, frames, algo) {
  const i = pagingEngine.parse({ refs: text(refs, '引用串'), frames: text(frames, '物理块数'), algo: text(algo ?? 'lru', '算法') });
  return pagingEngine.run(i);
}

useFuncs({
  next: (s) => nums(kmp(s, 'next').next),
  nextval: (s) => nums(kmp(s, 'nextval').nv),
  faults: (refs, frames, algo) => Q.int(paging(refs, frames, algo).faults),
  victims: (refs, frames, algo) => paging(refs, frames, algo).victims.map((v) => {
    if (!/^-?\d+$/.test(String(v))) throw new Error('victims() 只算页号是数的引用串');
    return Q.int(Number(v));
  }),
  wpl: (w) => {
    const r = huffmanEngine.run(huffmanEngine.parse({ weights: text(w, '权值') }));
    return Q.from(Number(r.wpl));
  },
});

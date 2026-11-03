// answer 的三种新答案（纯函数，tests/anstypes.test.js）：
//   type: interval：一个数集（含参讨论「a 取何值时……」）：区间 (-∞, 1) ∪ (2, +∞)、不等式 a < 1 或 a > 2、a ≠ 1 且 a ≠ -2、
//     几个值 a = 1 或 a = -2 / {1, -2}、R（全体实数）、∅（无）。写法不同、集合一样就对；不对时说出在哪个数上不一样。
//   type: equation：线性方程（组）：平面 x + 2y - z = 3、直线、方程组（; 隔开）。同一个解集就对（两边同乘一个数、移项、换个等价的方程组都算）。
//   type: fixed：定点数（双符号位 00.1011、11.0101，单符号位 1.0110）：符号位几位、小数点在哪、从第几位开始不对。
import { calcValue, rrefOf, Q, toExact } from './exact.js';

// ———————— 数集 ————————
// 一个数集 = 按从小到大排好、互不相交的几段 [{ lo, hi, loIn, hiIn }]（lo 可以是 -Infinity，单个点 lo === hi）

const EPS = 1e-9;
const eq = (a, b) => a === b || (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= EPS * Math.max(1, Math.abs(a), Math.abs(b)));
const ALL = () => [{ lo: -Infinity, hi: Infinity, loIn: false, hiIn: false }];

function normSet(segs) {
  const s = segs.filter((x) => x.lo < x.hi || (eq(x.lo, x.hi) && x.loIn && x.hiIn)).map((x) => ({ ...x })).sort((a, b) => a.lo - b.lo || (b.loIn - a.loIn));
  const out = [];
  for (const x of s) {
    const p = out[out.length - 1];
    // 接得上（重叠，或者在同一个端点碰上而且至少一边含这个端点）就并成一段
    if (p && (x.lo < p.hi || (eq(x.lo, p.hi) && (p.hiIn || x.loIn)))) {
      if (x.hi > p.hi || (eq(x.hi, p.hi) && x.hiIn)) { p.hiIn = eq(x.hi, p.hi) ? p.hiIn || x.hiIn : x.hiIn; p.hi = Math.max(p.hi, x.hi); }
      if (eq(x.lo, p.lo)) p.loIn = p.loIn || x.loIn;
    } else out.push(x);
  }
  return out;
}
const union = (a, b) => normSet([...a, ...b]);
function complement(a) {
  const out = [];
  let lo = -Infinity, loIn = false;
  for (const x of normSet(a)) {
    out.push({ lo, hi: x.lo, loIn, hiIn: !x.loIn && x.lo !== -Infinity });
    lo = x.hi; loIn = !x.hiIn && x.hi !== Infinity;
  }
  out.push({ lo, hi: Infinity, loIn, hiIn: false });
  return normSet(out.filter((x) => !(x.lo === -Infinity && x.hi === -Infinity) && !(x.lo === Infinity)));
}
const intersect = (a, b) => complement(union(complement(a), complement(b)));
const inSet = (set, v) => set.some((x) => (v > x.lo || (eq(v, x.lo) && x.loIn)) && (v < x.hi || (eq(v, x.hi) && x.hiIn)));

// 一个数：整数、小数、分数、根号（√2、sqrt(2)）、∞
function readNum(t) {
  const s = t.replace(/\s+/g, '').replace(/[−–—]/g, '-').replace(/＋/g, '+');
  if (/^[+-]?(∞|inf|infinity|无穷大?)$/i.test(s)) return s.startsWith('-') ? -Infinity : Infinity;
  const e = s.replace(/√\(?(\d+(?:\.\d+)?)\)?/g, 'sqrt($1)');
  try {
    const v = calcValue(e, {}).float;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  } catch { /* 下面报 */ }
  throw new Error(`看不懂「${t.trim()}」（写数，比如 -2、1/3、√2；无穷写 ∞ 或 inf）`);
}

// 按最外层（不在括号里）的分隔符切开
function splitTop(s, re) {
  const out = [];
  let depth = 0, cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if ('([{'.includes(ch)) depth++;
    if (')]}'.includes(ch)) depth = Math.max(0, depth - 1);
    if (depth === 0) {
      const m = s.slice(i).match(re);
      if (m && m.index === 0) { out.push(cur); cur = ''; i += m[0].length - 1; continue; }
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

const CMP = /(<=|>=|!=|≤|≥|≠|<|>|=|＜|＞)/;
const CMPN = { '<=': '≤', '>=': '≥', '!=': '≠', '＜': '<', '＞': '>' };

/** 数集的写法 → 数集。写错了抛出中文原因 */
export function parseNumSet(text) {
  let s = String(text ?? '').trim();
  if (!s) throw new Error('还没写');
  s = s.replace(/（/g, '(').replace(/）/g, ')').replace(/［/g, '[').replace(/］/g, ']').replace(/｛/g, '{').replace(/｝/g, '}').replace(/，/g, ',').replace(/；/g, ';');
  s = s.replace(/^[a-zA-Zλμαβγθ]\s*(∈|属于|in)\s*/i, ''); // a ∈ (-∞, 1) 只看后面
  const terms = splitTop(s, /^(\s*(∪|或|or|\|\||U(?=\s*[([{])))\s*/i);
  let set = [];
  for (const term of terms) {
    if (!term) throw new Error('「或」「∪」的两边都要写东西');
    const parts = splitTop(term, /^(\s*(且|并且|and|&&|∩|,|;|、)\s*)/i);
    let cur = ALL();
    for (const p of parts) cur = intersect(cur, atom(p));
    set = union(set, cur);
  }
  return normSet(set);
}

function atom(src) {
  const s = src.trim();
  if (!s) throw new Error('有一段是空的（两个「且」「或」中间没写东西）');
  if (/^(R|ℝ|全体实数|任意实数|任意|所有实数|一切实数|\(-∞,\+?∞\)|\(-inf,\+?inf\))$/i.test(s.replace(/\s+/g, ''))) return ALL();
  if (/^(∅|空集|无|没有|不存在|无解|{})$/.test(s.replace(/\s+/g, ''))) return [];
  // 区间：(a, b)、[a, b]、(a, b]、[a, +∞)
  const iv = s.match(/^([([])(.*),(.*)([)\]])$/);
  if (iv && !CMP.test(s)) {
    const lo = readNum(iv[2]), hi = readNum(iv[3]);
    if (!(lo < hi)) throw new Error(`区间「${s}」左端点要比右端点小`);
    if ((iv[1] === '[' && lo === -Infinity) || (iv[4] === ']' && hi === Infinity)) throw new Error(`「${s}」：∞ 那一端只能写圆括号`);
    return [{ lo, hi, loIn: iv[1] === '[', hiIn: iv[4] === ']' }];
  }
  // 几个值：{1, -2}
  const pts = s.match(/^\{(.*)\}$/);
  if (pts) return normSet(splitTop(pts[1], /^,/).map(readNum).map((v) => ({ lo: v, hi: v, loIn: true, hiIn: true })));
  // 不等式（可以连着写：-1 < a ≤ 3）：一边是字母，另一边是数
  const toks = s.split(CMP).map((x) => x.trim());
  if (toks.length >= 3 && toks.length % 2 === 1) {
    const isVar = (t) => /^[a-zA-Zλμαβγθ]\w*$/.test(t) && !/^(inf|infinity)$/i.test(t);
    let cur = ALL();
    for (let i = 0; i + 2 < toks.length; i += 2) {
      const [l, op0, r] = [toks[i], toks[i + 1], toks[i + 2]];
      const op = CMPN[op0] || op0;
      if (isVar(l) === isVar(r)) throw new Error(`「${l} ${op0} ${r}」：不等式一边写字母、一边写数`);
      const v = readNum(isVar(l) ? r : l);
      // 统一成「x op v」
      const flip = { '<': '>', '>': '<', '≤': '≥', '≥': '≤', '=': '=', '≠': '≠' };
      const o = isVar(l) ? op : flip[op];
      const piece = {
        '<': [{ lo: -Infinity, hi: v, loIn: false, hiIn: false }],
        '≤': [{ lo: -Infinity, hi: v, loIn: false, hiIn: true }],
        '>': [{ lo: v, hi: Infinity, loIn: false, hiIn: false }],
        '≥': [{ lo: v, hi: Infinity, loIn: true, hiIn: false }],
        '=': [{ lo: v, hi: v, loIn: true, hiIn: true }],
        '≠': complement([{ lo: v, hi: v, loIn: true, hiIn: true }]),
      }[o];
      cur = intersect(cur, piece);
    }
    return cur;
  }
  // 只写一个数：就是这一个值
  try { const v = readNum(s); return [{ lo: v, hi: v, loIn: true, hiIn: true }]; } catch { /* 下面报 */ }
  throw new Error(`看不懂「${s}」：写成区间 (-∞, 1) ∪ (2, +∞)、不等式 a < 1 或 a > 2、a ≠ 1 且 a ≠ -2、几个值 {1, -2}，全体实数写 R，没有写 ∅`);
}

const numText = (v) => (v === Infinity ? '+∞' : v === -Infinity ? '-∞' : String(Number(v.toPrecision(10))));
/** 数集写成区间的样子（看答案、记录用） */
export function setText(set) {
  if (!set.length) return '∅';
  if (set.length === 1 && set[0].lo === -Infinity && set[0].hi === Infinity) return 'R';
  // 只少了几个点的：写成 a ≠ … 更像教材
  return set.map((x) => (eq(x.lo, x.hi) ? `{${numText(x.lo)}}` : `${x.loIn ? '[' : '('}${numText(x.lo)}, ${numText(x.hi)}${x.hiIn ? ']' : ')'}`)).join(' ∪ ');
}

// 两个集合哪里不一样：找一个只在一边的数（端点、端点之间、两头）
function diffPoint(a, b) {
  const ends = [...new Set([...a, ...b].flatMap((x) => [x.lo, x.hi]).filter(Number.isFinite))].sort((x, y) => x - y);
  const probes = [...ends];
  for (let i = 0; i + 1 < ends.length; i++) probes.push((ends[i] + ends[i + 1]) / 2);
  probes.push((ends[0] ?? 0) - 1, (ends.at(-1) ?? 0) + 1);
  probes.sort((x, y) => x - y);
  return probes.find((v) => inSet(a, v) !== inSet(b, v));
}

/** type: interval 的判法：answer 原文 → { check(写的), display, tex } */
export function intervalSpec(answer) {
  const want = parseNumSet(answer);
  const display = setText(want);
  return {
    display,
    tex: `\\text{${display.replace(/∞/g, '∞')}}`,
    check(given) {
      let mine;
      try { mine = parseNumSet(given); } catch (e) { return { ok: false, wrong: [], msg: e.message }; }
      const v = diffPoint(mine, want);
      if (v === undefined) return { ok: true, wrong: [], msg: '' };
      // 只说在哪个数上不一样，不说答案
      const where = Number.isInteger(v) || ends(want).some((e) => eq(e, v)) || ends(mine).some((e) => eq(e, v)) ? `取 ${numText(v)} 时` : `在 ${numText(v)} 附近`;
      return { ok: false, wrong: [], msg: `${where}不对：你写的${inSet(mine, v) ? '包含' : '不包含'}它，再看看这个值${ends(mine).some((e) => eq(e, v)) ? '（端点该不该取到）' : ''}。` };
    },
  };
}
const ends = (set) => set.flatMap((x) => [x.lo, x.hi]).filter(Number.isFinite);

// ———————— 线性方程（组） ————————

// 一个线性式子 → { c: 常数（Q）, k: { 变量: 系数（Q） } }
function linear(src) {
  const s = String(src).replace(/[−–—]/g, '-').replace(/[×·]/g, '*').replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, '');
  let i = 0;
  const peek = () => s[i];
  const add = (a, b, sign = 1) => {
    const k = { ...a.k };
    for (const [n, v] of Object.entries(b.k)) k[n] = (k[n] || Q.int(0)).add(sign > 0 ? v : v.neg());
    return { c: a.c.add(sign > 0 ? b.c : b.c.neg()), k };
  };
  const scale = (a, q) => ({ c: a.c.mul(q), k: Object.fromEntries(Object.entries(a.k).map(([n, v]) => [n, v.mul(q)])) });
  const isConst = (a) => Object.values(a.k).every((v) => v.zero);
  function expr() {
    let a = term();
    while (peek() === '+' || peek() === '-') { const op = s[i++]; a = add(a, term(), op === '+' ? 1 : -1); }
    return a;
  }
  function term() {
    let a = factor();
    for (;;) {
      if (peek() === '*') { i++; a = mulL(a, factor()); continue; }
      if (peek() === '/') { i++; const b = factor(); if (!isConst(b) || b.c.zero) throw new Error('只能除以一个不是 0 的数'); a = scale(a, Q.int(1).div(b.c)); continue; }
      // 省略乘号：2x、3(x - 1)、x(…) 不行（非线性时下面报）
      if (peek() && /[A-Za-z(λ]/.test(peek())) { a = mulL(a, factor()); continue; }
      return a;
    }
  }
  function mulL(a, b) {
    if (isConst(a)) return scale(b, a.c);
    if (isConst(b)) return scale(a, b.c);
    throw new Error('只认一次方程（线性的）：不能两个未知数相乘');
  }
  function factor() {
    const ch = peek();
    if (ch === '+') { i++; return factor(); }
    if (ch === '-') { i++; return scale(factor(), Q.int(-1)); }
    if (ch === '(') { i++; const a = expr(); if (peek() !== ')') throw new Error('括号没配对'); i++; return a; }
    const num = s.slice(i).match(/^\d+(?:\.\d+)?/);
    if (num) { i += num[0].length; return { c: toExact(Number(num[0])), k: {} }; }
    const v = s.slice(i).match(/^([A-Za-zλ])(?:_?\{?(\d+)\}?|([₀-₉]+))?/);
    if (v) {
      i += v[0].length;
      const sub = v[2] || (v[3] ? [...v[3]].map((c) => c.charCodeAt(0) - 0x2080).join('') : '');
      return { c: Q.int(0), k: { [`${v[1]}${sub}`]: Q.int(1) } };
    }
    throw new Error(`看不懂「${s.slice(i, i + 6) || '（结尾）'}」`);
  }
  const r = expr();
  if (i < s.length) throw new Error(`看不懂「${s.slice(i, i + 6)}」`);
  return r;
}

/** 方程组的写法（; 或换行隔开，每个一个 =）→ { vars, rows: 增广矩阵的行（Q） } */
export function parseEquations(text) {
  const eqs = String(text ?? '').replace(/；/g, ';').split(/[;\n]+/).map((x) => x.trim()).filter(Boolean);
  if (!eqs.length) throw new Error('还没写方程');
  const forms = eqs.map((e) => {
    const sides = e.replace(/＝/g, '=').split('=');
    if (sides.length !== 2) throw new Error(`「${e}」要写成「左边 = 右边」，一个方程一个等号（几个方程用 ; 隔开）`);
    const l = linear(sides[0]), r = linear(sides[1]);
    // 左边 − 右边 = 0
    const k = { ...l.k };
    for (const [n, v] of Object.entries(r.k)) k[n] = (k[n] || Q.int(0)).sub(v);
    return { k, c: r.c.sub(l.c) };
  });
  const vars = [...new Set(forms.flatMap((f) => Object.keys(f.k)))].sort();
  return { vars, rows: forms.map((f) => [...vars.map((n) => f.k[n] || Q.int(0)), f.c]) };
}

// 化成行最简形、去掉零行：解集一样的方程组化出来一模一样（变量按名字排好）
function canon({ vars, rows }, allVars) {
  const M = rows.map((r) => [...allVars.map((n) => { const j = vars.indexOf(n); return j < 0 ? Q.int(0) : r[j]; }), r[r.length - 1]]);
  return rrefOf(M).R.filter((r) => r.some((x) => !x.zero));
}
const sameRows = (a, b) => a.length === b.length && a.every((r, i) => r.every((x, j) => x.cmp(b[i][j]) === 0));

/** type: equation 的判法 */
export function equationSpec(answer) {
  const want = parseEquations(answer);
  const display = String(answer).trim();
  return {
    display,
    tex: `\\text{${display.replace(/[\\{}$&#^_%~]/g, (c) => `\\${c}`)}}`,
    check(given) {
      let mine;
      try { mine = parseEquations(given); } catch (e) { return { ok: false, wrong: [], msg: e.message }; }
      const all = [...new Set([...want.vars, ...mine.vars])].sort();
      const extra = mine.vars.filter((n) => !want.vars.includes(n));
      if (extra.length) return { ok: false, wrong: [], msg: `答案里没有未知数 ${extra.join('、')}：看看是不是写错了字母（x、y、z 或 x1、x2……）` };
      const a = canon(want, all), b = canon(mine, all);
      const inconsistent = (R) => R.some((r) => r.slice(0, -1).every((x) => x.zero) && !r[r.length - 1].zero);
      if (inconsistent(b)) return { ok: false, wrong: [], msg: '你写的方程（组）自相矛盾，没有解。' };
      if (sameRows(a, b)) return { ok: true, wrong: [], msg: '' };
      if (b.length < a.length) return { ok: false, wrong: [], msg: `条件不够：你写的方程组只有 ${b.length} 个独立的方程，表示的东西比答案大。` };
      if (b.length > a.length) return { ok: false, wrong: [], msg: `条件多了：你写的有 ${b.length} 个独立的方程，表示的东西比答案小。` };
      return { ok: false, wrong: [], msg: '和答案不是同一个（平面 / 直线 / 解集）：代一个点进去验算一下。' };
    },
  };
}

// ———————— 定点数 ————————

/** type: fixed 的判法：answer 是 00.1011 这样的位串（符号位 + 小数点 + 数值位，补码、原码照写出来的样子） */
export function fixedSpec(answer, { scope = {} } = {}) {
  // 原样的位串；也可以是 \calc 算出来的（practice 里：answer: \calc{…}）
  let a = String(answer ?? '').trim();
  if (a.includes('\\calc')) a = a.replace(/\\calc\{([^}]*)\}/g, (m, e) => { const v = calcValue(e, scope).value; return v?.digits ?? String(v); });
  a = a.replace(/\s+/g, '');
  const m = a.match(/^([01]+)\.([01]+)$/);
  if (!m) throw new Error(`type: fixed 的 answer 写成符号位、小数点、数值位，比如 00.1011（双符号位）、1.0110（现在是「${answer}」）`);
  const [, sign, frac] = m;
  return {
    display: a,
    width: sign.length + frac.length,
    tex: `\\texttt{${a}}`,
    check(given) {
      const g = String(given ?? '').replace(/[\s_]/g, '').replace(/[()（）]/g, '');
      if (!/^[01.]+$/.test(g) || (g.match(/\./g) || []).length > 1) return { ok: false, wrong: [], msg: '写 0、1 和一个小数点，比如 00.1011。' };
      const [gs, gf] = g.includes('.') ? g.split('.') : [null, null];
      // 写了小数点：符号位的位数要对（双符号位写成一位是常见错）
      if (gs !== null && gs.length !== sign.length) return { ok: false, wrong: [], msg: `小数点前面是符号位，要写 ${sign.length} 位${sign.length === 2 ? '（双符号位）' : ''}，你写了 ${gs.length} 位。` };
      if (gf !== null && gf.length !== frac.length) return { ok: false, wrong: [], msg: `小数点后面要写 ${frac.length} 位，你写了 ${gf.length} 位。` };
      const digits = g.replace('.', ''), want = sign + frac;
      if (digits.length !== want.length) return { ok: false, wrong: [], msg: `一共要写 ${want.length} 位（${sign.length} 位符号位 + ${frac.length} 位小数），你写了 ${digits.length} 位。` };
      const k = [...want].findIndex((c, i) => c !== digits[i]);
      if (k < 0) return { ok: true, wrong: [], msg: '' };
      return { ok: false, wrong: [], msg: k < sign.length ? '符号位不对。' : `从小数点后第 ${k - sign.length + 1} 位开始不对。` };
    },
  };
}

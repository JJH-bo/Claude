// 含参数的精确计算：let 块里写 `a = param`，a 就是一个参数（不取值的字母）。之后 \calc{…} 里用到 a 的，
// 按 a 的多项式精确地算：含参数的行列式、特征多项式 det(λE − A)、矩阵乘法、迹……写出来是含 a 的式子，
// factor(…) 写成因式分解的样子（(a - 1)^2(a + 2)）。纯函数（tests/paramcalc.test.js）。
// exact.js 遇到参数时交给这里（useSymbolic）：poly.js 要用 exact.js 的 Q，不能反过来 import，免得循环
import { Q, Sym, isQ, toExact, exactTeX, useSymbolic } from './exact.js';
import { Poly, P, polyDet } from './poly.js';

const GREEK = { lambda: '\\lambda', mu: '\\mu', alpha: '\\alpha', beta: '\\beta', theta: '\\theta', λ: '\\lambda', μ: '\\mu' };
const isPoly = (x) => x instanceof Poly;
const isS = (x) => isPoly(x) || isQ(x);
// 值：Poly（含参数的数）或它组成的向量 / 矩阵
// 变量里的值：精确的数 / JS 的数 / 前面含参数算出来的多项式，都换成多项式
const liftAny = (x) => (Array.isArray(x) ? x.map(liftAny) : isPoly(x) ? x : P(isQ(x) ? x : toExact(x)));
const isMat = (x) => Array.isArray(x) && Array.isArray(x[0]);
const isVec = (x) => Array.isArray(x) && !Array.isArray(x[0]);

// 一个含参数的式子的结果：factor() 的写法记在 Factored 上
class Factored { constructor(p) { this.p = p; } }

function add(a, b, sign = 1) {
  if (isS(a) && isS(b)) return sign > 0 ? P(a).add(P(b)) : P(a).sub(P(b));
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) return a.map((x, i) => add(x, b[i], sign));
  throw new Error('尺寸不同，不能相加减');
}
function mul(a, b) {
  if (isS(a)) return Array.isArray(b) ? b.map((x) => mul(a, x)) : P(a).mul(P(b));
  if (isS(b)) return mul(b, a);
  if (isMat(a) && isMat(b)) {
    if (a[0].length !== b.length) throw new Error(`尺寸不匹配：${a.length}×${a[0].length} 乘 ${b.length}×${b[0].length}`);
    return a.map((r) => b[0].map((_, j) => r.reduce((s, x, k) => s.add(P(x).mul(P(b[k][j]))), new Poly([]))));
  }
  if (isMat(a) && isVec(b)) {
    if (a[0].length !== b.length) throw new Error('矩阵的列数和向量的维数不一样，不能相乘');
    return a.map((r) => r.reduce((s, x, k) => s.add(P(x).mul(P(b[k]))), new Poly([])));
  }
  throw new Error('含参数时这两个不能相乘');
}
const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => P(i === j ? 1 : 0)));
const sq = (M, what) => { if (!isMat(M) || M.length !== M[0].length) throw new Error(`只有方阵才有${what}`); return M; };
const intOf = (x, what) => { const v = P(x); if (!v.isConst || !v.constValue().integer) throw new Error(`${what}要是整数`); return Number(v.constValue().n); };

const FUNCS = {
  det: (M) => polyDet(sq(M, '行列式')),
  tr: (M) => sq(M, '迹').reduce((s, r, i) => s.add(P(r[i])), new Poly([])),
  T: (M) => (isMat(M) ? M[0].map((_, j) => M.map((r) => r[j])) : isVec(M) ? [M.slice()] : M),
  E: (n) => eye(n === undefined ? 2 : intOf(n, '阶数')),
  I: (n) => eye(n === undefined ? 2 : intOf(n, '阶数')),
  diag: (...a) => a.map((x, i) => a.map((_, j) => (i === j ? P(x) : P(0)))),
  row: (M, i) => M[intOf(i, '行号') - 1].slice(),
  col: (M, j) => M.map((r) => r[intOf(j, '列号') - 1]),
  factor: (p) => { if (!isS(p)) throw new Error('factor() 里写一个含参数的式子（比如 factor(det(A))）'); return new Factored(P(p)); },
  expand: (p) => p,
};
FUNCS.transpose = FUNCS.T;

function run(n, vars, sym) {
  switch (n.t) {
    case 'num': return P(n.big !== undefined ? new Q(n.big) : Q.from(n.v));
    case 'var': {
      if (!(n.name in vars)) throw new Error(`未定义的变量 ${n.name}`);
      const v = vars[n.name];
      if (v instanceof Sym) { sym.add(v.name); return Poly.x(); }
      // 前面含参数算出来的值记着参数名
      const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (isPoly(x) && x.param) sym.add(x.param); };
      walk(v);
      return liftAny(v);
    }
    case 'neg': return mul(P(-1), run(n.a, vars, sym));
    case 'list': return n.items.map((x) => run(x, vars, sym));
    case 'call': {
      const f = FUNCS[n.name];
      if (!f) throw new Error(`含参数时不能用 ${n.name}()（能用 det、tr、T、E、diag、row、col、factor）`);
      return f(...n.args.map((x) => run(x, vars, sym)));
    }
    case 'bin': {
      const a = run(n.a, vars, sym), b = run(n.b, vars, sym);
      if (n.op === '+') return add(a, b);
      if (n.op === '-') return add(a, b, -1);
      if (n.op === '*') return mul(a, b);
      if (n.op === '/') {
        if (!isS(b) || !P(b).isConst || P(b).zero) throw new Error('含参数时只能除以不是 0 的数（不能除以含参数的式子）');
        return mul(P(Q.int(1).div(P(b).constValue())), a);
      }
      if (n.op === '^') {
        const k = intOf(b, '次数');
        if (k < 0) throw new Error('含参数时不能做负数次幂');
        if (k > 12) throw new Error('次数太大（含参数时最多 12 次）');
        if (isS(a)) return P(a).pow(k);
        sq(a, '幂');
        let r = eye(a.length);
        for (let i = 0; i < k; i++) r = mul(r, a);
        return r;
      }
      throw new Error('含参数时不能比较大小');
    }
    default: throw new Error('含参数时这种写法算不了');
  }
}

const texOf = (v, name) => {
  const x = GREEK[name] || name;
  if (v instanceof Factored) return v.p.toFactorTeX(x);
  if (isS(v)) return P(v).toTeX(x);
  if (isMat(v)) return `\\begin{bmatrix}${v.map((r) => r.map((e) => texOf(e, name)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
  return `\\begin{bmatrix}${v.map((e) => texOf(e, name)).join(' \\\\ ')}\\end{bmatrix}`;
};
// 文字写法（组件字段、记录用）：a^2 - 2*a + 1
function textOf(v, name) {
  if (v instanceof Factored) return textOf(v.p, name);
  if (Array.isArray(v)) return `[${v.map((e) => textOf(e, name)).join(', ')}]`;
  const p = P(v);
  if (p.zero) return '0';
  const terms = [];
  for (let k = p.deg; k >= 0; k--) {
    const c = p.coef(k);
    if (c.zero) continue;
    const neg = c.n < 0n, a = neg ? c.neg() : c;
    const coef = k > 0 && a.n === 1n && a.d === 1n ? '' : a.toString();
    const pw = k === 0 ? '' : k === 1 ? name : `${name}^${k}`;
    terms.push({ neg, s: coef && pw ? `${coef}*${pw}` : coef || pw });
  }
  return terms.map((t, i) => (i ? (t.neg ? ` - ${t.s}` : ` + ${t.s}`) : t.neg ? `-${t.s}` : t.s)).join('');
}

/** 算一个含参数的表达式。返回和 calcValue 一样的 { value, exact, tex, text, float }；一个式子里最多一个参数 */
export function calcSymbolic(ast, vars) {
  const sym = new Set();
  const value = run(ast, vars, sym);
  if (sym.size > 1) throw new Error(`一个式子里只能有一个参数（现在有 ${[...sym].join('、')}）`);
  const name = [...sym][0] || 'x';
  // 算完不含参数的（比如 det 把参数消掉了）：写成普通的数
  const flat = (v) => (v instanceof Factored ? v.p : Array.isArray(v) ? v.map(flat) : P(v));
  const isConstAll = (v) => (Array.isArray(v) ? v.every(isConstAll) : P(v).isConst);
  const f = flat(value);
  if (isConstAll(f)) {
    const q = (v) => (Array.isArray(v) ? v.map(q) : v.constValue());
    const e = q(f);
    return { value: e, exact: true, tex: exactTeX(e), text: textOf(f, name), float: NaN };
  }
  const tag = (v) => { if (Array.isArray(v)) v.forEach(tag); else v.param = name; };
  tag(f);
  return { value: f, exact: true, tex: texOf(value, name), text: textOf(value, name), float: NaN, param: name };
}

useSymbolic(calcSymbolic);

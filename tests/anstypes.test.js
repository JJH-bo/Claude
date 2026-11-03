// answer 的新答案：数集（type: interval）、线性方程（组）（type: equation）、定点数（type: fixed）；引用前面的答案 ans(编号)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { intervalSpec, equationSpec, fixedSpec, parseNumSet, setText } from '../kit/src/anstypes.js';
import { ansRefs, refConditions, checkConditions } from '../kit/src/anscheck.js';
import { textAnswerSpec } from '../kit/src/textspec.js';

test('数集：区间、不等式、≠、几个值、R、∅ 都读得懂，写成区间', () => {
  assert.equal(setText(parseNumSet('a != 1 且 a != -2')), '(-∞, -2) ∪ (-2, 1) ∪ (1, +∞)');
  assert.equal(setText(parseNumSet('-1 < a <= 3')), '(-1, 3]');
  assert.equal(setText(parseNumSet('a < 1 或 a >= 2')), '(-∞, 1) ∪ [2, +∞)');
  assert.equal(setText(parseNumSet('{1, -2}')), '{-2} ∪ {1}');
  assert.equal(setText(parseNumSet('a = 3')), '{3}');
  assert.equal(setText(parseNumSet('R')), 'R');
  assert.equal(setText(parseNumSet('∅')), '∅');
  assert.equal(setText(parseNumSet('a ∈ (-inf, 1/2]')), '(-∞, 0.5]');
  assert.equal(setText(parseNumSet('(0, 2) ∪ [2, 3)')), '(0, 3)');
  assert.throws(() => parseNumSet('(3, 1)'), /左端点要比右端点小/);
  assert.throws(() => parseNumSet('[-∞, 1)'), /圆括号/);
  assert.throws(() => parseNumSet('a 大于 1'), /看不懂/);
});

test('type: interval：写法不同、集合一样就对；不对时只说在哪个数上不一样', () => {
  const I = intervalSpec('a != 1 且 a != -2');
  for (const g of ['(-∞,-2)∪(-2,1)∪(1,+∞)', 'a≠1，a≠-2', 'x != -2 and x != 1', '(-inf, -2) U (-2, 1) U (1, inf)']) assert.ok(I.check(g).ok, g);
  const r = I.check('a ≠ 1 或 a ≠ -2');
  assert.ok(!r.ok);
  assert.match(r.msg, /取 -2 时不对：你写的包含它/);
  const J = intervalSpec('(-∞, 1] ∪ (2, +∞)');
  assert.ok(J.check('a ≤ 1 或 a > 2').ok);
  assert.match(J.check('a<1 或 a>2').msg, /取 1 时不对.*端点/);
  assert.match(J.check('奇怪').msg, /看不懂/);
  // textAnswerSpec 接得上（answer 组件用它）
  const t = textAnswerSpec('interval', 'a != 1 且 a != -2');
  assert.equal(t.shape.kind, 'line');
  assert.match(t.shape.echo('a≠1'), /读成：\(-∞, 1\) ∪ \(1, \+∞\)/);
  assert.ok(t.check(t.display).ok, '标准答案的写法自己判自己');
});

test('type: equation：同一个解集就对（同乘一个数、移项、换个等价的方程组）', () => {
  const E = equationSpec('x + 2y - z = 3');
  for (const g of ['2x+4y-2z=6', 'x = 3 - 2y + z', '-x - 2y + z + 3 = 0', '2(x + 2y) = 2z + 6']) assert.ok(E.check(g).ok, g);
  assert.match(E.check('x+2y-z=4').msg, /不是同一个/);
  assert.match(E.check('x+2y-z=3; x=1').msg, /条件多了/);
  assert.match(E.check('x+2w=3').msg, /没有未知数 w/);
  assert.match(E.check('xy = 1').msg, /一次方程/);
  assert.match(E.check('x + 1').msg, /左边 = 右边/);
  const S = equationSpec('x1 + x2 = 1; x3 = 0');
  assert.ok(S.check('x_1 = 1 - x_2; 2x3 = 0').ok);
  assert.ok(S.check('x1+x2+x3=1; x3=0').ok);
  assert.ok(S.check('x₁ + x₂ = 1; x₃ = 0').ok);
  assert.match(S.check('x1+x2=1').msg, /条件不够/);
  assert.match(S.check('x1 = 1; x1 = 2').msg, /自相矛盾/);
});

test('type: fixed：符号位几位、小数点、第几位不对', () => {
  const F = fixedSpec('00.1011');
  assert.ok(F.check('00.1011').ok);
  assert.ok(F.check('001011').ok, '小数点可以不写');
  assert.ok(F.check('00.10 11').ok);
  assert.match(F.check('0.1011').msg, /要写 2 位（双符号位），你写了 1 位/);
  assert.match(F.check('00.1001').msg, /小数点后第 3 位/);
  assert.match(F.check('01.1011').msg, /符号位不对/);
  assert.match(F.check('00.10110').msg, /要写 4 位/);
  assert.match(F.check('00.1021').msg, /写 0、1/);
  assert.equal(fixedSpec('1.0110').width, 5);
  assert.throws(() => fixedSpec('1011'), /符号位、小数点、数值位/);
});

test('ans(编号)：换成变量名；answer 里引用了就变成一条 check，按学生前面写的判', () => {
  const r = ansRefs('inv(ans(q-P))*A*ans(q-P) + ans');
  assert.equal(r.src, 'inv(__ans0)*A*__ans0 + ans');
  assert.deepEqual(r.refs, [{ id: 'q-P', name: '__ans0' }]);
  assert.equal(refConditions('A*[1, 2]', 'det(ans) != 0'), null, '没引用就照旧');
  const c = refConditions('inv(ans(q-P))*A*ans(q-P)', 'det(ans) != 0');
  const A = [[1, 2], [2, 1]];
  // 学生前面写的 P 和标准答案不一样：照它算
  const P = [[1, 2], [-1, 2]];
  assert.ok(checkConditions(c.cond, [[-1, 0], [0, 3]], { A, __ans0: P }).ok);
  const bad = checkConditions(c.cond, [[3, 0], [0, -1]], { A, __ans0: P });
  assert.ok(!bad.ok);
  assert.match(bad.msg, /按你前面那一题写的答案算/);
});

test('数集：写成表达式的 a == 1 或 a == -2 也认（验收第三批 la-param 碰到的）', () => {
  assert.equal(setText(parseNumSet('a == 1 或 a == -2')), '{-2} ∪ {1}');
  assert.ok(intervalSpec('a == 1 或 a == -2').check('{1, -2}').ok);
});

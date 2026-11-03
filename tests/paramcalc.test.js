// 含参数的精确计算（let 里 a = param）和按格写的矩阵式子答案
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../kit/src/paramcalc.js';
import { calcValue, letValue, toExact, isSym } from '../kit/src/exact.js';
import { calcFields } from '../kit/src/stepperspec.js';
import { matrixCells, compareCells, formulaSpec } from '../kit/src/formula.js';
import { ENGINES } from '../kit/src/engines/registry.js';

const withParam = (name = 'a') => ({ [name]: letValue(name, calcValue('param', {}).value) });

test('a = param：含参数的行列式、矩阵乘法、迹，factor 写成因式分解', () => {
  const v = withParam();
  assert.ok(isSym(v.a));
  v.A = calcValue('[[1, 1, a], [1, a, 1], [a, 1, 1]]', v).value;
  assert.equal(calcValue('det(A)', v).tex, '-a^{3} + 3a - 2');
  assert.equal(calcValue('factor(det(A))', v).tex, '-(a + 2)(a - 1)^{2}');
  assert.equal(calcValue('tr(A)', v).text, 'a + 2');
  assert.equal(calcValue('A*A', v).text, '[[a^2 + 2, 2*a + 1, 2*a + 1], [2*a + 1, a^2 + 2, 2*a + 1], [2*a + 1, 2*a + 1, a^2 + 2]]');
  // 参数消掉了：写成普通的数
  assert.equal(calcValue('det(A - A)', v).tex, '0');
  assert.throws(() => calcValue('A/a', v), /不能除以含参数的式子/);
  assert.throws(() => calcValue('inv(A)', v), /不能用 inv/);
  // 特征多项式
  const w = { ...withParam('lambda'), B: toExact([[2, 1], [1, 2]]) };
  assert.equal(calcValue('factor(det(lambda*E(2) - B))', w).tex, '(\\lambda - 1)(\\lambda - 3)');
  // 没参数时 factor 就是它自己
  assert.equal(calcValue('factor(6)', {}).text, '6');
});

test('含参数的矩阵写进演示组件的字段：elim 的 param: 读得懂', () => {
  const v = withParam();
  v.A = calcValue('[[1, 1, a], [1, a, 1], [a, 1, 1]]', v).value;
  const f = calcFields({ matrix: '\\calc{A}' }, v).fields;
  assert.equal(f.matrix, '[[1, 1, a], [1, a, 1], [a, 1, 1]]');
  const r = ENGINES.elim.run(ENGINES.elim.parse({ matrix: f.matrix, param: 'a' }));
  assert.deepEqual(r.special, ['−2', '1']);
});

test('按格写的矩阵答案：拆格、逐格比，指出哪一格不对', () => {
  assert.deepEqual(matrixCells('[[2^n, n*2^(n-1)], [0, 2^n]]'), [['2^n', 'n*2^(n-1)'], ['0', '2^n']]);
  assert.equal(matrixCells('3^(n-1)*A'), null);
  assert.equal(matrixCells('[[1, 2], [3]]'), null);
  const f = formulaSpec('[[2^n, n*2^(n-1)], [0, 2^n]]', 'n', {});
  const cells = matrixCells(f.expected);
  assert.ok(compareCells(cells, [['2^n', '2^(n-1)*n'], ['0', '2^(n+1)/2']], { free: f.free, scope: {} }).ok);
  const bad = compareCells(cells, [['2^n', 'n*2^n'], ['0', '2^n']], { free: f.free, scope: {} });
  assert.deepEqual(bad.wrong, [1]);
  assert.equal(bad.first.r, 0);
  assert.equal(bad.first.c, 1);
});

test('formula: a 的答案用到含参数 a 的量（answer: det(A)，A 里有 a）：代值时把 a 代进去（验收第三批 la-param 碰到的）', async () => {
  const { compareFormula, normalizeFormula } = await import('../kit/src/formula.js');
  const v = withParam();
  v.A = calcValue('[[1, 1, a], [1, a, 1], [a, 1, 1]]', v).value;
  const f = formulaSpec('det(A)', 'a', v);
  assert.ok(compareFormula(f.expected, normalizeFormula('-(a-1)^2(a+2)', { names: f.names }), f).ok);
  assert.ok(compareFormula(f.expected, normalizeFormula('-a^3+3a-2', { names: f.names }), f).ok);
  assert.match(compareFormula(f.expected, normalizeFormula('(a-1)^2(a+2)', { names: f.names }), f).msg, /应该是/);
});

test('form:：值对了再看写法：kA（数 × 矩阵名）、factored（因式分解）；formula: - 没有变量', async () => {
  const { compareFormula, normalizeFormula, checkForm } = await import('../kit/src/formula.js');
  const A = toExact([[2, 1, 1], [4, 2, 2], [-2, -1, -1]]);
  const f = formulaSpec('3^9*A', '-', { A });
  assert.deepEqual(f.free, []);
  const read = (x, sp) => normalizeFormula(x, { names: sp.names });
  for (const g of ['3^9A', '19683A']) { assert.ok(compareFormula(f.expected, read(g, f), f).ok); assert.ok(checkForm(read(g, f), 'kA', f).ok, g); }
  assert.ok(compareFormula(f.expected, read('A^10', f), f).ok, '值是对的');
  assert.match(checkForm(read('A^10', f), 'kA', f).msg, /数 × 矩阵名/);
  const v = withParam();
  v.M = calcValue('[[1, 1, a], [1, a, 1], [a, 1, 1]]', v).value;
  const g = formulaSpec('det(M)', 'a', v);
  assert.ok(checkForm(read('-(a-1)^2(a+2)', g), 'factored', g).ok);
  assert.ok(checkForm(read('(1-a)(a-1)(a+2)', g), 'factored', g).ok);
  assert.match(checkForm(read('-a^3+3a-2', g), 'factored', g).msg, /因式分解/);
  assert.ok(!checkForm(read('-(a^2-2a+1)(a+2)', g), 'factored', g).ok);
  assert.throws(() => checkForm(read('a', g), 'nice', g), /kA.*factored/);
});

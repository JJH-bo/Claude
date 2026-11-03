// practice 的 use:（演示组件当练习题）：解析、内置出题、自检、取数的新写法（bits / seq / word / str）和写法函数（list / sbin / el / sort / cumsum）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENGINES } from '../kit/src/engines/registry.js';
import { parseUseTemplate, checkUse, prepareUse, BUILTIN_USE } from '../kit/src/usespec.js';
import { instantiate, pickedText, parseTemplate } from '../kit/src/practicespec.js';
import { calcValue, toExact } from '../kit/src/exact.js';
import { textAnswerSpec } from '../kit/src/textspec.js';

// 固定的随机数，结果可复现
function seeded(seed = 7) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

test('写法函数：list / sbin / el / sort / sum / cumsum', () => {
  const v = toExact([7, 0, 1, 2]);
  assert.equal(calcValue('list(v)', { v }).text, '7 0 1 2');
  assert.equal(calcValue('sbin(-13/16, 4)', {}).text, '-0.1101');
  assert.equal(calcValue('sbin(3/8, 4)', {}).text, '0.0110');
  assert.equal(calcValue('sbin(-3, 3)', {}).text, '-011');
  assert.throws(() => calcValue('sbin(1/3, 4)', {}), /写不尽/);
  assert.throws(() => calcValue('sbin(9, 3)', {}), /放不下/);
  assert.equal(calcValue('el(v, 1)', { v }).text, '7');
  assert.throws(() => calcValue('el(v, 5)', { v }), /没有第 5 个/);
  assert.equal(calcValue('sort(v)', { v }).text, '[0, 1, 2, 7]');
  assert.equal(calcValue('sum(v)', { v }).text, '10');
  assert.equal(calcValue('cumsum(v)', { v }).text, '[7, 7, 8, 10]');
  // list() 的结果只能写出来
  assert.throws(() => calcValue('list(v) + 1', { v }), /只能直接写出来/);
});

test('取数：bits(4) 是 0/1 串，nonzero 不全是 0；seq distinct 不重复；word / str 是文字', () => {
  const tpl = parseTemplate('type: custom\npick d = bits(6) nonzero\npick v = seq(8, 1, 8) distinct\npick w = word(fifo, lru, rr q=2)\npick p = str(7, ab)\nq: x\nanswer: 1');
  const rand = seeded(3);
  for (let k = 0; k < 30; k++) {
    const { vars, picked } = instantiate(tpl, { rand });
    assert.match(vars.d.digits, /^[01]{6}$/);
    assert.ok(vars.d.digits.includes('1'));
    assert.deepEqual([...vars.v.map(Number)].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.ok(['fifo', 'lru', 'rr q=2'].includes(vars.w.digits));
    assert.match(vars.p.digits, /^[ab]{7}$/);
    assert.match(pickedText(picked), /^d=[01]{6}，v=(\d ){7}\d，w=[^，]+，p=[ab]{7}$/);
  }
  assert.throws(() => parseTemplate('type: custom\npick v = seq(9, 1, 8) distinct\nq: x\nanswer: 1'), /只有 8 个数/);
  assert.throws(() => parseTemplate('type: custom\npick v = bits(40)\nq: x\nanswer: 1'), /1 到 32/);
  assert.throws(() => parseTemplate('type: custom\npick v = int(1, 3) distinct\nq: x\nanswer: 1'), /只能跟在 seq/);
});

test('use: 老师自己写取数和组件的字段；practice 自己的字段不交给组件；没写 mode 就是 quiz', () => {
  const tpl = parseUseTemplate(String.raw`use: paging
title: 页面置换练习
count: 2
pick v = seq(10, 0, 4)
pick a = word(fifo, lru)
refs: \calc{list(v)}
frames: 3
algo: \calc{a}`, ENGINES);
  assert.equal(tpl.use, 'paging');
  assert.equal(tpl.fields.count, '2');
  assert.equal(tpl.fields.title, '页面置换练习');
  assert.ok(!/title|count/.test(tpl.body));
  assert.equal(tpl.picks.length, 2);
  assert.deepEqual([...checkUse(tpl, { rand: seeded(1) })], []);
  const { vars } = instantiate(tpl, { rand: seeded(2) });
  const p = prepareUse(tpl, vars);
  assert.equal(p.mode, 'quiz');
  assert.match(p.fields.refs, /^(\d )+\d$/);
  assert.ok(['fifo', 'lru'].includes(p.fields.algo));
  // 标准答案自己判自己是对的
  const qz = ENGINES.paging.quiz(p.input, p.run, p.fields);
  assert.ok(textAnswerSpec(qz.type || 'seq', qz.answer, {}).check(String(qz.answer).split('|')[0]).ok);
});

test('use: 写错了报出来：组件名、frames、mode: do、组件的字段、没有能作答的、拼错的字段', () => {
  assert.throws(() => parseUseTemplate('use: hammming', ENGINES), /不认识「hammming」/);
  assert.throws(() => parseUseTemplate('use: frames\npick a = int(1, 2)', ENGINES), /frames/);
  assert.throws(() => parseUseTemplate('use: banker', ENGINES), /没有内置的出题/);
  assert.throws(() => parseUseTemplate('use: elim\nmode: do\npick a = int(1, 2)\nmatrix: [[1, \\calc{a}], [0, 1]]', ENGINES), /mode: do/);
  // 取到的数让组件报错：说出取的是什么
  const bad = parseUseTemplate('use: hamming\npick d = bits(20)\ndata: \\calc{d}', ENGINES);
  const errs = checkUse(bad, { rand: seeded(4) });
  assert.match(errs[0], /^取 d=[01]{20} 时，hamming：/);
  // 纯演示（mode: demo、没有 ask）不能当练习题
  const demo = parseUseTemplate('use: sort\npick v = seq(6, 1, 9)\narray: \\calc{list(v)}\nalgo: insert\nmode: demo', ENGINES);
  assert.match(checkUse(demo)[0], /要有作答/);
  // 拼错的字段当提醒（不拦着）
  const typo = parseUseTemplate('use: sort\npick v = seq(6, 1, 9) distinct\narray: \\calc{list(v)}\nalgo: insert\npass: 1\nalog: x', ENGINES);
  const r = checkUse(typo);
  assert.deepEqual([...r], []);
  assert.match(r.warnings[0], /alog/);
});

test('内置出题：每一种两档都能出题（自检 40 组），标准答案自己判自己是对的', () => {
  assert.ok(Object.keys(BUILTIN_USE).length >= 13);
  for (const name of Object.keys(BUILTIN_USE)) for (const level of [1, 2]) {
    const where = `${name} level ${level}`;
    const tpl = parseUseTemplate(`use: ${name}\nlevel: ${level}`, ENGINES);
    assert.ok(tpl.builtin, where);
    const errs = checkUse(tpl, { rand: seeded(level * 31 + name.length), rounds: 40 });
    assert.deepEqual([...errs], [], where);
    assert.deepEqual(errs.warnings, [], where);
    const { vars } = instantiate(tpl, { rand: seeded(5) });
    const p = prepareUse(tpl, vars);
    if (p.mode === 'quiz') {
      const qz = ENGINES[name].quiz(p.input, p.run, p.fields);
      const first = String(qz.answer).split('|')[0].trim();
      assert.ok(textAnswerSpec(qz.type || 'seq', qz.answer, { width: qz.width }).check(first).ok, `${where}：标准答案「${first}」判成错`);
    }
  }
});

test('内置出题可以改字段：老师写的同名字段覆盖内置的（algo: lru 只练 LRU）', () => {
  const tpl = parseUseTemplate('use: paging\nalgo: lru\nframes: 4', ENGINES);
  const { vars } = instantiate(tpl, { rand: seeded(9) });
  const p = prepareUse(tpl, vars);
  assert.equal(p.fields.algo, 'lru');
  assert.equal(p.fields.frames, '4');
  // 改成 fill 也行
  const fill = parseUseTemplate('use: paging\nmode: fill', ENGINES);
  assert.equal(prepareUse(fill, instantiate(fill, { rand: seeded(9) }).vars).mode, 'fill');
});

test('表达式里的算法函数：next / nextval / faults / victims / wpl / same；内置出题保证能分开对错两种想法', async () => {
  await import('../kit/src/algofuncs.js');
  const v = { v: toExact([7, 0, 1, 2, 0, 3, 0, 4]) };
  const { textValue } = await import('../kit/src/exact.js');
  v.p = textValue('abaabcac');
  assert.equal(calcValue('faults(v, 3, lru)', v).text, '6');
  assert.equal(calcValue('faults(v, 3, fifo)', v).text, '7');
  assert.equal(calcValue('victims(v, 3, lru)', v).text, '[7, 1, 2]');
  assert.equal(calcValue('list(next(p))', v).text, '0 1 1 2 2 3 1 2');
  assert.equal(calcValue('list(nextval(p))', v).text, '0 1 0 2 1 3 0 2');
  assert.equal(calcValue('wpl([7, 5, 2, 4])', v).text, '35');
  assert.equal(calcValue('same(next(p), nextval(p))', v).text, '0');
  assert.equal(calcValue('same(victims(v, 3, lru), victims(v, 3, lru))', v).text, '1');
  // 内置的页面置换、nextval：每一题 LRU 和 FIFO 换出的不一样，nextval 和 next 不一样
  for (const [use, level] of [['paging', 1], ['paging', 2], ['kmp', 2]]) {
    const tpl = parseUseTemplate(`use: ${use}\nlevel: ${level}`, ENGINES);
    for (let k = 0; k < 15; k++) {
      const { vars } = instantiate(tpl, { rand: seeded(k + 11) });
      if (use === 'kmp') assert.equal(calcValue('same(next(p), nextval(p))', vars).text, '0');
      else assert.equal(calcValue(`same(victims(v, ${level === 1 ? 3 : 'f'}, lru), victims(v, ${level === 1 ? 3 : 'f'}, fifo))`, vars).text, '0');
    }
  }
});

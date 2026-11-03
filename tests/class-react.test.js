// 预案（kit/src/class/react.js，docs/board-plan.md 第 1 节）：写法、作答归到哪种情况、这一批能不能页面自己接、刷新后重建
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReact, classify, planLocal, markFired, reactNote, armedText, rebuildRules, dropForSeg, stepOf } from '../kit/src/class/react.js';
import { parseOutput, parseCommand } from '../kit/src/class/protocol.js';
import { PROTOCOL_DOC } from '../kit/src/class/prompt.js';
import { usageOf, usageText } from '../kit/src/class/usage.js';

const BODY = [
  'right show=b4: 对。再来一个：乘 $(1,0)$ 呢？',
  'wrong: 先只算第一个分量，再试一次。',
  'misread "FIFO": 你是按谁先进来换的？',
  'giveup show=b4,b5: 第一个分量是 $1\\cdot3+1\\cdot(-1)=2$。',
  'done step=3: 看完了，下面你来。',
].join('\n');

const rules = (body = BODY, target = 'q1', seq = 3, seg = 'b3') => {
  const r = parseReact(`target=${target}`, body);
  return new Map([[target, { target, seq, seg, cases: r.cases.map((c) => ({ ...c, used: false })) }]]);
};

test('parseReact：一行一条，情况、选项、说的话', () => {
  const r = parseReact('target=q1', BODY);
  assert.equal(r.op, 'react');
  assert.equal(r.target, 'q1');
  assert.deepEqual(r.cases.map((c) => c.kind), ['right', 'wrong', 'misread', 'giveup', 'done']);
  assert.deepEqual(r.cases[0].show, ['b4']);
  assert.equal(r.cases[0].text, '对。再来一个：乘 $(1,0)$ 呢？', '冒号后面的话里还能有冒号');
  assert.equal(r.cases[2].key, 'FIFO');
  assert.deepEqual(r.cases[3].show, ['b4', 'b5']);
  assert.equal(r.cases[4].step, 3);
  // 省掉 target= 也认；中文冒号、中文的情况名也认
  assert.equal(parseReact('q2', '对：好').cases[0].kind, 'right');
  // 空块：撤掉这个组件的预案
  assert.deepEqual(parseReact('target=q1', '').cases, []);
});

test('parseReact：写错的行报出来，读懂的照用', () => {
  assert.match(parseReact('', 'right: 对').error, /缺少 target/);
  assert.match(parseReact('target=q1', 'maybe: 嗯').error, /看不懂的情况/);
  assert.match(parseReact('target=q1', 'misread: 嗯').error, /misread 后面要写/);
  assert.match(parseReact('target=q1', 'right 对').error, /情况: 说的话/);
  const r = parseReact('target=q1', 'right: 对\nstep: 嗯');
  assert.equal(r.cases.length, 1);
  assert.equal(r.errors.length, 1);
  // 错法关键词里带冒号：在引号里不算分隔
  assert.equal(parseReact('target=q1', 'misread "a:b": 嗯').cases[0].key, 'a:b');
});

test('protocol：board react、add … hold、show', () => {
  const out = parseOutput('````board add id=b4 hold title="再来一个"\n内容\n````\n\n````board react target=q1\nright show=b4: 对\n````\n\n````board show id=b4\n````\n', { final: true });
  assert.deepEqual(out.ops.map((o) => o.op), ['add', 'react', 'show']);
  assert.equal(out.ops[0].hold, true);
  assert.equal(out.ops[0].title, '再来一个');
  assert.deepEqual(out.ops[1].cases[0].show, ['b4']);
  assert.match(parseCommand('new id=b1 hold').error, /hold 只能写在 add 上/);
  assert.equal(parseCommand('add id=b1').hold, undefined);
});

test('说明里的预案例子照抄就能用', () => {
  const ex = parseOutput(PROTOCOL_DOC, { final: true }).ops.find((o) => o.op === 'react');
  assert.ok(ex, '说明里有 react 的例子');
  assert.deepEqual(ex.cases.map((c) => c.kind), ['right', 'wrong', 'misread']);
  assert.ok(!ex.errors);
});

test('classify：作答归到哪种情况', () => {
  assert.deepEqual(classify({ source: 'record', type: 'answer', ok: true, block: 'q1' }, 'soon'), { kind: 'right', step: undefined });
  assert.equal(classify({ source: 'record', type: 'answer', ok: false, block: 'q1' }, 'soon').kind, 'wrong');
  assert.equal(classify({ source: 'record', type: 'stepper', ok: false, misread: '像是按 FIFO 换的' }, 'soon').misread, '像是按 FIFO 换的');
  assert.equal(classify({ source: 'record', type: 'answer', revealed: true }, 'soon').kind, 'giveup');
  assert.equal(classify({ source: 'event', type: 'giveup', step: 2 }, 'now').kind, 'giveup');
  assert.equal(classify({ source: 'event', type: 'reveal', step: 3 }, 'soon').kind, 'done');
  // 拖一拖、揭开中间一步、有把握：不用老师
  assert.equal(classify({ source: 'event', type: 'drag' }, 'later').kind, 'passive');
  // 答对了却没把握（红线 5）、自由作答、页面自己的提醒：要叫 Claude
  assert.equal(classify({ source: 'event', type: 'sure', sure: false, ok: true }, 'soon'), null);
  assert.equal(classify({ source: 'record', type: 'conjecture', text: '我觉得…' }, 'soon'), null);
  assert.equal(classify({ source: 'page', type: 'stuck' }, 'soon'), null);
  assert.equal(stepOf({ source: 'record', type: 'steps', detail: '第 2 步' }), 2);
});

test('planLocal：答错 → 预写的话；同一批里两次答错只有一条预案 → 叫 Claude', () => {
  const r = rules();
  const wrong = { a: { source: 'record', type: 'answer', ok: false, block: 'q1' }, trig: 'soon' };
  const plan = planLocal({ items: [wrong], rules: r });
  assert.equal(plan.talk, '先只算第一个分量，再试一次。');
  assert.deepEqual(plan.show, []);
  assert.equal(plan.fired[0].seq, 3);
  assert.equal(planLocal({ items: [wrong, wrong], rules: r }), null);
});

test('planLocal：认出来的错法先于 wrong；答对揭开藏着的段', () => {
  const r = rules();
  const mis = { a: { source: 'record', type: 'stepper', ok: false, misread: '像是按 fifo 换的', block: 'q1' }, trig: 'soon' };
  assert.equal(planLocal({ items: [mis], rules: r }).fired[0].kind, 'misread');
  const right = { a: { source: 'record', type: 'answer', ok: true, block: 'q1' }, trig: 'soon' };
  const p = planLocal({ items: [{ a: { source: 'event', type: 'drag', block: 'fig' }, trig: 'later' }, right], rules: r });
  assert.deepEqual(p.show, ['b4']);
  assert.equal(p.fired.length, 1, '拖一拖跟着一起记，不用预案');
});

test('planLocal：学生说了话、附了图、组件不在了、没写这种情况、别的组件 → 叫 Claude', () => {
  const r = rules('wrong: 再想想');
  const right = { a: { source: 'record', type: 'answer', ok: true, block: 'q1' }, trig: 'soon' };
  const wrong = { a: { source: 'record', type: 'answer', ok: false, block: 'q1' }, trig: 'soon' };
  assert.equal(planLocal({ items: [right], rules: r }), null, '没写 right');
  assert.equal(planLocal({ items: [wrong], rules: r, other: true }), null);
  assert.equal(planLocal({ items: [wrong], rules: r, present: () => false }), null);
  assert.equal(planLocal({ items: [{ a: { ...wrong.a, block: 'q9' }, trig: 'soon' }], rules: r }), null);
  assert.equal(planLocal({ items: [wrong, { a: { source: 'event', type: 'sure', sure: false, ok: true, block: 'q1' }, trig: 'soon' }], rules: r }), null);
  // step=3 的 done 只管第 3 步
  const d = rules();
  assert.equal(planLocal({ items: [{ a: { source: 'event', type: 'reveal', step: 2, block: 'q1' }, trig: 'soon' }], rules: d }), null);
  assert.equal(planLocal({ items: [{ a: { source: 'event', type: 'reveal', step: 3, block: 'q1' }, trig: 'soon' }], rules: d }).fired[0].kind, 'done');
});

test('markFired：每条只用一次；答对了整组收起', () => {
  const r = rules();
  const wrong = { a: { source: 'record', type: 'answer', ok: false, block: 'q1' }, trig: 'soon' };
  markFired(r, planLocal({ items: [wrong], rules: r }));
  assert.equal(planLocal({ items: [wrong], rules: r }), null, '第二次答错叫 Claude');
  assert.doesNotMatch(armedText(r.get('q1')), /wrong/);
  assert.match(armedText(r.get('q1')), /right show=b4/);
  markFired(r, planLocal({ items: [{ a: { source: 'record', type: 'answer', ok: true, block: 'q1' }, trig: 'soon' }], rules: r }));
  assert.equal(r.has('q1'), false);
});

test('reactNote：记给 Claude 的一行', () => {
  const r = rules();
  const plan = planLocal({ items: [{ a: { source: 'record', type: 'answer', ok: true, block: 'q1' }, trig: 'soon' }], rules: r });
  const note = reactNote(plan);
  assert.match(note, /^\[系统\] 页面按你预写的预案接了（q1 答对）/);
  assert.match(note, /揭开了 b4/);
  assert.match(note, /没有调用你/);
});

test('rebuildRules / dropForSeg：刷新后重建，段改写以后作废，用掉的不再用', () => {
  const cases = parseReact('q1', BODY).cases;
  const history = [
    { seq: 1, role: 'student', text: '开始上课。' },
    { seq: 2, role: 'claude', boardOps: [{ op: 'new', id: 'b3', ok: true }, { op: 'react', target: 'q1', seg: 'b3', ok: true, cases }, { op: 'react', target: 'q2', seg: 'b4', ok: true, cases }] },
    { seq: 3, role: 'student', text: '[作答] …' },
    { seq: 4, role: 'system', kind: 'react', fired: [{ target: 'q1', seq: 2, index: 1, kind: 'wrong' }] },
    { seq: 5, role: 'claude', boardOps: [{ op: 'replace', id: 'b4', ok: true }] },
  ];
  const r = rebuildRules(history);
  assert.equal(r.has('q2'), false, 'b4 改写了，挂在上面的预案作废');
  assert.equal(r.get('q1').cases[1].used, true);
  assert.equal(r.get('q1').cases[0].used, false);
  // 同一轮先 replace 再 react：这一轮自己写的不作废
  const m = new Map([['q1', { seq: 7, seg: 'b3', cases: [] }]]);
  dropForSeg(m, 'b3', 7);
  assert.equal(m.has('q1'), true);
  dropForSeg(m, 'b3', 8);
  assert.equal(m.has('q1'), false);
  // 作废的轮不算；空的 react 撤掉
  assert.equal(rebuildRules([{ seq: 1, role: 'claude', discarded: true, boardOps: [{ op: 'react', target: 'q1', ok: true, cases }] }]).size, 0);
  assert.equal(rebuildRules([...history.slice(0, 2), { seq: 9, role: 'claude', boardOps: [{ op: 'react', target: 'q1', ok: true, cases: [] }] }]).has('q1'), false);
});

test('花费：页面按预案接了几次（没调用）', () => {
  const u = usageOf([{ role: 'claude', cost: { bytes: 90000, why: 'turn' } }, { role: 'system', kind: 'react' }, { role: 'system', kind: 'react' }]);
  assert.equal(u.local, 2);
  assert.equal(u.calls, 1);
  assert.match(usageText(u), /页面按预案接了 2 次，没调用/);
  assert.equal(usageOf([{ role: 'claude', cost: { bytes: 1, why: 'turn' } }]).local, undefined);
});

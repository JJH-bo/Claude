// 这节课的一页（kit/src/memory/sheet.js）：记号、重点框、做错又改对的、还没拿下的；课后报告里带着；复现课的资料包从它开始
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessonSheet, sheetMd, calloutsIn, sheetEmpty } from '../kit/src/memory/sheet.js';
import { buildReport } from '../kit/src/memory/report.js';
import { reviewPack } from '../kit/src/memory/views.js';
import { sampleMemory } from '../kit/src/memory/sample.js';

const steps = [
  { id: 'k1', place: 'pin', seq: 1, title: '记号', md: '$A=\\alpha\\beta^T$' },
  { id: 'b1', place: 'board', seq: 2, title: '推', md: '前面的话\n\n```key\ntitle: 关键\n$\\beta^T\\alpha$ 是一个数\n```\n\n```warning\n别把 $\\beta^T\\alpha$ 当成矩阵\n```' },
  { id: 'b2', place: 'board', seq: 3, hidden: true, md: '```key\n撤回的不要\n```' },
];

test('calloutsIn：重点 / 易错框和标题', () => {
  assert.deepEqual(calloutsIn(steps[1].md), [{ kind: 'key', title: '关键', md: '$\\beta^T\\alpha$ 是一个数' }, { kind: 'warning', title: '', md: '别把 $\\beta^T\\alpha$ 当成矩阵' }]);
});

test('lessonSheet / sheetMd：常驻栏、重点框（撤回的不要）、做错又改对的带当时的错答、没拿下的', () => {
  const items = [
    { outcome: 'ok', q: '算 βᵀα', wrongs: ['3×3 矩阵'], last: '5' },
    { outcome: 'first', q: '一次对的不列' },
    { outcome: 'revealed', q: '写出 Aⁿ', expected: '5^(n-1) A', wrongs: ['5^n A'] },
  ];
  const sh = lessonSheet({ steps, items });
  assert.equal(sh.notes.length, 1);
  assert.equal(sh.keys.length, 2);
  assert.equal(sh.fixed.length, 1);
  assert.equal(sh.open.length, 1);
  const md = sheetMd(sh);
  assert.match(md, /\*\*记号和结论\*\*\n\n- 记号：\$A=\\alpha\\beta\^T\$/);
  assert.match(md, /\*\*重点 · 关键\*\*/);
  assert.match(md, /\*\*易错\*\*/);
  assert.match(md, /- 算 βᵀα：当时写了「3×3 矩阵」，后来写对了「5」/);
  assert.match(md, /- 写出 Aⁿ（看了答案，写过「5\^n A」；答案 5\^\(n-1\) A）/);
  assert.doesNotMatch(md, /撤回的不要|一次对的不列/);
  assert.equal(sheetMd(lessonSheet({ steps: [] })), '');
  assert.ok(sheetEmpty(lessonSheet({})));
});

test('课后报告带着这一页，题里记着写错的那几次', () => {
  const ev = [
    { id: 'e1', src: 'record', kind: 'answer', comp: 'q1', step: 'b1', q: '算 βᵀα', ok: false, value: '3×3', attempts: 1, at: 1 },
    { id: 'e2', src: 'record', kind: 'answer', comp: 'q1', step: 'b1', q: '算 βᵀα', ok: true, value: '5', attempts: 2, at: 2 },
  ];
  const r = buildReport({ session: { id: 's1' }, evidence: ev, steps });
  assert.deepEqual(r.items[0].wrongs, ['3×3']);
  assert.equal(r.sheet.fixed[0].wrongs[0], '3×3');
  assert.match(sheetMd(r.sheet), /当时写了「3×3」/);
});

test('复现课的资料包：带上以前这一块的那一页，计划里先从当时错的地方出题', () => {
  const mem = sampleMemory('2026-11-03');
  const rid = mem.reviews?.[0]?.id;
  assert.ok(rid, '示例记忆里有复现组');
  const p = reviewPack(mem, rid, { sheets: [{ date: '2026-10-27', title: '秩一', md: '**做错又改对的**\n\n- …' }] });
  assert.match(p.main['以前这一块整理的一页'], /【2026-10-27 秩一】/);
  assert.match(p.main.plan, /^0\. 资料包里有以前这一块的课整理的一页/);
  assert.equal(reviewPack(mem, rid).main['以前这一块整理的一页'], undefined);
});

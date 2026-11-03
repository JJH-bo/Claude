// 2026-11-03 审查学习台时修的几处：撤销过的掌握能再加、删课留下的记忆点去掉课号、没块的课按这节课的科记、
// 首页和备课的复现排序一致、三科的资料包都进备份、试出来的选择题不当场接
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyPending, planEntry, parseMemoLines, blockSwitch } from '../kit/src/memory/memo.js';
import { purgePlan } from '../kit/src/memory/purge.js';
import { reviewQueue, reviewRank, handoffText } from '../kit/src/memory/views.js';
import { backupFile } from '../kit/src/memory/backup.js';
import { classify } from '../kit/src/class/react.js';
import { parseOutput } from '../kit/src/class/protocol.js';

const TODAY = '2026-11-03';

test('撤销过的掌握（void）再算出来时接着那条写，不撞号', () => {
  const old = { id: 'L2.2.3', state: '基础题过', status: 'void', log: [{ field: 'state', from: null, to: '基础题过' }] };
  const pd = { id: 'pd-1', kind: 'mastery', tier: 'direct', by: 'page', coll: 'mastery', op: 'add', target: 'L2.2.3', data: { state: '讲过' }, status: 'open', log: [] };
  const r = applyPending(pd, { mastery: [old] }, { date: TODAY });
  const doc = r.writes.find((w) => w.coll === 'mastery').doc;
  assert.equal(doc.state, '讲过');
  assert.equal(doc.status, 'active');
  assert.equal(doc.log.length, 2, '原来的 log 留着');
  assert.equal(doc.log[1].from, '基础题过');
  // 没作废的照旧拦住
  assert.throws(() => applyPending(pd, { mastery: [{ ...old, status: 'active' }] }, { date: TODAY }), /已经有/);
});

test('删课：这节课收的记忆点留着，去掉课号', () => {
  const mem = { sessions: [{ id: 'c-20261103-1' }], recall: [{ id: 'K1', q: 'q', a: 'a', session: 'c-20261103-1', tier: 1 }] };
  const plan = purgePlan(mem, 'c-20261103-1');
  const u = plan.unlink.find((x) => x.path === 'recall/K1');
  assert.ok(u);
  assert.equal(u.doc.session, undefined);
  assert.equal(u.doc.wasSession, 'c-20261103-1');
  assert.ok(!plan.docs.includes('recall/K1'));
});

test('没块开的课：position、记忆点、新弱点按这节课的科（不一律当数学）', () => {
  const mem = { curriculum: [{ id: 'EN-L1.1.1', title: '主谓' }], position: [], recall: [], weaknesses: [], evidence: [] };
  const one = (t) => parseMemoLines(t).entries[0];
  const pos = one('position next="从主谓一致接" block=EN-L1.1.1');
  assert.equal(planEntry(pos, { mem, space: 'en', date: TODAY }).target, 'now-en');
  // 没写 block：按这节课的科
  const r = planEntry(one('recall q="three 的过去式" a="不是动词" basis=say'), { mem, space: 'en', date: TODAY, session: 'c-1', evidence: [{ id: 'ev-1', src: 'say', kind: 'say', text: '要背', session: 'c-1', at: 1 }] });
  assert.equal(planEntry(one('position next="接着讲"'), { mem: { ...mem, position: [{ id: 'now-en', block: 'EN-L1.1.1', next: 'x' }] }, space: 'en', date: TODAY }).target, 'now-en');
  assert.equal(r.data?.space, 'en', JSON.stringify(r));
  // 换块：英语里没块开的课不能换到线代的块
  assert.match(blockSwitch({ attrs: { id: 'L2.2.1' } }, { mem: { curriculum: [{ id: 'L2.2.1' }] }, block: '', space: 'en' }).error, /不是这一科/);
});

test('复现排序：课堂新建的组（带建组那天的 last、没有结果）算从没复现过', () => {
  const mem = { reviews: [
    { id: 'R1', title: '没过的', tier: 1, last: '2026-10-30', result: '没过', status: 'active', blocks: ['L2.2.1'] },
    { id: 'R2', title: '新建的', tier: 1, last: '2026-11-01', status: 'active', blocks: ['L2.2.1'] },
  ] };
  const q = reviewQueue(mem, { today: TODAY });
  assert.deepEqual(q.map((x) => x.id), ['R2', 'R1']);
  assert.equal(q[0].why, '从没复现过');
  assert.equal(reviewRank({ result: '过' }), 2);
});

test('备份：三科的资料包各按自己的编号存', () => {
  const f = backupFile({ packs: { math: { main: { unit: '数' }, problems: null }, cs: { main: { unit: '计' }, problems: { items: [] } }, en: { main: null, problems: null } } });
  const ids = f.docs.filter((d) => d.collection === 'pack').map((d) => d.doc_id).sort();
  assert.deepEqual(ids, ['main', 'main-cs', 'problems-cs']);
});

test('启动语：练一练不算上一节；不再叫外部 Claude 代写', () => {
  const mem = { sessions: [
    { id: 'c-20261102-1', date: '2026-11-02', status: 'closed', startedAt: 1, block: 'L2.2.1' },
    { id: 'c-20261103-1', date: TODAY, status: 'closed', startedAt: 2, kind: 'drill' },
  ] };
  const t = handoffText(mem, { today: TODAY });
  assert.match(t, /上一节：c-20261102-1/);
  assert.doesNotMatch(t, /等你做的/);
});

test('预案：选择题错选过再选对（可能是试出来的）交给老师', () => {
  assert.equal(classify({ source: 'record', type: 'quiz', ok: true, attempts: 3, wrong: ['A', 'B'] }), null);
  assert.equal(classify({ source: 'record', type: 'quiz', ok: true, attempts: 1, wrong: [] }).kind, 'right');
});

test('add 的标题没加引号、后面跟 hold：hold 不被吞进标题', () => {
  const op = parseOutput('好\n\n```board add id=b4 title=提示 hold\n内容\n```\n', { final: true }).ops[0];
  assert.equal(op.hold, true);
  assert.equal(op.title, '提示');
});

test('掌握：删了那节课（依据的作答都没了），页面定的状态退回去；我定的不动', async () => {
  const { masteryProposals } = await import('../kit/src/memory/mastery.js');
  const mem = {
    curriculum: [{ id: 'L2.2.1', level: 'block' }],
    evidence: [],
    pending: [{ id: 'pd-a', by: 'page', status: 'done' }],
    mastery: [
      { id: 'L2.2.1', state: '基础题过', basis: ['ev-x1'], log: [{ field: 'state', from: '讲过', to: '基础题过', by: 'page', ref: 'pd-a', date: '2026-11-03' }] },
    ],
  };
  const p = masteryProposals(mem);
  assert.equal(p.length, 1);
  assert.equal(p[0].patch.state, '讲过');
  // 作答还在：不动
  assert.equal(masteryProposals({ ...mem, evidence: [{ id: 'ev-x1', src: 'record', tags: ['L9.9.9'] }] }).length, 0);
  // 我定的：不动
  assert.equal(masteryProposals({ ...mem, mastery: [{ ...mem.mastery[0], log: [{ field: 'state', from: '讲过', to: '基础题过', by: 'me', date: '2026-11-03' }] }] }).length, 0);
});

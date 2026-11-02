// 掌握：页面按证据算，出改动单，我点「确认」才写（docs/learning-plan.md 2.2）。纯函数，有测试（tests/memory-mastery.test.js）。
//
// 为什么页面算：掌握原来只有对话里的 Claude 能写，而上课、练习都在学习台里，很少回对话，课程地图的颜色就停住不动了。
// 课堂里的 Claude 照旧不能宣布掌握（红线 6）：这里不调用 Claude，只数证据；写进去要我确认（改动单 by: page，tier: confirm）。
//
// 按时间顺序走一遍这一块（或块里的一个知识点 块#名字）做过的题：
//   干净 = 一次对，而且没标「没把握」；失手 = 第一次就错（后来改对了也算）、想不出来、看了答案
//   两道不同的题干净 → 基础题过；
//   基础题过以后，隔够 1 / 3 / 7 / 14 / 30 天又干净一道 → 复现通过（第几档）；
//   基础题过 / 复现通过以后失手 → 掉了，重新数。
// 从记忆里现有的状态出发（我确认过的、对话里的 Claude 写的），只看那以后的题：不会把定下来的状态推翻成没依据的样子。
import { REVIEW_TIERS, toDate, daysBetween } from './schema.js';
import { itemsOf } from './report.js';
import { voidedIds } from './memo.js';
import { spaceOfId } from './space.js';

export const MASTERY_RULE = {
  basic: 2, // 几道不同的题干净算基础题过
  tiers: REVIEW_TIERS, // 复现的间隔（和复现组同一套档位）
  text: '两道不同的题一次对、没标没把握 → 基础题过；之后隔够 1 / 3 / 7 / 14 / 30 天再一次对 → 复现通过到那一档；之后错了、看了答案、想不出来 → 掉了',
};

const CLEAN = (it) => it.outcome === 'first' && it.sure !== false;
// 改对了（第一次错）也算失手：考试只有一次机会
const FAIL = (it) => ['wrong', 'giveup', 'revealed', 'ok'].includes(it.outcome);
// 同一道题（练习里抄来的组件 id 每次一样）在不同的课里做两遍，不算「两道不同的题」
const same = (k) => String(k).split('§').pop();
const blockOf = (id) => String(id || '').split('#')[0];
const isTarget = (t) => /^(?:[A-Z]{2}-)?L\d+(?:\.\d+){0,2}(?:#[A-Za-z0-9_-]+)?$/.test(t);

/**
 * 一串题（按时间排好）从 start 状态出发走一遍。start：{ state, tier, last（上次干净那天）}。
 * 返回 { state, tier, last, basis（定下这个状态的那几道题的证据）, why（一句话）}；没有变化时 state 和 start 一样。
 */
export function walk(items, start = {}, rule = MASTERY_RULE) {
  let state = start.state || '未学';
  let tier = Number(start.tier) || null;
  let last = start.last || null;
  let clean = []; // 还没到基础题过时，数过的干净题
  let basis = [];
  let why = '';
  const tiers = rule.tiers;
  for (const it of items) {
    const day = toDate(it.first || it.end || Date.now());
    const ev = (it.evidence || []).slice(-3);
    if (CLEAN(it)) {
      if (['未学', '讲过', '掉了'].includes(state)) {
        if (!clean.some((c) => c.key === same(it.key))) clean.push({ key: same(it.key), ev, day });
        if (clean.length >= rule.basic) {
          state = '基础题过'; tier = null; last = day;
          basis = clean.flatMap((c) => c.ev); clean = [];
          why = `${rule.basic} 道不同的题一次对`;
        }
      } else if (state === '基础题过' || state === '复现通过') {
        const i = state === '复现通过' ? tiers.indexOf(tier) : -1;
        const need = tiers[Math.min(tiers.length - 1, i + 1)];
        if (last && daysBetween(last, day) >= need) {
          const was = state === '复现通过' ? `第 ${tier} 天那档` : '基础题过';
          state = '复现通过'; tier = need; last = day; basis = ev;
          why = `${was}以后隔够 ${need} 天又一次对`;
        }
      }
    } else if (FAIL(it)) {
      if (state === '基础题过' || state === '复现通过') {
        state = '掉了'; tier = null; basis = ev;
        why = `过了以后又${it.outcome === 'giveup' ? '想不出来' : it.outcome === 'revealed' ? '看了答案' : '做错'}`;
      }
      clean = [];
    }
  }
  return { state, tier, last, basis: [...new Set(basis)], why };
}

/** 记忆里这一条现在的状态，和它从什么时候起算（之后的题才看） */
function startOf(doc, pending = []) {
  if (!doc) return { state: '未学', tier: null, last: null, since: 0 };
  const log = Array.isArray(doc.log) ? doc.log : [];
  const lastState = [...log].reverse().find((e) => e?.field === 'state' || e?.field === 'tier');
  // 从改动单来的：按它写进去的那一刻；别的（对话里的 Claude 写的）按 log 那天结束
  const pd = lastState?.ref ? pending.find((p) => p.id === lastState.ref) : null;
  const date = lastState?.date || doc.date || null;
  const since = Number(pd?.doneAt) || (date ? Date.parse(`${date}T23:59:59`) : 0) || 0;
  const last = doc.state === '基础题过' || doc.state === '复现通过' ? (date || null) : null;
  return { state: doc.state || '未学', tier: Number(doc.tier) || null, last, since };
}

/**
 * 全部提议：[{ target, op, data | patch, basis, reason, space, upto }]（还没变成改动单）。
 * mem：整个记忆库（evidence、mastery、pending、curriculum、sessions）。
 * 只提块（课程地图里有的）和块里的知识点（证据的 tags 写了的）。
 */
export function masteryProposals(mem = {}, { rule = MASTERY_RULE } = {}) {
  const gone = voidedIds(mem);
  const mastery = (mem.mastery || []).filter((d) => d && !gone.has(`mastery/${d.id}`));
  const pending = mem.pending || [];
  const blocks = new Set((mem.curriculum || []).filter((d) => d && (d.level === 'block' || String(d.id).replace(/^[A-Z]{2}-/, '').split('.').length === 3)).map((d) => String(d.id)));
  const evs = (mem.evidence || []).filter((e) => e && (e.src === 'record' || e.src === 'event'));
  const items = itemsOf(evs, new Map(), { bySession: true });
  const byTarget = new Map();
  for (const it of items) {
    for (const t of it.tags || []) {
      if (!isTarget(t)) continue;
      if (blocks.size && !blocks.has(blockOf(t))) continue;
      if (!byTarget.has(t)) byTarget.set(t, []);
      byTarget.get(t).push(it);
    }
  }
  const out = [];
  for (const [target, list] of [...byTarget].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))) {
    const doc = mastery.find((m) => String(m.id) === target);
    const start = startOf(doc, pending);
    const after = list.filter((it) => (Number(it.end) || Number(it.first) || 0) > start.since).sort((a, b) => (a.first ?? 0) - (b.first ?? 0));
    if (!after.length) continue;
    const r = walk(after, start, rule);
    if (r.state === start.state && (r.tier ?? null) === (start.tier ?? null)) continue;
    const upto = after.at(-1).evidence?.at(-1) || '';
    const value = { state: r.state, ...(r.state === '复现通过' ? { tier: r.tier } : {}) };
    const reason = `页面按证据算的：${r.why}。规则：${rule.text}`;
    const space = spaceOfId(target);
    // 依据接在原来的后面（原来的是定下上一个状态的，留着）
    if (doc) out.push({ target, op: 'update', patch: { ...value, basis: [...new Set([...(Array.isArray(doc.basis) ? doc.basis : []), ...r.basis])].slice(-20) }, basis: r.basis, reason, space, upto });
    else out.push({ target, op: 'add', data: { ...value, block: blockOf(target), basis: r.basis }, basis: r.basis, reason, space, upto });
  }
  return out;
}

const newId = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
const sameValue = (a, b) => (a.state ?? null) === (b.state ?? null) && (a.tier ?? null) === (b.tier ?? null);
const valueOf = (pd) => pd.patch || pd.data || {};

/**
 * 提议 → 要写的改动单：[{ id, doc }]。
 * - 同一条还开着的提议：内容一样不动；变了就改写那一张（不在「待确认」里堆好几张）
 * - 我点过「不要」的：同样的结论、同样的依据（upto 一样）不再提
 */
export function masteryPendingWrites(proposals, pending = [], { now = Date.now() } = {}) {
  const writes = [];
  for (const p of proposals) {
    const mine = pending.filter((d) => d && d.kind === 'mastery' && String(d.target) === p.target);
    const open = mine.find((d) => d.status === 'open');
    const value = p.patch || p.data;
    if (mine.some((d) => d.status === 'rejected' && sameValue(valueOf(d), value) && d.upto === p.upto)) continue;
    if (open && sameValue(valueOf(open), value) && open.op === p.op) continue;
    const id = open?.id || `pd-m${newId()}`;
    writes.push({
      id,
      doc: {
        kind: 'mastery', tier: 'confirm', by: 'page', coll: 'mastery', op: p.op, target: p.target,
        ...(p.op === 'add' ? { data: p.data } : { patch: p.patch }),
        reason: p.reason, basis: p.basis.slice(0, 20), label: '掌握', space: p.space, upto: p.upto,
        session: null, status: 'open', at: open?.at || now, log: open?.log || [],
      },
    });
  }
  return writes;
}

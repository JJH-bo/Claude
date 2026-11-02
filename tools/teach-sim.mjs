// 教学尺子（evals/teaching/，docs/learning-plan.md 第 4 节）：一节模拟课的「页面」。
// 老师（子代理，扮课堂里的 Claude）和学生（子代理，带一个设定好的误解）不直接对话，都经过这个脚本：
// 老师的输出用真的 protocol.js 读、按真的规矩上黑板；学生看到的是去掉答案的板面；学生的作答由这里判分，
// 用真的 actionText 写成课堂里同样的 [作答] / [动作] 行，连同真的「黑板现状」（和教学计划）发回给老师。
//
//   node tools/teach-sim.mjs init  <目录> <场景.json> [--no-plan]   开课：写 system.md（老师读一次）、state.json
//   node tools/teach-sim.mjs teacher <目录> <老师这一轮的输出文件>    上黑板；写 view.md（学生看的）
//   node tools/teach-sim.mjs student <目录> <学生这一轮的 JSON 文件>  判分；写 to-teacher.md（下一轮发给老师的）
//   node tools/teach-sim.mjs transcript <目录>                         整节课的记录 transcript.md（评卷人看）
//   node tools/teach-sim.mjs score <目录…>                             页面能算的指标（score.json）
//
// 学生的 JSON：{ "say": "对老师说的话（可空）", "acts": [{ "comp": "组件 id", "value": "答案或选项的文字" } | { "comp": "…", "giveup": true }],
//               "sure": { "组件 id": true | false } }
import fs from 'node:fs';
import path from 'node:path';
import { componentDocs } from '../kit/build-docs.js';
import { buildSystem, boardStateText, planText, latestPlan, actionsMessage, actionText } from '../kit/src/class/prompt.js';
import { parseOutput } from '../kit/src/class/protocol.js';
import { compile, valueTeX } from '../kit/src/expr.js';

const [cmd, dir, arg, ...rest] = process.argv.slice(2);
const read = (f) => fs.readFileSync(f, 'utf8');
const P = (f) => path.join(dir, f);
const load = () => JSON.parse(read(P('state.json')));
const save = (s) => fs.writeFileSync(P('state.json'), JSON.stringify(s, null, 1));
const bytes = (s) => Buffer.byteLength(String(s ?? ''));

/* ---------------- 组件：学生看到什么、怎么判 ---------------- */

function fencesOf(md) {
  const out = [];
  const re = /^(`{3,}|~{3,})[ \t]*([A-Za-z][\w-]*)[^\n]*\n([\s\S]*?)^\1[ \t]*$/gm;
  let m;
  while ((m = re.exec(String(md ?? '')))) {
    const body = m[3].replace(/\n$/, '');
    out.push({ lang: m[2].toLowerCase(), body, id: body.match(/^\s*id\s*[:：]\s*(\S+)\s*$/m)?.[1] || '', raw: m[0], at: m.index });
  }
  return out;
}

const KEY = /^([A-Za-z][\w-]*)\s*[:：]\s?(.*)$/;
function parseSteps(src) {
  const fields = {}; const steps = []; let target = fields, last = null;
  for (const raw of String(src).split('\n')) {
    const m = raw.match(KEY);
    if (m) {
      const k = m[1].toLowerCase();
      if (k === 'step') { target = { title: m[2].trim() }; steps.push(target); last = null; continue; }
      target[k] = m[2]; last = k;
    } else if (last) target[last] += '\n' + raw;
  }
  for (const o of [fields, ...steps]) for (const k in o) if (typeof o[k] === 'string') o[k] = o[k].trim();
  if (!steps.length) throw new Error('steps 至少要有一个 step:');
  for (const s of steps) s.choices = s.choices ? s.choices.split(/\s*\|\s*/).filter(Boolean) : null;
  return { fields, steps };
}
function parseQuiz(src) {
  const fields = {}; const options = [];
  for (const raw of String(src).split('\n')) {
    const o = raw.match(/^\s*-\s*\[([ xX])\]\s*(.*)$/);
    if (o) { options.push({ correct: o[1].toLowerCase() === 'x', text: o[2].trim() }); continue; }
    const m = raw.match(KEY);
    if (m) fields[m[1].toLowerCase()] = m[2].trim();
  }
  return { fields, options };
}
const field = (body, k) => body.match(new RegExp(`^\\s*${k}\\s*[:：]\\s?(.*)$`, 'mi'))?.[1]?.trim() || '';
// 隐藏答案：这些字段学生看不到
const HIDDEN = /^\s*(answer|answers|check|explain|show|expected|hint|why|wrong|variants|alts|accept|solution)\s*[:：]/i;

/** 一个组件 → 学生看到的文字（progress：steps 走到第几步了） */
function studentComp(f, progress = 0) {
  const id = f.id || '（没写 id）';
  try {
    if (f.lang === 'steps') {
      const { fields, steps } = parseSteps(f.body);
      const k = Math.min(progress, steps.length);
      const done = steps.slice(0, k).map((s, i) => `  第 ${i + 1} 步 ${s.title}：${s.show || s.answer || ''}`);
      const cur = steps[k];
      return [`【分步例题 ${id}】${fields.title || ''}`, fields.q ? `  ${fields.q}` : '', ...done,
        cur ? `  第 ${k + 1} 步 ${cur.title}：${cur.ask || '（自己做这一步）'}${cur.choices ? `\n  选项：${cur.choices.join(' / ')}` : cur.do ? '\n  （自己写出这一步的结果）' : '\n  （写一句你的想法）'}` : '  （全部步骤都揭开了）'].filter(Boolean).join('\n');
    }
    if (f.lang === 'quiz') {
      const { fields, options } = parseQuiz(f.body);
      return `【选择题 ${id}】${fields.title || ''}\n  ${fields.q || ''}\n${options.map((o, i) => `  ${String.fromCharCode(65 + i)}. ${o.text}`).join('\n')}${options.filter((o) => o.correct).length > 1 ? '\n  （多选）' : ''}`;
    }
    if (f.lang === 'answer' || f.lang === 'practice') {
      return `【作答题 ${id}】${field(f.body, 'title')}\n  ${field(f.body, 'q')}\n  （写出答案）`;
    }
    if (['scene', 'graph', 'space', 'plot'].includes(f.lang)) return `【一张图 ${id}】${field(f.body, 'title')}（模拟课里拖不了；可以看图里的标注：${f.body.split('\n').filter((l) => /^\s*show\b|label=/.test(l)).map((l) => l.trim()).slice(0, 3).join('；') || '没有'}）`;
    if (f.lang === 'let') return '';
    // 别的组件：去掉答案类字段，原样给
    return `【${f.lang} ${id}】\n${f.body.split('\n').filter((l) => !HIDDEN.test(l) && !/^\s*-\s*\[[xX]\]/.test(l)).map((l) => `  ${l}`).join('\n')}`;
  } catch (e) {
    return `【${f.lang} ${id}】（这个组件写错了，学生看到的是「这段没画出来」：${e.message}）`;
  }
}

// 页面会把 \calc{…} 算好再写上去：学生看到的是数（算不出来的照原样留着）
function expandCalc(md, vars) {
  return String(md).replace(/\\calc\{((?:[^{}]|\{[^{}]*\})*)\}/g, (m, ex) => { const v = evalExpr(ex, vars); try { return v === undefined ? m : valueTeX(v); } catch { return m; } });
}

/** 一段 → 学生看到的文字 */
function studentSeg(seg, st) {
  const md = expandCalc(String(seg.md || ''), boardVars(st));
  const fs_ = fencesOf(md);
  let out = '';
  let pos = 0;
  for (const f of fs_) {
    out += md.slice(pos, f.at);
    out += studentComp(f, st.progress[f.id] || 0);
    pos = f.at + f.raw.length;
  }
  out += md.slice(pos);
  return `## ${seg.title || seg.id}\n${out.trim()}`;
}

// 数值比较：表达式算出来的数 / 向量 / 矩阵
function evalExpr(src, vars = {}) {
  try { return compile(String(src).replace(/[（）]/g, (c) => (c === '（' ? '(' : ')')))(vars); } catch { return undefined; }
}
const flat = (v) => (Array.isArray(v) ? v.flat(Infinity) : [v]);
function sameVal(a, b) {
  if (a === undefined || b === undefined) return null;
  const x = flat(a), y = flat(b);
  if (x.length !== y.length || x.some((n) => typeof n !== 'number')) return false;
  return x.every((n, i) => Math.abs(n - y[i]) < 1e-6 * Math.max(1, Math.abs(n)));
}
// 黑板上所有 let 块定义的量（整节课都能用，和页面的 session.vars 一样）
function boardVars(st) {
  const v = {};
  for (const sg of st.segs) for (const f of fencesOf(sg.md)) {
    if (f.lang !== 'let') continue;
    for (const m of f.body.matchAll(/^\s*(?:let\s+)?([A-Za-z_][\w]*)\s*=\s*(.+)$/gm)) { const x = evalExpr(m[2], v); if (x !== undefined) v[m[1]] = x; }
  }
  return v;
}
function answerVars(body, base = {}) {
  const v = { ...base };
  // 组件里的 let 一行一个（scene.js 碰 DOM，这里自己读）
  for (const m of String(body).matchAll(/^\s*let\s+([A-Za-z_][\w]*)\s*=\s*(.+)$/gm)) { const x = evalExpr(m[2], v); if (x !== undefined) v[m[1]] = x; }
  return v;
}
const norm = (s) => String(s ?? '').replace(/\$/g, '').replace(/\s+/g, '').toLowerCase();

// 学生选的是哪一项：写选项文字、字母（A / A. / A、），或者「A. 选项文字」都认
export function pickOption(texts, value) {
  const v = norm(value);
  const byText = texts.findIndex((t) => norm(t) === v);
  if (byText >= 0) return byText;
  const m = String(value ?? '').trim().match(/^([A-Za-z])(?:[.．、:：)）\s]|$)/);
  if (m) { const i = m[1].toUpperCase().charCodeAt(0) - 65; if (i >= 0 && i < texts.length) return i; }
  return texts.findIndex((t) => norm(t) && v.includes(norm(t)));
}

/** 学生的一个动作 → 课堂里同样的作答记录（交给 actionText） */
function judge(st, act) {
  const where = st.compAt[act.comp];
  if (!where) return { source: 'page', text: `[系统] 学生想答 ${act.comp}，可黑板上没有这个组件` };
  const { seg, f } = where;
  const base = { source: 'record', block: f.id, step: seg.id };
  st.tries[f.id] = (st.tries[f.id] || 0) + (act.giveup ? 0 : 1);
  const attempts = st.tries[f.id];
  if (f.lang === 'steps') {
    const { fields, steps } = parseSteps(f.body);
    const k = st.progress[f.id] || 0;
    const s = steps[k];
    if (!s) return { source: 'page', text: `[系统] ${f.id} 的步骤都揭开了` };
    const detail = `第 ${k + 1} 步`;
    if (act.giveup) { st.progress[f.id] = k + 1; st.tries[f.id] = 0; return { source: 'event', type: 'giveup', block: f.id, step: seg.id, detail: { step: k + 1, title: s.title } }; }
    let ok = null;
    if (s.choices) ok = pickOption(s.choices, act.value) === s.choices.indexOf(s.answer);
    else if (s.do && s.answer) { const v = boardVars(st); ok = sameVal(evalExpr(act.value, v), evalExpr(s.answer, v)); }
    // 选择一次定（和真的 steps 一样：选错就揭开）；写的错了可以再试
    if (s.choices || ok !== false) { st.progress[f.id] = k + 1; st.tries[f.id] = 0; }
    return { ...base, type: 'steps', title: fields.title || '', q: `${s.title}｜${s.ask || ''}`, detail, value: s.choices ? act.value : undefined, text: s.choices ? undefined : act.value, ok, attempts };
  }
  if (f.lang === 'quiz') {
    const { fields, options } = parseQuiz(f.body);
    const pick = pickOption(options.map((o) => o.text), act.value);
    const ok = pick >= 0 ? options[pick].correct : false;
    return { ...base, type: 'quiz', q: fields.q || '', ok, attempts, ...(ok ? {} : { wrong: [act.value] }), final: ok };
  }
  if (f.lang === 'answer') {
    const exp = field(f.body, 'answer');
    const vars = answerVars(f.body, boardVars(st));
    const ok = exp ? sameVal(evalExpr(act.value, vars), evalExpr(exp, vars)) : null;
    return { ...base, type: 'answer', title: field(f.body, 'title'), q: field(f.body, 'q'), value: act.value, ok: ok === null ? null : ok, attempts };
  }
  return { ...base, type: f.lang, title: field(f.body, 'title'), q: field(f.body, 'q'), value: act.value, ok: null, attempts };
}

/* ---------------- 黑板 ---------------- */

function boardForPrompt(st) {
  return {
    segs: st.segs.map((s) => ({ ...s, blocks: fencesOf(s.md).filter((f) => f.id && f.lang !== 'let').map((f) => ({ id: f.id, kind: f.lang, results: st.results[f.id] || [] })) })),
    pages: st.pages, cur: st.cur, view: st.cur, screen: { w: 820, h: 1180, board: { w: 780, h: 900 } },
  };
}

function apply(st, text) {
  const { segments, rejected } = parseOutput(text, { final: true });
  const notes = rejected.map((r) => `[系统] 有一个 board 块看不懂：${r.error || r.header || ''}`);
  const talk = segments.filter((s) => s.type === 'speech').map((s) => s.text).join('\n\n').trim();
  let newPage = false;
  for (const sg of segments.filter((s) => s.type === 'board')) {
    const op = sg.op || {};
    const seg = (id) => st.segs.find((s) => s.id === id);
    const check = (md, id) => {
      for (const f of fencesOf(md)) {
        try { if (f.lang === 'steps') parseSteps(f.body); } catch (e) { notes.push(`[系统] 段 ${id} 里的 steps ${f.id} 写错了：${e.message}`); }
      }
    };
    if (op.op === 'new') { st.cur = st.pages.length + 1; st.pages.push({ n: st.cur, title: op.title || '', talk: '' }); st.segs.push({ id: op.id, page: st.cur, title: op.title || '', md: sg.body }); newPage = true; check(sg.body, op.id); }
    else if (op.op === 'add') { if (!st.pages.length) { st.cur = 1; st.pages.push({ n: 1, title: op.title || '', talk: '' }); } st.segs.push({ id: op.id, page: st.cur, title: op.title || '', md: sg.body }); check(sg.body, op.id); }
    else if (op.op === 'replace') { const s = seg(op.id); if (s) { s.md = sg.body; if (op.title) s.title = op.title; for (const f of fencesOf(sg.body)) { delete st.progress[f.id]; delete st.results[f.id]; } check(sg.body, op.id); } else notes.push(`[系统] replace 的 ${op.id} 不在黑板上`); }
    else if (op.op === 'hide') { const s = seg(op.id); if (s) s.hidden = true; }
    else if (op.op === 'pin') { st.segs.push({ id: op.id, place: 'pin', title: op.title || '', md: sg.body }); }
    else if (op.op === 'unpin') { const s = seg(op.id); if (s) s.hidden = true; }
    st.ops.push(op.op || 'unknown');
  }
  const page = st.pages.find((p) => p.n === st.cur);
  if (page && talk) page.talk = talk;
  // 组件 id → 所在段（学生作答时找）
  st.compAt = {};
  for (const s of st.segs) if (!s.hidden) for (const f of fencesOf(s.md)) if (f.id) st.compAt[f.id] = { seg: { id: s.id }, f };
  return { talk, notes, newPage };
}

function viewText(st, talk) {
  const page = st.pages.find((p) => p.n === st.cur);
  const here = st.segs.filter((s) => !s.hidden && s.place !== 'pin' && s.page === st.cur);
  const pins = st.segs.filter((s) => !s.hidden && s.place === 'pin');
  return [
    `# 第 ${st.cur || 0} 块板${page?.title ? `「${page.title}」` : ''}`,
    `老师写在板顶的话：${talk || page?.talk || '（没说话）'}`,
    ...here.map((s) => studentSeg(s, st)),
    pins.length ? `# 常驻栏\n${pins.map((s) => studentSeg(s, st)).join('\n')}` : '',
    '\n（回复一个 JSON：{"say": "…", "acts": [{"comp": "组件 id", "value": "…"}], "sure": {"组件 id": true/false}}；不会就 {"comp": "…", "giveup": true}）',
  ].filter(Boolean).join('\n\n');
}

/* ---------------- 命令 ---------------- */

const docs = () => componentDocs(read(new URL('../CLAUDE-PROJECT.md', import.meta.url)));

if (cmd === 'init') {
  const sc = JSON.parse(read(arg));
  const plan = !rest.includes('--no-plan');
  fs.mkdirSync(dir, { recursive: true });
  const system = buildSystem({ componentDocs: docs(), pack: sc.pack, board: { segs: [], pages: [], cur: 0 }, subject: sc.subject, tools: false, planDoc: plan });
  fs.writeFileSync(P('system.md'), system);
  save({ scenario: sc.id, subject: sc.subject, plan, pack: sc.pack, segs: [], pages: [], cur: 0, progress: {}, tries: {}, results: {}, compAt: {}, ops: [], history: [], turns: [], seq: 0 });
  fs.writeFileSync(P('to-teacher.md'), `${sc.opening || '学生打开了课堂：「老师好，开始吧。」'}`);
  console.log(`开课：${sc.id}（${sc.subject}，计划块${plan ? '开' : '关'}），说明 ${(bytes(system) / 1024).toFixed(1)} KiB`);
} else if (cmd === 'teacher') {
  const st = load();
  const text = read(arg);
  st.seq++;
  st.history.push({ role: 'claude', seq: st.seq, text });
  const r = apply(st, text);
  const view = viewText(st, r.talk);
  fs.writeFileSync(P('view.md'), view);
  st.turns.push({ seq: st.seq, role: 'teacher', bytes: bytes(text), talk: r.talk, ops: st.ops.slice(), notes: r.notes, plan: /board[ \t]+plan/i.test(text), view });
  st.pendingNotes = r.notes;
  st.ops = [];
  save(st);
  console.log(`第 ${st.seq} 轮老师：${bytes(text)} 字节，话 ${r.talk.length} 字，指令 ${st.turns.at(-1).ops.join(' ') || '无'}${r.notes.length ? `，${r.notes.length} 条提醒` : ''}`);
} else if (cmd === 'student') {
  const st = load();
  let s;
  try { s = JSON.parse(read(arg).replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch (e) { console.error('学生的回复不是 JSON：', e.message); process.exit(1); }
  st.seq++;
  const acts = [];
  for (const a of s.acts || []) {
    const rec = judge(st, a);
    acts.push(rec);
    if (rec.block) (st.results[rec.block] ||= []).push(rec);
  }
  for (const [comp, sure] of Object.entries(s.sure || {})) {
    const last = (st.results[comp] || []).at(-1);
    const ev = { source: 'event', type: 'sure', block: comp, step: st.compAt[comp]?.seg.id, sure: !!sure, ok: last?.ok ?? null };
    acts.push(ev);
  }
  const say = String(s.say || '').trim();
  const msg = [say, actionsMessage(acts), ...(st.pendingNotes || [])].filter(Boolean).join('\n') || '（学生没有说话，也没有作答）';
  st.history.push({ role: 'student', seq: st.seq, text: msg });
  st.turns.push({ seq: st.seq, role: 'student', say, acts: acts.map((a) => ({ comp: a.block, ok: a.ok, type: a.type })), msg });
  st.pendingNotes = [];
  const state = `${st.plan ? `${planText(latestPlan(st.history))}\n\n` : ''}${boardStateText(boardForPrompt(st))}`;
  fs.writeFileSync(P('to-teacher.md'), `【页面这一轮发给你的】\n\n# 黑板现状（最新，替换说明里那份）\n\n${state}\n\n# 学生\n\n${msg}\n`);
  save(st);
  console.log(`第 ${st.seq} 轮学生：${acts.map((a) => (a.block ? `${a.block}${a.ok === true ? '✓' : a.ok === false ? '✗' : '·'}` : a.type || '')).join(' ') || '没作答'}${say ? `，说「${say.slice(0, 30)}」` : ''}`);
} else if (cmd === 'transcript') {
  const st = load();
  const out = [`# 模拟课 ${st.scenario}（${st.subject}，计划块${st.plan ? '开' : '关'}）`];
  for (const t of st.turns) {
    if (t.role === 'teacher') out.push(`## 第 ${t.seq} 轮 · 老师\n\n${st.history.find((h) => h.seq === t.seq)?.text || ''}\n\n### 学生看到的\n\n${t.view}`);
    else out.push(`## 第 ${t.seq} 轮 · 学生\n\n${t.msg}`);
  }
  fs.writeFileSync(P('transcript.md'), out.join('\n\n'));
  console.log(`写了 ${P('transcript.md')}`);
} else if (cmd === 'score') {
  const rows = [];
  for (const d of [dir, arg, ...rest].filter(Boolean)) {
    const st = JSON.parse(read(path.join(d, 'state.json')));
    const T = st.turns.filter((t) => t.role === 'teacher');
    const S = st.turns.filter((t) => t.role === 'student');
    const judged = S.flatMap((t) => t.acts).filter((a) => a.ok === true || a.ok === false);
    const interactive = T.filter((t) => /```(?:steps|quiz|answer|practice|predict|scene|recognize|cloze|errfind|parse|drill)/.test(st.history.find((h) => h.seq === t.seq)?.text || '')).length;
    rows.push({
      run: path.basename(d), scenario: st.scenario, plan: st.plan, teacherTurns: T.length,
      avgOutBytes: Math.round(T.reduce((a, t) => a + t.bytes, 0) / Math.max(1, T.length)),
      avgTalkChars: Math.round(T.reduce((a, t) => a + t.talk.length, 0) / Math.max(1, T.length)),
      planWrites: T.filter((t) => t.plan).length, boards: T.reduce((a, t) => a + t.ops.filter((o) => o === 'new').length, 0),
      turnsWithTask: interactive, studentActs: judged.length, studentRight: judged.filter((a) => a.ok).length,
      notes: T.reduce((a, t) => a + t.notes.length, 0),
    });
  }
  console.log(JSON.stringify(rows, null, 1));
} else {
  console.log('用法见文件开头');
}

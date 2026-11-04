#!/usr/bin/env node
// 在 Claude Code 里转教材（docs/textbook-plan.md「在 Claude Code 里转」）。学习台里只存原页图、不调用 Claude；这边：
//   1. ArtifactData list 把书和页存到本地（out_dir）：books/B3.json、books/B3/pages/*.json
//   2. node tools/books.mjs plan  --dump 目录 --book B3 [--pages 64-81,55] [--per 4] --work 工作目录
//      → 每批一个 bNNN.prompt.txt（转写的规矩，和学习台里原来用的同一份 transcribePrompt）、bNNN.json（页码 → 原页图的 asset id）
//   3. 每批交给一个转写助手：取这几张原页图（Artifact read 的 path）、看图、照 prompt 写成 bNNN.out.txt
//   4. node tools/books.mjs apply --book B3 --work 工作目录 --by 模型
//      → 读每批的 out.txt（ingest.js 的 parseTranscription），拼成收件箱记录 inbox/*.json，打印 ArtifactData batch 的 writes
//   5. ArtifactData batch 写进 book_inbox；学习台打开时（bookview.js 的 takeInbox）并进各页、自己拼条目
// 收件箱每批一条新记录：不改已有的页、不用管版本号，学习台那边同时在存别的页也不冲突。
import fs from 'node:fs';
import path from 'node:path';
import { transcribePrompt, parseTranscription } from '../kit/src/books/ingest.js';

const args = process.argv.slice(2);
const cmd = args.shift();
const opt = (k, d = null) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const pad = (n) => String(n).padStart(3, '0');

/** 「64-81,55」→ [55, 64, 65, …, 81] */
export function parseRange(s = '') {
  const out = new Set();
  for (const part of String(s).split(/[,，、\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:[-–~](\d+))?$/);
    if (!m) continue;
    const a = Number(m[1]), b = Number(m[2] || m[1]);
    for (let n = Math.min(a, b); n <= Math.max(a, b); n++) out.add(n);
  }
  return [...out].sort((x, y) => x - y);
}

/** 要转的页分批：连着的页才放一批，一批最多 per 页 */
export function batchesOf(nums = [], per = 4) {
  const out = [];
  for (const n of [...nums].sort((a, b) => a - b)) {
    const last = out[out.length - 1];
    if (last && last.length < per && last[last.length - 1] === n - 1) last.push(n);
    else out.push([n]);
  }
  return out;
}

// 上一页停在哪（和 importer.js 的 ctxBefore 一样）：给转写判断这几页开头是不是接着上一页
function ctxBefore(pages, n) {
  let chapter = '', section = '';
  for (const p of pages.filter((x) => x.n < n && x.status === 'done').sort((a, b) => a.n - b.n)) {
    for (const it of p.items || []) if (it.kind === '标题') { if (it.level === 1) { chapter = it.title; section = ''; } else if (it.level === 2) section = it.title; }
  }
  const prev = pages.find((x) => x.n === n - 1 && x.status === 'done');
  const it = prev ? [...(prev.items || [])].reverse().find((x) => x.kind !== '标题') : null;
  return { chapter, section, last: it ? { kind: it.kind, title: it.title } : null };
}

function loadDump(dir, book) {
  const info = readJson(path.join(dir, 'books', `${book}.json`));
  const pdir = path.join(dir, 'books', book, 'pages');
  const pages = fs.readdirSync(pdir).filter((f) => f.endsWith('.json')).map((f) => readJson(path.join(pdir, f))).map((p) => ({ ...p, n: Number(p.n) }));
  return { info, pages: pages.sort((a, b) => a.n - b.n) };
}

// 告诉转写的模型这是什么：学生自己的书，转了只存进学生私人的学习台自己复习（页面里的 Haiku 以为是要外传，不肯转）
const CONTEXT = '（这些是学生自己手里这本教材的扫描页。转写的文字只存进学生私人的学习台，上课时给讲课的老师按条取用，不对外发布。）';

function plan() {
  const dir = opt('dump'), book = opt('book'), work = opt('work');
  if (!dir || !book || !work) throw new Error('要 --dump 目录 --book B3 --work 工作目录');
  const per = Number(opt('per', 4)) || 4;
  const { info, pages } = loadDump(dir, book);
  const byN = new Map(pages.map((p) => [p.n, p]));
  const want = opt('pages') ? parseRange(opt('pages')).filter((n) => byN.has(n)) : pages.filter((p) => p.status !== 'done').map((p) => p.n);
  const noImg = want.filter((n) => !byN.get(n).img);
  const todo = want.filter((n) => byN.get(n).img);
  const out = path.join(work, book);
  fs.mkdirSync(out, { recursive: true });
  const rows = [];
  for (const nums of batchesOf(todo, per)) {
    const id = `b${pad(nums[0])}`;
    const layer = Object.fromEntries(nums.map((n) => [n, byN.get(n).layer || '']));
    const prompt = `${CONTEXT}\n\n${transcribePrompt({ title: info.title, subject: info.subject }, nums, { ...ctxBefore(pages, nums[0]), kind: info.kind, layer })}`;
    fs.writeFileSync(path.join(out, `${id}.prompt.txt`), prompt);
    const imgs = Object.fromEntries(nums.map((n) => [n, byN.get(n).img]));
    fs.writeFileSync(path.join(out, `${id}.json`), JSON.stringify({ book, pages: nums, imgs }, null, 1));
    rows.push({ id, pages: nums, imgs });
  }
  console.log(JSON.stringify({ book, title: info.title, pages: todo.length, batches: rows.length, noImg, rows }, null, 1));
}

function apply() {
  const book = opt('book'), work = opt('work'), by = opt('by', '');
  if (!book || !work) throw new Error('要 --book B3 --work 工作目录');
  const dir = path.join(work, book);
  const inbox = path.join(dir, 'inbox');
  fs.mkdirSync(inbox, { recursive: true });
  const writes = [];
  const report = [];
  const stamp = Date.now().toString(36);
  for (const f of fs.readdirSync(dir).filter((x) => /^b\d+\.json$/.test(x)).sort()) {
    const { pages: nums } = readJson(path.join(dir, f));
    const id = f.replace(/\.json$/, '');
    const outFile = path.join(dir, `${id}.out.txt`);
    if (!fs.existsSync(outFile)) { report.push(`${id}：没有结果（${nums.join('、')} 页）`); continue; }
    if (fs.existsSync(path.join(dir, `${id}.sent`))) continue; // 已经写进学习台了
    const raw = fs.readFileSync(outFile, 'utf8');
    let parsed;
    try { parsed = parseTranscription(raw, nums); } catch (e) { report.push(`${id}：${e.message}：${raw.replace(/\s+/g, ' ').slice(0, 100)}`); continue; }
    const got = Object.fromEntries(nums.filter((n) => parsed.pages.has(n)).map((n) => [n, parsed.pages.get(n)]));
    if (parsed.missing.length) report.push(`${id}：第 ${parsed.missing.join('、')} 页没转出来`);
    if (!Object.keys(got).length) continue;
    const docId = `${book}-${pad(nums[0])}-${stamp}`;
    const file = path.join(inbox, `${docId}.json`);
    fs.writeFileSync(file, JSON.stringify({ book, batch: id, pages: got, by, at: Date.now() }));
    writes.push({ op: 'set', collection: 'book_inbox', doc_id: docId, file_path: path.resolve(file), _batch: id });
  }
  // 一次 batch 最多 50 条、1 MiB：按大小切
  const groups = [];
  let cur = [], size = 0;
  for (const w of writes) {
    const n = fs.statSync(w.file_path).size;
    if (cur.length && (cur.length >= 50 || size + n > 900 * 1024)) { groups.push(cur); cur = []; size = 0; }
    cur.push(w); size += n;
  }
  if (cur.length) groups.push(cur);
  console.log(JSON.stringify({ book, inbox: writes.length, report, groups: groups.map((g) => g.map(({ _batch, ...w }) => w)) }, null, 1));
}

/** 写进学习台以后记一下，下次 apply 不再重发 */
function sent() {
  const book = opt('book'), work = opt('work');
  const dir = path.join(work, book);
  for (const f of fs.readdirSync(path.join(dir, 'inbox'))) {
    const d = readJson(path.join(dir, 'inbox', f));
    fs.writeFileSync(path.join(dir, `${d.batch}.sent`), f);
  }
  console.log('记下了');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    if (cmd === 'plan') plan();
    else if (cmd === 'apply') apply();
    else if (cmd === 'sent') sent();
    else console.log('用法：node tools/books.mjs plan|apply|sent …（见文件开头）');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

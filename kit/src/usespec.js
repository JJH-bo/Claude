// practice 的 use:（演示组件当练习题）：随机取数照自定义题型写（pick / let / where），下面接那个演示组件的写法，
// 字段里用 \calc{…} 写取到的数。页面每一题换一组数，判分、错法诊断都用现成的引擎。纯函数（tests/usespec.test.js）。
//
//   use: hamming
//   count: 3
//   pick d = bits(4) nonzero
//   data: \calc{d}
//   mode: quiz
//
// 只写 use: 不写 pick 的，用这里内置的出题（BUILTIN_USE，按 level 选难度）。
import { parseFields } from './parse.js';
import { calcFields, commonSpec, resolveAsks, parseAskField, trackFields, fillSpec } from './stepperspec.js';
import { commandLine, instantiate, pickedText } from './practicespec.js';

// 这几个字段是 practice 自己的（标题、要答对几道、难度、说明），其余的行原样交给演示组件
const OWN = new Set(['use', 'count', 'title', 'note', 'level', 'id']);

/**
 * 解析。返回 { use, fields（practice 自己的）, picks, lets, wheres, body（演示组件的写法）, builtin }；写错了抛出中文原因。
 * engines：名字 → 引擎（engines/registry.js），用来查 use: 写的组件在不在
 */
export function parseUseTemplate(src, engines) {
  const fields = {};
  const into = { picks: [], lets: [], wheres: [] };
  const body = [];
  for (const raw of String(src ?? '').split('\n')) {
    const t = raw.trim();
    if (t && commandLine(t, into)) continue;
    const f = raw.match(/^([A-Za-z][\w-]*)\s*[:：]\s?(.*)$/);
    if (f && OWN.has(f[1].toLowerCase())) { fields[f[1].toLowerCase()] = f[2].trim(); continue; }
    body.push(raw);
  }
  const use = String(fields.use || '').trim().toLowerCase();
  if (!use) throw new Error('use: 写演示组件的名字（hamming、mul、paging……）');
  const engine = engines[use];
  if (!engine) throw new Error(`use: 不认识「${fields.use}」：写演示组件的名字（${Object.keys(engines).slice(0, 12).join('、')}……）`);
  if (use === 'frames') throw new Error('frames 是你自己写每一帧，没有可以随机换的数：用 type: custom 出题');
  let builtin = false;
  let tpl = { ...into, body: body.join('\n').trim() };
  if (!into.picks.length) {
    // 只写了 use:（和 mode: 这类）：用内置的出题；组件的字段写了的照写的来（覆盖内置的同名字段）
    const b = builtinUse(use, fields.level);
    if (!b) throw new Error(`${use} 没有内置的出题：自己写 pick（随机取的数）和组件的字段，字段里用 \\calc{…} 写取到的数（内置出题的有：${Object.keys(BUILTIN_USE).join('、')}）`);
    tpl = { ...b, body: mergeBody(b.body, tpl.body) };
    builtin = true;
  }
  if (/^\s*mode\s*[:：]\s*do\b/mi.test(tpl.body)) throw new Error('practice 的 use: 里不能用 mode: do（那是学生自己动手的整套做法，单独放一个组件）');
  return { use, engine, fields, ...tpl, builtin };
}

// 内置出题的字段 + 老师写的同名字段（老师的优先）
function mergeBody(base, mine) {
  if (!mine.trim()) return base;
  const keyOf = (l) => l.match(/^([A-Za-z][\w-]*)\s*[:：]/)?.[1].toLowerCase();
  const mineKeys = new Set(mine.split('\n').map(keyOf).filter(Boolean));
  return [...base.split('\n').filter((l) => !mineKeys.has(keyOf(l))), mine].join('\n');
}

/**
 * 用一组数把组件准备好（和 stepper.js 开头一样的那几步，不碰 DOM）：字段里的 \calc 换成这组数，
 * 解析、跑一遍，看看这一题有没有能作答的（quiz / fill / ask）。返回 { fields, input, run, mode, src }；不行就抛出中文原因
 */
export function prepareUse(tpl, vars) {
  const { engine } = tpl;
  const raw = parseFields(engine.head ? engine.head(tpl.body) : tpl.body).fields;
  // 没写 mode: 也没写 ask: 时就是 quiz（练习题就是要写结果）
  const body = raw.mode === undefined && raw.ask === undefined ? `mode: quiz\n${tpl.body}` : tpl.body;
  const calced = calcFields(parseFields(engine.head ? engine.head(body) : body).fields, vars);
  if (calced.errors.length) throw new Error(calced.errors[0]);
  const tracked = trackFields(calced.fields);
  const { fields } = tracked;
  const common = commonSpec(fields);
  const input = engine.parse(fields, body);
  const run = engine.run(input);
  if (common.mode === 'quiz') {
    if (!engine.quiz?.(input, run, fields)) throw new Error(`${tpl.use} 这种用法没有 mode: quiz，换成 mode: fill 或 ask:`);
  } else if (common.mode === 'fill') {
    const t = engine.table?.(input, run, fields);
    if (!t) throw new Error(`${tpl.use} 还没有 mode: fill，用 mode: quiz 或 ask:`);
    const r = fillSpec(t, fields);
    if (r.errors.length) throw new Error(r.errors[0]);
  } else {
    const ask = (fields.ask === undefined || fields.ask === '') && engine.defaultAsk ? parseAskField(engine.defaultAsk(input)) : common.ask;
    const r = resolveAsks(ask, run.steps);
    // 问的那种这一组数里没有（没失衡就没有 rotate）：换一组；一组都问不到才报（拼错了的种类也是取 40 组以后报）
    if (r.errors.length) throw Object.assign(new Error(r.errors[0]), { redraw: true });
    // 这组数正好没有能问的（插了几个数都没失衡，就没有「哪种旋转」可问）：换一组。一组都问不到才是写错了
    if (!r.asks.size) throw Object.assign(new Error('练习题要有作答：写 mode: quiz（写结果）、mode: fill（填表）或 ask:（先猜）；写了 ask: 的，取的数要让它问得到'), { redraw: true });
  }
  // 写了却没用上的字段（拼错了）：quiz / fill 用到的字段要先碰一下，所以放在最后（hint 是 quiz 的提示，外壳读）
  void fields.hint;
  return { fields, input, run, mode: common.mode, src: body, unknown: tracked.unknown() };
}

/** 发布时先取十几组数试一遍：取不到、组件报错、没有能作答的都报出来。返回出错的说明（没有就是空数组） */
export function checkUse(tpl, { base = {}, rand = Math.random, rounds = 12 } = {}) {
  const errors = [];
  let warnings = null;
  for (let k = 0; k < rounds && !errors.length; k++) {
    try {
      const p = drawUse(tpl, { base, rand });
      warnings ??= p.unknown;
    } catch (e) { errors.push(e.message); }
  }
  return Object.assign(errors, { warnings: warnings || [] });
}

/**
 * 出一道题：取一组数、把组件准备好。这组数正好问不到（redraw）就换一组，最多 tries 组。
 * 返回 prepareUse 的结果加上 { vars, picked }；出不来抛出中文原因（带着取到的数）
 */
export function drawUse(tpl, { base = {}, rand = Math.random, avoid = null, tries = 40 } = {}) {
  let last = null;
  for (let k = 0; k < tries; k++) {
    const inst = instantiate(tpl, { base, rand, avoid });
    try {
      return { ...prepareUse(tpl, inst.vars), vars: inst.vars, picked: inst.picked };
    } catch (e) {
      last = new Error(`取 ${pickedText(inst.picked)} 时，${tpl.use}：${e.message}`);
      if (!e.redraw) throw last;
    }
  }
  throw last;
}

// —— 内置出题：就是写好的模板（和老师写的同一套取数、自检），[level 1, level 2] ——
// 数都取得「考试里那样」：位数、长度和王道的例题差不多；字段写法和各组件的说明一致
const T = String.raw;
export const BUILTIN_USE = {
  hamming: { name: '海明码', levels: [T`pick d = bits(4) nonzero
data: \calc{d}`, T`pick d = bits(8) nonzero
data: \calc{d}`] },
  crc: { name: 'CRC 校验码', levels: [T`pick d = bits(6) nonzero
pick g = choice(0b1101, 0b1011, 0b1001)
data: \calc{d}
gen: \calc{bin(g)}`, T`pick d = bits(8) nonzero
pick g = choice(0b10011, 0b11001, 0b10101)
data: \calc{d}
gen: \calc{bin(g)}`] },
  mul: { name: 'Booth 补码一位乘', levels: [T`pick a = int(1, 15)
pick b = int(5, 15)
pick s = choice(1, -1)
pick u = choice(1, -1)
x: \calc{sbin(s*a/16, 4)}
y: \calc{sbin(u*b/16, 4)}
algo: booth`, T`pick a = int(1, 63)
pick b = int(9, 63)
pick s = choice(1, -1)
pick u = choice(1, -1)
x: \calc{sbin(s*a/64, 6)}
y: \calc{sbin(u*b/64, 6)}
algo: booth`] },
  div: { name: '原码加减交替除法', levels: [T`pick b = int(9, 15)
pick a = int(1, b - 1)
pick s = choice(1, -1)
pick u = choice(1, -1)
x: \calc{sbin(s*a/16, 4)}
y: \calc{sbin(u*b/16, 4)}
algo: orig`, T`pick b = int(33, 63)
pick a = int(1, b - 1)
pick s = choice(1, -1)
pick u = choice(1, -1)
x: \calc{sbin(s*a/64, 6)}
y: \calc{sbin(u*b/64, 6)}
algo: comp`] },
  fadd: { name: '浮点加减', levels: [T`pick i = int(-3, 3)
pick f = int(-3, 3)
pick a = int(128, 255)
pick b = int(128, 255)
pick s = choice(1, -1)
pick u = choice(1, -1)
where i != f
x: 2^\calc{sbin(i, 3)} × \calc{sbin(s*a/256, 8)}
y: 2^\calc{sbin(f, 3)} × \calc{sbin(u*b/256, 8)}`, T`pick i = int(-5, 5)
pick f = int(-5, 5)
pick a = int(128, 255)
pick b = int(128, 255)
pick s = choice(1, -1)
pick u = choice(1, -1)
pick o = word(+, -)
where i != f
x: 2^\calc{sbin(i, 3)} × \calc{sbin(s*a/256, 8)}
y: 2^\calc{sbin(f, 3)} × \calc{sbin(u*b/256, 8)}
op: \calc{o}`] },
  frag: { name: 'IP 分片', levels: [T`pick k = int(20, 60)
pick m = choice(1500, 1420, 1006, 820, 576)
where 100*k > m
total: \calc{100*k}
mtu: \calc{m}`, T`pick k = int(30, 80)
pick m = choice(1500, 1420)
pick r = choice(576, 620, 820)
total: \calc{100*k}
mtu: \calc{m}, \calc{r}`] },
  kmp: { name: 'next / nextval', levels: [T`pick p = str(7, ab)
pattern: \calc{p}
show: next`, T`pick p = str(8, abc)
pattern: \calc{p}
show: nextval`] },
  huffman: { name: '哈夫曼树的 WPL', levels: [T`pick v = seq(5, 1, 12) distinct
weights: \calc{list(v)}`, T`pick v = seq(7, 1, 20) distinct
weights: \calc{list(v)}`] },
  sort: { name: '排序的某一趟', levels: [T`pick v = seq(8, 10, 99) distinct
pick a = word(insert, bubble, select, quick)
pick p = int(1, 3)
array: \calc{list(v)}
algo: \calc{a}
pass: \calc{p}`, T`pick v = seq(10, 10, 99) distinct
pick a = word(insert, bubble, select, quick, merge, shell)
pick p = int(1, 3)
array: \calc{list(v)}
algo: \calc{a}
pass: \calc{p}`] },
  paging: { name: '页面置换', levels: [T`pick v = seq(12, 0, 5)
pick a = word(fifo, lru, opt)
refs: \calc{list(v)}
frames: 3
algo: \calc{a}`, T`pick v = seq(16, 0, 7)
pick a = word(fifo, lru, opt, clock)
pick f = int(3, 4)
refs: \calc{list(v)}
frames: \calc{f}
algo: \calc{a}`] },
  sched: { name: '进程调度', levels: [T`pick r = seq(4, 1, 6)
pick g = seq(3, 1, 3)
pick a = word(fcfs, sjf, srtf, hrrn)
let at = cumsum(g)
procs: P1 0 \calc{el(r, 1)}, P2 \calc{el(at, 1)} \calc{el(r, 2)}, P3 \calc{el(at, 2)} \calc{el(r, 3)}, P4 \calc{el(at, 3)} \calc{el(r, 4)}
algo: \calc{a}
quiz: avg`, T`pick r = seq(5, 1, 8)
pick g = seq(4, 0, 3)
pick a = word(fcfs, sjf, srtf, hrrn, rr q=2)
let at = cumsum(g)
procs: P1 0 \calc{el(r, 1)}, P2 \calc{el(at, 1)} \calc{el(r, 2)}, P3 \calc{el(at, 2)} \calc{el(r, 3)}, P4 \calc{el(at, 3)} \calc{el(r, 4)}, P5 \calc{el(at, 4)} \calc{el(r, 5)}
algo: \calc{a}
quiz: avg`] },
  subnet: { name: '子网的网络地址、广播地址', levels: [T`pick a = int(1, 223)
pick b = int(0, 255)
pick c = int(0, 255)
pick d = int(1, 254)
pick p = int(20, 29)
pick w = word(net, bcast, hosts)
ip: \calc{a}.\calc{b}.\calc{c}.\calc{d}/\calc{p}
quiz: \calc{w}`, T`pick b = int(0, 255)
pick c = int(0, 255)
pick n = choice(2, 4, 8)
split: 172.\calc{b}.\calc{c}.0/24
into: \calc{n}
mode: fill`] },
  bsearch: { name: '折半查找的比较序列', levels: [T`pick v = seq(11, 1, 60) distinct
pick k = int(1, 11)
let s = sort(v)
bsearch: \calc{list(s)}
key: \calc{el(s, k)}`, T`pick v = seq(15, 1, 99) distinct
pick k = int(0, 99)
let s = sort(v)
bsearch: \calc{list(s)}
key: \calc{k}`] },
};

/** 内置出题：名字 + level → { picks, lets, wheres, body, name }（没有内置的返回 null） */
export function builtinUse(name, level = 1) {
  const b = BUILTIN_USE[String(name).trim().toLowerCase()];
  if (!b) return null;
  const src = b.levels[Math.min(b.levels.length, Math.max(1, Number(level) || 1)) - 1];
  const into = { picks: [], lets: [], wheres: [] };
  const body = [];
  for (const l of src.split('\n')) if (!commandLine(l.trim(), into)) body.push(l);
  return { ...into, body: body.join('\n'), name: b.name };
}

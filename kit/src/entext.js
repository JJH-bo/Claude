// 英语（语法）组件不碰 DOM 的部分：答案怎么比、句子怎么切成词、成分标注的写法和判分。纯函数，有测试（tests/entext.test.js）。
// 组件：cloze（填空，一句或一段里几个空）、errfind（点出用错的词再改）、parse（句子成分标注，能套从句）、drill（句型操练，一题一题做）。
// 判分只认写法上的差别：大小写（默认不管）、弯引号、多余空格、缩写（don't = do not）、句末标点；词不对就是不对，
// 不对时说第几个词开始不一样，不说应该是什么。

// —— 比对 ——

const QUOTES = [[/[‘’‚‛′]/g, "'"], [/[“”„‟″]/g, '"'], [/[–—]/g, '-'], [/ /g, ' ']];
// 缩写展开成全写再比：don't 和 do not 一样。's、'd 有两种意思，不展开
const CONTRACTIONS = [
  [/\bwon't\b/g, 'will not'], [/\bshan't\b/g, 'shall not'], [/\bcan't\b/g, 'can not'], [/\bcannot\b/g, 'can not'],
  [/\bain't\b/g, 'am not'], [/n't\b/g, ' not'], [/'m\b/g, ' am'], [/'re\b/g, ' are'], [/'ve\b/g, ' have'], [/'ll\b/g, ' will'],
];

/** 规范化：caseSensitive 时不改大小写；sentence 时去掉句末的 . ! ?（整句作答时可写可不写） */
export function normText(s, { caseSensitive = false, sentence = false } = {}) {
  let t = String(s ?? '');
  for (const [re, to] of QUOTES) t = t.replace(re, to);
  t = t.trim().replace(/\s+/g, ' ');
  if (!caseSensitive) t = t.toLowerCase();
  for (const [re, to] of CONTRACTIONS) t = t.replace(re, to);
  t = t.replace(/\s+([,;:.!?])/g, '$1').replace(/\s+/g, ' ').trim();
  if (sentence) t = t.replace(/[.!?。]+$/, '').trim();
  return t;
}

/** 可接受的几种写法：went | have gone（| 隔开） */
export const parseAlts = (s) => String(s ?? '').split('|').map((x) => x.trim()).filter(Boolean);

const wordsOf = (t) => t.split(/(?=[,;:.!?])|\s+/).map((x) => x.trim()).filter(Boolean);

/**
 * 学生写的 vs 几种可接受的答案：{ ok, empty, at（第几个词开始不一样，从 1 数）, near（只差大小写或标点）}
 * opts：{ caseSensitive, sentence }
 */
export function matchText(input, alts, opts = {}) {
  const given = normText(input, opts);
  if (!given) return { ok: false, empty: true };
  const list = (Array.isArray(alts) ? alts : parseAlts(alts)).map((a) => normText(a, opts));
  if (list.includes(given)) return { ok: true };
  // 只差大小写、标点：算错，但告诉学生是哪一种（区分大小写的题目、标点算分的题目才会走到这里）
  const loose = (x) => normText(x, { sentence: true }).replace(/[,;:.!?"'-]/g, '').replace(/\s+/g, ' ');
  const near = list.some((a) => loose(a) === loose(given));
  // 和最接近的答案比，第几个词开始不一样
  const gw = wordsOf(given);
  let at = 1;
  for (const a of list) {
    const aw = wordsOf(a);
    let k = 0;
    while (k < gw.length && k < aw.length && gw[k] === aw[k]) k++;
    at = Math.max(at, k + 1);
  }
  return { ok: false, near, at: Math.min(at, gw.length + 1) };
}

/** 不对时给学生的一句话（不泄露答案） */
export function textHint(r, { what = '答案' } = {}) {
  if (r.ok) return '';
  if (r.empty) return `还没写${what}`;
  if (r.near) return '词都对了，大小写或标点不对';
  return `从第 ${r.at} 个词开始不对`;
}

// —— 常见错答（docs/english-plan.md 第 2 批）：「had started | !has started=用成了现在完成时」——
// 对的几种写法照旧用 | 隔开；! 开头的是常见的错答，= 后面是针对它的一句提示（学生看到，记录里也写给老师：页面看出来像是哪种错法）

/** 一个答案的写法 → { alts（对的）, wrongs: [{ text, why }]（常见错答）}。opts 用来查「错答和对的一样」 */
export function parseAnswer(s, opts = {}) {
  const alts = [];
  const wrongs = [];
  for (const part of parseAlts(s)) {
    if (!part.startsWith('!')) { alts.push(part); continue; }
    const body = part.slice(1);
    const i = body.indexOf('=');
    const text = (i < 0 ? body : body.slice(0, i)).trim();
    const why = i < 0 ? '' : body.slice(i + 1).trim();
    if (!text) throw new Error(`「${part}」：! 后面写常见的错答，比如 !has started=用成了现在完成时`);
    wrongs.push({ text, why });
  }
  for (const w of wrongs) if (alts.some((a) => normText(a, opts) === normText(w.text, opts))) throw new Error(`常见错答「${w.text}」和对的答案一样，不用列`);
  return { alts, wrongs };
}

/** 学生写的是不是哪一种常见错答：{ text, why } 或 null */
export function diagnose(input, wrongs = [], opts = {}) {
  const g = normText(input, opts);
  return g ? wrongs.find((w) => normText(w.text, opts) === g) || null : null;
}

/**
 * 选择式的空（第 3 批）：「that=逗号后面不用 that|*which|who」→ [{ text, ok, why }]。* 是对的（可以不止一个），= 后面是选了它时的提示
 */
export function parseChoices(inner) {
  const opts = parseAlts(inner).map((p) => {
    const ok = p.startsWith('*');
    const body = ok ? p.slice(1) : p;
    const i = body.indexOf('=');
    return { text: (i < 0 ? body : body.slice(0, i)).trim(), ok, why: i < 0 ? '' : body.slice(i + 1).trim() };
  }).filter((o) => o.text);
  if (opts.length < 2) throw new Error('选择式的空至少要两个选项：{{[that|*which|who]}}');
  if (!opts.some((o) => o.ok)) throw new Error('选择式的空要用 * 标出对的选项：{{[that|*which|who]}}');
  const seen = new Set();
  for (const o of opts) { const k = normText(o.text); if (seen.has(k)) throw new Error(`选项「${o.text}」写了两遍`); seen.add(k); }
  return opts;
}

// —— 填空 cloze：{{went}}、{{has lived|has been living}}、{{[that|*which]}} ——

/**
 * 「By the time we arrived, the film {{had started}} (start).」→ { parts: [{ text } | { blank: i, alts, wrongs, choices }], blanks: [alts], specs }。
 * 打字的空：alts 对的写法、wrongs 常见错答；选择式的空 {{[that|*which]}}：choices 选项（alts 是对的那几个）。
 * 没有空、空里什么都没写都报错
 */
export function parseCloze(text) {
  const src = String(text ?? '');
  const parts = [];
  const blanks = [];
  const re = /\{\{([^{}]*)\}\}/g;
  let last = 0, m;
  while ((m = re.exec(src))) {
    if (m.index > last) parts.push({ text: src.slice(last, m.index) });
    const k = blanks.length + 1;
    const inner = m[1].trim();
    let spec;
    try {
      if (/^\[.*\]$/s.test(inner)) {
        const choices = parseChoices(inner.slice(1, -1));
        spec = { alts: choices.filter((c) => c.ok).map((c) => c.text), wrongs: choices.filter((c) => !c.ok && c.why).map((c) => ({ text: c.text, why: c.why })), choices };
      } else spec = { ...parseAnswer(inner), choices: null };
    } catch (e) { throw new Error(`第 ${k} 个空：${e.message}`); }
    if (!spec.alts.length) throw new Error(`第 ${k} 个空 {{}} 里没写答案`);
    parts.push({ blank: blanks.length, ...spec });
    blanks.push(spec.alts);
    last = re.lastIndex;
  }
  if (last < src.length) parts.push({ text: src.slice(last) });
  if (/\{\{|\}\}/.test(parts.filter((p) => p.text).map((p) => p.text).join(''))) throw new Error('{{ 和 }} 没有配对');
  if (!blanks.length) throw new Error('text 里要有空：把答案写成 {{答案}}，几种写法都对时 {{a|b}}');
  return { parts, blanks, specs: parts.filter((p) => p.blank !== undefined) };
}

// —— 切词：errfind、parse 用 ——

/**
 * 句子切成词：[{ w, i, word（是不是词，标点不是）}]。缩写（don't）、连字符（well-known）、所有格（Tom's）算一个词；
 * 标点各自成一个，不能点、不能标
 */
export function tokenizeSentence(text) {
  const out = [];
  const re = /[A-Za-z0-9]+(?:['’][A-Za-z]+)*(?:-[A-Za-z0-9]+(?:['’][A-Za-z]+)*)*|[^\sA-Za-z0-9]/g;
  let m;
  while ((m = re.exec(String(text ?? '')))) out.push({ w: m[0], i: out.length, word: /[A-Za-z0-9]/.test(m[0]) });
  return out;
}

/**
 * 英文里的词（和 tokenizeSentence 的「词」一样：缩写、连字符、所有格算一个），带在原文里的位置：[{ w, start, end }]。
 * punct：标点也算进来（word: false），phrase=", which" 要标逗号时用
 */
export function wordsIn(text, { punct = false } = {}) {
  const out = [];
  const re = punct ? /[A-Za-z0-9]+(?:['’][A-Za-z]+)*(?:-[A-Za-z0-9]+(?:['’][A-Za-z]+)*)*|[,;:.!?—–()"“”]/g : /[A-Za-z0-9]+(?:['’][A-Za-z]+)*(?:-[A-Za-z0-9]+(?:['’][A-Za-z]+)*)*/g;
  let m;
  while ((m = re.exec(String(text ?? '')))) out.push({ w: m[0], start: m.index, end: m.index + m[0].length, word: /[A-Za-z0-9]/.test(m[0]) });
  return out;
}
/** phrase 里有没有要标的标点（有就连标点一起数） */
export const phraseHasPunct = (text) => /[,;:.!?—–()"“”]/.test(String(text ?? ''));

const wkey = (w) => String(w).toLowerCase().replace(/’/g, "'");

/**
 * board mark 标英语句子里的词（docs/english-plan.md 第 1 批）：sel 是 { kind: word, k } / { kind: words, a, b } / { kind: phrase, text, n }，
 * words 是那句英文按顺序的词（字符串）。返回 { from, to }（从 0 数，含两头）或 { error }
 */
export function wordSpan(sel, words) {
  const n = words.length;
  if (!n) return { error: '这里没有英文词' };
  if (sel.kind === 'word') return sel.k > n ? { error: `这里一共 ${n} 个词，没有第 ${sel.k} 个` } : { from: sel.k - 1, to: sel.k - 1 };
  if (sel.kind === 'words') return sel.b > n ? { error: `这里一共 ${n} 个词，没有第 ${sel.b} 个` } : { from: sel.a - 1, to: sel.b - 1 };
  const want = wordsIn(sel.text, { punct: phraseHasPunct(sel.text) }).map((x) => wkey(x.w));
  if (!want.length) return { error: `phrase「${sel.text}」里没有英文词，也没有标点` };
  const keys = words.map(wkey);
  const hits = [];
  for (let i = 0; i + want.length <= n; i++) if (want.every((w, j) => keys[i + j] === w)) hits.push(i);
  if (!hits.length) return { error: `这里没有「${sel.text}」${n <= 40 ? `（句子是：${words.join(' ')}）` : ''}` };
  if (sel.n && !hits[sel.n - 1]) return { error: `「${sel.text}」只出现了 ${hits.length} 次，没有第 ${sel.n} 次` };
  if (hits.length > 1 && !sel.n) return { error: `「${sel.text}」出现了 ${hits.length} 次：写 phrase="${sel.text}#2" 指第几次` };
  const i = hits[(sel.n || 1) - 1];
  return { from: i, to: i + want.length - 1 };
}

// —— 找错 errfind：wrong: are（第二次出现的写 are#2）——

/** 句子里用错的那个词是第几个（tokenizeSentence 的下标）。找不到、有歧义都报错 */
export function findWrong(text, wrong) {
  const toks = tokenizeSentence(text);
  const m = /^(.*?)(?:#(\d+))?$/.exec(String(wrong ?? '').trim());
  const w = m[1].trim(), nth = Number(m[2] || 0);
  if (!w) throw new Error('wrong: 要写句子里用错的那个词');
  const hits = toks.filter((t) => t.word && t.w.toLowerCase() === w.toLowerCase());
  if (!hits.length) throw new Error(`句子里没有「${w}」这个词（wrong: 要和 text 里的写法一样）`);
  if (hits.length > 1 && !nth) throw new Error(`「${w}」在句子里出现了 ${hits.length} 次：写 wrong: ${w}#2 指第几次`);
  if (nth && !hits[nth - 1]) throw new Error(`「${w}」只出现了 ${hits.length} 次，没有第 ${nth} 次`);
  return hits[(nth || 1) - 1].i;
}

/**
 * errfind 的 decoys:（常见的点错的词）：「Neither=neither 本身没错，看谓语; the#2=…」→ [{ i（第几个记号）, w, why }]
 */
export function parseDecoys(text, src) {
  const out = [];
  for (const part of String(src ?? '').split(/[;；\n]/).map((x) => x.trim()).filter(Boolean)) {
    const i = part.indexOf('=');
    const w = (i < 0 ? part : part.slice(0, i)).trim();
    const why = i < 0 ? '' : part.slice(i + 1).trim();
    if (!why) throw new Error(`decoys 里「${part}」：写成 词=为什么它没错，比如 Neither=neither 本身没错，看谓语`);
    out.push({ i: findWrong(text, w), w: w.replace(/#\d+$/, ''), why });
  }
  return out;
}

// —— 成分标注 parse：[S The man [RC who lives next door]] [V gave] [O me] [O a book] ——

// 常用的成分（写法 → 中文名）；roles: 可以只列几种，也可以自己起名（RC=定语从句）
export const ROLES = {
  S: '主语', V: '谓语', O: '宾语', IO: '间接宾语', DO: '直接宾语', P: '表语', C: '补语', OC: '宾补', A: '状语', Attr: '定语', App: '同位语',
  RC: '定语从句', SC: '主语从句', ObC: '宾语从句', PC: '表语从句', AppC: '同位语从句', AdvC: '状语从句', NF: '非谓语', Conj: '连接词',
};

/** roles: 「S V O」或「S=主语 V=谓语 RC=定语从句」→ [{ key, name }] */
export function parseRoles(src, fallback = []) {
  const items = String(src ?? '').split(/[\s,，、]+/).filter(Boolean);
  const out = items.map((x) => { const [k, n] = x.split(/[=＝]/); return { key: k.trim(), name: (n || ROLES[k.trim()] || k).trim() }; });
  return out.length ? out : fallback.map((k) => ({ key: k, name: ROLES[k] || k }));
}

/**
 * 括号写法 → { text（原句）, tokens, spans: [{ role, from, to, depth }] }。from / to 是词的下标（含两端），可以套（从句里再分成分）。
 * 括号不配对、角色没写都报错。标点不算进成分的头尾（[S Tom ,] 记成只到 Tom）
 */
export function parseBrackets(src) {
  const s = String(src ?? '').trim();
  const words = [];
  const spans = [];
  const stack = [];
  const re = /\[([A-Za-z][\w]*)\s+|\]|[^\s[\]]+/g;
  let m;
  const pieces = [];
  while ((m = re.exec(s))) {
    if (m[1]) { stack.push({ role: m[1], from: null, depth: stack.length }); continue; }
    if (m[0] === ']') {
      const top = stack.pop();
      if (!top) throw new Error('多了一个 ]');
      if (top.from === null) throw new Error(`[${top.role} …] 里面没有词`);
      spans.push({ role: top.role, from: top.from, to: lastWord(top.from), depth: top.depth });
      continue;
    }
    // 一段文字：再按句子的切法切开（标点单独成词）
    for (const t of tokenizeSentence(m[0])) {
      const idx = words.length;
      words.push(t.w);
      if (t.word) for (const fr of stack) if (fr.from === null) fr.from = idx;
      pieces.push({ idx, word: t.word });
    }
  }
  if (stack.length) throw new Error(`[${stack.at(-1).role} 没有配对的 ]`);
  function lastWord(from) {
    for (let k = pieces.length - 1; k >= 0; k--) if (pieces[k].word && pieces[k].idx >= from) return pieces[k].idx;
    return from;
  }
  if (!spans.length) throw new Error('answer 里要用 [角色 词…] 标出成分，比如 [S The man] [V gave] [O me]');
  const tokens = tokenizeSentence(words.join(' '));
  return { text: joinWords(words), tokens, spans: spans.sort((a, b) => a.from - b.from || b.to - a.to) };
}

// 词连回句子：标点贴在前一个词后面
export function joinWords(words) {
  return words.reduce((s, w) => (!s ? w : /^[,;:.!?)\]}”’]$/.test(w) ? s + w : /[(\[{“‘]$/.test(s) ? s + w : `${s} ${w}`), '');
}

const key = (x) => `${x.role}:${x.from}-${x.to}`;

/**
 * 学生标的 vs 答案：{ ok, right: [span], wrongRole: [{ span, should }], missing: [span], extra: [span] }。
 * 范围一样、角色不一样算 wrongRole；答案里有、学生没标算 missing；学生标了答案里没有的范围算 extra。
 */
export function judgeSpans(mine = [], answer = []) {
  const ansByRange = new Map(answer.map((a) => [`${a.from}-${a.to}`, a]));
  const right = [], wrongRole = [], extra = [];
  const hit = new Set();
  for (const s of mine) {
    const a = ansByRange.get(`${s.from}-${s.to}`);
    if (!a) { extra.push(s); continue; }
    hit.add(key(a));
    if (a.role === s.role) right.push(s); else wrongRole.push({ span: s, should: a.role });
  }
  const missing = answer.filter((a) => !hit.has(key(a)));
  return { ok: !wrongRole.length && !missing.length && !extra.length, right, wrongRole, missing, extra };
}

/** 一段范围写成文字：「The man who lives next door」 */
export const spanText = (tokens, s) => joinWords(tokens.slice(s.from, s.to + 1).map((t) => t.w));

/** 判分结果给学生的一句话（不说答案） */
export function spansHint(r, roles = []) {
  if (r.ok) return '';
  const name = (k) => roles.find((x) => x.key === k)?.name || ROLES[k] || k;
  const bits = [];
  if (r.right.length) bits.push(`对了 ${r.right.length} 处`);
  if (r.wrongRole.length) bits.push(`${r.wrongRole.length} 处范围对了、成分标错了（${r.wrongRole.map((x) => name(x.span.role)).join('、')}）`);
  if (r.extra.length) bits.push(`${r.extra.length} 处范围不对`);
  if (r.missing.length) bits.push(`还少 ${r.missing.length} 处`);
  return bits.join('；');
}

// —— 句型操练 drill：一行一题 ——

/** 「- They built it. => It was built.｜It was built by them.」→ [{ q, alts }]（=> 后面几种都对时 | 隔开） */
export function parseDrill(lines) {
  const items = [];
  for (const raw of Array.isArray(lines) ? lines : String(lines ?? '').split('\n')) {
    const m = /^\s*[-*]\s+(.*?)\s*(?:=>|⇒|→)\s*(.+)$/.exec(raw);
    if (!m) continue;
    const { alts, wrongs } = parseAnswer(m[2], { sentence: true });
    if (!m[1] || !alts.length) continue;
    items.push({ q: m[1], alts, wrongs });
  }
  if (!items.length) throw new Error('drill 要一行一题：- 原句 => 答案（几种都对时 a | b）');
  return items;
}

// —— 分步拆句 parse 的 steps:（docs/english-plan.md 第 4 批）：「V | S O | RC」——

/**
 * 「V | S O | RC」→ [[V], [S, O], [RC]]：一步标哪几种成分。每一步的成分在答案里都要有；
 * 答案里有、哪一步都没问到的成分最后照样画出来（不判）
 */
export function parseSteps(src, spans = []) {
  const groups = String(src ?? '').split('|').map((g) => g.trim().split(/[\s,，、]+/).filter(Boolean)).filter((g) => g.length);
  if (!groups.length) throw new Error('steps: 写每一步标哪几种成分，用 | 隔开，比如 steps: V | S O | RC');
  const have = new Set(spans.map((s) => s.role));
  groups.forEach((g, i) => {
    const miss = g.filter((r) => !have.has(r));
    if (miss.length) throw new Error(`steps 第 ${i + 1} 步的 ${miss.join('、')} 在 answer 里没有标`);
  });
  const all = groups.flat();
  const dup = all.find((r, i) => all.indexOf(r) !== i);
  if (dup) throw new Error(`${dup} 在 steps 里写了两次：一种成分只在一步里标`);
  return groups;
}

// —— 意群断句 chunk：「The man who lives next door / gave me a book / that I had wanted | for years.」——
// / 是一定要切的地方，| 是切不切都行的地方。切口在两个词之间：用切口后面那个词的下标表示

/** → { tokens（去掉 / 和 | 的句子，tokenizeSentence 的样子）, must: [切口], may: [切口], gaps: [能切的地方] } */
export function parseChunk(text) {
  const raw = tokenizeSentence(text);
  const tokens = [];
  const must = [], may = [];
  let mark = null;
  for (const t of raw) {
    if (t.w === '/' || t.w === '|') { mark = mark === '/' ? '/' : t.w; continue; }
    if (mark && tokens.length) (mark === '/' ? must : may).push(tokens.length);
    mark = null;
    tokens.push({ ...t, i: tokens.length });
  }
  // 能切的地方：每个词前面（第一个词除外）
  const gaps = tokens.filter((t, i) => i > 0 && t.word).map((t) => t.i);
  const fix = (g) => (gaps.includes(g) ? g : gaps.find((x) => x > g) ?? g); // 切在标点前面的，挪到标点后面的那个词前
  const M = [...new Set(must.map(fix))], Y = [...new Set(may.map(fix))].filter((g) => !M.includes(g));
  if (!M.length) throw new Error('text 里用 / 标出要切的地方（切不切都行的地方用 |），比如 The man who lives next door / gave me a book.');
  return { tokens, must: M, may: Y, gaps, text: joinWords(tokens.map((t) => t.w)) };
}

/** 学生切的 vs 答案：{ ok, missing（还要切的）, extra（不该切的）} */
export function judgeChunks(cuts, { must, may }) {
  const S = new Set(cuts);
  const missing = must.filter((g) => !S.has(g));
  const extra = [...S].filter((g) => !must.includes(g) && !may.includes(g)).sort((a, b) => a - b);
  return { ok: !missing.length && !extra.length, missing, extra };
}

/** 不对时的一句话：「door 后面还要切一刀；me 和 a 之间不用切」（不说切几刀、不给答案） */
export function chunkHint(r, tokens) {
  if (r.ok) return '';
  const before = (g) => { let k = g - 1; while (k > 0 && !tokens[k].word) k--; return tokens[k]?.w || ''; };
  const bits = [];
  if (r.missing.length) bits.push(`「${before(r.missing[0])}」后面还要切一刀${r.missing.length > 1 ? `（一共还少 ${r.missing.length} 刀）` : ''}`);
  if (r.extra.length) bits.push(`「${before(r.extra[0])} ${tokens[r.extra[0]]?.w || ''}」是一个意群，中间不用切${r.extra.length > 1 ? `（多切了 ${r.extra.length} 刀）` : ''}`);
  return bits.join('；');
}

/** 切好的意群：[[词…]]（给译文框、记录用） */
export function chunksOf(tokens, cuts) {
  const set = new Set(cuts);
  const out = [[]];
  tokens.forEach((t, i) => { if (set.has(i) && out.at(-1).length) out.push([]); out.at(-1).push(t.w); });
  return out.map((ws) => joinWords(ws));
}

// —— 连线 link（第 6 批）：点一个词，再点它连着的那个词（关系词 → 先行词、非谓语 → 逻辑主语、谓语 → 主语的中心词）——

/**
 * text 是句子；pairs 是「who -> brother; gave -> man」（几条用 ; 隔开，出现几次的词写 the#2）；
 * 常见的连错写成「!who -> Beijing=就近的名词不一定是先行词」。返回 { tokens, pairs: [{ from, to }], wrongs: [{ from, to, why }] }（下标是 tokenizeSentence 的）
 */
export function parseLink(text, src) {
  const tokens = tokenizeSentence(text);
  const pairs = [], wrongs = [];
  for (const raw of String(src ?? '').split(/[;；\n]/).map((x) => x.trim()).filter(Boolean)) {
    const bad = raw.startsWith('!');
    const body = bad ? raw.slice(1) : raw;
    const eq = bad ? body.indexOf('=') : -1;
    const pair = (eq < 0 ? body : body.slice(0, eq)).trim();
    const m = /^(.+?)\s*(?:->|→|=>)\s*(.+)$/.exec(pair);
    if (!m) throw new Error(`「${raw}」：写成 词 -> 它连着的词，比如 who -> brother`);
    const from = findWrong(text, m[1].trim());
    const to = findWrong(text, m[2].trim());
    if (from === to) throw new Error(`「${raw}」：两头是同一个词`);
    if (bad) wrongs.push({ from, to, why: eq < 0 ? '' : body.slice(eq + 1).trim() });
    else pairs.push({ from, to });
  }
  if (!pairs.length) throw new Error('pairs: 至少写一条：词 -> 它连着的词，比如 who -> brother');
  const seen = new Set();
  for (const p of pairs) { if (seen.has(p.from)) throw new Error(`「${tokens[p.from].w}」连了两条：一个词只连一条`); seen.add(p.from); }
  return { tokens, pairs, wrongs };
}

/** 学生连的 vs 答案：{ ok, right, wrong: [{ from, to, why }], missing（还差几条）} */
export function judgeLinks(mine, { pairs, wrongs = [] }) {
  const right = mine.filter((m) => pairs.some((p) => p.from === m.from && p.to === m.to));
  const wrong = mine.filter((m) => !right.includes(m)).map((m) => ({ ...m, why: wrongs.find((w) => w.from === m.from && w.to === m.to)?.why || '' }));
  const missing = pairs.filter((p) => !mine.some((m) => m.from === p.from && m.to === p.to)).length;
  return { ok: !wrong.length && !missing && right.length === pairs.length, right, wrong, missing };
}

/** 不对时的一句话（不说答案）：「who 连错了：…；还有 1 条没连」 */
export function linkHint(r, tokens) {
  if (r.ok) return '';
  const bits = r.wrong.map((w) => `「${tokens[w.from].w}」连到「${tokens[w.to].w}」不对${w.why ? `：${w.why}` : ''}`);
  if (r.missing) bits.push(`还有 ${r.missing} 条没连`);
  return bits.join('；');
}

// —— 拿不准时问 Claude（drill 整句改写）：页面判错、又不是已知的错答时，可能只是换了个说法 ——

/** 发给 Claude 的一小段：题目、标准答案、学生写的；只要它回一行 JSON（几百个字，一两千 token） */
export function regradePrompt({ q, task = '', alts = [], given }) {
  return [
    '你在帮英语练习的页面复核一道整句改写题（考研英语一的语法）。页面按标准答案逐字比，判了错；请判断学生的句子是不是其实也对（只是换了说法、语序），还是真的错了。',
    task ? `题目要求：${task}` : '',
    `原句：${q}`,
    `标准答案：${alts.join(' / ')}`,
    `学生写的：${given}`,
    '标准：语法正确、完成了题目要求的变换、意思和原句一样，就算对；拼写错、时态语态错、没按要求变换都算错。',
    '只回一行 JSON：{"ok": true 或 false, "why": "一句中文：对的话说为什么也行；错的话指出哪里不对，但不要写出正确答案"}',
  ].filter(Boolean).join('\n');
}

/** Claude 的回答 → { ok, why } 或 null（看不懂就当没复核） */
export function parseRegrade(text) {
  const m = String(text ?? '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    return typeof j.ok === 'boolean' ? { ok: j.ok, why: String(j.why || '').slice(0, 200) } : null;
  } catch { return null; }
}

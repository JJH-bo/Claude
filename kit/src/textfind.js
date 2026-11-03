// 板书标注 text="…"：在画好的文字里找一段字（中文、英文、混着的都行）。纯函数，有测试（tests/marks.test.js）。
// 以前只能圈公式里 \hl 起了名字的项和英文单词，中文、普通文字圈不了，课堂 Claude 只好把「不定代词」这种字塞进公式里起名字
// （字体变成公式体，一项一个小圈，2026-11-03 真课）。现在直接写板上的字。
// 比的时候不管空格、大小写、全角半角（「，」和「,」、「（」和「(」算一样）；「…」或「...」隔开的是头和尾，
// 中间是什么都行（圈一整句不用照抄整句）。

// 全角标点 → 半角；别的全角字母数字（ＦＦ０１–ＦＦ５Ｅ）也换成半角
const PUNCT = { '，': ',', '。': '.', '：': ':', '；': ';', '（': '(', '）': ')', '！': '!', '？': '?', '“': '"', '”': '"', '‘': "'", '’': "'", '【': '[', '】': ']', '〔': '[', '〕': ']', '—': '-', '–': '-', '－': '-', '～': '~', '·': '·', '・': '·' };
function norm(ch) {
  if (PUNCT[ch]) return PUNCT[ch];
  const c = ch.codePointAt(0);
  if (c >= 0xff01 && c <= 0xff5e) return String.fromCodePoint(c - 0xfee0).toLowerCase();
  return ch.toLowerCase();
}
const SPACE = /\s/;
// 头尾分开的写法：「主语是…除外」「from ... to」
const GAP = /\s*(?:…+|\.{3,})\s*/;
export const GAP_MAX = 400; // 头和尾最多隔多少个字

/** 一串文字（几段 text 连着）摊平成去掉空格、规范化了的字，每个字记着在第几段的第几个字 */
export function flatten(texts) {
  const chars = [];
  const at = [];
  texts.forEach((t, si) => {
    const s = String(t ?? '');
    let i = 0;
    for (const ch of s) {
      const len = ch.length;
      if (!SPACE.test(ch)) { chars.push(norm(ch)); at.push([si, i, i + len]); }
      i += len;
    }
  });
  return { chars, at };
}

const key = (s) => [...String(s ?? '')].filter((ch) => !SPACE.test(ch)).map(norm);

function indexOf(chars, want, from) {
  outer: for (let i = from; i + want.length <= chars.length; i++) {
    for (let j = 0; j < want.length; j++) if (chars[i + j] !== want[j]) continue outer;
    return i;
  }
  return -1;
}

/**
 * 在 texts（按顺序的几段字，通常是板上的一个个文字节点）里找 needle。
 * 返回所有不重叠的出现：[{ from: [段, 字], to: [段, 字（不含）] }]，下标是原文里的（含空格）。
 * needle 里有「…」：头、尾分别找，尾要在头后面 GAP_MAX 个字以内
 */
export function findText(texts, needle) {
  const parts = String(needle ?? '').split(GAP).map(key).filter((p) => p.length);
  if (!parts.length) return [];
  const { chars, at } = flatten(texts);
  const hits = [];
  let from = 0;
  while (from < chars.length) {
    const a = indexOf(chars, parts[0], from);
    if (a < 0) break;
    let end = a + parts[0].length;
    let ok = true;
    for (const p of parts.slice(1)) {
      const b = indexOf(chars, p, end);
      if (b < 0 || b - end > GAP_MAX) { ok = false; break; }
      end = b + p.length;
    }
    if (!ok) { from = a + 1; continue; }
    hits.push({ from: [at[a][0], at[a][1]], to: [at[end - 1][0], at[end - 1][2]] });
    from = end;
  }
  return hits;
}

/**
 * text="…#2"：挑第几次出现。返回 { hit, count, warn? } 或 { error }。
 * 出现了好几次又没写第几次：圈第一次，warn 告诉课堂 Claude（不算写错，免得为这个多跑一轮）
 */
export function pickHit(hits, n, needle) {
  if (!hits.length) return { error: `这里没有「${needle}」` };
  if (n) return hits[n - 1] ? { hit: hits[n - 1], count: hits.length } : { error: `「${needle}」只出现了 ${hits.length} 次，没有第 ${n} 次` };
  return { hit: hits[0], count: hits.length, ...(hits.length > 1 ? { warn: `「${needle}」出现了 ${hits.length} 次，标的是第一次；要别的写 text="${needle}#2"` } : {}) };
}

/** 报错时给课堂 Claude 看这里大概写了什么（去掉多余空格，截短） */
export function textPreview(texts, n = 80) {
  const s = texts.join('').replace(/\s+/g, ' ').trim();
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

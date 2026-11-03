// 版面（docs/canvas-plan.md）：课堂里的 Claude 自己排板。黑板是一整块横屏，上面一张看不见的格子
// （COLS 列 × ROWS 行正好一屏），每一段写 at=列-列/行-行 说放在哪、占多大；页面按格子摆，放不下先缩小，
// 每一轮把「版面图」（哪格被哪段占了、哪里空）写进黑板现状，它据此决定下一块写哪、擦哪、挪哪。
// 没有模板：放哪、多大都由它看内容定。纯函数，不碰 DOM（tests/class-canvas.test.js）。

export const COLS = 12;
export const ROWS = 8; // 一屏的行数；再往下学生要滑
export const MAX_ROW = 24;

/** at=7-12/1-5（第 7～12 列、第 1～5 行）；一列 / 一行可以只写一个数：at=3/2。返回 { c1, c2, r1, r2 } 或 { error } */
export function parseAt(v) {
  const s = String(v ?? '').trim().replace(/[，,]/, '/').replace(/[－—–~～]/g, '-').replace(/\s+/g, '');
  const m = s.match(/^(\d+)(?:-(\d+))?\/(\d+)(?:-(\d+))?$/);
  if (!m) return { error: `at「${v}」看不懂：写成 列-列/行-行，比如 at=7-12/1-5（第 7～12 列、第 1～5 行）` };
  let [c1, c2, r1, r2] = [m[1], m[2] ?? m[1], m[3], m[4] ?? m[3]].map(Number);
  if (c1 > c2) [c1, c2] = [c2, c1];
  if (r1 > r2) [r1, r2] = [r2, r1];
  if (c1 < 1 || c2 > COLS) return { error: `at「${v}」：列只有 1～${COLS}` };
  if (r1 < 1 || r2 > MAX_ROW) return { error: `at「${v}」：行从 1 数，一屏 ${ROWS} 行，最多到第 ${MAX_ROW} 行` };
  return { c1, c2, r1, r2 };
}

export const atText = (a) => (a ? `${a.c1}-${a.c2}/${a.r1}-${a.r2}` : '');
export const sizeOf = (a) => ({ w: a.c2 - a.c1 + 1, h: a.r2 - a.r1 + 1 });
export const overlaps = (a, b) => a.c1 <= b.c2 && b.c1 <= a.c2 && a.r1 <= b.r2 && b.r1 <= a.r2;

// 没写 at= 时按内容估一个大小：要拖、要看的图和演示给大地方，题中等，几行字小
const BIG = new Set(['scene', 'graph', 'space', 'matrix', 'derive', 'sketch', 'image', 'predict', 'code', 'trace', 'frames']);
const MID = new Set(['steps', 'practice', 'elim', 'parse', 'chunk']);
export function defaultSize(kinds = [], textLen = 0) {
  if (kinds.some((k) => BIG.has(k))) return { w: 7, h: 5 };
  if (kinds.some((k) => MID.has(k))) return { w: 6, h: 4 };
  if (kinds.length) return { w: 5, h: 3 }; // answer、quiz、演示组件以外的小组件
  return textLen > 160 ? { w: 5, h: 2 } : { w: 4, h: 2 };
}

/** 从上往下、从左往右找第一块放得下 w×h 的空处（placed：已有的 at） */
export function findFree(placed = [], w, h) {
  const ww = Math.min(COLS, Math.max(1, w));
  for (let r = 1; r + h - 1 <= MAX_ROW; r++) {
    for (let c = 1; c + ww - 1 <= COLS; c++) {
      const a = { c1: c, c2: c + ww - 1, r1: r, r2: r + h - 1 };
      if (!placed.some((p) => overlaps(p, a))) return a;
    }
  }
  return { c1: 1, c2: ww, r1: MAX_ROW - h + 1, r2: MAX_ROW };
}

/**
 * 一段要放进 want（没写就按 size 找空处）。和别的段重叠时不叠上去：同样大小挪到最近的空处。
 * 返回 { at, moved?（原位置被占，挪了）, auto?（没写 at，页面找的）}
 */
export function placeBlock(placed = [], want = null, size = { w: 5, h: 3 }) {
  if (!want) return { at: findFree(placed, size.w, size.h), auto: true };
  if (!placed.some((p) => overlaps(p, want))) return { at: want };
  const { w, h } = sizeOf(want);
  return { at: findFree(placed, w, h), moved: true };
}

/**
 * 版面图：每格写着占它的段 id（三个字宽），· 是空的。blocks：[{ id, at }]。至少画满一屏（ROWS 行）。
 *       1  2  3 …
 *   1  b1 b1 ·  …
 */
export function mapText(blocks = []) {
  const list = blocks.filter((b) => b?.at);
  const rows = Math.max(ROWS, ...list.map((b) => b.at.r2));
  const cell = (s) => String(s).slice(0, 3).padEnd(3);
  const out = ['    ' + Array.from({ length: COLS }, (_, i) => cell(i + 1)).join('')];
  for (let r = 1; r <= rows; r++) {
    let line = String(r).padStart(2) + '  ';
    for (let c = 1; c <= COLS; c++) {
      const b = list.find((x) => x.at.c1 <= c && c <= x.at.c2 && x.at.r1 <= r && r <= x.at.r2);
      line += cell(b ? b.id : '·');
    }
    out.push(line.trimEnd() + (r === ROWS && rows > ROWS ? '   ← 一屏到这里，下面要滑' : ''));
  }
  return out.join('\n');
}

/** 一段实际需要几行：内容高 need 像素、一行 rowH 像素、行间 gap */
export const rowsFor = (need, rowH, gap = 0) => Math.max(1, Math.ceil((need + gap) / (rowH + gap)));

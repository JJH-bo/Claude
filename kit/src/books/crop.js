// 扫描页的白边裁掉、空白页认出来（纯函数，有测试）。为什么：Claude 看图按像素算 token（宽 × 高 / 750，一张最多约 4800），
// 教材的页边、页眉页脚以外的空白占一页的三四成，这部分不带任何字，却照样算钱、拖慢。只裁空白、不缩小：留下来的字每个还是
// 原来那么多像素，Claude 看到的字和以前一样清楚，转写质量不变；整页空白的页（扉页背面、章与章之间）根本不用交给 Claude。
// 宁可少裁，不能裁掉字：认「有墨」用宽松的阈值（比纸色暗一点就算），淡色的字、铅笔字、浅色的图都算进内容；
// 只认作噪点的是孤立的一两个点；扫描时贴着页边的一道黑边（≤ 4%）不算内容，比这宽的（整页出血的章首横幅）照样当内容。

const EDGE_MAX = 0.04; // 贴着边的黑边最宽多少（占这一边的比例）才当作扫描留下的边，不当内容
const DARK_LINE = 0.6; // 一行（一列）里多少比例是墨，才算「一整道黑边」
const PAD = 0.02; // 裁好以后四周再留多少（占长边的比例），不让字贴着图边
const MIN_SAVE = 0.06; // 省不到这么多面积就不裁（图照原样，免得为一点点改动图）

/** 一组灰度值（0 黑 – 255 白）里第 q 分位的亮度 */
function quantile(gray, q) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  let need = Math.floor(gray.length * q);
  for (let v = 0; v < 256; v++) { need -= hist[v]; if (need < 0) return v; }
  return 255;
}

// 贴着两头、整道是墨（≥ DARK_LINE）、加起来不超过 EDGE_MAX 的当扫描边：返回两头各去掉几道
function edges(count, len) {
  const n = count.length;
  const max = Math.max(1, Math.floor(n * EDGE_MAX));
  const run = (at) => { let k = 0; while (k < n && count[at(k)] >= len * DARK_LINE) k++; return k <= max ? k : 0; };
  return [run((i) => i), run((i) => n - 1 - i)];
}

// 一维的「哪些是内容」：count[i] 是第 i 行（列）里墨点的个数，len 是一行有多少点；[a, b) 以外是扫描边。
// 找第一段、最后一段连着 ≥ 2 行的内容（孤立的一行是噪点）
function span(count, len, a, b) {
  // 一行里至少这么多墨点才算有东西：扫描噪点是零星一两个（上下两行各一个点也不算），一行字、一个页码都远多于这个
  const min = Math.max(2, Math.round(len * 0.005));
  const on = (i) => i >= a && i < b && count[i] >= min;
  let first = -1, last = -1;
  for (let i = a; i < b; i++) if (on(i) && (on(i - 1) || on(i + 1))) { if (first < 0) first = i; last = i; }
  return first < 0 ? null : [first, last];
}

/**
 * gray：一页缩小以后的灰度图（Uint8Array，长 w × h，按行）。返回这一页的内容在哪：
 * { blank: true }（整页空白）/ { box: { x, y, w, h }（缩小图上的坐标，已经留了边）, save（省下的面积比例）} /
 * { box: null }（不裁：省得太少，或者纸本身太暗、看不准）
 */
export function contentBox(gray, w, h) {
  if (!gray || gray.length < w * h || w < 8 || h < 8) return { box: null };
  const paper = quantile(gray, 0.9); // 九成的点比它暗：就是纸的颜色
  if (paper < 120) return { box: null }; // 底色太暗（照片、翻拍）：认不准哪里是纸，不裁
  const ink = Math.max(40, paper - 40);
  const count = (x0, x1, y0, y1) => {
    const rows = new Uint32Array(h);
    const cols = new Uint32Array(w);
    for (let y = y0; y < y1; y++) {
      const o = y * w;
      for (let x = x0; x < x1; x++) if (gray[o + x] < ink) { rows[y]++; cols[x]++; }
    }
    return { rows, cols };
  };
  // 先认出扫描边，再不算它重数一遍：左边一道黑边会让每一行都「有墨」，不去掉就上下都裁不了
  const all = count(0, w, 0, h);
  const [top, bottom] = edges(all.rows, w);
  const [left, right] = edges(all.cols, h);
  const { rows, cols } = count(left, w - right, top, h - bottom);
  const ys = span(rows, w - left - right, top, h - bottom);
  const xs = span(cols, h - top - bottom, left, w - right);
  if (!ys || !xs) return { blank: true };
  const pad = Math.max(2, Math.round(Math.max(w, h) * PAD));
  const x0 = Math.max(0, xs[0] - pad), x1 = Math.min(w - 1, xs[1] + pad);
  const y0 = Math.max(0, ys[0] - pad), y1 = Math.min(h - 1, ys[1] + pad);
  const box = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  const save = 1 - (box.w * box.h) / (w * h);
  return save < MIN_SAVE ? { box: null, save } : { box, save };
}

/** 缩小图上的框换回原图的像素（四舍五入向外，不会切到字） */
export function scaleBox(box, k, W, H) {
  const x = Math.max(0, Math.floor(box.x * k));
  const y = Math.max(0, Math.floor(box.y * k));
  return { x, y, w: Math.min(W, Math.ceil((box.x + box.w) * k)) - x, h: Math.min(H, Math.ceil((box.y + box.h) * k)) - y };
}

/** RGBA 像素（ImageData.data）转灰度 */
export function toGray(rgba, w, h) {
  const out = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < out.length; i++, j += 4) out[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  return out;
}

/** 一张图大约多少 token（宽 × 高 / 750；长边超过 2576 先缩小，一张最多约 4784） */
export function imageTokens(w, h) {
  const k = Math.min(1, 2576 / Math.max(w, h));
  return Math.min(4784, Math.ceil((w * k * h * k) / 750));
}

// 板书标注的几何（纯函数，有测试 tests/marks.test.js）：手绘风格的圈、框、下划线、划掉、涂色、箭头，旁注放哪。
// 坐标都是宿主里的像素（左上角是原点）。seed 让同一条标注每次重画的抖动都一样：
// 图重画、屏幕转向时标注跟着挪，但不会每次变个形状。

// 字符串 → 0..1 的伪随机数序列（mulberry32）
export function rng(seed) {
  let h = 1779033703 ^ String(seed).length;
  for (const ch of String(seed)) { h = Math.imul(h ^ ch.codePointAt(0), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 几个矩形的外包框 { x, y, w, h }（没有就是 null） */
export function union(rects) {
  const rs = (rects || []).filter((r) => r && Number.isFinite(r.x) && Number.isFinite(r.y));
  if (!rs.length) return null;
  const x = Math.min(...rs.map((r) => r.x)), y = Math.min(...rs.map((r) => r.y));
  const x2 = Math.max(...rs.map((r) => r.x + r.w)), y2 = Math.max(...rs.map((r) => r.y + r.h));
  return { x, y, w: x2 - x, h: y2 - y };
}

export function overlaps(a, b, gap = 0) {
  return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}

const f = (n) => Math.round(n * 10) / 10;
const P = ([x, y]) => `${f(x)} ${f(y)}`;

// 一串点连成光滑的曲线（Catmull-Rom 换成三次贝塞尔）
export function smooth(pts, closed = false) {
  if (pts.length < 3) return `M${pts.map(P).join(' L')}`;
  const at = (i) => (closed ? pts[(i + pts.length) % pts.length] : pts[Math.max(0, Math.min(pts.length - 1, i))]);
  let d = `M${P(pts[0])}`;
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return closed ? `${d} Z` : d;
}

// 手画的椭圆：比一圈多绕一点，收尾稍微偏出去一点，像粉笔圈的
function ellipse(cx, cy, rx, ry, rot, R) {
  const n = 40;
  const start = -Math.PI * (0.62 + R() * 0.16);
  const total = Math.PI * 2 * (1.07 + R() * 0.05);
  const ph1 = R() * 6.28, ph2 = R() * 6.28;
  const cos = Math.cos(rot), sin = Math.sin(rot);
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const th = start + total * t;
    const wob = 1 + 0.03 * Math.sin(th * 2 + ph1) + 0.018 * Math.sin(th * 3 + ph2);
    const grow = 1 + 0.08 * t;
    const x = Math.cos(th) * rx * wob * grow, y = Math.sin(th) * ry * wob * grow;
    pts.push([cx + x * cos - y * sin, cy + x * sin + y * cos]);
  }
  return smooth(pts);
}

// 一笔稍微弯一点的线（box 的边、下划线、划掉）
function stroke(a, b, R, bow = 1.6) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
  const k = (R() - 0.5) * 2 * bow;
  return `M${P(a)} Q${P([mx + nx * k, my + ny * k])} ${P(b)}`;
}

const PAD = 6;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * 要标的东西四周还空着多少（像素）：上下左右离最近的别的字多远。obstacles：板上的字（宿主里的坐标）；
 * 和 box 重叠的（就是要标的这些字）不算。上下只看横向挨着的，左右只看同一行的。远的（> cap）都当 cap
 */
export function roomAround(box, obstacles = [], cap = 40) {
  const room = { top: cap, bottom: cap, left: cap, right: cap };
  for (const o of obstacles) {
    if (!o) continue;
    // 按中心分：中心在 box 里的是要标的这些字；上下两行的字框常常和这一行叠一两个像素，也算上一行 / 下一行
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    if (cx >= box.x && cx <= box.x + box.w && cy >= box.y && cy <= box.y + box.h) continue;
    const hx = o.x < box.x + box.w && box.x < o.x + o.w;
    const vy = cy > box.y && cy < box.y + box.h;
    if (hx && cy < box.y) room.top = Math.min(room.top, box.y - (o.y + o.h));
    else if (hx && cy > box.y + box.h) room.bottom = Math.min(room.bottom, o.y - (box.y + box.h));
    else if (vy && cx < box.x) room.left = Math.min(room.left, box.x - (o.x + o.w));
    else if (vy && cx > box.x + box.w) room.right = Math.min(room.right, o.x - (box.x + box.w));
  }
  for (const k of Object.keys(room)) room[k] = Math.max(0, room[k]);
  return room;
}

// 圈、框离字留多少：想要 want，但不压到旁边的字——线落在空隙的中间（空隙小的时候贴着字，宁可贴着自己的字也不压别人的）
export function padsFor(room, want = { x: 8, y: 6 }) {
  const r = room || {};
  const side = (gap, w) => (gap === undefined ? w : clamp(gap * 0.5 - 0.5, 1.5, w));
  return { top: side(r.top, want.y), bottom: side(r.bottom, want.y), left: side(r.left, want.x), right: side(r.right, want.x) };
}

// 圆角矩形一周上的点（从左上角的上边开始顺时针，s 是走过的长度）
function rrPoint(x, y, w, h, r, s) {
  const st = w - 2 * r, sv = h - 2 * r, q = (Math.PI / 2) * r;
  const P = 2 * st + 2 * sv + 4 * q;
  s = ((s % P) + P) % P;
  const arc = (cx, cy, a0, t) => [cx + r * Math.cos(a0 + (t / q) * (Math.PI / 2)), cy + r * Math.sin(a0 + (t / q) * (Math.PI / 2))];
  if (s < st) return [x + r + s, y];
  s -= st; if (s < q) return arc(x + w - r, y + r, -Math.PI / 2, s);
  s -= q; if (s < sv) return [x + w, y + r + s];
  s -= sv; if (s < q) return arc(x + w - r, y + h - r, 0, s);
  s -= q; if (s < st) return [x + w - r - s, y + h];
  s -= st; if (s < q) return arc(x + r, y + h - r, Math.PI / 2, s);
  s -= q; if (s < sv) return [x, y + h - r - s];
  s -= sv; return arc(x + r, y + r, Math.PI, s);
}

/**
 * 手画的圈：一个圆角矩形（宽的是两头圆的长圈，方的就是圆），绕一周多一点、收尾稍微偏出去，像粉笔一笔圈出来的。
 * 以前用椭圆：椭圆要包住宽的一行字，得比字宽出一半、高出一截，就压到旁边和上下行的字（2026-11-03 真课）。
 * b：圈的外框（已经留好了白）
 */
export function loopPath(b, R) {
  const r = Math.min(b.h / 2, b.w / 2, b.h > 60 ? 18 : 26);
  const st = b.w - 2 * r, sv = b.h - 2 * r;
  const P = 2 * st + 2 * sv + 2 * Math.PI * r;
  const n = Math.max(28, Math.min(120, Math.round(P / 9)));
  const start = st * (0.06 + R() * 0.12); // 从上边靠左的地方起笔
  // 绕一周多一点：小圈多绕 6%～11%，大圈多出来的那段最多 40px（不然左上角拖出一长截）
  const total = P + Math.min(P * (0.06 + R() * 0.05), 26 + R() * 14);
  const ph1 = R() * 6.28, ph2 = R() * 6.28;
  const amp = Math.min(1.6, 0.6 + b.h * 0.02);
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const [px, py] = rrPoint(b.x, b.y, b.w, b.h, r, start + total * t);
    // 往外的方向（离中心）：抖一点，越画越往外一点，收尾不和起笔重合
    const dx = px - cx, dy = py - cy;
    const len = Math.hypot(dx / Math.max(1, b.w / 2), dy / Math.max(1, b.h / 2)) || 1;
    const nx = dx / Math.max(1, b.w / 2) / len, ny = dy / Math.max(1, b.h / 2) / len;
    const tail = (P * t > P - 10) ? Math.min(1, (P * t - (P - 10)) / Math.max(1, total - P + 10)) : 0;
    const off = amp * (Math.sin(t * 6.28 * 2 + ph1) * 0.7 + Math.sin(t * 6.28 * 3 + ph2) * 0.4) * (1 - 0.6 * tail) + 1.4 * tail;
    pts.push([px + nx * off, py + ny * off]);
  }
  return smooth(pts);
}

/**
 * 跨几行的半句话：沿着这几行字的形状圈（第一行从中间开始、最后一行到中间结束），不把整段都圈进去。
 * lines：每一行的框（从上到下，已经留好了白、上下挨着）。返回一笔手画的闭合线
 */
export function lassoPath(lines, R) {
  const ls = [...lines].sort((a, b) => a.y - b.y);
  // 相邻两行的分界：上一行的底和下一行的顶中间
  const cut = ls.slice(1).map((l, i) => (ls[i].y + ls[i].h + l.y) / 2);
  const top = (i) => (i ? cut[i - 1] : ls[0].y);
  const bot = (i) => (i < ls.length - 1 ? cut[i] : ls[i].y + ls[i].h);
  // 外轮廓的拐角：右边从上往下，左边从下往上
  const pts = [];
  ls.forEach((l, i) => { pts.push([l.x + l.w, top(i)], [l.x + l.w, bot(i)]); });
  for (let i = ls.length - 1; i >= 0; i--) pts.push([ls[i].x, bot(i)], [ls[i].x, top(i)]);
  // 去掉挨着的重复点、同一条线上的中间点
  const poly = pts.filter((p, i) => { const q = pts[(i + pts.length - 1) % pts.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.5; });
  // 拐角削圆：每个拐角换成两条边上离它 r 的两点，再一路加点、抖一抖
  const out = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[i], a = poly[(i + n - 1) % n], b = poly[(i + 1) % n];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]) || 1, lb = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;
    const r = Math.min(12, la / 2, lb / 2);
    out.push([p[0] + ((a[0] - p[0]) / la) * r, p[1] + ((a[1] - p[1]) / la) * r], [p[0] + ((b[0] - p[0]) / lb) * r, p[1] + ((b[1] - p[1]) / lb) * r]);
  }
  // 从第一行左上角往右起笔，绕一周再多画一小段
  const dense = [];
  for (let i = 0; i < out.length; i++) {
    const p = out[i], q = out[(i + 1) % out.length];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const k = Math.max(1, Math.round(len / 14));
    for (let t = 0; t < k; t++) dense.push([p[0] + ((q[0] - p[0]) * t) / k, p[1] + ((q[1] - p[1]) * t) / k]);
  }
  const startAt = dense.findIndex((p) => Math.abs(p[1] - ls[0].y) < 0.6) + 1 || 0;
  const ring = [...dense.slice(startAt), ...dense.slice(0, startAt)];
  const extra = ring.slice(0, Math.min(3, ring.length));
  const ph = R() * 6.28;
  const wob = (p, i) => [p[0] + Math.sin(i * 0.7 + ph) * 0.9, p[1] + Math.cos(i * 0.9 + ph) * 0.9];
  return smooth([...ring.map(wob), ...extra.map((p, i) => [p[0] + 1.5, p[1] - 2.2 - i * 0.4])]);
}

// 大括号（一组要背的东西旁边）：side right 是「}」，left 是「{」
function bracePath(b, side, R) {
  const top = b.y - 2, bot = b.y + b.h + 2, mid = (top + bot) / 2 + (R() - 0.5) * 2;
  const bw = clamp((bot - top) * 0.07, 8, 15);
  const dir = side === 'left' ? -1 : 1;
  const x0 = side === 'left' ? b.x - 9 : b.x + b.w + 9;
  const xm = x0 + dir * bw * 0.5, xt = x0 + dir * bw;
  const c = Math.min(bw * 0.9, (bot - top) / 5);
  const jj = () => (R() - 0.5) * 1.2;
  const d = `M${P([x0, top])} Q${P([xm + jj(), top])} ${P([xm, top + c])} L${P([xm + jj(), mid - c])} Q${P([xm, mid])} ${P([xt, mid])} `
    + `Q${P([xm, mid])} ${P([xm, mid + c])} L${P([xm + jj(), bot - c])} Q${P([xm + jj(), bot])} ${P([x0, bot])}`;
  const bx = Math.min(x0, xt) - 2;
  return { d, bbox: { x: bx, y: top - 2, w: bw + 4, h: bot - top + 4 }, tip: [xt, mid] };
}

// 一行字下面的波浪线
function wavePath(x0, x1, y, R) {
  const pts = [];
  const per = 8.5, amp = 1.9;
  const ph = R() * 6.28;
  for (let x = x0; x <= x1 + 0.1; x += 2) pts.push([x, y + amp * Math.sin(((x - x0) / per) * 6.28 + ph)]);
  return smooth(pts);
}

// 圆点（着重号）
const dotPath = (x, y, r) => `M${P([x - r, y])} a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0 Z`;

/**
 * 一条标注的形状。geom：{ box }（要标的地方的外包框）、{ diag: [cell…] }（主对角线上各格）或 { point }；
 * 还可以带 room（四周空着多少，roomAround）、chars（着重号：每个字的框）、side（大括号、✓ 放哪边）。
 * 返回 { strokes: [d], fills: [d], dots: [d], bbox, tip? }：strokes 是线，fills 是涂色（画在字下面），dots 是实心的点；
 * bbox 是画出来的范围（旁注要躲开它），tip 是旁注最好挨着的那一点（大括号的尖）
 */
export function shapeFor(style, geom, seed) {
  const R = rng(seed);
  const j = (s = 1.4) => (R() - 0.5) * 2 * s;
  const none = { strokes: [], fills: [], dots: [] };
  if (geom.diag?.length) {
    // 主对角线：一个斜着的长圈，从第一个对角元圈到最后一个
    const cs = geom.diag.map((c) => [c.x + c.w / 2, c.y + c.h / 2]);
    const a = cs[0], b = cs[cs.length - 1];
    const r = Math.max(...geom.diag.map((c) => Math.max(c.w, c.h))) / 2 + PAD * 0.6;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const rot = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
    const rx = len / 2 + r * 1.05, ry = r;
    const ext = [Math.abs(rx * Math.cos(rot)) + Math.abs(ry * Math.sin(rot)), Math.abs(rx * Math.sin(rot)) + Math.abs(ry * Math.cos(rot))].map((e) => e * 1.1);
    return { ...none, strokes: [ellipse(cx, cy, rx, ry, rot, R)], bbox: { x: cx - ext[0], y: cy - ext[1], w: ext[0] * 2, h: ext[1] * 2 } };
  }
  if (geom.point) {
    // 图上的一个点：圈一个小圈（箭头直接指过去）
    const { x, y } = geom.point;
    const r = 15;
    const box = { x: x - r, y: y - r, w: r * 2, h: r * 2 };
    if (style === 'arrow') return { ...none, bbox: { x: x - 4, y: y - 4, w: 8, h: 8 }, point: geom.point };
    return { ...none, strokes: [ellipse(x, y, r, r * 0.92, j(0.3), R)], bbox: box };
  }
  const b = geom.box;
  const { x, y, w, h } = b;
  const room = geom.room || {};
  const below = clamp((room.bottom ?? 12) * 0.45, 2, 4.5); // 线画在字下面多远：别碰到下一行
  switch (style) {
    case 'circle': {
      const p = padsFor(geom.room, geom.tight ? { x: 4, y: 4 } : { x: 8, y: 6 });
      const o = { x: x - p.left, y: y - p.top, w: w + p.left + p.right, h: h + p.top + p.bottom };
      // 跨几行、头尾不齐（半句话从行中间开始、到行中间结束）：沿着字的形状圈
      const ls = geom.lines;
      if (ls?.length > 1 && (ls[0].x - x > 24 || x + w - (ls[ls.length - 1].x + ls[ls.length - 1].w) > 24)) {
        const ex = ls.map((l, i) => ({ x: l.x - p.left, y: l.y - (i ? 0 : p.top), w: l.w + p.left + p.right, h: l.h + (i ? 0 : p.top) + (i === ls.length - 1 ? p.bottom : 0) }));
        return { ...none, strokes: [lassoPath(ex, R)], bbox: { x: o.x - 5, y: o.y - 5, w: o.w + 10, h: o.h + 10 } };
      }
      // 方方的一小块（公式里的一项、一个字母、图上的标签）：椭圆更像随手一圈，也包得住四个角。
      // 公式里左右挨着别的符号、上下比较空：圈得高一点、窄一点（宽度刚好包住四个角再多 2px），高度不超过上下的空隙
      if (o.w / o.h < 1.9) {
        const v = Math.min(room.top ?? 40, room.bottom ?? 40);
        const ry = Math.min(h / 2 * 1.35 + PAD * 0.7, h / 2 + Math.max(2.5, v * 0.55));
        const kk = Math.min(0.92, h / 2 / ry);
        const rx = Math.max(w / 2 / Math.sqrt(1 - kk * kk) + 2, ry * 0.85);
        const cx = x + w / 2, cy = y + h / 2;
        return { ...none, strokes: [ellipse(cx, cy, rx, ry, j(0.04), R)], bbox: { x: cx - rx * 1.1, y: cy - ry * 1.1, w: rx * 2.2, h: ry * 2.2 } };
      }
      return { ...none, strokes: [loopPath(o, R)], bbox: { x: o.x - 5, y: o.y - 5, w: o.w + 10, h: o.h + 10 } };
    }
    case 'brace': {
      const br = bracePath(b, geom.side === 'left' ? 'left' : 'right', R);
      return { ...none, strokes: [br.d], bbox: br.bbox, tip: br.tip };
    }
    case 'underline': {
      const yy = y + h + below;
      return { ...none, strokes: [stroke([x - 3 + j(0.8), yy + j(0.6)], [x + w + 3 + j(0.8), yy - 0.8 + j(0.6)], R, 1.6)], bbox: { x: x - 6, y, w: w + 12, h: h + below + 4 } };
    }
    case 'double': {
      const y1 = y + h + Math.min(below, 2.5), y2 = y1 + 3.6;
      return { ...none, strokes: [stroke([x - 3, y1 + j(0.5)], [x + w + 3, y1 + j(0.5)], R, 1), stroke([x - 1, y2 + j(0.5)], [x + w + 2, y2 + j(0.5)], R, 1)], bbox: { x: x - 6, y, w: w + 12, h: h + 10 } };
    }
    case 'wave': {
      const yy = y + h + Math.max(below, 3);
      return { ...none, strokes: [wavePath(x - 1, x + w + 1, yy, R)], bbox: { x: x - 4, y, w: w + 8, h: h + below + 7 } };
    }
    case 'dots': {
      // 着重号：每个字正下方一个点；没有每个字的位置时按字宽约 1em 排
      const yy = y + h + Math.max(below, 3) + 1;
      const cs = geom.chars?.length ? geom.chars : Array.from({ length: Math.max(1, Math.round(w / Math.max(10, h * 0.9))) }, (_, i, a) => ({ x: x + (w / a.length) * i, w: w / a.length }));
      const r = clamp(h * 0.09, 1.6, 2.4);
      return { ...none, dots: cs.map((c) => dotPath(c.x + c.w / 2, yy, r)), bbox: { x: x - 2, y, w: w + 4, h: h + below + 8 } };
    }
    case 'strike': {
      // 宽的划一横；窄的（一个数、一项）像 \cancel 斜着划
      const wide = w > h * 2.6;
      const d = wide
        ? stroke([x - 3, y + h * 0.56 + j(1.5)], [x + w + 3, y + h * 0.46 + j(1.5)], R, 1.5)
        : stroke([x - 2 + j(), y + h + 2 + j()], [x + w + 2 + j(), y - 2 + j()], R, 1.2);
      return { ...none, strokes: [d], bbox: { x: x - 4, y: y - 4, w: w + 8, h: h + 8 } };
    }
    case 'highlight': {
      // 荧光笔：一笔涂过去，上下边稍微不齐、两头斜着收（画在字下面一层，字照样清楚）
      const t = y + h * 0.1, bt = y + h * 0.96, p = 3;
      const d = `M${P([x - p + j(0.8), t + j(0.8)])} L${P([x + w * 0.5, t - 0.6 + j(0.6)])} L${P([x + w + p + j(0.8), t + 0.4 + j(0.8)])} `
        + `L${P([x + w + p - 2 + j(0.8), bt + j(0.8)])} L${P([x + w * 0.5, bt + 0.8 + j(0.6)])} L${P([x - p + 2 + j(0.8), bt + 0.3 + j(0.8)])} Z`;
      return { ...none, fills: [d], bbox: { x: x - p - 2, y: y - 3, w: w + p * 2 + 4, h: h + 6 } };
    }
    case 'tick':
    case 'cross': {
      // ✓ / ✗：写在这一句后面（side=left 写在前面）
      const sz = clamp(h * 1.05, 16, 30);
      const left = geom.side === 'left';
      const x0 = left ? x - 8 - sz : x + w + 9;
      const y0 = y + h / 2 - sz / 2;
      const d = style === 'tick'
        ? `M${P([x0 + j(0.8), y0 + sz * 0.52])} Q${P([x0 + sz * 0.22, y0 + sz * 0.7])} ${P([x0 + sz * 0.36, y0 + sz + j(0.6)])} Q${P([x0 + sz * 0.6, y0 + sz * 0.35])} ${P([x0 + sz * 1.08, y0 - sz * 0.08 + j(0.8)])}`
        : `${stroke([x0, y0 + j(0.8)], [x0 + sz * 0.9, y0 + sz + j(0.8)], R, 1.4)} ${stroke([x0 + sz * 0.92, y0 + j(0.8)], [x0 + j(0.8), y0 + sz * 0.98], R, 1.4)}`;
      return { ...none, strokes: [d], bbox: { x: x0 - 4, y: y0 - 6, w: sz * 1.1 + 8, h: sz + 10 } };
    }
    case 'arrow':
      // 箭头的线要等旁注放好了才知道从哪画来（arrowPath）；这里只给出要指的范围
      return { ...none, bbox: { x: x - 2, y: y - 2, w: w + 4, h: h + 4 } };
    default: { // box
      // 矩阵的一行（一列）：上下（左右）收紧，挨着的几行各框各的，框线不打架
      const tx = geom.tight === 'x', ty = geom.tight === 'y';
      const pp = padsFor(geom.room, { x: PAD - 1, y: PAD - 1 });
      const px = tx ? geom.inset ?? 1 : null, py = ty ? geom.inset ?? 1 : null;
      const L = x - (px ?? pp.left), T = y - (py ?? pp.top), Rr = x + w + (px ?? pp.right), B = y + h + (py ?? pp.bottom);
      // 角上多出去一点。收紧的方向上不出头、抖得也小：不然竖边伸进上下两行的框里，几行的框线叠成一团
      const o = () => (geom.tight ? 1.5 + R() * 2.5 : 3 + R() * 4);
      const ox = () => (tx ? 0 : o()), oy = () => (ty ? 0 : o());
      const jx = () => j(tx ? 0.5 : 1.4), jy = () => j(ty ? 0.5 : 1.4);
      const bh = ty ? 0.6 : 1.6, bv = tx ? 0.6 : 1.6;
      const d = [
        stroke([L - ox(), T + jy()], [Rr + ox(), T + jy()], R, bh),
        stroke([Rr + jx(), T - oy()], [Rr + jx(), B + oy()], R, bv),
        stroke([Rr + ox(), B + jy()], [L - ox(), B + jy()], R, bh),
        stroke([L + jx(), B + oy()], [L + jx(), T - oy()], R, bv),
      ].join(' ');
      return { ...none, strokes: [d], bbox: { x: L - 7, y: T - 7, w: Rr - L + 14, h: B - T + 14 } };
    }
  }
}

// 点到矩形最近的点
function nearest(p, r) {
  return [Math.max(r.x, Math.min(p[0], r.x + r.w)), Math.max(r.y, Math.min(p[1], r.y + r.h))];
}

/**
 * 箭头：从 from 区域（旁注）指到 to 区域（或一个点）。返回 SVG path（线 + 箭头的两笔）
 */
export function arrowPath(from, to, seed, { room = null } = {}) {
  const R = rng(`${seed}:arrow`);
  // 同一行里的两处（主语 → 谓语）：拱过去，不横穿中间的字
  if (sameLine(from, to)) return arcPath(from, to, R, room).d;
  const toC = to.w !== undefined ? [to.x + to.w / 2, to.y + to.h / 2] : [to.x, to.y];
  const fromC = [from.x + from.w / 2, from.y + from.h / 2];
  const a0 = nearest(toC, from);
  let b0 = to.w !== undefined ? nearest(fromC, to) : [to.x, to.y];
  const len0 = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]) || 1;
  const ux = (b0[0] - a0[0]) / len0, uy = (b0[1] - a0[1]) / len0;
  const a = [a0[0] + ux * 4, a0[1] + uy * 4];
  // 箭头尖停在目标外面一点，别压住要看的东西
  const b = [b0[0] - ux * (to.w !== undefined ? 5 : 9), b0[1] - uy * (to.w !== undefined ? 5 : 9)];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const bend = (R() > 0.5 ? 1 : -1) * Math.min(26, len * 0.18);
  const c = [(a[0] + b[0]) / 2 - uy * bend, (a[1] + b[1]) / 2 + ux * bend];
  // 箭头方向按曲线末端的切线
  const tx = b[0] - c[0], ty = b[1] - c[1];
  const tl = Math.hypot(tx, ty) || 1;
  const dx = tx / tl, dy = ty / tl;
  const hl = Math.min(13, len * 0.4), ang = 0.5;
  const h1 = [b[0] - hl * (dx * Math.cos(ang) - dy * Math.sin(ang)), b[1] - hl * (dy * Math.cos(ang) + dx * Math.sin(ang))];
  const h2 = [b[0] - hl * (dx * Math.cos(-ang) - dy * Math.sin(-ang)), b[1] - hl * (dy * Math.cos(-ang) + dx * Math.sin(-ang))];
  return `M${P(a)} Q${P(c)} ${P(b)} M${P(h1)} L${P(b)} L${P(h2)}`;
}

export const sameLine = (from, to) => to.w !== undefined && from.y < to.y + to.h && to.y < from.y + from.h && Math.abs(from.x + from.w / 2 - (to.x + to.w / 2)) > 20;

/**
 * 同一行两处之间拱起来的箭头：{ d, bbox, down }。往上下哪边拱看哪边空（room：这一行上下空着多少），
 * 拱多高也按空隙来，不压进上一行（下一行）的字
 */
export function arcPath(from, to, R = rng('arc'), room = null) {
  const down = !!room && room.top < 22 && room.bottom > room.top;
  const gap = room ? (down ? room.bottom : room.top) : 30;
  const sgn = down ? 1 : -1;
  const yA = down ? from.y + from.h + 3 : from.y - 3, yB = down ? to.y + to.h + 3 : to.y - 3;
  const a = [from.x + from.w / 2, yA], b = [to.x + to.w / 2, yB];
  const dist = Math.abs(b[0] - a[0]);
  const rise = clamp(Math.min(dist * 0.16, gap - 5), 5, 22);
  const c = [(a[0] + b[0]) / 2 + (R() - 0.5) * 6, (down ? Math.max(a[1], b[1]) : Math.min(a[1], b[1])) + sgn * rise * 2];
  // 末端切线 c → b，箭头的两笔
  const tx = b[0] - c[0], ty = b[1] - c[1], tl = Math.hypot(tx, ty) || 1, dx = tx / tl, dy = ty / tl;
  const hl = 10, ang = 0.5;
  const h1 = [b[0] - hl * (dx * Math.cos(ang) - dy * Math.sin(ang)), b[1] - hl * (dy * Math.cos(ang) + dx * Math.sin(ang))];
  const h2 = [b[0] - hl * (dx * Math.cos(-ang) - dy * Math.sin(-ang)), b[1] - hl * (dy * Math.cos(-ang) + dx * Math.sin(-ang))];
  const y0 = down ? Math.min(a[1], b[1]) : Math.min(a[1], b[1]) - rise, y1 = down ? Math.max(a[1], b[1]) + rise : Math.max(a[1], b[1]);
  return { d: `M${P(a)} Q${P(c)} ${P(b)} M${P(h1)} L${P(b)} L${P(h2)}`, bbox: { x: Math.min(a[0], b[0]) - 4, y: y0 - 4, w: dist + 8, h: y1 - y0 + 8 }, down };
}

/**
 * 示意图（sketch）里画出来的线，当作旁注要躲开的地方。shapes：[{ box, closed }]。
 * 封闭的形状（方块、圆）只躲四条边：框里空着的地方旁注照样能写；线、折线、路径躲它占的范围。t：线的粗细加余量
 */
export function strokeObstacles(shapes, t = 8) {
  const h = t / 2;
  const out = [];
  for (const { box: b, closed } of shapes || []) {
    if (!b || !Number.isFinite(b.x) || !Number.isFinite(b.y) || !(b.w >= 0) || !(b.h >= 0)) continue;
    if (closed && b.w > t && b.h > t) {
      out.push(
        { x: b.x - h, y: b.y - h, w: b.w + t, h: t }, { x: b.x - h, y: b.y + b.h - h, w: b.w + t, h: t },
        { x: b.x - h, y: b.y - h, w: t, h: b.h + t }, { x: b.x + b.w - h, y: b.y - h, w: t, h: b.h + t },
      );
    } else out.push({ x: b.x - h, y: b.y - h, w: b.w + t, h: b.h + t });
  }
  return out;
}

const SIDE_ORDER = ['right', 'above', 'below', 'left'];
const GAPS = [8, 30, 60, 100, 150];
const ALIGNS = ['center', 'start', 'end'];

// 重叠的面积
function overlapArea(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

// 两个矩形之间的空隙（挨着或重叠是 0）
export function gapBetween(a, b) {
  const dx = Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w));
  const dy = Math.max(0, a.y - (b.y + b.h), b.y - (a.y + a.h));
  return Math.hypot(dx, dy);
}

function candidate(t, size, s, g, a) {
  const cx = a === 'center' ? t.x + t.w / 2 - size.w / 2 : a === 'start' ? t.x : t.x + t.w - size.w;
  const cy = a === 'center' ? t.y + t.h / 2 - size.h / 2 : a === 'start' ? t.y : t.y + t.h - size.h;
  if (s === 'right') return { x: t.x + t.w + g, y: cy };
  if (s === 'left') return { x: t.x - g - size.w, y: cy };
  if (s === 'above') return { x: cx, y: t.y - g - size.h };
  return { x: cx, y: t.y + t.h + g };
}

/**
 * 旁注放哪。target：形状的范围；size：旁注的大小；area：旁注能放的范围 { x0, y0, x1, y1 }（宿主里的坐标）。
 * 在四边、几种距离、几种对齐里挑一个：不压住要标的东西（target）、尽量不压字（obstacles：正文、按钮的范围）、
 * 不压别的旁注和形状（taken），近的、side 指定的那边优先。
 * keep：上次挑好的 { side, gap, align }（图在动时沿用，不重新挑，旁注不会跳来跳去）。
 * 返回 { x, y, side, gap, align, lead }：lead 表示旁注离得远，要连一条线过去
 */
export function placeNote(target, size, area, { side, taken = [], far = false, obstacles = [], keep = null } = {}) {
  const clampX = (x) => Math.max(area.x0, Math.min(area.x1 - size.w, x));
  const clampY = (y) => Math.max(area.y0, Math.min(area.y1 - size.h, y));
  const make = (s, g, a) => {
    const raw = candidate(target, size, s, g, a);
    const r = { x: clampX(raw.x), y: clampY(raw.y), w: size.w, h: size.h };
    return { r, s, g, a, moved: Math.abs(r.x - raw.x) + Math.abs(r.y - raw.y) };
  };
  const done = (c) => ({ x: c.r.x, y: c.r.y, side: c.s, gap: c.g, align: c.a, lead: gapBetween(c.r, target) > 18 });
  if (keep && SIDE_ORDER.includes(keep.side)) return done(make(keep.side, keep.gap, keep.align));
  const order = side ? [side, ...SIDE_ORDER.filter((x) => x !== side)] : SIDE_ORDER;
  const gaps = far ? [34, 60, 100, 150] : GAPS;
  let best = null;
  order.forEach((s, rank) => {
    for (const g of gaps) {
      if ((s === 'left' || s === 'right') && g > 60) continue;
      ALIGNS.forEach((a, ai) => {
        const c = make(s, g, a);
        if (overlapArea(c.r, target) > 0) return; // 压住要标的东西：不要
        let score = rank * 40 + ai * 15 + g * 6 + c.moved * 2;
        for (const o of obstacles) score += overlapArea(c.r, o);
        for (const o of taken) score += overlapArea(c.r, o) * 3;
        if (!best || score < best.score) best = { ...c, score };
      });
    }
  });
  return done(best || make(order[0], gaps[0], 'center'));
}

/** 旁注离得远时连过去的一条细线（不带箭头） */
export function leaderPath(from, to, seed) {
  const R = rng(`${seed}:lead`);
  const fc = [from.x + from.w / 2, from.y + from.h / 2], tc = [to.x + to.w / 2, to.y + to.h / 2];
  const a = nearest(tc, from), b0 = nearest(fc, to);
  const len = Math.hypot(b0[0] - a[0], b0[1] - a[1]) || 1;
  const ux = (b0[0] - a[0]) / len, uy = (b0[1] - a[1]) / len;
  const a1 = [a[0] + ux * 3, a[1] + uy * 3], b = [b0[0] - ux * 4, b0[1] - uy * 4];
  const bend = (R() > 0.5 ? 1 : -1) * Math.min(14, len * 0.12);
  const c = [(a1[0] + b[0]) / 2 - uy * bend, (a1[1] + b[1]) / 2 + ux * bend];
  return `M${P(a1)} Q${P(c)} ${P(b)}`;
}

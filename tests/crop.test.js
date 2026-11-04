// 扫描页裁白边、认空白页（kit/src/books/crop.js）：只裁空白，绝不裁到字
import test from 'node:test';
import assert from 'node:assert/strict';
import { contentBox, scaleBox, imageTokens } from '../kit/src/books/crop.js';

// 一页 w × h 的白纸（纸色 paper），rects 是一块块墨 [x, y, w, h, 灰度]
function page(w, h, rects = [], paper = 245) {
  const g = new Uint8Array(w * h).fill(paper);
  for (const [x, y, rw, rh, v = 30] of rects) for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) g[j * w + i] = v;
  return g;
}
const inside = (box, [x, y, w, h]) => box.x <= x && box.y <= y && box.x + box.w >= x + w && box.y + box.h >= y + h;

test('正文四周的白边裁掉，字全在框里，还留了边', () => {
  const text = [60, 80, 180, 240];
  const r = contentBox(page(300, 424, [text]), 300, 424);
  assert.ok(r.box, '该裁');
  assert.ok(inside(r.box, text));
  assert.ok(r.box.x < 60 && r.box.y < 80, '四周留了边');
  assert.ok(r.save > 0.4, `省了 ${r.save}`);
});

test('整页空白（只有零星噪点）认成空白页', () => {
  assert.deepEqual(contentBox(page(300, 424, [[10, 10, 1, 1], [200, 300, 1, 1]]), 300, 424), { blank: true });
});

test('孤立的噪点不算内容，页码这种小块要算', () => {
  const text = [60, 80, 180, 200];
  const num = [145, 400, 10, 6]; // 页脚的页码
  const r = contentBox(page(300, 424, [text, num, [5, 5, 1, 1], [40, 6, 1, 1], [250, 7, 1, 1], [20, 30, 1, 2]]), 300, 424);
  assert.ok(inside(r.box, text) && inside(r.box, num));
  assert.ok(r.box.x > 5 && r.box.y > 5, '噪点不撑大框');
});

test('淡色的字（浅蓝标题、铅笔字）也算内容', () => {
  const faint = [40, 20, 120, 8, 200]; // 比纸暗 45
  const r = contentBox(page(300, 424, [[60, 80, 180, 240], faint]), 300, 424);
  assert.ok(inside(r.box, faint));
});

test('扫描留下的贴边黑边不算内容；整道出血的横幅照样当内容', () => {
  const text = [60, 80, 180, 240];
  const border = [0, 0, 8, 424]; // 左边一道 8 像素黑边（< 4%）
  const r = contentBox(page(300, 424, [text, border]), 300, 424);
  assert.ok(r.box && r.box.x > 8, '黑边裁掉');
  assert.ok(r.box.y > 40, '黑边不让每一行都算有墨');
  const banner = [0, 0, 300, 60]; // 章首整宽的横幅（14%）
  const r2 = contentBox(page(300, 424, [text, banner]), 300, 424);
  assert.ok(!r2.box || inside(r2.box, banner), '横幅不裁');
});

test('省得太少、纸太暗：不裁', () => {
  assert.equal(contentBox(page(300, 424, [[4, 4, 292, 416]]), 300, 424).box, null);
  assert.equal(contentBox(page(300, 424, [[60, 80, 180, 240]], 90), 300, 424).box, null);
});

test('缩小图的框换回原图向外取整；token 估算', () => {
  assert.deepEqual(scaleBox({ x: 10, y: 20, w: 30, h: 40 }, 4, 1200, 1697), { x: 40, y: 80, w: 120, h: 160 });
  assert.deepEqual(scaleBox({ x: 290, y: 0, w: 10, h: 10 }, 4.01, 1200, 1697).x + scaleBox({ x: 290, y: 0, w: 10, h: 10 }, 4.01, 1200, 1697).w, 1200);
  assert.equal(imageTokens(1200, 1697), 2716);
  assert.ok(imageTokens(4000, 6000) <= 5000);
});

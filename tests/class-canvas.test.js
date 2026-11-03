// 版面（kit/src/class/canvas.js，docs/canvas-plan.md）：at= 的写法、找空处、不叠、版面图
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAt, atText, placeBlock, findFree, mapText, defaultSize, rowsFor, overlaps } from '../kit/src/class/canvas.js';
import { parseCommand } from '../kit/src/class/protocol.js';
import { boardStateText, buildSystem, CANVAS_DOC, bytes } from '../kit/src/class/prompt.js';

test('parseAt：列-列/行-行，一个数也行，写反了也认', () => {
  assert.deepEqual(parseAt('7-12/1-5'), { c1: 7, c2: 12, r1: 1, r2: 5 });
  assert.deepEqual(parseAt('3/2'), { c1: 3, c2: 3, r1: 2, r2: 2 });
  assert.deepEqual(parseAt('12-7/5-1'), { c1: 7, c2: 12, r1: 1, r2: 5 });
  assert.deepEqual(parseAt('1–6，1-4'), { c1: 1, c2: 6, r1: 1, r2: 4 });
  assert.match(parseAt('0-13/1').error, /列只有/);
  assert.match(parseAt('左上').error, /看不懂/);
  assert.equal(atText({ c1: 1, c2: 6, r1: 1, r2: 4 }), '1-6/1-4');
});

test('protocol：at= 和 move', () => {
  assert.deepEqual(parseCommand('add id=b4 at=7-12/1-5').at, { c1: 7, c2: 12, r1: 1, r2: 5 });
  assert.deepEqual(parseCommand('move id=b3 at=1-4/6-8'), { op: 'move', id: 'b3', at: { c1: 1, c2: 4, r1: 6, r2: 8 } });
  assert.match(parseCommand('move id=b3').error, /move 要写挪到哪/);
  assert.match(parseCommand('add id=b4 at=99').error, /看不懂/);
});

test('placeBlock：写了就放那里；和别的叠了挪到最近的空处；没写按内容找空处', () => {
  const placed = [{ c1: 1, c2: 6, r1: 1, r2: 4 }];
  assert.deepEqual(placeBlock(placed, { c1: 7, c2: 12, r1: 1, r2: 4 }).at, { c1: 7, c2: 12, r1: 1, r2: 4 });
  const moved = placeBlock(placed, { c1: 4, c2: 9, r1: 2, r2: 3 });
  assert.equal(moved.moved, true);
  assert.ok(!overlaps(moved.at, placed[0]));
  assert.deepEqual(moved.at, { c1: 7, c2: 12, r1: 1, r2: 2 });
  const auto = placeBlock(placed, null, defaultSize(['scene']));
  assert.equal(auto.auto, true);
  assert.deepEqual(auto.at, { c1: 1, c2: 7, r1: 5, r2: 9 }, '7 列宽的图右边放不下，放到下面');
  assert.deepEqual(findFree([], 4, 2), { c1: 1, c2: 4, r1: 1, r2: 2 });
  assert.equal(rowsFor(250, 80, 12), 3);
});

test('mapText：每格写着段 id，· 是空的，超出一屏的行标出来', () => {
  const m = mapText([{ id: 'b1', at: { c1: 1, c2: 2, r1: 1, r2: 1 } }, { id: 'b2', at: { c1: 12, c2: 12, r1: 9, r2: 9 } }]);
  const lines = m.split('\n');
  assert.match(lines[0], /^ {4}1 {2}2 {2}3/);
  assert.match(lines[1], /^ 1 {2}b1 b1 ·/);
  assert.match(lines[8], /一屏到这里/);
  assert.match(lines[9], /b2$/);
});

test('黑板现状里有版面图和每段的位置；说明里有版面一节（开着时才带）', () => {
  const board = {
    segs: [{ id: 'b1', page: 1, title: '图', summary: '', at: '1-7/1-5', fit: { need: 6, scale: 0.85 }, blocks: [] }],
    pages: [{ n: 1, title: '秩一' }], cur: 1, view: 1,
    canvas: { map: mapText([{ id: 'b1', at: { c1: 1, c2: 7, r1: 1, r2: 5 } }]), cell: { w: 70, h: 78 } },
  };
  const t = boardStateText(board);
  assert.match(t, /b1「图」［at=1-7\/1-5，内容要 6 行，缩小到 85% 才放下］/);
  assert.match(t, /当前板的版面（12 列 × 8 行一屏，一格约 70×78 像素/);
  const on = buildSystem({ componentDocs: '', pack: {}, board: [], canvas: true });
  const off = buildSystem({ componentDocs: '', pack: {}, board: [] });
  assert.ok(on.includes(CANVAS_DOC) && !off.includes(CANVAS_DOC));
  assert.ok(bytes(CANVAS_DOC) < 3 * 1024, `版面说明 ${bytes(CANVAS_DOC)} 字节`);
  assert.doesNotMatch(CANVAS_DOC, /[他她]/);
});

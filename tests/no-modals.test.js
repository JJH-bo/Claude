// claude.ai 把 artifact 放在不许弹框的沙箱里：window.confirm / alert / prompt 不弹、直接当取消，按钮点了像没反应
// （2026-11-03 学习台「直接下课」就是这样坏的）。页面里要问一句用 kit/src/dialog.js 的 ask / choose。开发面板（?dev 才有）不管。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function files(dir) {
  return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : p.endsWith('.js') ? [p] : []; });
}

test('页面代码里不用 window.confirm / alert / prompt', () => {
  const bad = [];
  for (const f of files(new URL('../kit/src', import.meta.url).pathname)) {
    if (/devpanel\.js$/.test(f)) continue;
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '');
      if (/(?<!function\s)(?<![.\w])(?:window\.)?(?:confirm|alert|prompt)\s*\(/.test(code)) bad.push(`${f.split('kit/src/')[1]}:${i + 1}`);
    });
  }
  assert.deepEqual(bad, []);
});

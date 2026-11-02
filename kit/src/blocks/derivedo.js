// derive 的学生版（mode: do）：老师给出发的式子，学生一行一行往下写，页面查每一行和上一行是不是相等（随机取几组数比）。
// 不相等就告诉学生「取哪组数时上一行等于什么、这一行等于什么」，学生改；老师看到的记录精确到第几行、两边各等于什么。
// 判断都在 derivedo.js（纯函数）。
import { parseDeriveDo, sampleEnvs, checkLine } from '../derivedo.js';
import { formulaTeX } from '../formula.js';
import { normalizeFormula, FORMULA_FUNCS } from '../formula.js';
import { session } from '../session.js';
import { widget, mdToHtml, tex2html, escapeHtml } from './common.js';
import { markDraft } from '../drafts.js';
import { floatVars } from '../exact.js';

export function deriveDo(el, src) {
  const spec = parseDeriveDo(src);
  const { fields } = spec;
  const id = el.closest?.('[data-bid]')?.dataset.bid || el.dataset.bid || 'derive';
  const envs = sampleEnvs(spec, { seed: id, base: floatVars(session.vars) });
  const names = Object.keys(envs[0] || {});
  const texOf = (s) => { try { return formulaTeX(normalizeFormula(s, { names, funcs: FORMULA_FUNCS })); } catch { return ''; } };
  // 第一行先查一遍算不算得出来：老师写错了要在页面上报出来，不能等学生写了才发现
  const first = checkLine(spec, envs, spec.start, spec.start);
  if (first.error) throw new Error(`start: ${first.error}`);
  if (spec.goal) { const g = checkLine(spec, envs, spec.start, spec.goal); if (g.error) throw new Error(`goal: ${g.error}`); if (!g.ok) session.problem(el, 'derive', `goal: 和 start: 不相等（${g.why}）：学生永远推不到`); }

  const title = fields.title || '自己推';
  const body = widget(el, { title: escapeHtml(title), cls: 'derive derive-do' });
  body.innerHTML = `${fields.q ? `<div class="w-q">${mdToHtml(fields.q)}</div>` : ''}
    <div class="dv-scroll"><table class="dv"><tbody><tr class="dv-line"><td class="dv-r">${tex2html(texOf(spec.start))}</td><td class="dv-note muted">出发</td></tr></tbody></table></div>
    <div class="dd-row">
      <span class="dd-eq">=</span>
      <input class="dd-input" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="下一行，比如 a(b'a)b'" aria-label="写下一行">
      <button type="button" class="btn btn-primary dd-ok">写好了</button>
    </div>
    <div class="dd-preview muted" aria-live="polite"></div>
    <div class="dd-fb" hidden></div>
    <div class="dd-acts"><button type="button" class="btn dd-giveup">想不出来</button>${spec.goal ? `<span class="muted dd-goal">推到 ${tex2html(texOf(spec.goal))} 就完成</span>` : '<button type="button" class="btn dd-done">推完了</button>'}</div>
    ${fields.note ? `<div class="w-note">${mdToHtml(fields.note)}</div>` : ''}`;
  const $ = (s) => body.querySelector(s);
  const tbody = $('tbody');
  const input = $('.dd-input');
  const fb = $('.dd-fb');
  const preview = $('.dd-preview');
  const lines = [spec.start];
  let tries = 0, total = 0, closed = false;
  const t0 = Date.now();
  const q = String(fields.q || title).replace(/\$/g, '').slice(0, 300);
  markDraft(body, () => (input.value.trim() ? { text: input.value.trim(), label: `第 ${lines.length + 1} 行` } : null));

  input.addEventListener('input', () => {
    const t = texOf(input.value);
    preview.innerHTML = t ? `读成 ${tex2html(t)}` : '';
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  $('.dd-ok').addEventListener('click', submit);

  function submit() {
    if (closed) return;
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    const r = checkLine(spec, envs, lines.at(-1), text);
    if (r.error) { show('bad', `看不懂这一行：${r.error}`); return; } // 写法问题不算一次尝试
    tries++; total++;
    const k = lines.length + 1;
    session.record({ type: 'derive', liveOnly: true, title, q, detail: `第 ${k} 行`, value: text, ok: r.ok, attempts: tries, check: r.ok ? undefined : r.why, ms: Date.now() - t0, el });
    if (!r.ok) { show('bad', `这一行和上一行不相等：${r.why}`); return; }
    lines.push(text);
    tbody.insertAdjacentHTML('beforeend', `<tr class="dv-line is-new"><td class="dv-r">= ${tex2html(r.tex)}</td><td class="dv-note">✓</td></tr>`);
    input.value = '';
    preview.innerHTML = '';
    tries = 0;
    if (r.done) finish(true);
    else show('ok', '对，接着往下写');
  }

  function show(kind, msg) {
    fb.hidden = false;
    fb.className = `dd-fb is-${kind}`;
    fb.textContent = msg;
  }

  function finish(ok, how = '') {
    if (closed) return;
    closed = true;
    $('.dd-row').hidden = true;
    $('.dd-acts').hidden = true;
    preview.innerHTML = '';
    show(ok ? 'ok' : 'bad', ok ? `推完了：${lines.length - 1} 步${total > lines.length - 1 ? `（中间改了 ${total - (lines.length - 1)} 次）` : ''}` : '先到这里，看老师怎么讲');
    session.record({ type: 'derive', final: true, title, q, detail: how || '推完了', value: lines.slice(1).join(' = '), ok, attempts: total, giveup: how === '想不出来' || undefined, ms: Date.now() - t0, el });
  }

  $('.dd-giveup').addEventListener('click', () => { session.event('giveup', el, { step: lines.length + 1, title: `第 ${lines.length + 1} 行` }); finish(false, '想不出来'); });
  $('.dd-done')?.addEventListener('click', () => { if (lines.length < 2) { show('bad', '还一行都没写'); return; } finish(true); });
}

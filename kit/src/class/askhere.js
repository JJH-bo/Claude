// 点着问的画面（ask.js 是不碰 DOM 的部分）：学生用手指点板上的一行字、一个公式、steps 的一步、表格的一行，
// 旁边出一排小钮「为什么 / 没看懂 / 举个例子 / 问点别的」。不用长按：iPad 上长按会出系统的选字菜单。
// 点到要作答、要拖的东西（输入框、按钮、图）不出；Pencil 写板书时不出；正在选字时不出。
import { mdToHtml } from '../render.js';
import { ASK_KINDS } from './ask.js';

const SKIP = 'input, textarea, select, button, a, label, svg, canvas, [contenteditable="true"], [contenteditable=""], .keypad, .cv-zoom, .class-beats, .ask-menu, .ask-note, .mk-layer, [data-scene], .q-opt, .st-choices, .w-actions, .lk-gloss, .lk-glossbox';
// 能指的东西，从小到大：公式里起了名字的项、公式、表格的一行、列表的一条、一段话、标题；steps 的一步单独认
const ANCHOR = '[data-lkmark], .katex-display, tr, li, p, h2, h3';

/**
 * board：黑板（课堂的 .class-app）。onAsk(spot, kind)：发给课堂 Claude；onWhy(spot) → 预写的「为什么」（Markdown）或 null；
 * onOther(spot)：「问点别的」（把位置写进输入框，学生接着打字）；onShown(spot)：页面当场显示了预写的那句。
 */
export function createAskHere({ board, onAsk, onWhy, onOther, onShown }) {
  let menu = null;
  let current = null; // { el, spot }

  function close() {
    menu?.remove();
    menu = null;
    current = null;
  }

  function spotOf(target) {
    const segEl = target.closest('.class-seg[data-step]');
    if (!segEl || segEl.classList.contains('is-preview') || segEl.closest('.class-pins')) return null;
    const blockEl = target.closest('.block[data-bid]');
    const stepEl = target.closest('.st-item');
    const dvRow = target.closest('tr.dv-line[data-cmd]');
    let el = target.closest(ANCHOR);
    if (el && !segEl.contains(el)) el = null;
    if (!el && stepEl) el = stepEl.querySelector('.st-head') || stepEl;
    if (!el) return null;
    const tex = (x) => x.querySelector?.('annotation[encoding="application/x-tex"]')?.textContent;
    const textOf = (x) => {
      const c = x.cloneNode(true);
      c.querySelectorAll('.katex').forEach((k) => { const t = tex(k); k.replaceWith(t ? `$${t}$` : k.textContent); });
      c.querySelectorAll('.ask-note, .mk-layer, button, .st-n, .st-input, .st-actions, .st-fb, .st-compare').forEach((b) => b.remove());
      return c.textContent.replace(/\s+/g, ' ').trim();
    };
    const steps = stepEl ? [...stepEl.parentElement.querySelectorAll(':scope > .st-item')] : [];
    const what = el.matches('[data-lkmark]') ? 'term' : el.matches('.katex-display') ? 'formula' : el.matches('tr') ? 'row' : el.matches('li') ? 'item' : el.matches('h2, h3') ? 'title' : stepEl ? '' : 'line';
    const spot = {
      seg: segEl.dataset.step,
      segTitle: segEl.querySelector('.stage-body > h2')?.textContent?.trim() || '',
      ...(blockEl && segEl.contains(blockEl) ? { block: blockEl.dataset.bid, kind: [...blockEl.classList].find((c) => c.startsWith('block-'))?.slice(6) || '' } : {}),
      ...(stepEl ? { step: steps.indexOf(stepEl) + 1, stepTitle: stepEl.querySelector('.st-title')?.textContent?.trim() || '' } : {}),
      // derive 的一行（tr.dv-line，data-cmd 是第几行）：预写的 why step= 按行对；要指着讲用 mark item=
      ...(!stepEl && dvRow ? { step: Number(dvRow.dataset.cmd), item: Number(dvRow.dataset.cmd) } : {}),
      ...(el.matches('[data-lkmark]') ? { term: el.getAttribute('data-lkmark') } : {}),
      what,
      text: what === 'formula' ? `$${tex(el) || el.textContent}$` : textOf(el).slice(0, 300),
    };
    return { el, spot };
  }

  function open(hit) {
    close();
    current = hit;
    menu = document.createElement('div');
    menu.className = 'ask-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = `${Object.entries(ASK_KINDS).map(([k, v]) => `<button type="button" role="menuitem" data-ask="${k}">${v.label}</button>`).join('')}<button type="button" role="menuitem" data-ask="other">问点别的</button>`;
    document.body.appendChild(menu);
    const r = hit.el.getBoundingClientRect();
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    const below = r.bottom + 8 + mh < window.innerHeight - 140;
    const top = (below ? r.bottom + 8 : Math.max(8, r.top - mh - 8)) + window.scrollY;
    const left = Math.max(12, Math.min(window.innerWidth - mw - 12, r.left)) + window.scrollX;
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    hit.el.classList.add('is-pointed');
    setTimeout(() => hit.el.classList.remove('is-pointed'), 1200);
  }

  function choose(kind) {
    const hit = current;
    close();
    if (!hit) return;
    if (kind === 'other') { onOther?.(hit.spot); return; }
    hit.el.classList.add('is-asked');
    if (kind === 'why') {
      const why = onWhy?.(hit.spot);
      if (why) { showNote(hit, why); onShown?.(hit.spot); return; }
    }
    onAsk?.(hit.spot, kind);
  }

  // 预写的「为什么」：写在那一行下面（一段话、一条、公式后面；表格就写在表格下面；steps 的一步写在这一步里面）
  function showNote(hit, md) {
    const host = hit.el.closest('.st-item') || hit.el.closest('table') || hit.el.closest('.katex-display, p, li, h2, h3') || hit.el;
    host.parentElement?.querySelector(':scope > .ask-note[data-for]')?.remove();
    const note = document.createElement('div');
    note.className = 'ask-note';
    note.dataset.for = '1';
    note.innerHTML = `<div class="ask-note-body">${mdToHtml(md)}</div><button type="button" class="ask-more">还是不懂，问 Claude</button>`;
    note.querySelector('.ask-more').addEventListener('click', () => { note.remove(); onAsk?.(hit.spot, 'lost'); });
    if (host.matches('.st-item')) host.appendChild(note);
    else host.after(note);
  }

  board.addEventListener('click', (e) => {
    if (menu && menu.contains(e.target)) return;
    const wasOpen = !!menu;
    close();
    if (e.pointerType === 'pen' || document.body.classList.contains('ink-on')) return;
    if (!(e.target instanceof Element) || e.target.closest(SKIP)) return;
    if (String(window.getSelection?.() || '').trim()) return; // 在选字
    const hit = spotOf(e.target);
    if (!hit || wasOpen) return;
    open(hit);
  });
  document.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('.ask-menu [data-ask]') : null;
    if (b) { e.preventDefault(); choose(b.dataset.ask); }
  });
  window.addEventListener('scroll', () => { if (menu) close(); }, { passive: true });

  return {
    close,
    // 新一轮讲完：上一轮问过的地方不再亮着
    clearAsked() { board.querySelectorAll('.is-asked').forEach((x) => x.classList.remove('is-asked')); },
  };
}

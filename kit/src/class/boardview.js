// 一屏一块板（课堂模式和实时黑板共用）：页面结构、板（section.class-page）、常驻栏、翻板、划动、
// 一屏放不放得下的测量（--board-h、「下面还有」、横屏时输入框靠在黑板那一栏）、宽屏左图右文。
// 板上写什么、存到哪、什么时候换板由各自的控制器决定；这里只管怎么摆、怎么翻。
import { mdToHtml, escapeHtml } from '../render.js';
import { FEATURES } from '../features.js';

const reduceMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// 一块板超出一屏多少才算放不下（KaTeX、图的取整会差几个像素）
const FIT_SLACK = 12;
// 分屏时底部那条「上一屏 / 下一屏」占的高度
const PAGER_H = 58;
// 在这些东西上划动不算翻页：要拖的图、要选的字、要横着滚的公式
const NO_SWIPE = 'input, textarea, select, button, a, label, [contenteditable=""], [contenteditable="true"], svg, canvas, .keypad, .ink-bar, .class-pins';

/**
 * root：课件的 <article>；unitHtml：常驻栏顶上的单元名；stageExtra：黑板区里板以外的东西（欢迎牌之类）。
 * isBusy()：Claude 正在写（翻回去看时「回到当前板」闪）；seqOf(id)：段的先后（同一块板上按它排）；
 * onShow(n)：换了正在看的板；onMeasure(fit)：量过一次一屏放不放得下。底部的条（bar.setNav、bar.height、bar.el）建好后用 attachBar 接上。
 */
// decorate(p)：每次画完一块板以后调（学习台里课堂在板顶的话下面挂改动单；实时黑板不给）
// onBeat(n, k)：板顶的话分拍播时，学生点了「‹」「下一拍 ›」（课堂的 beatGo；实时黑板不给）
export function createBoardView({ root, unitHtml = '', stageExtra = '', isBusy = () => false, seqOf = () => Infinity, onShow, onMeasure, decorate = null, onBeat = null } = {}) {
  // 常驻栏（横屏在右边一栏，竖屏在顶上一条）+ 黑板。黑板里一块板一个 section，只显示正在看的那块
  root.innerHTML = `
    <div class="class-app">
      <aside class="class-pins" hidden aria-label="常驻栏"><div class="class-pins-head"><span class="class-unit">${unitHtml}</span></div><div class="class-pins-body"></div></aside>
      <main class="class-stage" aria-label="黑板">
        <div class="class-pages"></div>
        ${stageExtra}
      </main>
    </div>`;
  const board = root.querySelector('.class-app');
  const stage = root.querySelector('.class-stage');
  const pagesBox = root.querySelector('.class-pages');
  const pinsBox = root.querySelector('.class-pins');
  const pinsBody = root.querySelector('.class-pins-body');

  const pages = new Map(); // 板号 → { n, title, talk, lead, kind, body, sec, head, titleEl, talkEl, bodyEl }
  let pageSeq = 0; // 开过几块板（板号从 1 编）
  let curPage = 0; // 当前板：最新的那块
  let viewPage = 0; // 正在看的板：翻回去看历史时和 curPage 不同
  let lastFit = null; // 当前板放不放得下一屏：{ fits, need, avail, w }
  let fitRaf = 0;
  let bar = null;

  // 当前板超出一屏、下面还有内容没露出来时，底部条上方给一个「下面还有」
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'class-more';
  more.hidden = true;
  more.textContent = '下面还有 ↓';
  more.addEventListener('click', () => window.scrollBy({ top: Math.round(window.innerHeight * 0.6), behavior: reduceMotion() ? 'auto' : 'smooth' }));
  document.body.appendChild(more);

  function ensurePage(n) {
    let p = pages.get(n);
    if (p) return p;
    const sec = document.createElement('section');
    sec.className = 'class-page';
    sec.dataset.page = String(n);
    sec.hidden = true;
    sec.setAttribute('aria-label', `第 ${n} 块板`);
    // 板书：写在板头、板顶那句话上的笔迹挂在这块板上（翻走就藏起来）；「清空」清的是整块板
    sec.dataset.inkAnchor = `p${n}`;
    sec.dataset.inkGroup = '';
    sec.innerHTML = '<header class="class-page-head" hidden><h2 class="class-page-title"></h2></header><div class="class-talk" hidden></div><div class="class-page-body"></div>';
    p = { n, title: '', talk: '', lead: '', kind: '', body: '', sec, head: sec.querySelector('.class-page-head'), titleEl: sec.querySelector('.class-page-title'), talkEl: sec.querySelector('.class-talk'), bodyEl: sec.querySelector('.class-page-body') };
    // 分拍播的「‹」「下一拍 ›」
    p.talkEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-beat]');
      if (!btn || !onBeat || !p.beats) return;
      onBeat(p.n, (p.beat ?? 0) + Number(btn.dataset.beat));
    });
    pages.set(n, p);
    // 按板号插：恢复时板号可能不是按顺序来的
    const after = [...pagesBox.children].find((c) => Number(c.dataset.page) > n);
    pagesBox.insertBefore(sec, after || null);
    pageSeq = Math.max(pageSeq, n);
    return p;
  }

  // 拿掉一块板（实时黑板里一块板上的段都撤回了）。正在看它就回到当前板
  function removePage(n) {
    const p = pages.get(n);
    if (!p) return;
    p.sec.remove();
    pages.delete(n);
    if (viewPage === n) show(curPage, { scroll: false });
    else syncNav();
  }

  // 擦掉黑板，开一块新板（成为当前板）。存不存由调用方管
  function addPage(fields = {}) {
    const p = ensurePage(pageSeq + 1);
    Object.assign(p, fields);
    curPage = p.n;
    paint(p);
    return p;
  }

  // 板的标题、板顶的话、小结正文画出来
  function paint(p) {
    p.titleEl.innerHTML = p.title ? mdToHtml(p.title, { inline: true }) : '';
    p.head.hidden = !p.title;
    // 分拍播（课堂 beats.js）：板顶一次只显示一拍的话，下面一排「‹ 2 / 4 下一拍 ›」
    const beats = Array.isArray(p.beats) && p.beats.length > 1 ? p.beats : null;
    const k = beats ? Math.max(0, Math.min(beats.length - 1, p.beat ?? 0)) : 0;
    const said = beats ? beats[k] : p.talk;
    p.talkEl.innerHTML = said ? mdToHtml(said) : '';
    p.talkEl.hidden = !p.talk;
    p.talkEl.classList.toggle('has-beats', !!beats);
    // 课堂：板顶的话是谁说的（平台核验过的模型）。挂在最后一段的末尾，不单占一行。
    // pre：Opus 5.5 上一轮预先写好的预案（react.js），学生作答以后页面当场接上，这一次没有调用
    if (p.talk && p.talkBy) {
      const last = p.talkEl.lastElementChild;
      const mock = p.talkBy === 'mock';
      const pre = p.talkBy === 'pre';
      const title = mock ? '本地测试的模拟老师，没有调用 Claude' : pre ? 'claude-opus-5-5 上一轮预先写好的回应：你作答以后页面当场接上，这一次没有再调用' : '这句话由 claude-opus-5-5 回答：模型是平台核验的；effort high 是页面要求的档位，平台不回报';
      (last?.tagName === 'P' ? last : p.talkEl).insertAdjacentHTML('beforeend', `<span class="class-by${mock ? ' is-mock' : ''}" title="${title}">${mock ? '模拟老师' : pre ? 'Opus 5.5 预写 ✓' : 'Opus 5.5 ✓'}</span>`);
    }
    if (beats) {
      const more = k < beats.length - 1;
      p.talkEl.insertAdjacentHTML('beforeend', `<div class="class-beats" role="group" aria-label="一拍一拍地讲"><button type="button" class="class-beat-prev" data-beat="-1" aria-label="上一拍"${k ? '' : ' disabled'}>‹</button><span class="class-beat-at">${k + 1} / ${beats.length}</span>${more ? '<button type="button" class="class-beat-next" data-beat="1">下一拍 ›</button>' : ''}</div>`);
    }
    p.sec.classList.toggle('is-closing', p.kind === 'closing');
    let closing = p.bodyEl.querySelector(':scope > .class-closing');
    if (p.kind === 'closing') {
      if (!closing) { closing = document.createElement('div'); closing.className = 'class-closing'; p.bodyEl.prepend(closing); }
      // foot：页面自己写的最后一行（这节课由谁讲的），不是 Claude 写的
      closing.innerHTML = mdToHtml(p.body || '') + (p.foot ? `<p class="class-foot">${escapeHtml(p.foot)}</p>` : '');
    } else closing?.remove();
    decorate?.(p);
  }

  // 只显示一块板。scroll：回到页面顶上（换了板，从板的开头看）
  function show(n, { scroll = true, animate = false } = {}) {
    const target = pages.has(n) ? n : curPage;
    const changed = target !== viewPage;
    viewPage = target;
    for (const p of pages.values()) p.sec.hidden = p.n !== viewPage;
    const shown = pages.get(viewPage);
    if (changed && animate && shown && !reduceMotion()) {
      shown.sec.classList.remove('is-enter');
      void shown.sec.offsetWidth; // 重新播一次进场
      shown.sec.classList.add('is-enter');
    }
    if (changed && scroll) window.scrollTo({ top: 0, behavior: 'auto' });
    // 板书挂在段上：翻走的板上的笔迹不画，翻出来的板上的笔迹画回来
    if (changed) window.LAKit?.ink?.redraw?.();
    syncNav();
    scheduleFit();
    if (changed) onShow?.(viewPage);
  }

  function go(n) {
    if (!pages.size) return;
    const target = Math.max(1, Math.min(pageSeq, Number(n) || curPage));
    if (target === viewPage) return;
    show(target, { animate: true });
  }

  // 往前 / 往后翻一块（划动、方向键）：按实际有的板走，板号中间缺了一块（那块没存上）也不会卡住
  // 一块板分了几屏时先在屏之间走，走到头才翻到别的板；往回翻到一块分了屏的板，落在它最后一屏
  function step(d) {
    const cur = pages.get(viewPage);
    if (cur?.screens?.length > 1) {
      const s = cur.screen + d;
      if (s >= 0 && s < cur.screens.length) { setScreen(cur, s); return; }
    }
    const ns = [...pages.keys()].sort((a, b) => a - b);
    const to = ns[ns.indexOf(viewPage) + d];
    if (to === undefined) return;
    const tp = pages.get(to);
    if (tp) tp.wantScreen = d < 0 ? 'last' : 0;
    go(to);
  }

  // —— 放不下就分屏（不叫 Claude 改：改一次要多跑一整轮）——
  // 学生不喜欢上下滚、宁愿左右翻（profile）。一块板比一屏长时，按段（一段太长就按段里的块）分成几屏，
  // 底部一条「上一屏 / 下一屏」，划动、方向键也先在屏之间走。板的标题每屏都在，板顶的话只在第一屏。
  // 内容变了（Claude 加了段、换了段、屏幕转了）才重新分；新加了段就翻到新内容那一屏
  function screenKey(p, avail) {
    const b = p.bodyEl;
    // 还在自检、没露出来的段（class-pending）露出来时也要重新分
    return `${avail}|${b.childElementCount}|${b.querySelectorAll('*').length}|${b.textContent.length}|${b.querySelectorAll('[hidden], .class-pending').length}|${p.talk?.length || 0}|${p.talkEl.hidden}`;
  }
  function fitScreens(p, avail) {
    const key = screenKey(p, avail);
    if (p.screenKey === key) return;
    const prevCount = p.screenKids ?? 0;
    p.screenKey = key;
    for (const el of p.sec.querySelectorAll('.is-off')) el.classList.remove('is-off');
    p.pagerEl?.remove();
    p.pagerEl = null;
    const top = p.sec.getBoundingClientRect().top;
    const rel = (el) => { const r = el.getBoundingClientRect(); return { top: r.top - top, bottom: r.bottom - top }; };
    const kids = [...p.bodyEl.children].filter((el) => !el.hidden && el.offsetParent !== null);
    const last = kids.at(-1);
    p.fullNeed = Math.round(last ? rel(last).bottom : rel(p.bodyEl).top);
    p.screenKids = p.bodyEl.childElementCount;
    if (!kids.length || p.fullNeed <= avail + FIT_SLACK) { p.screens = null; p.screen = 0; p.wantScreen = null; return; }
    // 第一屏从板顶算起；后面几屏的内容接在标题下面（板顶的话不再出现）
    const restStart = p.talkEl.hidden ? rel(p.bodyEl).top : rel(p.talkEl).top;
    const cap0 = avail - PAGER_H;
    const capN = avail - PAGER_H - restStart;
    // 一块一块排：一段比一屏还高就拆成段里的几块（段的标题、组件、段落）
    // （段的结构是 section.class-seg > .stage-body > 段里的块：只有一个孩子的那层穿过去）
    const pieces = [];
    const visible = (c) => !c.hidden && c.offsetParent !== null;
    const split = (el, wraps, depth) => {
      const r = rel(el);
      let inner = [...el.children].filter(visible);
      let host = el;
      const chain = [...wraps];
      while (inner.length === 1 && inner[0].children.length && depth < 4) { chain.push(host); host = inner[0]; inner = [...host.children].filter(visible); depth++; }
      // 段一律拆成段里的块（一段跨在两屏中间时能从块之间分开）；块再比一屏高才往里拆
      if ((wraps.length === 0 || r.bottom - r.top > capN) && inner.length > 1 && depth < 4) { chain.push(host); for (const c of inner) split(c, chain, depth + 1); }
      else pieces.push({ el, wraps, ...r });
    };
    for (const el of kids) split(el, [], 0);
    const screens = [[]];
    let start = 0; // 这一屏从哪儿开始（第一屏是板顶）
    for (const pc of pieces) {
      const cur = screens.at(-1);
      const cap = screens.length === 1 ? cap0 : capN;
      if (cur.length && pc.bottom - start > cap) { screens.push([pc]); start = pc.top; }
      else cur.push(pc);
    }
    if (screens.length < 2) { p.screens = null; p.screen = 0; return; }
    p.screens = screens;
    const pager = document.createElement('nav');
    pager.className = 'class-screens';
    pager.setAttribute('aria-label', '这块板分了几屏');
    pager.innerHTML = '<button type="button" class="btn class-scr-prev">‹ 上一屏</button><span class="class-scr-n"></span><button type="button" class="btn class-scr-next">下一屏 ›</button>';
    pager.querySelector('.class-scr-prev').addEventListener('click', () => setScreen(p, p.screen - 1));
    pager.querySelector('.class-scr-next').addEventListener('click', () => setScreen(p, p.screen + 1));
    p.sec.appendChild(pager);
    p.pagerEl = pager;
    // 停在哪一屏：翻回来的落在最后一屏；新加了段落在新内容那一屏；不然尽量留在原来那屏
    let at = Math.min(p.screen || 0, screens.length - 1);
    if (p.wantScreen === 'last') at = screens.length - 1;
    else if (p.wantScreen === 0) at = 0;
    else if (prevCount && p.screenKids > prevCount) at = screens.length - 1;
    p.wantScreen = null;
    setScreen(p, at, { quiet: true });
  }
  function setScreen(p, s, { quiet = false } = {}) {
    if (!p.screens) return;
    const n = Math.max(0, Math.min(p.screens.length - 1, s));
    p.screen = n;
    const on = new Set(p.screens[n].map((x) => x.el));
    const wraps = new Set();
    const used = new Set(); // 这一屏有块的外层（拆开的段）
    p.screens.forEach((sc) => sc.forEach((x) => {
      x.el.classList.toggle('is-off', !on.has(x.el));
      for (const w of x.wraps) { wraps.add(w); if (on.has(x.el)) used.add(w); }
    }));
    // 拆开的段：这一屏一块都没有就整段藏起来（不留一个空框）
    for (const w of wraps) w.classList.toggle('is-off', !used.has(w));
    p.talkEl.classList.toggle('is-off', n > 0);
    if (p.pagerEl) {
      p.pagerEl.querySelector('.class-scr-n').textContent = `第 ${n + 1} / ${p.screens.length} 屏`;
      p.pagerEl.querySelector('.class-scr-prev').disabled = n === 0;
      p.pagerEl.querySelector('.class-scr-next').disabled = n === p.screens.length - 1;
    }
    if (!quiet) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      if (!reduceMotion()) { p.sec.classList.remove('is-enter'); void p.sec.offsetWidth; p.sec.classList.add('is-enter'); }
    }
    window.LAKit?.ink?.redraw?.();
    syncMoreHint();
  }

  function syncNav() {
    bar?.setNav({
      view: viewPage, cur: curPage,
      items: [...pages.values()].sort((a, b) => a.n - b.n).map((p) => ({ n: p.n, title: p.title || (p.kind === 'closing' ? '这节课的小结' : '') })),
      busy: isBusy(),
    });
  }

  // 常驻栏里有看得见的卡才露出来；横屏时它占右边一栏
  function syncPins() {
    const pinned = [...pinsBody.children].some((c) => !c.hidden);
    pinsBox.hidden = !pinned;
    board.classList.toggle('has-pins', pinned);
    return pinned;
  }

  // —— 一屏放不放得下：黑板可用的高度给 CSS（--board-h），当前板的内容高度报给讲课的 Claude ——
  function scheduleFit() {
    if (fitRaf) return;
    fitRaf = requestAnimationFrame(() => { fitRaf = 0; measureFit(); });
  }
  function measureFit() {
    const sr = stage.getBoundingClientRect();
    // 横屏时常驻栏在右边一栏：底部的条只放在黑板那一栏下面（CSS 用 --cb-l / --cb-r 当左右边距）
    const docked = !pinsBox.hidden && pinsBox.getBoundingClientRect().left >= sr.right - 1;
    document.body.classList.toggle('class-docked', docked);
    if (docked) {
      document.body.style.setProperty('--cb-l', `${Math.round(sr.left)}px`);
      document.body.style.setProperty('--cb-r', `${Math.max(0, Math.round(document.documentElement.clientWidth - sr.right))}px`);
    }
    // 竖屏常驻栏是一条：放不下的卡底下渐隐，点开看全部
    for (const card of pinsBody.children) card.classList.toggle('is-clipped', !card.classList.contains('is-open') && card.scrollHeight > card.clientHeight + 2);
    const top = sr.top + window.scrollY;
    const avail = Math.max(240, Math.round(window.innerHeight - (bar?.height || 0) - top - 10));
    board.style.setProperty('--board-h', `${avail}px`);
    const shown = pages.get(viewPage);
    if (FEATURES.screens && shown && !shown.sec.hidden && shown.kind !== 'closing') fitScreens(shown, avail);
    const p = pages.get(curPage);
    if (p && !p.sec.hidden) {
      const r = p.sec.getBoundingClientRect();
      const last = [...p.sec.querySelectorAll(':scope > *, :scope > .class-page-body > *')].filter((el) => !el.hidden && el.offsetParent !== null && !el.classList.contains('is-off')).at(-1);
      const seen = Math.round(last ? last.getBoundingClientRect().bottom - r.top : 0);
      // 分了屏：报给讲课的 Claude 的是整块板的高度和分了几屏（页面已经处理了，不用它改）
      const need = p.screens ? p.fullNeed : seen;
      lastFit = { fits: need <= avail + FIT_SLACK, need, avail, w: Math.round(r.width), ...(p.screens ? { screens: p.screens.length, screenFits: seen <= avail + FIT_SLACK } : {}) };
      p.sec.classList.toggle('is-overflow', p.screens ? !lastFit.screenFits : !lastFit.fits);
    }
    syncMoreHint();
    onMeasure?.(lastFit);
    return lastFit;
  }
  function syncMoreHint() {
    const p = pages.get(viewPage);
    if (!p || p.sec.hidden) { if (!more.hidden) { more.hidden = true; bar?.syncCtrl?.(); } return; }
    const bottom = p.sec.getBoundingClientRect().bottom;
    const hide = !(bottom > window.innerHeight - (bar?.height || 0) + 24);
    if (more.hidden !== hide) { more.hidden = hide; bar?.syncCtrl?.(); }
  }
  window.addEventListener('resize', scheduleFit, { passive: true });
  window.addEventListener('orientationchange', scheduleFit, { passive: true });
  window.addEventListener('scroll', syncMoreHint, { passive: true });
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleFit) : null;
  ro?.observe(pagesBox);
  ro?.observe(pinsBox);
  // 段自检完露出来（class-pending 只改 visibility，尺寸不变，ResizeObserver 不响）、组件揭开一步：也要再量一次、重新分屏
  const mo = typeof MutationObserver === 'function' ? new MutationObserver(scheduleFit) : null;
  mo?.observe(pagesBox, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden'] });

  // —— 左右划动翻板（只认手指；在图、输入框、按钮上划不算；屏幕边缘留给系统的返回手势）——
  let swipe = null;
  const scrollsSideways = (el) => {
    for (let n = el; n && n !== stage; n = n.parentElement) if (n.scrollWidth > n.clientWidth + 2 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) return true;
    return false;
  };
  stage.addEventListener('touchstart', (e) => {
    swipe = null;
    if (e.touches.length !== 1 || pages.size < 2) return;
    if (document.body.classList.contains('ink-on') || document.body.classList.contains('has-keypad')) return;
    const t = e.touches[0];
    const target = e.target instanceof Element ? e.target : null;
    if (!target || target.closest(NO_SWIPE) || scrollsSideways(target)) return;
    if (t.clientX < 28 || t.clientX > window.innerWidth - 28) return;
    swipe = { x: t.clientX, y: t.clientY, t: performance.now(), sy: window.scrollY };
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (!swipe) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipe.x, dy = t.clientY - swipe.y, dt = performance.now() - swipe.t;
    const scrolled = Math.abs(window.scrollY - swipe.sy) > 12;
    swipe = null;
    if (scrolled || dt > 700 || Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.5) return;
    step(dx < 0 ? 1 : -1);
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { swipe = null; }, { passive: true });
  // 外接键盘：← → 翻板（在输入框里打字时不算）
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const t = e.target;
    if (t instanceof Element && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], .keypad, .cb-menu, .cb-pages')) return;
    step(e.key === 'ArrowRight' ? 1 : -1);
  });

  // 竖屏时常驻栏是横着的一条，长的卡片先收着：点一下展开 / 收起
  pinsBody.addEventListener('click', (e) => {
    const card = e.target.closest('.class-pin');
    if (!card || e.target.closest('button, a, input, textarea, svg, .keypad')) return;
    if (!card.classList.contains('is-clipped') && !card.classList.contains('is-open')) return;
    card.classList.toggle('is-open');
    scheduleFit();
  });

  // 一段里正好有一张图（scene / graph / space，不是绑定了 steps 的那种）和别的内容：宽屏时排成左图右文。
  // 只记下图要占几行，排版交给 CSS 的容器查询（窄屏照原来的顺序上下排）
  // 图占左栏、跨过右栏所有的行，最后一行是 1fr：图比右栏高时多出来的高度都给最后一行，右栏的内容之间不被拉开
  function splitFigure(body) {
    const kids = [...body.children];
    const figs = kids.filter((el) => el.matches('.block-scene, .block-graph, .block-space') && !el.dataset.link);
    if (figs.length !== 1 || body.querySelector(':scope > .steps-pair')) return;
    const heads = kids.filter((el) => el.tagName === 'H2');
    if (heads.length > 1 || (heads.length && kids[0] !== heads[0])) return; // 小标题不在开头：照原样排
    const text = kids.filter((el) => el !== figs[0] && el.tagName !== 'H2');
    if (!text.length) return;
    const head = heads.length ? 1 : 0;
    body.classList.add('seg-split');
    figs[0].classList.add('split-fig');
    body.style.setProperty('--split-rows', `${head ? 'auto ' : ''}repeat(${text.length}, auto) 1fr`);
    figs[0].style.setProperty('--fig-row', `${1 + head} / span ${text.length + 1}`);
  }

  // 把一段放进它那块板（同一块板上按先后排）或常驻栏；替换时放在原位置。
  // seg：{ id, sec, page, place: 'board' | 'pin' }
  function place(seg, sec) {
    if (seg.sec?.isConnected && seg.sec !== sec) { seg.sec.after(sec); return; }
    const host = seg.place === 'pin' ? pinsBody : ensurePage(seg.page || curPage || 1).bodyEl;
    const mine = seg.seq ?? seqOf(seg.id);
    const after = [...host.children].find((c) => c !== sec && (seqOf(c.dataset.step) ?? Infinity) > mine);
    host.insertBefore(sec, after || null);
  }

  return {
    board, stage, pagesBox, pinsBox, pinsBody, pages, more,
    get cur() { return curPage; },
    set cur(n) { curPage = n; },
    get view() { return viewPage; },
    get seq() { return pageSeq; },
    get fit() { return lastFit; },
    attachBar(b) {
      bar = b;
      if (bar?.el) ro?.observe(bar.el);
      // 底部的条给了位置：「下面还有」挂进去，跟翻板条排在一起
      if (bar?.moreSlot) { bar.moreSlot.appendChild(more); more.classList.add('in-bar'); }
      syncNav();
      scheduleFit();
    },
    ensurePage, addPage, removePage, paint, show, go, step, syncNav, syncPins, scheduleFit, measureFit, splitFigure, place, setScreen,
  };
}

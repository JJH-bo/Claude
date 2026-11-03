// 页面里自己画的确认框。claude.ai 把 artifact 放在不许弹框的沙箱里（没有 allow-modals）：
// window.confirm / alert / prompt 不弹出来、直接当「取消」，按钮点了就像没反应（2026-11-03 学习台「直接下课」就是这样坏的）。
// 所以要问一句的地方一律用这里的 ask / choose，不用浏览器自带的。

let open = null;

/**
 * 问一句。text：要问的话（可以换行）；opts：{ ok（确定按钮的字）, cancel, danger（确定按钮标红） }。
 * 返回 Promise<boolean>：点了确定是 true，取消、点外面、按 Esc 是 false
 */
export function ask(text, { ok = '确定', cancel = '取消', danger = false } = {}) {
  return choose(text, [{ label: cancel, value: false }, { label: ok, value: true, primary: !danger, danger }]).then((v) => v === true);
}

/**
 * 几个选项里挑一个。options：[{ label, value, primary?, danger? }]，最后一个放在最右边。
 * 返回 Promise<value>；取消（点外面、Esc）返回 null
 */
export function choose(text, options) {
  if (open) open(null);
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'la-dialog-back';
    back.innerHTML = `<div class="la-dialog" role="alertdialog" aria-modal="true"><p class="la-dialog-text"></p><div class="la-dialog-acts"></div></div>`;
    back.querySelector('.la-dialog-text').textContent = String(text ?? '');
    const acts = back.querySelector('.la-dialog-acts');
    for (const o of options) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `btn${o.primary ? ' btn-primary' : ''}${o.danger ? ' btn-danger' : ''}`;
      b.textContent = o.label;
      b.addEventListener('click', () => done(o.value));
      acts.appendChild(b);
    }
    const onKey = (e) => { if (e.key === 'Escape') done(null); };
    function done(v) {
      if (open !== done) return;
      open = null;
      document.removeEventListener('keydown', onKey);
      back.remove();
      resolve(v);
    }
    back.addEventListener('click', (e) => { if (e.target === back) done(null); });
    document.addEventListener('keydown', onKey);
    open = done;
    document.body.appendChild(back);
    acts.lastElementChild?.focus();
  });
}

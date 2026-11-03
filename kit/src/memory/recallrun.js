// 首页「要记的」（docs/review-plan.md）：到期的记忆点一条一条想一遍。排期、结果在 recall.js（纯函数），这里是画面。
// 先自己写出来（Apple Pencil 在框里直接写，iPad 的随手写会转成字），再看答案，自己点「想起来了 / 模糊 / 没想起」——
// 不让页面替我判：要背的东西说法不一，意思对就算；写过的留在证据里，以后能对着看当时写的什么。不调用 Claude。
import { mdToHtml, escapeHtml } from '../render.js';
import { toast } from '../record.js';
import { assertWrite, applyChange, toDate } from './schema.js';
import { RATINGS, rateRecall, recallEvidence, sameText } from './recall.js';

const inline = (s) => { try { return mdToHtml(String(s ?? ''), { inline: true }); } catch { return escapeHtml(String(s ?? '')); } };

/**
 * host：画在哪（首页那张卡的身体）；items：这次要想的记忆点（recall.js 的 recallToday）；db：学习台的数据库；
 * titleOf(block)：块的标题；onDone()：想完了 / 先到这（回到卡片的样子）
 */
export function runRecall(host, { items = [], db, titleOf = () => '', onDone = () => {} } = {}) {
  const list = items.slice();
  const tally = { got: 0, vague: 0, miss: 0 };
  let at = 0;
  let busy = false;

  function show() {
    if (at >= list.length) return done();
    const k = list[at];
    host.innerHTML = `
      <div class="rc-run">
        <div class="rc-top"><span class="muted">第 ${at + 1} / ${list.length} 条</span><button type="button" class="btn btn-sm rc-stop">先到这</button></div>
        <div class="rc-q">${inline(k.q)}</div>
        <textarea class="rc-typed" rows="3" placeholder="先自己写出来（Apple Pencil 可以直接在框里写）"></textarea>
        <div class="rc-acts"><button type="button" class="btn btn-primary rc-show">看答案</button></div>
        <div class="rc-back" hidden></div>
      </div>`;
    host.querySelector('.rc-stop').addEventListener('click', done);
    host.querySelector('.rc-show').addEventListener('click', reveal);
    window.scrollTo({ top: Math.max(0, host.getBoundingClientRect().top + window.scrollY - 80), behavior: 'smooth' });
  }

  function reveal() {
    const k = list[at];
    const typed = host.querySelector('.rc-typed').value;
    host.querySelector('.rc-acts').hidden = true;
    host.querySelector('.rc-typed').readOnly = true;
    const back = host.querySelector('.rc-back');
    back.hidden = false;
    const t = k.block ? titleOf(k.block) : '';
    back.innerHTML = `
      <div class="rc-a"><span class="dk-k">答案</span>${inline(k.a)}</div>
      <p class="rc-where muted">${t ? `${inline(t)} · ` : ''}${k.last ? `上次${{ got: '想起来了', vague: '模糊', miss: '没想起' }[k.result] || '想过'}` : '第一次想'}${Number(k.lapses) ? `，没想起过 ${Number(k.lapses)} 次` : ''}${sameText(typed, k.a) ? '　<b class="rc-same">写得和答案一样</b>' : ''}</p>
      <div class="rc-rate">${Object.entries(RATINGS).map(([v, r]) => `<button type="button" class="btn rc-r is-${v}" data-r="${v}"><b>${r.label}</b><span class="muted">${r.hint}</span></button>`).join('')}</div>`;
    back.querySelectorAll('.rc-r').forEach((b) => b.addEventListener('click', () => rate(b.dataset.r, typed)));
  }

  async function rate(rating, typed) {
    if (busy) return;
    busy = true;
    host.querySelectorAll('.rc-r').forEach((b) => { b.disabled = true; });
    const k = list[at];
    const today = toDate(Date.now());
    try {
      const { patch, note } = rateRecall(k, rating, { today });
      const ev = recallEvidence(k, { typed, rating });
      const { id: evId, ...evDoc } = ev;
      assertWrite('page', 'evidence');
      assertWrite('page', 'recall');
      await db.doc(`evidence/${evId}`).set(evDoc);
      // 读最新的再改（课堂里可能刚改过问法）
      const cur = await db.doc(`recall/${k.id}`).get().then((s) => (s.exists ? s.data() : null)).catch(() => null);
      const { id: _, ...base } = cur ? { id: k.id, ...cur } : k;
      await db.doc(`recall/${k.id}`).set(applyChange(base, patch, { date: today, by: 'page', basis: [evId], note: `我自己想了一遍：${note}` }));
      tally[rating]++;
      at++;
      show();
    } catch (err) {
      toast(`没记上：${err?.message || err}`);
      host.querySelectorAll('.rc-r').forEach((b) => { b.disabled = false; });
    } finally { busy = false; }
  }

  function done() {
    const n = tally.got + tally.vague + tally.miss;
    if (!n) { onDone(); return; }
    host.innerHTML = `
      <div class="rc-run">
        <p class="rc-sum">想了 ${n} 条：想起来了 ${tally.got}、模糊 ${tally.vague}、没想起 ${tally.miss}。</p>
        <p class="muted">${tally.miss ? '没想起的明天再来；' : ''}想起来的隔得更久再问，隔 30 天还想得起来就算记牢了。</p>
        <div class="rc-acts"><button type="button" class="btn btn-primary rc-ok">好</button></div>
      </div>`;
    host.querySelector('.rc-ok').addEventListener('click', onDone);
  }

  show();
}

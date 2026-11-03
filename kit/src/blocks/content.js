// 纯内容类组件：定义/定理/重点/易错 提示框，可折叠的提示/解答，翻转卡片
import { parseFields } from '../parse.js';
import { session } from '../session.js';
import { mdToHtml } from './common.js';

const CALLOUTS = {
  definition: '定义 Definition',
  theorem: '定理 Theorem',
  key: '重点 Key Idea',
  warning: '易错 Watch Out',
  example: '例题 Example',
  intuition: '直觉 Intuition',
  // 要背的一整块（清单、例外、固定搭配）：一个粉色的大框圈住，不用一项一项去圈（2026-11-03 我说的）
  remember: '要背 Memorize',
};

// 开头几行可以写 `title: ...`（自定义标题）和 `id: ...`（组件 id，课堂和实时黑板里用），顺序不限，都不显示成正文
function splitTitle(src) {
  let title = null, rest = src;
  for (;;) {
    const m = rest.match(/^\s*(title|id)\s*[:：]\s*(.*)\n?/i);
    if (!m) break;
    if (m[1].toLowerCase() === 'title') title = m[2].trim();
    rest = rest.slice(m[0].length);
  }
  return [title, rest];
}

export const callouts = Object.fromEntries(Object.entries(CALLOUTS).map(([name, label]) => [name, (el, src) => {
  const [title, rest] = splitTitle(src);
  // 标签拆成中文和英文两截（「重点」「Key Idea」）：风格可以分开排（水墨里中文是毛笔字，英文是小号字母）
  const [zh, ...en] = label.split(' ');
  el.innerHTML = `<aside class="callout callout-${name}"><div class="callout-title"><span class="co-zh">${zh}</span>${en.length ? `<span class="co-en">${en.join(' ')}</span>` : ''}${title ? `<span class="callout-sub">${mdToHtml(title, { inline: true })}</span>` : ''}</div><div class="callout-body">${mdToHtml(rest)}</div></aside>`;
}]));

const FOLDS = { hint: '提示 Hint', solution: '解答 Solution', proof: '证明 Proof' };
export const folds = Object.fromEntries(Object.entries(FOLDS).map(([name, label]) => [name, (el, src) => {
  const [title, rest] = splitTitle(src);
  el.innerHTML = `<details class="fold fold-${name}"><summary><span>${title ? mdToHtml(title, { inline: true }) : label}</span><span class="fold-tap">点击展开</span></summary><div class="fold-body">${mdToHtml(rest)}</div></details>`;
}]));

export function card(el, src) {
  const { fields } = parseFields(src);
  if (!fields.front || !fields.back) throw new Error('需要 front: 和 back:');
  el.innerHTML = `<button type="button" class="flashcard" aria-label="翻转卡片">
      <div class="fc-inner">
        <div class="fc-face fc-front"><div class="fc-tag">记忆卡 · 正面</div>${mdToHtml(fields.front)}<div class="fc-tap">点一下翻面</div></div>
        <div class="fc-face fc-back"><div class="fc-tag">背面</div>${mdToHtml(fields.back)}</div>
      </div>
    </button>`;
  const btn = el.querySelector('.flashcard');
  btn.addEventListener('click', () => btn.classList.toggle('flipped'));
}

// context：不显示，只作为页面里 Claude 的背景资料（资料原文、学生情况等）
export function context(el, src) {
  session.context += (session.context ? '\n\n' : '') + src.trim();
  el.remove();
}

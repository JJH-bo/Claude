// 页面风格：默认石墨（styles.css 的 :root），别的在 themes.css。课件 front matter 写 theme: 选，中英文名都认
export const THEMES = { chalk: 'chalk', 墨绿黑板: 'chalk', 黑板: 'chalk', paper: 'paper', 纸本: 'paper', midnight: 'midnight', 深蓝: 'midnight', white: 'white', 白板: 'white', celadon: 'celadon', 青瓷: 'celadon', 护眼: 'celadon', candle: 'candle', 烛光: 'candle', dusk: 'dusk', 暮色: 'dusk', ink: 'ink', 水墨: 'ink', inknight: 'inknight', 墨夜: 'inknight', xuan: 'xuan', 玄: 'xuan', 粉笔: 'chalk', graphite: '', 石墨: '', 夜读: '' };

/** front matter 里 theme 的值 → <html data-theme> 的值（'' 是默认石墨；不认识的返回 null） */
export function themeOf(value) {
  const v = String(value ?? '').trim().toLowerCase();
  if (!v) return '';
  return Object.prototype.hasOwnProperty.call(THEMES, v) ? THEMES[v] : null;
}

// 这台设备上选的风格（学习台「管理」里选；课件自己写了 theme: 的照课件）。存 localStorage，无痕模式读不到就是默认石墨
const KEY = 'la-theme';
// 学习台里推荐的三种（2026-11-03 我要三种最舒服、最适合学习的）：夜读（石墨）、纸本、青瓷；别的照旧能用
// sw：选的时候那块小样的颜色（页面底、卡片、字、重点色）
// dark：深色的一种（「跟着 iPad 白天晚上」时，白天从浅色里挑、晚上从深色里挑）
export const PICKS = [
  { id: 'ink', name: '水墨', note: '宣纸和墨，最安静', sw: ['#f1ede5', '#faf8f3', '#1e1e1e', '#a67422'] },
  { id: 'paper', name: '纸本', note: '暖白笔记纸，像在本子上写', sw: ['#f4efe4', '#fffdf8', '#28251f', '#b06c0a'] },
  { id: 'celadon', name: '青瓷', note: '浅青灰，白天看久了不刺眼', sw: ['#e5ece7', '#f8fbf9', '#1a2a28', '#b26812'] },
  { id: 'chalk', name: '黑板', note: '墨绿黑板，粉笔字，擦过的痕迹', sw: ['#233a31', '#2b463b', '#eef0e6', '#f2dc85'], dark: true },
  { id: 'inknight', name: '墨夜', note: '水墨的夜里：黑漆描金，远山和月亮', sw: ['#131210', '#1f1e1b', '#eee8dc', '#d2ac6c'], dark: true },
  { id: 'xuan', name: '玄', note: 'iOS 的深色模式，纯黑、干净', sw: ['#000000', '#1c1c1e', '#ffffff', '#0a84ff'], dark: true },
];
// 以前的几种，收在「更多」里
export const MORE = [
  { id: 'graphite', name: '夜读', sw: ['#171c22', '#232a32', '#eeebe2', '#f0be5c'], dark: true },
  { id: 'candle', name: '烛光', sw: ['#1c1612', '#2a211b', '#f2e6d4', '#eeb25a'], dark: true },
  { id: 'dusk', name: '暮色', sw: ['#221e3a', '#2f2a50', '#eeeaf8', '#ffbe8c'], dark: true },
  { id: 'midnight', name: '深蓝', sw: ['#101c2f', '#18283f', '#e4ecf8', '#ffd26e'], dark: true },
  { id: 'white', name: '白板', sw: ['#f3f5f8', '#ffffff', '#1f242e', '#cd7000'] },
];
export const DAY_DEFAULT = 'ink';
export const NIGHT_DEFAULT = 'inknight';

// 2026-11-03 我定下白天水墨、晚上墨夜：以前试样子时留下的那几种（没选过、水墨、黑板、墨夜、玄）换成「跟着 iPad」这一对，只换一次
const PAIR_FLAG = `${KEY}-pair-1103`;
function migratePair() {
  try {
    if (localStorage.getItem(PAIR_FLAG)) return;
    localStorage.setItem(PAIR_FLAG, '1');
    const raw = localStorage.getItem(KEY);
    if (raw === null || ['ink', 'chalk', 'inknight', 'xuan', 'auto'].includes(raw)) {
      localStorage.setItem(KEY, 'auto'); localStorage.setItem(`${KEY}-day`, 'ink'); localStorage.setItem(`${KEY}-night`, 'inknight');
    }
  } catch { /* 无痕模式 */ }
}
export function storedTheme(fallback = '') {
  if (fallback === DESK_DEFAULT) migratePair();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return fallback;
    if (raw === 'auto') return 'auto';
    const t = themeOf(raw);
    return t === null ? fallback : t;
  } catch { return fallback; }
}

// 「跟着 iPad 白天晚上」：系统是浅色用白天那种，深色用晚上那种（la-theme-day / la-theme-night，没选过就是水墨 / 黑板）
const get = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* 无痕模式 */ } };
export const dayNight = () => ({ day: get(`${KEY}-day`, DAY_DEFAULT), night: get(`${KEY}-night`, NIGHT_DEFAULT) });
export function setDayNight(which, id) { set(`${KEY}-${which}`, id); }
const darkMq = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null);
let autoWired = false;
/** 现在该用哪一种（auto 时按系统深浅色） */
export function resolveTheme(t) {
  if (t !== 'auto') return t;
  const { day, night } = dayNight();
  return darkMq()?.matches ? night : day;
}
export const isAuto = () => get(KEY, '') === 'auto';
// 学习台没选过样子：跟着 iPad，白天水墨、晚上墨夜（2026-11-03 我定的一对）
export const DESK_DEFAULT = 'auto';
/** 换风格：写在 <html data-theme>（'' 是默认石墨），save 时记在这台设备上 */
export function applyTheme(t, { save = false } = {}) {
  if (t === 'auto') {
    if (save) set(KEY, 'auto');
    // 系统深浅色一变就跟着换（iPad 设了自动深色时，傍晚自己切过去）
    if (!autoWired && darkMq()) { autoWired = true; darkMq().addEventListener?.('change', () => { if (isAuto()) applyTheme('auto'); }); }
    return applyTheme(resolveTheme('auto'));
  }
  const v = themeOf(t) ?? '';
  const el = document.documentElement;
  if (v) el.dataset.theme = v; else delete el.dataset.theme;
  if (save) { try { localStorage.setItem(KEY, v || 'graphite'); } catch { /* 无痕模式 */ } }
  return v;
}

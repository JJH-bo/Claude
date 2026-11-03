// 页面风格：默认石墨（styles.css 的 :root），别的在 themes.css。课件 front matter 写 theme: 选，中英文名都认
export const THEMES = { chalk: 'chalk', 墨绿黑板: 'chalk', 黑板: 'chalk', paper: 'paper', 纸本: 'paper', midnight: 'midnight', 深蓝: 'midnight', white: 'white', 白板: 'white', celadon: 'celadon', 青瓷: 'celadon', 护眼: 'celadon', candle: 'candle', 烛光: 'candle', dusk: 'dusk', 暮色: 'dusk', ink: 'ink', 水墨: 'ink', graphite: '', 石墨: '', 夜读: '' };

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
export const PICKS = [
  { id: 'ink', name: '水墨', note: '宣纸和墨，最安静（学习台默认）', sw: ['#f1ede5', '#faf8f3', '#1e1e1e', '#b24828'] },
  { id: 'paper', name: '纸本', note: '暖白笔记纸，像在本子上写', sw: ['#f4efe4', '#fffdf8', '#28251f', '#b06c0a'] },
  { id: 'celadon', name: '青瓷', note: '浅青灰，白天看久了不刺眼', sw: ['#e5ece7', '#f8fbf9', '#1a2a28', '#b26812'] },
  { id: 'graphite', name: '夜读', note: '深色石板，晚上、灯光暗的时候', sw: ['#171c22', '#232a32', '#eeebe2', '#f0be5c'] },
  { id: 'candle', name: '烛光', note: '暖的深色，蓝光最少', sw: ['#1c1612', '#2a211b', '#f2e6d4', '#eeb25a'] },
  { id: 'dusk', name: '暮色', note: '紫靛色的傍晚，柔和', sw: ['#221e3a', '#2f2a50', '#eeeaf8', '#ffbe8c'] },
];
// 以前就有的另外三种，收在「更多」里
export const MORE = [
  { id: 'chalk', name: '墨绿黑板', sw: ['#233a31', '#2b463b', '#eef0e6', '#f2dc85'] },
  { id: 'midnight', name: '深蓝', sw: ['#101c2f', '#18283f', '#e4ecf8', '#ffd26e'] },
  { id: 'white', name: '白板', sw: ['#f3f5f8', '#ffffff', '#1f242e', '#cd7000'] },
];
/** 这台设备选过的；没选过（或者读不到）用 fallback——学习台默认水墨（2026-11-03 我选的），别的页默认石墨 */
export function storedTheme(fallback = '') {
  try { const raw = localStorage.getItem(KEY); if (raw === null) return fallback; const t = themeOf(raw); return t === null ? fallback : t; } catch { return fallback; }
}
export const DESK_DEFAULT = 'ink';
/** 换风格：写在 <html data-theme>（'' 是默认石墨），save 时记在这台设备上 */
export function applyTheme(t, { save = false } = {}) {
  const v = themeOf(t) ?? '';
  const el = document.documentElement;
  if (v) el.dataset.theme = v; else delete el.dataset.theme;
  if (save) { try { localStorage.setItem(KEY, v || 'graphite'); } catch { /* 无痕模式 */ } }
  return v;
}

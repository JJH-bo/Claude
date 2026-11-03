// 黑板字号（课堂「⋯」菜单里的 A− / A+）：我自己调，这台设备记着。一块板的内容多、想一屏多看一点就调小，看不清就调大
// （2026-11-03：板稍长上下滑就行，字号也该能调，不用为了塞进一屏把一个点拆成好几块板）。
// 用 CSS zoom 整块缩放（组件里的字多是写死的 px，只改 font-size 缩不动）；板书标注按宿主的实际大小换算（marks.js 的 k），跟着对得上。
export const ZOOMS = [0.8, 0.9, 1, 1.1, 1.2, 1.35];
const KEY = 'la-board-zoom';

export function getZoom() {
  try { const v = Number(localStorage.getItem(KEY)); return ZOOMS.includes(v) ? v : 1; } catch { return 1; }
}

/** 套到页面上（课堂开始时调一次） */
export function applyZoom(z = getZoom()) {
  document.documentElement.style.setProperty('--board-zoom', String(z));
}

/** 调大（+1）、调小（-1）一档，返回新的倍数 */
export function stepZoom(dir) {
  const cur = ZOOMS.indexOf(getZoom());
  const z = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, (cur < 0 ? 2 : cur) + dir))];
  try { localStorage.setItem(KEY, String(z)); } catch { /* 存不了就只管这一次 */ }
  applyZoom(z);
  // 板的高度、放不放得下、标注的位置都按尺寸算：让它们重新量一遍
  window.dispatchEvent(new Event('resize'));
  return z;
}

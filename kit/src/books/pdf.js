// 在页面里读 PDF（教材入库）：pdf.js 发布在学习台的 pdf/ 下（kit/build.js 拷过去），导入 PDF 时才取。
// 扫描版（没有文字层）的书：一页渲染成一张图，交给 Claude 看图转写；有文字层的也取出来，转写时给它对照（中文、数字更准）。
// 渲染在 pdf.js 自己的 worker 里；artifact 的环境不让开 worker 时，pdf.js 自动退回在主线程里做（慢一点，照样能用）。

import { contentBox, scaleBox, toGray, imageTokens } from './crop.js';

let lib = null;
const base = () => new URL('pdf/', document.baseURI).href;

export async function loadPdfLib() {
  if (lib) return lib;
  try {
    lib = await import(/* @vite-ignore */ `${base()}pdf.min.mjs`);
  } catch (e) {
    throw new Error(`读 PDF 的程序没取到（${e?.message || e}）：学习台发布时要带上 pdf/ 这个文件夹`);
  }
  lib.GlobalWorkerOptions.workerSrc = `${base()}pdf.worker.min.mjs`;
  return lib;
}

// pdf.js 要的 cmap（没嵌字体的中文 PDF 才用到）和解码器 wasm 由它来取：cmap 发布成一个 pdf/cmaps.json（学习台不收二进制的
// .bcmap），第一次要用时才下载
let cmapPack = null;
class DeskData {
  constructor({ cMapUrl, wasmUrl }) {
    this.cMapUrl = cMapUrl;
    this.wasmUrl = wasmUrl;
  }
  async fetch({ kind, filename }) {
    if (kind === 'cMapUrl') {
      cmapPack ||= fetch(`${base()}cmaps.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`cmaps.json ${r.status}`))));
      const b64 = (await cmapPack.catch((e) => { cmapPack = null; throw e; }))[filename];
      if (!b64) throw new Error(`没有 cmap ${filename}`);
      return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    }
    if (kind !== 'wasmUrl') throw new Error(`pdf.js 要的 ${kind} 没带`);
    const r = await fetch(`${this.wasmUrl}${filename}`);
    if (!r.ok) throw new Error(`${filename} ${r.status}`);
    return new Uint8Array(await r.arrayBuffer());
  }
}

/** 打开一个 PDF（bytes：ArrayBuffer / Uint8Array）。返回 pdf.js 的文档对象（numPages、getPage） */
export async function openPdf(bytes) {
  const L = await loadPdfLib();
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return L.getDocument({ data, wasmUrl: base(), cMapUrl: base(), cMapPacked: true, BinaryDataFactory: DeskData, isEvalSupported: false, useSystemFonts: true }).promise;
}

// 第 n 页画在一块画布上（白底），宽 width 像素
async function drawPage(doc, n, width) {
  const page = await doc.getPage(n);
  const v1 = page.getViewport({ scale: 1 });
  const vp = page.getViewport({ scale: Math.min(4, width / v1.width) });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(vp.width);
  canvas.height = Math.round(vp.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  page.cleanup();
  return canvas;
}

const jpeg = async (canvas, quality, n) => {
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
  if (!blob) throw new Error(`第 ${n} 页没画出来`);
  return blob;
};

/**
 * 把第 n 页（从 1 数）画成图。width：图的宽度（像素）；扫描的教材 1400 像素宽给 Claude 看得清小字和上下标，
 * 存进学习台的原页图用 1000 像素就够核对。返回 Blob（JPEG）
 */
export async function renderPage(doc, n, { width = 1400, quality = 0.85 } = {}) {
  const canvas = await drawPage(doc, n, width);
  try { return await jpeg(canvas, quality, n); } finally { canvas.width = canvas.height = 0; } // iPad 上画布占内存，用完马上放掉
}

/**
 * 入库用：画第 n 页，裁掉四周的白边（crop.js：只裁空白、不缩小，字的清晰度和整页一样），认出整页空白的页。
 * 返回 { blob, blank, w, h, tokens（裁了以后这张图约多少 token）, full（不裁要多少）}
 */
export async function renderScan(doc, n, { width = 1200, quality = 0.8 } = {}) {
  const canvas = await drawPage(doc, n, width);
  let out = canvas;
  try {
    // 在缩小到 400 像素宽的图上找内容（够认出一行字，几毫秒）
    const sw = Math.min(400, canvas.width);
    const k = canvas.width / sw;
    const sh = Math.max(1, Math.round(canvas.height / k));
    const small = document.createElement('canvas');
    small.width = sw;
    small.height = sh;
    const sctx = small.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(canvas, 0, 0, sw, sh);
    const found = contentBox(toGray(sctx.getImageData(0, 0, sw, sh).data, sw, sh), sw, sh);
    small.width = small.height = 0;
    if (found.box) {
      const b = scaleBox(found.box, k, canvas.width, canvas.height);
      out = document.createElement('canvas');
      out.width = b.w;
      out.height = b.h;
      out.getContext('2d').drawImage(canvas, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
    }
    const blob = await jpeg(out, quality, n);
    return { blob, blank: !!found.blank, w: out.width, h: out.height, tokens: imageTokens(out.width, out.height), full: imageTokens(canvas.width, canvas.height) };
  } finally {
    if (out !== canvas) out.width = out.height = 0;
    canvas.width = canvas.height = 0;
  }
}

/** 第 n 页的文字层（扫描版是空的） */
export async function pageText(doc, n) {
  const page = await doc.getPage(n);
  const tc = await page.getTextContent();
  return tc.items.map((it) => `${it.str}${it.hasEOL ? '\n' : ''}`).join('').replace(/[ \t]+/g, ' ').trim();
}

/** 把一张图（截图、照片）缩到 width 像素宽、转成 JPEG（太大的图 Claude 那边也会缩，先缩省流量和存储） */
export async function shrinkImage(blob, { width = 1400, quality = 0.85 } = {}) {
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, width / bmp.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  const out = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
  canvas.width = canvas.height = 0;
  return out || blob;
}

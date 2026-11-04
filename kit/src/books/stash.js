// 存教材时把选的 PDF 在这台设备的浏览器里暂存一份（IndexedDB）：中途退出、刷新、屏幕熄了，回来点「接着存」直接接着存，
// 不用再选文件（浏览器不让网页记住你选过的文件，只能自己留一份）。存完就删。暂存不了（无痕模式、空间不够、
// 浏览器清了数据）都不要紧：「接着存」退回让我再选一次同一个 PDF，已经存好的页跳过。每一步出错都只是返回 null。
const DB = 'la-book-stash';
const STORE = 'files';

function open() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
}

async function tx(mode, fn) {
  const db = await open();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => { db.close(); resolve(req?.result ?? true); };
      t.onerror = t.onabort = () => { db.close(); resolve(null); };
    } catch { db.close(); resolve(null); }
  });
}

/** 存一份：{ name, size, blob }（book 是书号） */
export const stashFile = (book, file) => tx('readwrite', (s) => s.put({ name: file.name, size: file.size, type: file.type, blob: file, at: Date.now() }, book));
/** 取回来：File 或 null */
export async function stashedFile(book) {
  const r = await tx('readonly', (s) => s.get(book));
  if (!r?.blob) return null;
  try { return new File([r.blob], r.name, { type: r.type || 'application/pdf' }); } catch { return null; }
}
export const dropStash = (book) => tx('readwrite', (s) => s.delete(book));

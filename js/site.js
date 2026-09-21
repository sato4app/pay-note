// サイトの運用まわり：QRコード表示・更新チェック・Service Worker 登録

import { h } from './ui.js';

const SITE_URL = new URL('.', location.href).href;

/* ============ サイトのQRコード ============ */

const QR_SCRIPT_SRC = 'https://unpkg.com/qrcode-generator@1.4.4/qrcode.js';
let qrScriptPromise = null;

// QR生成ライブラリは初回表示時にだけ読み込む
const loadQrScript = () => {
  if (window.qrcode) return Promise.resolve();
  if (!qrScriptPromise) {
    qrScriptPromise = new Promise((resolve, reject) => {
      const el = h('script', { src: QR_SCRIPT_SRC });
      el.onload = resolve;
      el.onerror = () => { qrScriptPromise = null; reject(new Error('QRライブラリの読み込みに失敗')); };
      document.head.appendChild(el);
    });
  }
  return qrScriptPromise;
};

export function openQrModal() {
  const body = h('div', { class: 'hint', text: '生成中…' });
  const close = () => overlay.remove();
  const modal = h('div', { class: 'modal' },
    h('h3', { text: 'このサイトのQRコード' }),
    body,
    h('p', { class: 'url', text: SITE_URL }),
    h('button', { class: 'close-btn', text: '閉じる', onclick: close })
  );
  const overlay = h('div', {
    class: 'modal-overlay',
    onclick: e => { if (e.target === overlay) close(); }
  }, modal);
  document.body.appendChild(overlay);

  loadQrScript().then(() => {
    const qr = qrcode(0, 'M');   // 型番は自動判定、誤り訂正レベルM
    qr.addData(SITE_URL);
    qr.make();
    body.replaceWith(h('div', {
      class: 'qr-code',
      html: qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true })
    }));
  }).catch(() => {
    body.className = 'hint is-error';
    body.textContent = 'QRコードを生成できませんでした。通信環境を確認してください。';
  });
}

/* ============ 更新チェック ============ */
/* ヘッダーのタイトルをタップした時に実行。画面上の表示は行わない */

let updateRequested = false;
let reloading = false;

const reloadOnce = () => {
  if (reloading) return;
  reloading = true;
  location.reload();
};

// キャッシュ済みのアプリ資材（HTML/CSS/JS/JSON）と配信中のものを比べる
const isAppFile = url =>
  url.origin === location.origin && (url.pathname.endsWith('/') || /\.(html|css|js|json)$/.test(url.pathname));

const hasNewerVersion = async () => {
  for (const key of await caches.keys()) {
    const cache = await caches.open(key);
    for (const request of await cache.keys()) {
      const url = new URL(request.url);
      if (!isAppFile(url)) continue;

      // _nc 付きの要求は Service Worker がキャッシュを介さずに通す
      const latest = await fetch(`${url.origin}${url.pathname}?_nc=${Date.now()}`, { cache: 'no-store' });
      if (!latest.ok) continue;

      const cached = await cache.match(request);
      if ((await latest.text()) !== (await cached.text())) return true;
    }
  }
  return false;
};

// 配信中のアプリとキャッシュを比べ、異なっていればキャッシュを破棄して読み込み直す
export const checkForUpdate = async () => {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;
  updateRequested = true;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) await registration.update();

    if (!(await hasNewerVersion())) return;

    await Promise.all((await caches.keys()).map(key => caches.delete(key)));
    reloadOnce();
  } catch {
    // オフライン時などは何もしない
  }
};

/* ============ Service Worker ============ */

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
  // 更新チェックによって新しい Service Worker が有効になった時だけ読み込み直す
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updateRequested) reloadOnce();
  });
}

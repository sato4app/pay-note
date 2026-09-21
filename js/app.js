// アプリの起点：ヘッダー、画面の切り替え、起動

import { h, iconSvg } from './ui.js';
import { state } from './store.js';
import { recordForm } from './screen-record.js';
import { historyScreen } from './screen-history.js';
import { settingsScreen } from './screen-settings.js';
import { openQrModal, checkForUpdate, registerServiceWorker } from './site.js';

function header() {
  const tabButton = (key, label) => h('button', {
    class: 'icon-btn' + (state.tab === key ? ' is-active' : ''),
    'aria-label': label,
    title: label,
    html: iconSvg(key),
    onclick: () => {
      if (state.tab === key && !state.editingId) return;
      state.editingId = null;
      state.tab = key;
      render();
    }
  });

  return h('header', { class: 'app-header' },
    h('h1', { text: 'PayNote', onclick: checkForUpdate }),
    h('nav', {},
      tabButton('input', '入力'),
      tabButton('history', '履歴'),
      // QRボタンは設定ボタンの左に置く
      h('button', {
        class: 'icon-btn qr-btn',
        text: 'QR',
        'aria-label': 'QRコード',
        title: 'QRコード',
        onclick: openQrModal
      }),
      tabButton('settings', '設定')
    )
  );
}

const root = document.getElementById('root');

export function render(flash) {
  const editing = state.editingId && state.records.find(r => r.id === state.editingId);
  if (state.editingId && !editing) state.editingId = null;

  const screen =
    editing ? recordForm(editing) :
    state.tab === 'history' ? historyScreen() :
    state.tab === 'settings' ? settingsScreen() :
    recordForm(null, flash);
  root.replaceChildren(header(), h('main', {}, screen));
}

render();
registerServiceWorker();

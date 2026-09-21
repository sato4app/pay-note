// 履歴一覧・CSV出力・全履歴削除

import { h } from './ui.js';
import { state, todayLocal, formatAmount, setRecords } from './store.js';
import { render } from './app.js';

function exportCsv() {
  const header = '日付,場所,金額,支払方法\n';
  const escape = s => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [...state.records]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => {
      const amount = Number(r.amount).toFixed(state.settings.decimalPlaces);
      return `${r.date},${escape(r.place)},${amount},${escape(r.cardName)}`;
    })
    .join('\n');
  const csv = '﻿' + header + rows + '\n';
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = h('a', { href: url, download: `paynote_${todayLocal()}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

function clearAllRecords() {
  if (!confirm(`全 ${state.records.length} 件の記録を削除しますか？この操作は取り消せません。`)) return;
  setRecords([]);
  render();
}

// 記録を月ごとにまとめる（新しい月・新しい記録が先）
function groupByMonth(records) {
  const groups = new Map();
  [...records]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach(r => {
      const month = r.date.slice(0, 7);
      if (!groups.has(month)) groups.set(month, []);
      groups.get(month).push(r);
    });
  return groups;
}

function monthCard(month, records) {
  const total = records.reduce((sum, r) => sum + Number(r.amount), 0);
  return h('div', { class: 'month-card' },
    h('div', { class: 'month-head' },
      h('span', { class: 'month', text: month }),
      h('span', { class: 'total' },
        '合計 ',
        h('b', { text: formatAmount(total) }),
        ' ' + state.settings.currency
      )
    ),
    records.map(r => h('div', { class: 'record' },
      h('div', { class: 'record-main' },
        h('div', { class: 'record-date', text: r.date }),
        h('div', { class: 'record-place', text: r.place }),
        h('div', { class: 'record-card', text: r.cardName })
      ),
      h('div', { class: 'record-side' },
        h('div', { class: 'record-amount', text: `${formatAmount(r.amount)} ${state.settings.currency}` }),
        h('button', {
          class: 'link-btn',
          text: '編集',
          onclick: () => { state.editingId = r.id; render(); }
        })
      )
    ))
  );
}

export function historyScreen() {
  const isEmpty = state.records.length === 0;

  return h('div', { class: 'screen' },
    h('div', { class: 'row-between' },
      h('h2', { text: '履歴' }),
      h('div', { class: 'btn-group' },
        h('button', { class: 'plain-btn', text: '全履歴削除', disabled: isEmpty, onclick: clearAllRecords }),
        h('button', { class: 'csv-btn', text: 'CSV出力', disabled: isEmpty, onclick: exportCsv })
      )
    ),
    isEmpty
      ? h('p', { class: 'empty', text: '記録がありません' })
      : [...groupByMonth(state.records)].map(([month, records]) => monthCard(month, records))
  );
}

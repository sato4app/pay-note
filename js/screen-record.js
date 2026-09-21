// 記録の入力フォーム（新規記録と編集の両方をここで扱う）

import { h, nextId, comboField } from './ui.js';
import { state, todayLocal, setRecords, addCandidate } from './store.js';
import { render } from './app.js';

const newId = () => Date.now().toString() + Math.random().toString(36).slice(2, 6);

// record を渡すと編集、渡さなければ新規記録のフォームになる
export function recordForm(record, flash) {
  const dateId = nextId();
  const amountId = nextId();
  const decimals = state.settings.decimalPlaces;

  const dateInput = h('input', { type: 'date', id: dateId, value: record ? record.date : todayLocal() });
  const amountInput = h('input', {
    type: 'number',
    id: amountId,
    class: 'amount',
    placeholder: '0',
    value: record ? String(record.amount) : '',
    inputmode: decimals > 0 ? 'decimal' : 'numeric',
    step: decimals > 0 ? Math.pow(10, -decimals).toFixed(decimals) : '1'
  });
  const placeCombo = comboField('場所', '店名などを入力', state.places, record ? record.place : '');
  const cardCombo = comboField('支払方法', 'カード名などを入力', state.cards,
    record ? record.cardName : (state.cards[0] || ''));

  const message = h('div', { class: 'message', hidden: true });
  let messageTimer = null;
  const showMessage = (type, text, autoHide) => {
    clearTimeout(messageTimer);
    message.className = 'message is-' + type;
    message.textContent = text;
    message.hidden = false;
    if (autoHide) messageTimer = setTimeout(() => { message.hidden = true; }, 2000);
  };

  // 編集を終えて履歴一覧へ戻る
  const closeEdit = () => {
    state.editingId = null;
    render();
  };

  const handleSave = () => {
    const place = placeCombo.getValue().trim();
    const cardName = cardCombo.getValue().trim();
    const amount = amountInput.value;

    if (!place) return showMessage('error', '場所を入力してください');
    if (!amount || Number(amount) <= 0) return showMessage('error', '金額を入力してください');
    if (!cardName) return showMessage('error', '支払方法を入力してください');

    const values = { date: dateInput.value, place, amount: Number(amount), cardName };
    setRecords(record
      ? state.records.map(r => (r.id === record.id ? { ...r, ...values } : r))
      : [{ id: newId(), ...values }, ...state.records]);

    addCandidate('places', place);
    addCandidate('cards', cardName);

    // 新規記録は入力欄を初期化するため画面ごと組み直し、成功メッセージだけ引き継ぐ
    if (record) closeEdit();
    else render({ type: 'success', text: '記録しました' });
  };

  const handleDelete = () => {
    if (!confirm('この記録を削除しますか？')) return;
    setRecords(state.records.filter(r => r.id !== record.id));
    closeEdit();
  };

  const screen = h('div', { class: 'screen input-screen' },
    h('h2', { text: record ? '記録を編集' : 'カード使用を記録' }),
    h('div', { class: 'field' }, h('label', { for: dateId, text: '日付' }), dateInput),
    h('div', { class: 'field' },
      h('label', { for: amountId, text: `金額（${state.settings.currency}）` }),
      amountInput
    ),
    placeCombo.node,
    cardCombo.node,
    message,
    h('button', {
      class: 'primary-btn',
      text: record ? '更新する' : '記録する',
      onclick: handleSave
    }),
    record && h('div', { class: 'form-actions' },
      h('button', { class: 'plain-btn', text: 'キャンセル', onclick: closeEdit }),
      h('button', { class: 'plain-btn is-danger', text: '削除', onclick: handleDelete })
    )
  );

  if (flash) showMessage(flash.type, flash.text, true);
  return screen;
}

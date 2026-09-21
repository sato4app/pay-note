// 通貨設定と、候補（支払方法・場所）の管理

import { h, nextId } from './ui.js';
import { state, setCandidates, updateSettings } from './store.js';
import { render } from './app.js';

// 候補の追加・削除を行う区画。kind は 'cards'（支払方法）か 'places'（場所）
function candidateSection(title, itemLabel, kind) {
  const items = state[kind];
  const input = h('input', { type: 'text', placeholder: itemLabel });
  const apply = next => {
    setCandidates(kind, next);
    render();
  };
  const add = () => {
    const value = input.value.trim();
    if (!value || items.includes(value)) return;
    apply([...items, value]);
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });

  return h('section', { class: 'card' },
    h('h3', { text: title }),
    h('div', { class: 'add-row' },
      input,
      h('button', { class: 'add-btn', text: '追加', onclick: add })
    ),
    h('ul', { class: 'list' },
      items.length === 0
        ? h('li', {}, h('span', { class: 'note', text: '未登録（記録時に自動登録されます）' }))
        : items.map(item => h('li', {},
            h('span', { text: item }),
            h('button', {
              class: 'link-btn is-danger',
              text: '削除',
              onclick: () => {
                if (!confirm(`${itemLabel}「${item}」を削除しますか？`)) return;
                apply(items.filter(x => x !== item));
              }
            })
          ))
    )
  );
}

// 設定項目 1 行分（入力欄は呼び出し側で作る）
const settingField = (label, control) =>
  h('div', { class: 'field' }, h('label', { for: control.id, text: label }), control);

function currencyField() {
  const input = h('input', {
    type: 'text',
    id: nextId(),
    value: state.settings.currency,
    placeholder: '例: 円, $, €'
  });
  input.addEventListener('input', () => updateSettings({ currency: input.value }));
  return settingField('通貨単位', input);
}

function decimalField() {
  const select = h('select', { id: nextId() },
    [['0', '0（整数）'], ['1', '1'], ['2', '2'], ['3', '3']].map(([value, label]) =>
      h('option', { value, text: label })
    )
  );
  select.value = String(state.settings.decimalPlaces);
  select.addEventListener('change', () => updateSettings({ decimalPlaces: Number(select.value) }));
  return settingField('小数点以下の桁数', select);
}

export function settingsScreen() {
  return h('div', { class: 'screen' },
    h('h2', { text: '設定' }),
    h('section', { class: 'card' },
      h('h3', { text: '通貨設定' }),
      currencyField(),
      decimalField()
    ),
    candidateSection('支払方法管理', '支払方法', 'cards'),
    candidateSection('場所管理', '場所', 'places')
  );
}

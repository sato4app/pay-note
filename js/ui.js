// DOM の組み立てと、画面共通の UI 部品

let uid = 0;
export const nextId = () => 'f' + (++uid);

// h('div', { class: 'x', onclick: fn }, 子要素…) で要素を組み立てる
export function h(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'value') node.value = value;
    else if (key === 'disabled' || key === 'hidden') node[key] = true;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

const ICON_PATHS = {
  input: 'M12 4v16m8-8H4',
  history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z'
};

export const iconSvg = name =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON_PATHS[name]}"/></svg>`;

// 直接入力でき、▼ から登録済みの候補も選べる入力欄
export function comboField(label, placeholder, options, initial) {
  const id = nextId();
  const input = h('input', { type: 'text', id, placeholder, value: initial || '' });
  const toggle = h('button', {
    type: 'button',
    class: 'combo-toggle',
    text: '▼',
    'aria-label': label + 'の候補から選択',
    title: options.length ? '候補から選択' : '候補がありません',
    disabled: options.length === 0
  });
  const list = h('ul', { class: 'combo-list' },
    options.map(option => h('li', {},
      h('button', {
        type: 'button',
        class: option === initial ? 'is-current' : '',
        text: option,
        onclick: () => {
          input.value = option;
          root.classList.remove('is-open');
        }
      })
    ))
  );
  const root = h('div', { class: 'field combo' },
    h('label', { for: id, text: label }),
    h('div', { class: 'combo-row' }, input, toggle, list)
  );
  toggle.addEventListener('click', () => root.classList.toggle('is-open'));
  return { node: root, getValue: () => input.value };
}

// 候補一覧の外をタップしたら閉じる
document.addEventListener('pointerdown', event => {
  document.querySelectorAll('.combo.is-open').forEach(combo => {
    if (!combo.contains(event.target)) combo.classList.remove('is-open');
  });
});

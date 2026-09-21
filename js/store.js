// 保存データ（localStorage）と画面状態をまとめて扱う

const STORAGE_KEYS = {
  records: 'paynote_records',
  cards: 'paynote_cards',
  places: 'paynote_places',
  settings: 'paynote_settings'
};

const DEFAULT_SETTINGS = { currency: '円', decimalPlaces: 0 };

const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

// 旧バージョンの日時付きデータ(datetime)を日付のみに正規化する
const normalizeRecord = ({ datetime, ...r }) => ({
  ...r,
  date: (r.date || datetime || '').slice(0, 10)
});

export const todayLocal = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const state = {
  tab: 'input',
  editingId: null,
  records: load(STORAGE_KEYS.records, []).map(normalizeRecord),
  cards: load(STORAGE_KEYS.cards, []),
  places: load(STORAGE_KEYS.places, []),
  settings: { ...DEFAULT_SETTINGS, ...load(STORAGE_KEYS.settings, {}) }
};

export const formatAmount = amount => Number(amount).toLocaleString('ja-JP', {
  minimumFractionDigits: state.settings.decimalPlaces,
  maximumFractionDigits: state.settings.decimalPlaces
});

/* ---- 更新（state の書き換えと保存を必ず一緒に行う） ---- */

export const setRecords = records => {
  state.records = records;
  save(STORAGE_KEYS.records, records);
};

// kind は 'cards'（支払方法）か 'places'（場所）
export const setCandidates = (kind, items) => {
  state[kind] = items;
  save(STORAGE_KEYS[kind], items);
};

export const addCandidate = (kind, value) => {
  if (state[kind].includes(value)) return;
  setCandidates(kind, [...state[kind], value]);
};

export const updateSettings = patch => {
  state.settings = { ...state.settings, ...patch };
  save(STORAGE_KEYS.settings, state.settings);
};

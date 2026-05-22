const PREFIX = 'sfdc_mentor_complete_';
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

export function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function notify(message, type = 'success') {
  try {
    const item = { id: Date.now(), message, type, date: new Date().toLocaleString() };
    const list = readStore('toasts', []);
    localStorage.setItem(PREFIX + 'toasts', JSON.stringify([item, ...list].slice(0, 20)));
    window.dispatchEvent(new CustomEvent('mentor-toast', { detail: item }));
  } catch {}
}

export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export function writeStore(key, value, opts = {}) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
  if (!opts.silent) notify(`Saved: ${key}`);
  if (opts.backend !== false) {
    api('/api/items', { method: 'POST', body: JSON.stringify({ key, data: value, source: 'frontend' }) }).catch(() => {});
  }
}

export function deleteStore(key) {
  localStorage.removeItem(PREFIX + key);
  notify(`Deleted: ${key}`, 'delete');
}

export function useStore(key, fallback, React) {
  const [value, setValue] = React.useState(() => readStore(key, fallback));
  React.useEffect(() => writeStore(key, value), [key, value]);
  return [value, setValue];
}

export function collectLocalStore() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) {
      try { data[k.replace(PREFIX, '')] = JSON.parse(localStorage.getItem(k)); }
      catch { data[k.replace(PREFIX, '')] = localStorage.getItem(k); }
    }
  }
  return data;
}

export async function syncToBackend() {
  const items = collectLocalStore();
  const result = await api('/api/sync', { method: 'POST', body: JSON.stringify({ items, source: 'localStorage-sync' }) });
  notify(`Backend sync done: ${result.saved || 0} items`);
  return result;
}

export async function restoreFromBackend() {
  const result = await api('/api/export');
  const items = result.items || {};
  Object.entries(items).forEach(([key, value]) => localStorage.setItem(PREFIX + key, JSON.stringify(value)));
  notify(`Restore done: ${Object.keys(items).length} items`);
  return result;
}

export function importBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const normalized = {};
        Object.entries(data).forEach(([k, v]) => {
          const key = k.startsWith(PREFIX) ? k.replace(PREFIX, '') : k;
          try { normalized[key] = typeof v === 'string' ? JSON.parse(v) : v; }
          catch { normalized[key] = v; }
          localStorage.setItem(PREFIX + key, JSON.stringify(normalized[key]));
        });
        notify(`Imported backup: ${Object.keys(normalized).length} items`);
        api('/api/restore', { method: 'POST', body: JSON.stringify({ items: normalized }) }).catch(() => {});
        resolve(normalized);
      } catch (e) { notify('Backup import failed', 'error'); reject(e); }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export async function backendSearch(query) {
  return api('/api/search', { method: 'POST', body: JSON.stringify({ query, limit: 20 }) });
}

export async function backendAnalytics() {
  return api('/api/analytics');
}

export function exportBackup() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) data[k] = localStorage.getItem(k);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sfdc-mentor-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
  notify('Backup downloaded');
}

export function downloadText(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  notify(`Downloaded: ${filename}`);
}

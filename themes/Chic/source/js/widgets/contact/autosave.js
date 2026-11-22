// Draft autosave to localStorage, shared by the contact form and the admin reply dialog. Every ~10 s
// the current values are written if they changed (or the entry is removed when everything is empty).
// All storage access is wrapped: private windows and blocked storage just turn autosave off.

const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };

// key: storage key; read(): plain object of the fields to keep; isEmpty(values) -> bool.
// onSaved(): called after a write, so the UI can show a small "saved" mark.
export function createAutosave({ key, read, isEmpty, onSaved, interval = 10000, storage = () => window.localStorage }) {
  let timer = null;
  let last = null;

  const load = () => safe(() => {
    const raw = storage().getItem(key);
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  }, null);

  function flush() {
    const values = read();
    if (isEmpty(values)) {
      if (last !== null) safe(() => storage().removeItem(key));
      last = null;
      return;
    }
    const json = JSON.stringify(values);
    if (json === last) return;
    if (safe(() => { storage().setItem(key, json); return true; }, false)) {
      last = json;
      onSaved && onSaved();
    }
  }

  const onHide = () => flush();
  return {
    load,
    flush,
    start() {
      if (timer) return;
      last = safe(() => storage().getItem(key), null); // what is already stored counts as saved
      timer = setInterval(flush, interval);
      window.addEventListener('pagehide', onHide);
    },
    stop() {
      clearInterval(timer);
      timer = null;
      window.removeEventListener('pagehide', onHide);
    },
    // after a successful send: forget the draft and stop writing it back
    clear() {
      last = null;
      safe(() => storage().removeItem(key));
    },
  };
}

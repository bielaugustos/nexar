// ══════════════════════════════════════
// STORAGE SERVICE
// ══════════════════════════════════════

export function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('[Ioversoroot] Storage error:', e)
  }
}

export function removeStorage(key) {
  try { localStorage.removeItem(key) } catch {}
}

export function clearAllStorage() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('nex_'))
      .forEach(k => localStorage.removeItem(k))
  } catch {}
}

// ══════════════════════════════════════
// ENTRADA DA APLICAÇÃO
//
// Ordem de inicialização:
//   1. Aplica o tema salvo ANTES do React montar
//      → elimina o flash de tema incorreto (FOUC)
//   2. Inicializa analytics (PostHog)
//   3. Em desenvolvimento, carrega dados de semente
//      e silencia avisos conhecidos do React Router v6
//   4. Monta o React com StrictMode
// ══════════════════════════════════════
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { applyTheme } from './services/themes'
import { initAnalytics } from './services/analytics'

// ── 1. Tema antecipado (antes do primeiro paint) ──
const savedTheme = localStorage.getItem('nex_theme') || 'light'
applyTheme(savedTheme)

// ── 2. Inicializa analytics ──
initAnalytics()

// ── 2. Ambiente de desenvolvimento ──
if (import.meta.env.DEV) {
  // Silencia avisos do React Router v6 sobre flags futuras (v7).
  // São inofensivos e já estão configurados no BrowserRouter.
  const originalWarn = console.warn
  console.warn = (...args) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    if (msg.includes('React Router Future Flag Warning')) return
    originalWarn(...args)
  }
}

// ── 3. Montagem do React ──
// Remove o aria-busy=true do #root que o HTML define enquanto JS carrega
const rootEl = document.getElementById('root')
rootEl.removeAttribute('aria-busy')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

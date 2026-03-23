import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { applyTheme } from './services/themes'

// Aplica o tema antes do React montar (evita flash)
const savedTheme = localStorage.getItem('nex_theme') || 'light'
applyTheme(savedTheme)

// Em desenvolvimento, silencia os avisos do React Router v6 sobre flags v7
// que já estão configuradas no BrowserRouter. Esses avisos são inofensivos
// e serão eliminados automaticamente ao migrar para React Router v7.
if (import.meta.env.DEV) {
  import('./devSeed.js') // expõe window.seedDevMode() no console
}

if (import.meta.env.DEV) {
  const originalWarn = console.warn
  console.warn = (...args) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    if (msg.includes('React Router Future Flag Warning')) return
    originalWarn(...args)
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

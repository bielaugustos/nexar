// ══════════════════════════════════════
// SISTEMA DE TEMAS — Ioversoroot
// ══════════════════════════════════════

export const THEMES = {
  light: {
    id: 'light', name: 'Padrão', emoji: '☀️',
    dark: false,
    vars: {
      '--bg':      '#f5f0e8',
      '--surface': '#ede8e0',
      '--white':   '#fff',
      '--ink':     '#111111',
      '--ink2':    '#333333',
      '--ink3':    '#555555',
      '--border':  '#111111',
      '--shadow':  '#111111',
    },
  },
  dark: {
    id: 'dark', name: 'Escuro', emoji: '🌙',
    dark: true,
    vars: {
      '--bg':      '#1a1a1a',
      '--surface': '#252525',
      '--white':   '#2e2e2e',
      '--ink':     '#f0e8d0',
      '--ink2':    '#d4c8a8',
      '--ink3':    '#a89c7c',
      '--border':  '#f0e8d0',
      '--shadow':  '#f0e8d044',
    },
  },
  midnight: {
    id: 'midnight', name: 'Midnight', emoji: '🌌',
    dark: true,
    vars: {
      '--bg':      '#0a0e1a',
      '--surface': '#111827',
      '--white':   '#1e2a3a',
      '--ink':     '#e8f0fe',
      '--ink2':    '#b8c8e8',
      '--ink3':    '#7a92b8',
      '--border':  '#3a5080',
      '--shadow':  '#000000',
    },
  },
  forest: {
    id: 'forest', name: 'Forest', emoji: '🌿',
    dark: false,
    vars: {
      '--bg':      '#f0ece0',
      '--surface': '#e4dfc8',
      '--white':   '#faf8f0',
      '--ink':     '#1a2a14',
      '--ink2':    '#2d4a22',
      '--ink3':    '#5a7a4a',
      '--border':  '#2d4a22',
      '--shadow':  '#1a2a14',
    },
  },
  sakura: {
    id: 'sakura', name: 'Sakura', emoji: '🌸',
    dark: false,
    vars: {
      '--bg':      '#fff5f7',
      '--surface': '#ffe8ed',
      '--white':   '#ffffff',
      '--ink':     '#3a1a22',
      '--ink2':    '#5a2a38',
      '--ink3':    '#9a6a78',
      '--border':  '#c4607a',
      '--shadow':  '#c4607a',
    },
  },
  desert: {
    id: 'desert', name: 'Desert', emoji: '🏜️',
    dark: false,
    vars: {
      '--bg':      '#f5ede0',
      '--surface': '#ecdcc8',
      '--white':   '#fdf8f0',
      '--ink':     '#2a1a0a',
      '--ink2':    '#4a3020',
      '--ink3':    '#8a6848',
      '--border':  '#7a3820',
      '--shadow':  '#5a2810',
    },
  },

  // Dracula — tema de código roxo escuro
  dracula: {
    id: 'dracula', name: 'Dracula', emoji: '🧛',
    dark: true,
    vars: {
      '--bg':      '#282a36',
      '--surface': '#343746',
      '--white':   '#3d4055',
      '--ink':     '#f8f8f2',
      '--ink2':    '#cdd6f4',
      '--ink3':    '#6272a4',
      '--border':  '#bd93f9',
      '--shadow':  '#1e1f29',
    },
  },

  // Nord — tema de código azul ártico
  nord: {
    id: 'nord', name: 'Nord', emoji: '🏔️',
    dark: true,
    vars: {
      '--bg':      '#2e3440',
      '--surface': '#3b4252',
      '--white':   '#434c5e',
      '--ink':     '#eceff4',
      '--ink2':    '#d8dee9',
      '--ink3':    '#81a1c1',
      '--border':  '#5e81ac',
      '--shadow':  '#242933',
    },
  },
}

// Aplica tema injetando CSS variables direto no <html>
export function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES.light
  const root  = document.documentElement

  // Remove variáveis inline de temas anteriores
  // (para não acumular propriedades velhas)
  const allVarNames = ['--bg','--surface','--white','--ink','--ink2','--ink3','--border','--shadow']
  allVarNames.forEach(v => root.style.removeProperty(v))

  // Injeta as variáveis do tema escolhido
  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val)
  })

  // data-theme controla as regras CSS que dependem de seletor
  // (ex: [data-theme='dark'] .pri-alta)
  root.setAttribute('data-theme', theme.dark ? 'dark' : 'light')

  // color-scheme para o browser (scrollbars nativos, inputs de data)
  root.style.colorScheme = theme.dark ? 'dark' : 'light'

  localStorage.setItem('nex_theme', themeId)
}

// Inicializa o tema — chama applyTheme mas também retorna o id
// para o useState do AppContext
export function initTheme() {
  const saved = localStorage.getItem('nex_theme') || 'light'
  // applyTheme só funciona depois que o DOM existe
  // Usamos requestAnimationFrame para garantir
  if (typeof document !== 'undefined') {
    requestAnimationFrame(() => applyTheme(saved))
  }
  return saved
}

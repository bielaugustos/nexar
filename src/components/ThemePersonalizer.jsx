import { useState, useEffect } from 'react'
import { PiPaletteBold, PiCheckCircleBold, PiCaretDownBold, PiCaretUpBold } from 'react-icons/pi'

// Temas de foco com paletas de cores personalizadas
const FOCUS_THEMES = {
  pessoal: {
    id: 'pessoal',
    name: 'Pessoal',
    emoji: '👤',
    colors: {
      primary: '#e91e63',
      secondary: '#f39c12',
      background: '#fef3c7',
      surface: '#fff9db',
      border: '#fecaca',
      ink: '#2d3748',
      ink2: '#6b7280',
      ink3: '#9ca3af',
      gold: '#f59e0b',
      gold_dk: '#d4a011',
    },
  },
  trabalho: {
    id: 'trabalho',
    name: 'Trabalho',
    emoji: '💼',
    colors: {
      primary: '#3498db',
      secondary: '#60a5fa',
      background: '#e3f2fd',
      surface: '#dbeafe',
      border: '#a855f7',
      ink: '#1e293b',
      ink2: '#475569',
      ink3: '#8b5cf6',
      gold: '#f59e0b',
      gold_dk: '#d4a011',
    },
  },
  sono: {
    id: 'sono',
    name: 'Sono',
    emoji: '😴',
    colors: {
      primary: '#8e44ad',
      secondary: '#a78bfa',
      background: '#1a1a2e',
      surface: '#2d2d44',
      border: '#4a4a6a',
      ink: '#e8eaf6',
      ink2: '#b8c5d6',
      ink3: '#6b7280',
      gold: '#f59e0b',
      gold_dk: '#d4a011',
    },
  },
}

export function ThemePersonalizer({ currentTheme, onThemeChange }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedFocus, setSelectedFocus] = useState(() => {
    const saved = localStorage.getItem('nex_theme_focus')
    return saved && FOCUS_THEMES[saved] ? saved : 'pessoal'
  })

  // Carregar preferência de foco ao mudar o tema
  useEffect(() => {
    const savedFocus = localStorage.getItem('nex_theme_focus')
    if (savedFocus && FOCUS_THEMES[savedFocus]) {
      applyFocusTheme(savedFocus)
    }
  }, [currentTheme])

  function applyFocusTheme(focusId) {
    const theme = FOCUS_THEMES[focusId]
    if (!theme) return

    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val)
    })

    localStorage.setItem('nex_theme_focus', focusId)
  }

  function handleFocusSelect(focusId) {
    setSelectedFocus(focusId)
    applyFocusTheme(focusId)
  }

  return (
    <div style={{ width: '100%', marginBottom: '16px' }}>
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: 'var(--surface)',
          border: '2px solid var(--border)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        <PiPaletteBold size={16} color="var(--ink2)" />
        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ink)' }}>
          Personalizar Tema por Foco
        </span>
        {expanded ? <PiCaretUpBold size={14} /> : <PiCaretDownBold size={14} />}
      </button>

      {expanded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          padding: '12px',
          background: 'var(--surface)',
          border: '2px solid var(--border)',
          borderRadius: '8px',
        }}>
          {Object.entries(FOCUS_THEMES).map(([id, theme]) => {
            const isSelected = selectedFocus === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleFocusSelect(id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '16px',
                  background: isSelected ? theme.colors.primary : 'var(--surface)',
                  border: `2px solid ${isSelected ? theme.colors.primary : 'var(--border)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '24px' }}>{theme.emoji}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: isSelected ? '#fff' : 'var(--ink)' }}>
                    {theme.name}
                  </span>
                  {isSelected && <PiCheckCircleBold size={14} color="#fff" />}
                </div>
                <div style={{ fontSize: '11px', color: isSelected ? '#fff' : 'var(--ink3)' }}>
                  Personalize as cores para {theme.name.toLowerCase()}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

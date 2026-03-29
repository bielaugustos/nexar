import { useState } from 'react'
import { PiPaletteBold, PiCheckCircleBold, PiLockSimpleBold, PiCaretDownBold, PiCaretUpBold } from 'react-icons/pi'
import { THEMES } from '../services/themes'
import styles from './ThemeSelector.module.css'

const THEME_LIST = [
  { id:'light',         name:'Padrão',       emoji:'☀️',  free:true  },
  { id:'dark',          name:'Escuro',       emoji:'🌙',  free:true  },
  { id:'glass_dark',    name:'Vidro Dark',   emoji:'🌑', free:true, shopId:'theme_glass_dark' },
  { id:'glass',         name:'Vidro',        emoji:'🪟', free:true, shopId:'theme_glass'    },
  { id:'high_contrast', name:'Alto Contraste',emoji:'⬛',  free:false, shopId:'theme_high_contrast' },
  { id:'midnight',      name:'Midnight',     emoji:'🌌',  free:false, shopId:'theme_midnight' },
  { id:'forest',        name:'Forest',       emoji:'🌿',  free:false, shopId:'theme_forest'   },
  { id:'sakura',        name:'Sakura',       emoji:'🌸',  free:false, shopId:'theme_sakura'   },
  { id:'desert',        name:'Desert',       emoji:'🏜️', free:false, shopId:'theme_desert'   },
  { id:'dracula',       name:'Dracula',      emoji:'🧛',  free:false, shopId:'theme_dracula'  },
  { id:'nord',          name:'Nord',         emoji:'🏔️', free:false, shopId:'theme_nord'     },
  { id:'macintosh',     name:'Macintosh',    emoji:'🍎',  free:false, shopId:'theme_macintosh'    },
  { id:'windows98',     name:'Windows 98',   emoji:'🪟',  free:false, shopId:'theme_windows98'    },
  { id:'linux',         name:'Linux',        emoji:'🐧',  free:false, shopId:'theme_linux'        },
]

export function ThemeSelector({ currentTheme, onChangeTheme, ownedItems }) {
  const [expanded, setExpanded] = useState(false)
  const current = THEME_LIST.find(t => t.id === currentTheme) || THEME_LIST[0]

  function handleThemeSelect(themeId) {
    const theme = THEME_LIST.find(t => t.id === themeId)
    if (theme && (theme.free || ownedItems.has(theme.shopId))) {
      onChangeTheme(themeId)
    }
  }

  return (
    <div className={styles.themeSelector}>
      {/* Header - sempre visível */}
      <button
        type="button"
        className={styles.themeHeader}
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-label="Selecionar tema"
      >
        <div className={styles.themeInfo}>
          <PiPaletteBold size={16} color="var(--ink2)" />
          <span className={styles.currentEmoji}>{current.emoji}</span>
          <span className={styles.currentName}>{current.name}</span>
        </div>
        {expanded ? <PiCaretUpBold size={14} /> : <PiCaretDownBold size={14} />}
      </button>

      {/* Grid de temas - expansível */}
      {expanded && (
        <div className={styles.themeGrid}>
          {THEME_LIST.map(theme => {
            const unlocked = theme.free || ownedItems.has(theme.shopId)
            const active = currentTheme === theme.id
            const themeVars = THEMES[theme.id]?.vars || {}

            return (
              <button
                key={theme.id}
                type="button"
                className={[
                  styles.themeCard,
                  active && styles.themeCardActive,
                  !unlocked && styles.themeCardLocked
                ].filter(Boolean).join(' ')}
                onClick={() => handleThemeSelect(theme.id)}
                disabled={!unlocked}
                title={!unlocked ? 'Desbloquear na loja' : theme.name}
                aria-label={theme.name}
                aria-pressed={active}
                style={{
                  '--preview-bg': themeVars['--bg'] || 'var(--bg)',
                  '--preview-surface': themeVars['--surface'] || 'var(--surface)',
                  '--preview-ink': themeVars['--ink'] || 'var(--ink)',
                }}
              >
                {/* Preview do tema */}
                <div className={styles.themePreview}>
                  <div className={styles.previewBar} style={{ background: 'var(--preview-surface)' }} />
                  <div className={styles.previewDot} style={{ background: 'var(--preview-ink)' }} />
                </div>

                {/* Informações do tema */}
                <div className={styles.themeDetails}>
                  <span className={styles.themeEmoji}>{theme.emoji}</span>
                  <span className={styles.themeName}>{theme.name}</span>
                </div>

                {/* Status */}
                <div className={styles.themeStatus}>
                  {active && <PiCheckCircleBold size={14} color="var(--gold-dk)" />}
                  {!unlocked && <PiLockSimpleBold size={12} color="var(--ink3)" />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

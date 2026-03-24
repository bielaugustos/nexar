// ══════════════════════════════════════
// COMPONENTE: Header
//
// Barra superior fixa — visível apenas
// no mobile (< 768px). Em tablet/desktop
// o SideNav assume essa função.
//
// ACESSIBILIDADE:
//   • <header> tem role="banner" implícito —
//     leitores de tela anunciam como região
//   • Logo com aria-label descreve o app
//   • Streak com aria-label numérico explícito
//     ("Sequência de 12 dias") — melhor que
//     apenas "12d" que é ambíguo em voz
//   • PiFlameFill com aria-hidden — decorativo
// ══════════════════════════════════════
import { PiFlameFill } from 'react-icons/pi'
import { useApp }      from '../context/AppContext'
import { useStats }    from '../hooks/useStats'
import styles          from './Header.module.css'

export function Header() {
  const { history } = useApp()
  const { streak }  = useStats(history)

  return (
    <header className={styles.header}>
      {/* Logo — aria-label nomeia o app para leitores de tela */}
      <span className={styles.logo} aria-label="Rootio">../</span>

      {streak > 0 && (
        <div
          className={styles.streakPill}
          aria-label={`Sequência de ${streak} ${streak === 1 ? 'dia' : 'dias'}`}
          title={`${streak} dias consecutivos`}
        >
          <PiFlameFill size={11} color="var(--gold-dk)" aria-hidden="true" />
          <span aria-hidden="true">{streak}d</span>
        </div>
      )}
    </header>
  )
}

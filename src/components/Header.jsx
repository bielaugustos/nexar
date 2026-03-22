// ══════════════════════════════════════
// HEADER — barra superior fixa
// Exibe o logotipo e a sequência atual
// (streak) quando maior que zero.
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
      <h1 className={styles.logo}>../</h1>

      {streak > 0 && (
        <div className={styles.streakPill}>
          <PiFlameFill size={11} color="#b08000" />
          {streak}d
        </div>
      )}
    </header>
  )
}

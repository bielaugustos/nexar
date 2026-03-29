import { useState, useEffect } from 'react'
import { useHabits } from '../../hooks/useHabits'
import { useStats } from '../../hooks/useStats'
import { useApp } from '../../context/AppContext'
import styles from './Desktop.module.css'

// ══════════════════════════════════════
// WIDGET - Widget na Área de Trabalho
// ══════════════════════════════════════
export function Widget({ type }) {
  if (type === 'clock') {
    return <ClockWidget />
  }
  if (type === 'stats') {
    return <StatsWidget />
  }
  return null
}

// ══════════════════════════════════════
// CLOCK WIDGET - Relógio
// ══════════════════════════════════════
function ClockWidget() {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Formatar hora
  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Formatar data
  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className={styles.widget}>
      <div className={styles.widgetClock}>
        <div className={styles.widgetClockTime}>
          {formatTime(currentTime)}
        </div>
        <div className={styles.widgetClockDate}>
          {formatDate(currentTime)}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// STATS WIDGET - Estatísticas Rápidas
// ══════════════════════════════════════
function StatsWidget() {
  const { habits, history } = useApp()
  const { allPoints } = useHabits()
  const { streak, daysActive } = useStats(history)

  // Hábitos concluídos hoje
  const today = new Date().toISOString().slice(0, 10)
  const todayEntry = history[today] || { done: 0, total: 0 }
  const completedToday = todayEntry.done
  const totalToday = todayEntry.total

  return (
    <div className={styles.widget}>
      <div className={styles.widgetStats}>
        <div className={styles.widgetStat}>
          <span className={styles.widgetStatIcon}>⭐</span>
          <div>
            <div className={styles.widgetStatValue}>{allPoints}</div>
            <div className={styles.widgetStatLabel}>Pontos</div>
          </div>
        </div>

        <div className={styles.widgetStat}>
          <span className={styles.widgetStatIcon}>🔥</span>
          <div>
            <div className={styles.widgetStatValue}>{streak}d</div>
            <div className={styles.widgetStatLabel}>Sequência</div>
          </div>
        </div>

        <div className={styles.widgetStat}>
          <span className={styles.widgetStatIcon}>✅</span>
          <div>
            <div className={styles.widgetStatValue}>{completedToday}/{totalToday}</div>
            <div className={styles.widgetStatLabel}>Hoje</div>
          </div>
        </div>

        <div className={styles.widgetStat}>
          <span className={styles.widgetStatIcon}>📅</span>
          <div>
            <div className={styles.widgetStatValue}>{daysActive}</div>
            <div className={styles.widgetStatLabel}>Dias ativos</div>
          </div>
        </div>
      </div>
    </div>
  )
}

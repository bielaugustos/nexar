import { useEffect, useState } from 'react'
import {
  PiArrowRightBold, PiCheckBold, PiCalendarDots,
  PiLightbulbBold, PiLockBold, PiChartLineUp,
} from 'react-icons/pi'
import { useApp }      from '../context/AppContext'
import { useHabits }   from '../hooks/useHabits'
import { useStats }    from '../hooks/useStats'
import { toast }       from '../components/Toast'
import { useSound }    from '../hooks/useSound'
import { calcLevel }   from '../services/levels'
import styles from './Home.module.css'


// ══════════════════════════════════════
// BLOCO 0 — PONTOS & NÍVEL
// ══════════════════════════════════════
function PontosCard({ history }) {
  const { streak }     = useStats(history)
  const { allPoints }  = useHabits()
  const level          = calcLevel(allPoints)

  return (
    <div className={`card ${styles.pontosCard}`}>
      <div className="card-title">
        <level.Icon size={14} style={{ color: level.color }} /> {level.name}
      </div>

      <div className={styles.pontosMain}>
        <div className={styles.pontosTotalWrap}>
          <span className={styles.pontosTotalNum} style={{ color: level.color }}>{streak}</span>
          <span className={styles.pontosTotalLabel}>dia{streak !== 1 ? 's' : ''} seguidos</span>
        </div>
        <span className={styles.pontosMantra}>{allPoints} io</span>
      </div>

      <p className={styles.pontosMantra}>{level.mantra}</p>

      <div className={styles.pontosBarWrap}>
        <div className={styles.pontosBar}>
          <div className={styles.pontosBarFill} style={{ width: `${level.prog}%`, background: level.color }} />
        </div>
        {level.next !== null ? (
          <span className={styles.pontosBarLabel}>
            {level.next - allPoints} io para {level.nextName}
          </span>
        ) : (
          <span className={styles.pontosBarLabel}>Nível máximo</span>
        )}
      </div>
    </div>
  )
}


// ══════════════════════════════════════
// BLOCO I — AÇÃO PRINCIPAL
// ══════════════════════════════════════
function AcaoPrincipalCard({ habits, onToggle }) {
  const [pressing, setPressing] = useState(false)

  const todayDow = new Date().getDay()
  const todayAll = habits.filter(h => Array.isArray(h.days) && h.days.includes(todayDow))
  const pending  = todayAll.filter(h => !h.done)

  const PRI = { alta: 0, media: 1, baixa: 2 }
  const next = [...pending].sort((a, b) => (PRI[a.priority] ?? 1) - (PRI[b.priority] ?? 1))[0]

  const priLabel = { alta: 'Alta prioridade', media: 'Média prioridade', baixa: 'Baixa prioridade' }

  function handleComecar() {
    if (!next || pressing) return
    setPressing(true)
    setTimeout(() => setPressing(false), 600)
    onToggle(next.id)
  }

  return (
    <div className={`card ${styles.acaoCard}`}>
      <p className={styles.acaoLabel}>O QUE FAZER AGORA?</p>

      {!next ? (
        <div className={styles.acaoConcluido}>
          <PiCheckBold size={22} color="#27ae60" />
          <p>Todos os hábitos do dia concluídos!</p>
        </div>
      ) : (
        <>
          <div className={styles.acaoHabit}>
            <span className={styles.acaoNome}>{next.name}</span>
            <div className={styles.acaoBadges}>
              {next.priority && (
                <span className={`${styles.acaoPri} ${styles[`pri_${next.priority}`]}`}>
                  {priLabel[next.priority]}
                </span>
              )}
              {next.estMins && (
                <span className={styles.acaoTempoBadge}>
                  {next.estMins < 60 ? `${next.estMins} min` : `${Math.floor(next.estMins / 60)}h`}
                </span>
              )}
              {next.tags?.map(tag => (
                <span key={tag} className={styles.acaoTag}>{tag}</span>
              ))}
            </div>
          </div>
          <button
            type="button"
            className={`${styles.comecarBtn} ${pressing ? styles.comecarBtnPress : ''}`}
            onClick={handleComecar}
            disabled={pressing}
          >
            <PiArrowRightBold size={13} /> COMEÇAR
          </button>
        </>
      )}
    </div>
  )
}


// ══════════════════════════════════════
// BLOCO II — PROGRESSO
// ══════════════════════════════════════
function ProgressoCard() {
  const { completed, total, rate } = useHabits()

  return (
    <div className={`card ${styles.progressoCard}`}>
      <div className="card-title">
        <PiChartLineUp size={15} /> Hoje
        <span className={styles.progressoPct}>{rate}%</span>
      </div>
      <div className={styles.progressoRow}>
        <div className={styles.progressoPips}>
          {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
            <div key={i} className={`${styles.pip} ${i < completed ? styles.pipDone : ''}`} />
          ))}
        </div>
        <span className={styles.progressoCount}>{completed} / {total} hábitos</span>
      </div>
    </div>
  )
}


// ══════════════════════════════════════
// BLOCO III — CALENDÁRIO
// ══════════════════════════════════════
function CalendarioCard({ history }) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const date = d.toISOString().slice(0, 10)
    const rec  = history[date]
    const rate = rec?.total > 0 ? Math.round(rec.done / rec.total * 100) : 0
    return {
      date,
      rate,
      isToday: i === 6,
      label:   d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    }
  })

  function intensityClass(rate) {
    if (rate === 0)  return styles.calCell0
    if (rate < 40)   return styles.calCell1
    if (rate < 70)   return styles.calCell2
    if (rate < 100)  return styles.calCell3
    return styles.calCell4
  }

  return (
    <div className={`card ${styles.calendarioCard}`}>
      <div className="card-title">
        <PiCalendarDots size={15} /> Semana
      </div>
      <div className={styles.calGrid}>
        {last7.map(day => (
          <div key={day.date} className={styles.calCol}>
            <div className={`${styles.calCell} ${intensityClass(day.rate)} ${day.isToday ? styles.calCellToday : ''}`} />
            <span className={`${styles.calLabel} ${day.isToday ? styles.calLabelToday : ''}`}>
              {day.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}


// ══════════════════════════════════════
// BLOCO IV — INSIGHTS (fixo, sem mover)
// ══════════════════════════════════════
function InsightsCard() {
  return (
    <div className={`card ${styles.insightsCard}`}>
      <div className="card-title">
        <PiLightbulbBold size={15} /> Insights
        <PiLockBold size={12} style={{ marginLeft: 'auto', opacity: .35 }} />
      </div>
      <p className={styles.insightsMsg}>
        Análises personalizadas, padrões de comportamento e relatórios semanais.
      </p>
      <span className={styles.insightsBadge}>Em breve · Plano Pro</span>
    </div>
  )
}


// ══════════════════════════════════════
// HOME — PÁGINA PRINCIPAL
// ══════════════════════════════════════
export default function Home() {
  const { habits, history, toggleHabit, soundOn, resetDay } = useApp()
  const { playCheck, playUncheck }                          = useSound(soundOn)

  // ── Reset automático ao passar da meia-noite ──
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const checkReset = () => {
      const d    = new Date().toISOString().slice(0, 10)
      const last = localStorage.getItem('nex_last_reset')
      if (last !== d) { localStorage.setItem('nex_last_reset', d); resetDay() }
    }
    if (localStorage.getItem('nex_last_reset') !== today) {
      localStorage.setItem('nex_last_reset', today)
    }
    const iv = setInterval(checkReset, 30_000)
    window.addEventListener('focus', checkReset)
    return () => { clearInterval(iv); window.removeEventListener('focus', checkReset) }
  }, [])

  function handleToggle(id) {
    const hab = habits.find(h => h.id === id)
    if (!hab) return
    if (!hab.done) { playCheck(); toast(`+${hab.pts} pts!`) }
    else playUncheck()
    toggleHabit(id)
  }

  return (
    <div className={styles.page}>
      <AcaoPrincipalCard habits={habits} onToggle={handleToggle} />
      <ProgressoCard />
      <CalendarioCard history={history} />
      <PontosCard history={history} />
      <InsightsCard />
    </div>
  )
}

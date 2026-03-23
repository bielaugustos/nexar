import { useEffect, useState, useMemo } from 'react'
import {
  PiArrowRightBold, PiCheckBold, PiCalendarDots,
  PiLightbulbBold, PiLockBold, PiChartLineUp,
  PiTrendUpBold, PiTrendDownBold, PiMinusBold,
  PiCalendarBold, PiFlame, PiStarBold,
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
const WEEK_FULL = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function InsightsCard({ history, habits }) {
  const isPro = (localStorage.getItem('nex_plan') || 'free') === 'pro'

  const insights = useMemo(() => {
    if (!isPro) return null

    const days = Object.entries(history)
      .filter(([, r]) => r?.total > 0)
      .map(([date, r]) => ({ date, rate: Math.round(r.done / r.total * 100) }))

    // Tendência: média últimos 7d vs 7d anteriores
    const avg = (arr) => arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : 0
    const rates7  = Array.from({length:7},  (_,i) => { const d=new Date(); d.setDate(d.getDate()-i);   const r=history[d.toISOString().slice(0,10)]; return r?.total>0 ? Math.round(r.done/r.total*100) : 0 })
    const ratesPrev= Array.from({length:7}, (_,i) => { const d=new Date(); d.setDate(d.getDate()-7-i); const r=history[d.toISOString().slice(0,10)]; return r?.total>0 ? Math.round(r.done/r.total*100) : 0 })
    const avg7  = avg(rates7)
    const avgPrev = avg(ratesPrev)
    const diff = avg7 - avgPrev

    // Melhor dia da semana (histórico completo)
    const dowTotals = Array(7).fill(0).map(() => ({ done: 0, total: 0 }))
    days.forEach(({ date, rate }) => {
      const dow = new Date(date + 'T12:00:00').getDay()
      dowTotals[dow].total++
      dowTotals[dow].done += rate
    })
    const bestDow = dowTotals.reduce((best, cur, i) =>
      cur.total > 0 && (cur.done / cur.total) > (dowTotals[best].done / (dowTotals[best].total||1)) ? i : best, 0)

    // Consistência últimos 30 dias
    const active30 = Array.from({length:30}, (_,i) => {
      const d=new Date(); d.setDate(d.getDate()-i)
      const r=history[d.toISOString().slice(0,10)]
      return r?.done > 0 ? 1 : 0
    }).reduce((s,x)=>s+x, 0)

    // Hábito mais consistente
    let bestHabit = null
    let bestRate = -1
    habits.filter(h => !h.archived).forEach(h => {
      let done=0, total=0
      for (let i=1; i<=30; i++) {
        const d=new Date(); d.setDate(d.getDate()-i)
        const dow=d.getDay()
        if (!Array.isArray(h.days) || !h.days.includes(dow)) continue
        total++
        if (history[d.toISOString().slice(0,10)]?.habits?.[h.id]) done++
      }
      const r = total > 0 ? done/total : 0
      if (r > bestRate) { bestRate=r; bestHabit=h }
    })

    return { avg7, diff, bestDow, active30, bestHabit, bestRate: Math.round(bestRate*100) }
  }, [isPro, history, habits])

  if (!isPro) {
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

  const TrendIcon = insights.diff > 3 ? PiTrendUpBold : insights.diff < -3 ? PiTrendDownBold : PiMinusBold
  const trendColor = insights.diff > 3 ? '#27ae60' : insights.diff < -3 ? '#e74c3c' : 'var(--ink3)'
  const trendShort = insights.diff > 3 ? `+${insights.diff}%` : insights.diff < -3 ? `${insights.diff}%` : 'Estável'

  // Trilha dos últimos 14 dias
  const trail14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const r = history[d.toISOString().slice(0, 10)]
    const rate = r?.total > 0 ? r.done / r.total : -1
    return { rate, isToday: i === 13 }
  })

  return (
    <div className={`card ${styles.insightsCard} ${styles.insightsCardPro}`}>
      <div className="card-title">
        <PiLightbulbBold size={15} /> Insights
        <span className={styles.insightsPeriodBadge}>7 dias</span>
      </div>

      {/* Hero */}
      <div className={styles.insightsHero}>
        <div className={styles.insightsHeroLeft}>
          <span className={styles.insightsHeroPct}>{insights.avg7}<span className={styles.insightsHeroUnit}>%</span></span>
          <span className={styles.insightsHeroLabel}>conclusão média</span>
        </div>
        <div className={styles.insightsTrendPill} style={{ color: trendColor, borderColor: trendColor }}>
          <TrendIcon size={11} />
          <span>{trendShort}</span>
          <span className={styles.insightsTrendSub}>vs semana anterior</span>
        </div>
      </div>

      {/* Trilha 14 dias */}
      <div className={styles.insightsTrail}>
        {trail14.map((day, i) => (
          <div
            key={i}
            className={`${styles.trailDot}
              ${day.rate < 0   ? styles.trailDotEmpty : ''}
              ${day.rate >= 0 && day.rate < 0.4  ? styles.trailDotLow  : ''}
              ${day.rate >= 0.4 && day.rate < 0.8 ? styles.trailDotMid  : ''}
              ${day.rate >= 0.8                   ? styles.trailDotHigh : ''}
              ${day.isToday ? styles.trailDotToday : ''}
            `}
          />
        ))}
      </div>

      {/* Grid 3 stats */}
      <div className={styles.insightsGrid}>
        <div className={styles.insightChip}>
          <div className={styles.insightChipAccent} style={{ background: 'var(--gold-dk)' }} />
          <PiCalendarBold size={13} style={{ color: 'var(--gold-dk)', flexShrink: 0 }} />
          <div className={styles.insightChipBody}>
            <span className={styles.insightChipLabel}>Melhor dia</span>
            <span className={styles.insightChipValue}>{WEEK_FULL[insights.bestDow]}</span>
          </div>
        </div>

        <div className={styles.insightChip}>
          <div className={styles.insightChipAccent} style={{ background: '#3498db' }} />
          <PiFlame size={13} style={{ color: '#3498db', flexShrink: 0 }} />
          <div className={styles.insightChipBody}>
            <span className={styles.insightChipLabel}>Constância</span>
            <span className={styles.insightChipValue}>{insights.active30}<span className={styles.insightChipSub}>/30</span></span>
          </div>
        </div>

        {insights.bestHabit && (
          <div className={styles.insightChip}>
            <div className={styles.insightChipAccent} style={{ background: '#8e44ad' }} />
            <PiStarBold size={13} style={{ color: '#8e44ad', flexShrink: 0 }} />
            <div className={styles.insightChipBody}>
              <span className={styles.insightChipLabel}>Top hábito</span>
              <span className={styles.insightChipValue} title={insights.bestHabit.name}>{insights.bestHabit.name}</span>
            </div>
          </div>
        )}
      </div>
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
    // Lê/escreve via JSON para ser consistente com AppContext (loadStorage/saveStorage)
    function readLast() {
      try { return JSON.parse(localStorage.getItem('nex_last_reset') || '""') } catch { return '' }
    }
    function writeLast(d) { localStorage.setItem('nex_last_reset', JSON.stringify(d)) }

    const today = new Date().toISOString().slice(0, 10)
    const checkReset = () => {
      const d = new Date().toISOString().slice(0, 10)
      if (readLast() !== d) { writeLast(d); resetDay() }
    }
    if (readLast() !== today) writeLast(today)
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
      <InsightsCard history={history} habits={habits} />
    </div>
  )
}

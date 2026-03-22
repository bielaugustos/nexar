import { useMemo, useState } from 'react'
import {
  PiChartBarBold, PiTrendUpBold, PiCalendarBold,
  PiTargetBold, PiFireBold, PiTrophyBold,
  PiStarBold, PiLightningBold,
} from 'react-icons/pi'
import { useApp }    from '../context/AppContext'
import { useHabits } from '../hooks/useHabits'
import { useStats }  from '../hooks/useStats'
import styles        from './Stats.module.css'

const WEEK_FULL  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const WEEK_SHORT = ['D','S','T','Q','Q','S','S']
const AMBER      = '#f0c020'
const AMBER_DK   = '#b08000'

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════
function fmt(n) { return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n) }

function habitStreaks(habitId, history) {
  let current = 0, record = 0, run = 0
  const sorted = Object.keys(history).sort()
  for (const k of sorted) {
    if (history[k]?.habits?.[habitId]) { run++; record = Math.max(record, run) }
    else run = 0
  }
  // Streak atual — conta de hoje para o passado até quebrar a sequência
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const k = d.toISOString().slice(0, 10)
    if (history[k]?.habits?.[habitId]) current++
    else break
  }
  return { current, record }
}

function habitRate(habitId, history) {
  const days = Object.keys(history).filter(k => history[k]?.total > 0)
  if (!days.length) return 0
  const done = days.filter(k => history[k]?.habits?.[habitId]).length
  return Math.round(done / days.length * 100)
}

// ══════════════════════════════════════
// 1. TAXA POR DIA DA SEMANA
// Revela padrões: "Sexta é seu ponto fraco"
// ══════════════════════════════════════
function WeekdayChart({ history }) {
  const data = useMemo(() => {
    const counts = Array(7).fill(0)
    const totals = Array(7).fill(0)
    Object.entries(history).forEach(([date, rec]) => {
      if (!rec?.total) return
      const dow = new Date(date + 'T12:00:00').getDay()
      counts[dow] += rec.done
      totals[dow] += rec.total
    })
    return WEEK_SHORT.map((lbl, i) => ({
      lbl,
      full: WEEK_FULL[i],
      rate: totals[i] > 0 ? Math.round(counts[i] / totals[i] * 100) : null,
    }))
  }, [history])

  const max  = Math.max(...data.map(d => d.rate ?? 0), 1)
  const best = data.reduce((a, b) => (b.rate ?? 0) > (a.rate ?? 0) ? b : a, data[0])
  const worst = data.filter(d => d.rate !== null)
                    .reduce((a, b) => b.rate < a.rate ? b : a, data.find(d => d.rate !== null) || data[0])

  return (
    <div className="card">
      <div className="card-title"><PiCalendarBold size={15}/> Taxa por Dia da Semana</div>

      <div className={styles.wdChart}>
        {data.map(d => (
          <div key={d.lbl} className={styles.wdCol}>
            <span className={styles.wdPct}>{d.rate !== null ? `${d.rate}%` : '—'}</span>
            <div className={styles.wdBarWrap}>
              <div
                className={styles.wdBar}
                style={{
                  height: d.rate !== null ? `${Math.round(d.rate / max * 100)}%` : '3px',
                  background: d.rate === best.rate && d.rate !== null ? AMBER
                    : d.rate === worst.rate && d.rate !== null ? '#e74c3c'
                    : 'var(--surface)',
                  borderColor: d.rate === best.rate && d.rate !== null ? AMBER_DK
                    : d.rate === worst.rate && d.rate !== null ? '#922b21'
                    : 'var(--border)',
                }}
              />
            </div>
            <span className={styles.wdLbl}>{d.lbl}</span>
          </div>
        ))}
      </div>

      {best.rate !== null && (
        <div className={styles.insight}>
          <PiLightningBold size={12} color={AMBER_DK}/>
          {best.full} é seu melhor dia ({best.rate}%).
          {worst.rate !== null && worst.rate < best.rate - 15
            ? ` ${worst.full} precisa de atenção (${worst.rate}%).`
            : ' Consistência equilibrada na semana!'}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// 2. TENDÊNCIA 30 DIAS (linha)
// Suavizada com média móvel de 5 dias
// ══════════════════════════════════════
function TrendChart({ history }) {
  const points = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 29 + i)
      const k = d.toISOString().slice(0, 10)
      const rec = history[k]
      return rec?.total > 0 ? Math.round(rec.done / rec.total * 100) : 0
    })
    // Média móvel de 5 dias
    return days.map((_, i) => {
      const slice = days.slice(Math.max(0, i - 2), i + 3)
      return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length)
    })
  }, [history])

  const W = 340, H = 80
  const max = Math.max(...points, 1)

  const polyline = points.map((v, i) => {
    const x = Math.round(i / (points.length - 1) * W)
    const y = Math.round(H - (v / max) * H)
    return `${x},${y}`
  }).join(' ')

  const lastVal = points[points.length - 1]
  const firstVal = points[0]
  const trend = lastVal - firstVal

  return (
    <div className="card">
      <div className="card-title"><PiTrendUpBold size={15}/> Tendência — 30 Dias</div>

      <div className={styles.trendSvgWrap}>
        <svg viewBox={`0 0 ${W} ${H + 4}`} width="100%" style={{ overflow: 'visible' }}>
          {/* Grade horizontal */}
          {[25, 50, 75, 100].map(v => (
            <line key={v}
              x1={0} y1={Math.round(H - v / max * H)}
              x2={W} y2={Math.round(H - v / max * H)}
              stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4"
            />
          ))}
          {/* Área preenchida */}
          <polygon
            points={`0,${H} ${polyline} ${W},${H}`}
            fill={AMBER} fillOpacity="0.15"
          />
          {/* Linha */}
          <polyline
            points={polyline}
            fill="none"
            stroke={AMBER}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Ponto atual */}
          <circle
            cx={W}
            cy={Math.round(H - (lastVal / max) * H)}
            r="4"
            fill={AMBER}
            stroke="var(--bg)"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className={styles.trendFooter}>
        <span className={styles.trendLbl}>30 dias atrás</span>
        <div className={styles.trendBadge} style={{
          color: trend > 5 ? '#27ae60' : trend < -5 ? '#e74c3c' : 'var(--ink3)',
          borderColor: trend > 5 ? '#27ae60' : trend < -5 ? '#e74c3c' : 'var(--border)',
        }}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}% {trend > 5 ? 'melhora' : trend < -5 ? 'queda' : 'estável'}
        </div>
        <span className={styles.trendLbl}>hoje</span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// 3. STREAKS POR HÁBITO
// Barras horizontais: atual vs recorde
// ══════════════════════════════════════
function StreaksChart({ habits, history }) {
  const data = useMemo(() =>
    habits.map(h => ({
      ...h,
      ...habitStreaks(h.id, history),
    })).sort((a, b) => b.record - a.record)
  , [habits, history])

  const maxRecord = Math.max(...data.map(d => d.record), 1)

  return (
    <div className="card">
      <div className="card-title"><PiFireBold size={15}/> Streaks por Hábito</div>

      {data.length === 0 ? (
        <div className="empty-state" style={{ padding: '16px 0' }}>
          <p>Sem dados suficientes ainda.</p>
        </div>
      ) : (
        <div className={styles.streakList}>
          {data.map(h => (
            <div key={h.id} className={styles.streakRow}>
              <div className={styles.streakName}>{h.name}</div>
              <div className={styles.streakBars}>
                {/* Recorde */}
                <div className={styles.streakBarWrap} title={`Recorde: ${h.record} dias`}>
                  <div
                    className={styles.streakBarRecord}
                    style={{ width: `${Math.round(h.record / maxRecord * 100)}%` }}
                  />
                </div>
                {/* Atual */}
                <div className={styles.streakBarWrap} title={`Atual: ${h.current} dias`}>
                  <div
                    className={styles.streakBarCurrent}
                    style={{ width: `${Math.round(h.current / maxRecord * 100)}%` }}
                  />
                </div>
              </div>
              <div className={styles.streakNums}>
                <span className={styles.streakCur}>{h.current}d</span>
                <span className={styles.streakRec}>/{h.record}d</span>
              </div>
            </div>
          ))}
          <div className={styles.streakLegend}>
            <span><span className={styles.legDot} style={{ background: AMBER }}/> Atual</span>
            <span><span className={styles.legDot} style={{ background: 'var(--border)' }}/> Recorde</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// 4. RANKING DE CONSISTÊNCIA
// Taxa de conclusão histórica por hábito
// ══════════════════════════════════════
function ConsistencyRanking({ habits, history }) {
  const data = useMemo(() =>
    habits.map(h => ({
      ...h,
      rate: habitRate(h.id, history),
    })).sort((a, b) => b.rate - a.rate)
  , [habits, history])

  return (
    <div className="card">
      <div className="card-title"><PiTargetBold size={15}/> Consistência por Hábito</div>
      {data.length === 0 ? (
        <div className="empty-state" style={{ padding: '16px 0' }}>
          <p>Sem dados suficientes ainda.</p>
        </div>
      ) : (
        <div className={styles.rankList}>
          {data.map((h, i) => (
            <div key={h.id} className={styles.rankRow}>
              <div className={styles.rankPos} style={{
                background: i === 0 ? AMBER : i === 1 ? 'var(--surface)' : 'transparent',
                color: i === 0 ? '#111' : 'var(--ink3)',
                border: i < 2 ? `2px solid var(--border)` : 'none',
              }}>
                {i === 0 ? <PiTrophyBold size={12}/> : i + 1}
              </div>
              <div className={styles.rankInfo}>
                <div className={styles.rankName}>{h.name}</div>
                <div className={styles.rankBarWrap}>
                  <div
                    className={styles.rankBar}
                    style={{
                      width: `${h.rate}%`,
                      background: h.rate >= 80 ? '#27ae60' : h.rate >= 50 ? AMBER : '#e74c3c',
                    }}
                  />
                </div>
              </div>
              <div className={styles.rankRate} style={{
                color: h.rate >= 80 ? '#27ae60' : h.rate >= 50 ? AMBER_DK : '#e74c3c',
              }}>
                {h.rate}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// 5. DISTRIBUIÇÃO POR PRIORIDADE
// De tudo feito, quanto era alta/média/baixa
// ══════════════════════════════════════
function PriorityChart({ habits, history }) {
  const data = useMemo(() => {
    const counts = { alta: 0, media: 0, baixa: 0 }
    const colors = { alta: '#e74c3c', media: AMBER, baixa: '#27ae60' }
    const labels = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }

    Object.values(history).forEach(rec => {
      if (!rec?.habits) return
      Object.entries(rec.habits).forEach(([id, done]) => {
        if (!done) return
        const h = habits.find(h => String(h.id) === String(id))
        if (h?.priority) counts[h.priority]++
      })
    })

    const total = counts.alta + counts.media + counts.baixa
    return Object.entries(counts).map(([p, n]) => ({
      priority: p,
      label: labels[p],
      color: colors[p],
      count: n,
      pct: total > 0 ? Math.round(n / total * 100) : 0,
    }))
  }, [habits, history])

  const total = data.reduce((a, d) => a + d.count, 0)

  return (
    <div className="card">
      <div className="card-title"><PiStarBold size={15}/> Distribuição por Prioridade</div>

      {/* Barra empilhada */}
      <div className={styles.stackBar}>
        {data.filter(d => d.pct > 0).map(d => (
          <div
            key={d.priority}
            className={styles.stackSeg}
            style={{ width: `${d.pct}%`, background: d.color }}
            title={`${d.label}: ${d.count} (${d.pct}%)`}
          />
        ))}
      </div>

      {/* Legenda */}
      <div className={styles.priLegend}>
        {data.map(d => (
          <div key={d.priority} className={styles.priLegRow}>
            <span className={styles.priLegDot} style={{ background: d.color }}/>
            <span className={styles.priLegLbl}>{d.label}</span>
            <span className={styles.priLegCount}>{d.count} hábitos</span>
            <span className={styles.priLegPct} style={{ color: d.color }}>{d.pct}%</span>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className={styles.insight}>
          <PiTrophyBold size={12} color={AMBER_DK}/>
          {total} conclusões registradas no total.
          {data[0].pct > 50
            ? ` Foco em hábitos de ${data[0].label.toLowerCase()} prioridade!`
            : ' Bom equilíbrio entre prioridades.'}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// RECORDES PESSOAIS — sempre visível,
// sem emojis nos valores, visual limpo
// ══════════════════════════════════════
function PersonalRecords({ history, streak, daysActive, allPoints }) {
  const [activeCard, setActiveCard] = useState(null)

  const totalDone = Object.values(history).reduce((a, r) => a + (r?.done || 0), 0)
  const bestDay   = Math.max(...Object.values(history).map(r => r?.done || 0), 0)
  const longestStreak = useMemo(() => {
    let max = 0, run = 0
    Object.keys(history).sort().forEach(k => {
      if (history[k]?.done > 0) { run++; max = Math.max(max, run) }
      else run = 0
    })
    return max
  }, [history])

  // Melhor mês
  const bestMonth = useMemo(() => {
    const months = {}
    Object.entries(history).forEach(([k, r]) => {
      const m = k.slice(0,7)
      if (!months[m]) months[m] = 0
      months[m] += r?.done || 0
    })
    const top = Object.entries(months).sort((a,b)=>b[1]-a[1])[0]
    if (!top) return null
    const [year, month] = top[0].split('-')
    return { label: new Date(Number(year), Number(month)-1, 1).toLocaleDateString('pt-BR', {month:'long', year:'numeric'}), count: top[1] }
  }, [history])

  const DETAILS = {
    'Maior sequência': longestStreak > 0
      ? `Sua maior sequência foi de ${longestStreak} dias seguidos. Streaks longas constroem hábitos duradouros.`
      : 'Complete hábitos em dias seguidos para registrar uma sequência.',
    'Sequência atual': streak > 0
      ? `Você está em sequência há ${streak} dias. Não quebre agora!`
      : 'Faça pelo menos 1 hábito hoje para começar uma sequência.',
    'Melhor dia': bestDay > 0
      ? `Seu recorde diário é ${bestDay} hábito${bestDay!==1?'s':''} em um único dia.`
      : 'Ainda sem dados.',
    'Dias ativos': daysActive > 0
      ? `Você teve atividade em ${daysActive} dias no total.${bestMonth ? ` Melhor mês: ${bestMonth.label} (${bestMonth.count} hábitos).` : ''}`
      : 'Complete hábitos para registrar dias ativos.',
    'Total concluídos': totalDone > 0
      ? `${fmt(totalDone)} hábitos concluídos no total. Cada um conta!`
      : 'Ainda sem hábitos concluídos.',
    'Pontos': allPoints > 0
      ? `${fmt(allPoints)} pontos acumulados. Use-os na Loja de Conquistas no Perfil.`
      : 'Complete hábitos para ganhar pontos.',
  }

  const records = [
    { label: 'Maior sequência',  val: longestStreak, unit: 'dias',    empty: '—' },
    { label: 'Sequência atual',  val: streak,        unit: 'dias',    empty: '—' },
    { label: 'Melhor dia',       val: bestDay,       unit: 'hábitos', empty: '—' },
    { label: 'Dias ativos',      val: daysActive,    unit: 'dias',    empty: '0' },
    { label: 'Total concluídos', val: totalDone,     unit: '',        empty: '0' },
    { label: 'Pontos',           val: allPoints,     unit: 'pts',     empty: '0' },
  ]

  return (
    <div className="card">
      <div className="card-title"><PiTrophyBold size={15}/> Recordes Pessoais</div>
      <div className={styles.recordsGrid}>
        {records.map((r, i) => (
          <button
            key={r.label}
            type="button"
            className={[styles.recordCard, activeCard === r.label && styles.recordCardActive].filter(Boolean).join(' ')}
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={() => setActiveCard(a => a === r.label ? null : r.label)}
          >
            <span className={styles.recordVal}>
              {r.val > 0 ? fmt(r.val) : r.empty}
              {r.val > 0 && r.unit && <span className={styles.recordUnit}> {r.unit}</span>}
            </span>
            <span className={styles.recordLbl}>{r.label}</span>
          </button>
        ))}
      </div>

      {/* Detalhe expandido ao clicar */}
      {activeCard && (
        <div className={styles.recordDetail}>
          <p className={styles.recordDetailText}>{DETAILS[activeCard]}</p>
        </div>
      )}

      {totalDone === 0 && (
        <p className={styles.recordsHint}>
          Complete hábitos para ver seus recordes aqui.
        </p>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// STATS — PÁGINA PRINCIPAL
// ══════════════════════════════════════
export default function Stats() {
  const { habits, history }          = useApp()
  const { allPoints }                = useHabits()
  const { streak, daysActive, last7 } = useStats(history)

  const hasData = Object.keys(history).length > 2

  // Recordes sempre visíveis.
  // Gráficos surgem progressivamente conforme o usuário acumula dados.
  const dayCount = Object.keys(history).filter(k => history[k]?.done > 0).length

  return (
    <main style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Sempre visível — mesmo sem dados */}
      <PersonalRecords
        history={history}
        streak={streak}
        daysActive={daysActive}
        allPoints={allPoints}
      />

      {/* Surge após 3 dias com dados */}
      {dayCount >= 3 && <TrendChart history={history} />}

      {/* Surge após 7 dias com dados */}
      {dayCount >= 7 && <WeekdayChart history={history} />}

      {/* Surge após 7 dias */}
      {dayCount >= 7 && <ConsistencyRanking habits={habits} history={history} />}

      {/* Surge após 14 dias */}
      {dayCount >= 14 && <StreaksChart habits={habits} history={history} />}

      {/* Surge após 14 dias */}
      {dayCount >= 14 && <PriorityChart habits={habits} history={history} />}

      {/* Mensagem motivacional enquanto os gráficos ainda não apareceram */}
      {dayCount < 7 && (
        <div className="card" style={{ textAlign:'center', padding:'16px', color:'var(--ink3)', fontSize:12 }}>
          <PiChartBarBold size={28} color="var(--ink3)" style={{ margin:'0 auto 8px', display:'block' }}/>
          {dayCount < 3
            ? `Mais ${3 - dayCount} dia${3-dayCount!==1?'s':''} para o primeiro gráfico aparecer.`
            : `Mais ${7 - dayCount} dia${7-dayCount!==1?'s':''} para mais gráficos aparecerem.`
          }
        </div>
      )}

    </main>
  )
}

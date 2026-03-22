import { useState, useEffect, useMemo, useRef } from 'react'
import {
  PiChartBarBold, PiTrendUpBold, PiCalendarBold,
  PiTargetBold, PiFireBold, PiTrophyBold,
  PiStarBold, PiLightningBold, PiMedalBold,
  PiCheckCircleFill, PiArrowUpBold, PiQuestionBold,
  PiPlantBold, PiHammerBold, PiCoinsBold,
  PiLightbulbBold, PiSunBold, PiArrowClockwiseBold, PiFlagBold,
} from 'react-icons/pi'
import { loadStorage }  from '../services/storage'
import { useApp }       from '../context/AppContext'
import { useHabits }    from '../hooks/useHabits'
import { useStats }     from '../hooks/useStats'
import { useSound }     from '../hooks/useSound'
import { toast }        from '../components/Toast'
import { calcLevel }    from '../services/levels'
import styles           from './Progress.module.css'

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
const WEEK_FULL  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const WEEK_SHORT = ['D','S','T','Q','Q','S','S']
const AMBER      = '#f0c020'
const AMBER_DK   = '#b08000'

function fmt(n) { return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n) }

function habitStreaks(habitId, history) {
  let current = 0, record = 0, run = 0
  const sorted = Object.keys(history).sort()
  for (const k of sorted) {
    if (history[k]?.habits?.[habitId]) { run++; record = Math.max(record, run) }
    else run = 0
  }
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

// ─────────────────────────────────────────
// CONQUISTAS — DADOS
// ─────────────────────────────────────────
const BADGES = [
  {
    id: 'first', Icon: PiPlantBold, name: 'Primeiro Passo',
    desc: 'Complete seu primeiro hábito',
    howto: 'Marque qualquer hábito como feito',
    check: (h) => h.some(x => x.done),
    progress: (h) => h.some(x => x.done) ? 100 : 0,
    label: (h) => `${h.filter(x=>x.done).length}/1`,
  },
  {
    id: 'half', Icon: PiLightningBold, name: 'Meio Caminho',
    desc: 'Complete 50% dos hábitos do dia',
    howto: 'Complete metade dos hábitos cadastrados',
    check: (h) => h.length > 0 && h.filter(x=>x.done).length / h.length >= 0.5,
    progress: (h) => h.length > 0 ? Math.min(100, Math.round(h.filter(x=>x.done).length/h.length*200)) : 0,
    label: (h) => `${h.filter(x=>x.done).length}/${Math.ceil(h.length/2)}`,
  },
  {
    id: 'full', Icon: PiTrophyBold, name: 'Dia Perfeito',
    desc: 'Complete 100% dos hábitos num dia',
    howto: 'Marque todos os hábitos do dia como feitos',
    check: (h) => h.length > 0 && h.every(x => x.done),
    progress: (h) => h.length > 0 ? Math.round(h.filter(x=>x.done).length/h.length*100) : 0,
    label: (h) => `${h.filter(x=>x.done).length}/${h.length}`,
  },
  {
    id: 'streak3', Icon: PiFireBold, name: 'Chama Viva',
    desc: '3 dias consecutivos ativos',
    howto: 'Complete pelo menos 1 hábito em 3 dias seguidos',
    check: (_,__,s) => s >= 3,
    progress: (_,__,s) => Math.min(100, Math.round(s/3*100)),
    label: (_,__,s) => `${Math.min(s,3)}/3 dias`,
  },
  {
    id: 'streak7', Icon: PiFireBold, name: 'Semana Completa',
    desc: '7 dias consecutivos sem parar',
    howto: 'Mantenha a sequência por 7 dias seguidos',
    check: (_,__,s) => s >= 7,
    progress: (_,__,s) => Math.min(100, Math.round(s/7*100)),
    label: (_,__,s) => `${Math.min(s,7)}/7 dias`,
  },
  {
    id: 'veteran', Icon: PiStarBold, name: 'Veterano',
    desc: '30 dias ativos no total',
    howto: 'Acumule 30 dias com pelo menos 1 hábito feito',
    check: (_,hist) => Object.values(hist).filter(r=>r?.done>0).length >= 30,
    progress: (_,hist) => Math.min(100, Math.round(Object.values(hist).filter(r=>r?.done>0).length/30*100)),
    label: (_,hist) => `${Object.values(hist).filter(r=>r?.done>0).length}/30 dias`,
  },
  {
    id: 'builder', Icon: PiHammerBold, name: 'Arquiteto',
    desc: 'Cadastre 7 ou mais hábitos',
    howto: 'Adicione 7 hábitos na tela de Habits',
    check: (h) => h.length >= 7,
    progress: (h) => Math.min(100, Math.round(h.length/7*100)),
    label: (h) => `${h.length}/7 hábitos`,
  },
  {
    id: 'pts500', Icon: PiCoinsBold, name: 'Acumulador',
    desc: 'Acumule 500 io no total',
    howto: 'Complete hábitos diariamente até atingir 500 io',
    check: (_,__,___,pts) => pts >= 500,
    progress: (_,__,___,pts) => Math.min(100, Math.round(pts/500*100)),
    label: (_,__,___,pts) => `${Math.min(pts,500)}/500 io`,
  },
]

function buildChallenges(habits, history) {
  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)

  const ws = new Date(today)
  const dow = ws.getDay()
  ws.setDate(ws.getDate() - (dow === 0 ? 6 : dow - 1))
  ws.setHours(0, 0, 0, 0)

  const lastWs = new Date(ws)
  lastWs.setDate(lastWs.getDate() - 7)

  let weekDone = 0, perfectDays = 0, activeDays = 0
  let maxDayDone = 0, lastWeekDone = 0, highRateDays = 0, weekendActive = 0
  const habitCountThisWeek = {}

  for (let i = 0; i < 7; i++) {
    const d = new Date(ws); d.setDate(ws.getDate() + i)
    if (d > today) break
    const k = d.toISOString().slice(0, 10)
    if (k === todayKey) continue  // hoje é tratado separadamente abaixo
    const rec = history[k]
    if (rec?.done > 0) {
      activeDays++
      weekDone += rec.done
      maxDayDone = Math.max(maxDayDone, rec.done)
      if (rec.total > 0 && rec.done === rec.total) perfectDays++
      if (rec.total > 0 && rec.done / rec.total >= 0.8) highRateDays++
      Object.keys(rec.habits || {}).forEach(hid => {
        if (rec.habits[hid]) habitCountThisWeek[hid] = (habitCountThisWeek[hid] || 0) + 1
      })
      const dayOfWeek = new Date(k + 'T12:00:00').getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) weekendActive = 1
    }
  }

  for (let i = 0; i < 7; i++) {
    const d = new Date(lastWs); d.setDate(lastWs.getDate() + i)
    const k = d.toISOString().slice(0, 10)
    lastWeekDone += history[k]?.done || 0
  }

  // hoje via estado ao vivo (evita double-counting com history)
  const todayDone = habits.filter(x => x.done).length
  const totalToday = habits.length
  weekDone += todayDone
  if (todayDone > 0) {
    activeDays++
    maxDayDone = Math.max(maxDayDone, todayDone)
    if (totalToday > 0 && todayDone === totalToday) perfectDays++
    if (totalToday > 0 && todayDone / totalToday >= 0.8) highRateDays++
    habits.forEach(h => {
      if (h.done) habitCountThisWeek[h.id] = (habitCountThisWeek[h.id] || 0) + 1
    })
    const todayDow = today.getDay()
    if (todayDow === 0 || todayDow === 6) weekendActive = 1
  }

  const bestHabitDays = Object.values(habitCountThisWeek).length > 0
    ? Math.max(...Object.values(habitCountThisWeek))
    : 0
  const mondayKey = ws.toISOString().slice(0, 10)
  const mondayActive = mondayKey === todayKey
    ? (todayDone > 0 ? 1 : 0)
    : (history[mondayKey]?.done > 0 ? 1 : 0)
  const lastWeekTarget = Math.max(lastWeekDone + 1, 5)

  return [
    { id:'c1',  Icon:PiCheckCircleFill,     title:'20 hábitos esta semana',     desc:'Some todos os hábitos concluídos de seg a dom.',         reward:'+50 io bônus',   target:20,             current:weekDone,      weekly:true },
    { id:'c2',  Icon:PiFireBold,            title:'3 dias perfeitos',           desc:'Complete 100% dos hábitos em 3 dias diferentes.',        reward:'Badge Perfeito', target:3,              current:perfectDays,   weekly:true },
    { id:'c3',  Icon:PiCalendarBold,        title:'Ativo 7 dias seguidos',      desc:'Complete ao menos 1 hábito por dia durante 7 dias.',     reward:'Badge Veterano', target:7,              current:activeDays,    weekly:true },
    { id:'c4',  Icon:PiLightbulbBold,       title:'Arrancada',                  desc:'Complete 5 ou mais hábitos em um único dia.',            reward:'+20 io',         target:5,              current:maxDayDone },
    { id:'c5',  Icon:PiSunBold,             title:'Segunda Determinada',        desc:'Complete ao menos 1 hábito na segunda-feira.',           reward:'+10 io',         target:1,              current:mondayActive },
    { id:'c6',  Icon:PiArrowClockwiseBold,  title:'Fidelidade',                 desc:'Complete o mesmo hábito 5 vezes nesta semana.',          reward:'+25 io',         target:5,              current:bestHabitDays },
    { id:'c7',  Icon:PiArrowUpBold,         title:'Superação',                  desc:'Supere o total de hábitos da semana passada.',           reward:'+35 io',         target:lastWeekTarget, current:weekDone },
    { id:'c8',  Icon:PiTargetBold,          title:'Precisão',                   desc:'Tenha taxa acima de 80% em pelo menos 2 dias.',          reward:'+30 io',         target:2,              current:highRateDays },
    { id:'c9',  Icon:PiFlagBold,            title:'Guerreiro de Fim de Semana', desc:'Complete hábitos no sábado ou domingo.',                 reward:'+15 io',         target:1,              current:weekendActive },
    { id:'c10', Icon:PiLightningBold,       title:'Potência Máxima',            desc:'Complete 10 ou mais hábitos em um único dia.',           reward:'+40 io',         target:10,             current:maxDayDone },
  ]
}

// ─────────────────────────────────────────
// CONQUISTAS — COMPONENTES
// ─────────────────────────────────────────
function BadgeCard({ badge, habits, history, streak, allPoints, prevEarned }) {
  const earned       = badge.check(habits, history, streak, allPoints)
  const justUnlocked = earned && !prevEarned.has(badge.id)
  const { soundOn }  = useApp()
  const { playBadge } = useSound(soundOn)
  const [showHow, setShowHow] = useState(false)

  useEffect(() => {
    if (justUnlocked) { playBadge(); toast(`"${badge.name}" conquistado!`) }
  }, [justUnlocked])

  const prog = badge.progress(habits, history, streak, allPoints)
  const lbl  = badge.label(habits, history, streak, allPoints)

  return (
    <div className={`${styles.badgeCard} ${earned ? styles.earned : ''} ${justUnlocked ? styles.justUnlocked : ''}`}>
      <div className={styles.badgeTop}>
        <span className={styles.badgeIcon}><badge.Icon size={22}/></span>
        <div className={styles.badgeInfo}>
          <div className={styles.badgeName}>{badge.name}</div>
          <div className={styles.badgeDesc}>{badge.desc}</div>
        </div>
        {!earned && (
          <button type="button" className={styles.howtoBtn}
            onClick={() => setShowHow(s => !s)} title="Como conquistar">
            <PiQuestionBold size={13}/>
          </button>
        )}
        {earned && <span className={styles.earnedMark}><PiCheckCircleFill size={16} color="#27ae60"/></span>}
      </div>
      {showHow && !earned && <p className={styles.howtoText}><PiLightbulbBold size={11} color="var(--gold-dk)"/> {badge.howto}</p>}
      {!earned && (
        <div className={styles.badgeProgress}>
          <div className={styles.bpBar}><div className={styles.bpFill} style={{ width:`${prog}%` }}/></div>
          <span className={styles.bpTxt}>{lbl}</span>
        </div>
      )}
    </div>
  )
}

function ChallengeCard({ ch }) {
  const prog = Math.min(100, Math.round(ch.current / ch.target * 100))
  const done = ch.current >= ch.target
  return (
    <div className={`${styles.challengeCard} ${done ? styles.doneCh : ''}`}>
      <div className={styles.chHeader}>
        <span className={styles.chIcon}><ch.Icon size={18}/></span>
        <div>
          <div className={styles.chTitle}>{ch.title}</div>
          <div className={styles.chDesc}>{ch.desc}</div>
        </div>
        <span className={styles.chReward}>{ch.reward}</span>
      </div>
      {done ? (
        <div className={styles.chDone}><PiCheckCircleFill size={13}/> Concluído!</div>
      ) : (
        <div className={styles.chProgRow}>
          <div className={styles.chBar}><div className={styles.chBarFill} style={{ width:`${prog}%` }}/></div>
          <span className={styles.chProg}>{ch.current}/{ch.target}</span>
        </div>
      )}
      {ch.weekly && <span className={styles.chExpiry}>↻ Renova segunda-feira</span>}
    </div>
  )
}

// ─────────────────────────────────────────
// GUIA DE GRÁFICO
// ─────────────────────────────────────────
function ChartGuidePanel({ steps }) {
  return (
    <div className={styles.guidePanel}>
      <ol className={styles.guideList}>
        {steps.map((s, i) => (
          <li key={i} className={styles.guideItem}>
            <span className={styles.guideNum}>{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ─────────────────────────────────────────
// GUIAS DE LEITURA DOS GRÁFICOS
// ─────────────────────────────────────────
const TREND_GUIDE = [
  'A linha sobe quando você conclui mais hábitos e desce quando conclui menos.',
  'O ponto dourado marca hoje — compare com o início à esquerda para ver sua evolução.',
  'O badge no rodapé indica a tendência: ↑ melhora, ↓ queda, → estável nos últimos 30 dias.',
]
const WEEKDAY_GUIDE = [
  'Cada coluna representa um dia da semana com sua taxa média de conclusão.',
  'Dourado = seu dia mais produtivo; vermelho = dia que precisa de atenção.',
  'Compare as alturas para identificar padrões e focar nos dias mais fracos.',
]
const STREAKS_GUIDE = [
  'Cada hábito tem duas barras: a cinza (recorde máximo) e a dourada (sequência atual).',
  'Quanto maior a barra dourada em relação à cinza, mais perto você está do seu recorde.',
  'O número X/Y mostra dias na sequência atual (X) e o maior recorde (Y).',
]

// ─────────────────────────────────────────
// ESTATÍSTICAS — COMPONENTES
// ─────────────────────────────────────────
function WeekdayChart({ history }) {
  const [showGuide, setShowGuide] = useState(false)
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
      lbl, full: WEEK_FULL[i],
      rate: totals[i] > 0 ? Math.round(counts[i] / totals[i] * 100) : null,
    }))
  }, [history])

  const max   = Math.max(...data.map(d => d.rate ?? 0), 1)
  const best  = data.reduce((a, b) => (b.rate ?? 0) > (a.rate ?? 0) ? b : a, data[0])
  const worst = data.filter(d => d.rate !== null)
                    .reduce((a, b) => b.rate < a.rate ? b : a, data.find(d => d.rate !== null) || data[0])

  return (
    <div id="chart-weekday" className="card">
      <div className="card-title">
        <PiCalendarBold size={15}/> Taxa por Dia da Semana
        <button type="button" className={styles.guideBtn} onClick={() => setShowGuide(o => !o)}>{showGuide ? '✕' : '?'}</button>
      </div>
      {showGuide && <ChartGuidePanel steps={WEEKDAY_GUIDE}/>}
      <div className={styles.wdChart}>
        {data.map(d => (
          <div key={d.lbl} className={styles.wdCol}>
            <span className={styles.wdPct}>{d.rate !== null ? `${d.rate}%` : '—'}</span>
            <div className={styles.wdBarWrap}>
              <div className={styles.wdBar} style={{
                height: d.rate !== null ? `${Math.round(d.rate / max * 100)}%` : '3px',
                background: d.rate === best.rate && d.rate !== null ? AMBER : d.rate === worst.rate && d.rate !== null ? '#e74c3c' : 'var(--surface)',
                borderColor: d.rate === best.rate && d.rate !== null ? AMBER_DK : d.rate === worst.rate && d.rate !== null ? '#922b21' : 'var(--border)',
              }}/>
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

function TrendChart({ history }) {
  const points = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 29 + i)
      const k = d.toISOString().slice(0, 10)
      const rec = history[k]
      return rec?.total > 0 ? Math.round(rec.done / rec.total * 100) : 0
    })
    return days.map((_, i) => {
      const slice = days.slice(Math.max(0, i - 2), i + 3)
      return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length)
    })
  }, [history])

  const hasData = points.some(p => p > 0)
  const [showGuide, setShowGuide] = useState(false)

  if (!hasData) return (
    <div id="chart-trend" className="card">
      <div className="card-title">
        <PiTrendUpBold size={15}/> Tendência — 30 Dias
        <button type="button" className={styles.guideBtn} onClick={() => setShowGuide(o => !o)}>{showGuide ? '✕' : '?'}</button>
      </div>
      {showGuide && <ChartGuidePanel steps={TREND_GUIDE}/>}
      <p className={styles.emptyMsg}>Complete hábitos nos próximos dias para ver a tendência aqui.</p>
    </div>
  )

  const W = 340, H = 80
  const max = Math.max(...points, 1)
  const polyline = points.map((v, i) => {
    const x = Math.round(i / (points.length - 1) * W)
    const y = Math.round(H - (v / max) * H)
    return `${x},${y}`
  }).join(' ')
  const lastVal = points[points.length - 1]
  const trend   = lastVal - points[0]

  return (
    <div id="chart-trend" className="card">
      <div className="card-title">
        <PiTrendUpBold size={15}/> Tendência — 30 Dias
        <button type="button" className={styles.guideBtn} onClick={() => setShowGuide(o => !o)}>{showGuide ? '✕' : '?'}</button>
      </div>
      {showGuide && <ChartGuidePanel steps={TREND_GUIDE}/>}
      <div className={styles.trendSvgWrap}>
        <svg viewBox={`0 0 ${W} ${H + 4}`} width="100%" style={{ overflow: 'visible' }}>
          {[25, 50, 75, 100].map(v => (
            <line key={v} x1={0} y1={Math.round(H - v/max*H)} x2={W} y2={Math.round(H - v/max*H)}
              stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4"/>
          ))}
          <polygon points={`0,${H} ${polyline} ${W},${H}`} fill={AMBER} fillOpacity="0.15"/>
          <polyline points={polyline} fill="none" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx={W} cy={Math.round(H - (lastVal/max)*H)} r="4" fill={AMBER} stroke="var(--bg)" strokeWidth="2"/>
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

function StreaksChart({ habits, history }) {
  const [showGuide, setShowGuide] = useState(false)
  const data = useMemo(() =>
    habits.map(h => ({ ...h, ...habitStreaks(h.id, history) })).sort((a, b) => b.record - a.record)
  , [habits, history])
  const maxRecord = Math.max(...data.map(d => d.record), 1)

  return (
    <div id="chart-streaks" className="card">
      <div className="card-title">
        <PiFireBold size={15}/> Sequências por Hábito
        <button type="button" className={styles.guideBtn} onClick={() => setShowGuide(o => !o)}>{showGuide ? '✕' : '?'}</button>
      </div>
      {showGuide && <ChartGuidePanel steps={STREAKS_GUIDE}/>}
      {data.length === 0 ? (
        <p className={styles.emptyMsg}>Sem dados suficientes ainda.</p>
      ) : (
        <div className={styles.streakList}>
          {data.map(h => (
            <div key={h.id} className={styles.streakRow}>
              <div className={styles.streakName}>{h.name}</div>
              <div className={styles.streakBars}>
                <div className={styles.streakBarWrap} title={`Recorde: ${h.record} dias`}>
                  <div className={styles.streakBarRecord} style={{ width:`${Math.round(h.record/maxRecord*100)}%` }}/>
                </div>
                <div className={styles.streakBarWrap} title={`Atual: ${h.current} dias`}>
                  <div className={styles.streakBarCurrent} style={{ width:`${Math.round(h.current/maxRecord*100)}%` }}/>
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

function ConsistencyRanking({ habits, history }) {
  const data = useMemo(() =>
    habits.map(h => ({ ...h, rate: habitRate(h.id, history) })).sort((a, b) => b.rate - a.rate)
  , [habits, history])

  return (
    <div className="card">
      <div className="card-title"><PiTargetBold size={15}/> Consistência por Hábito</div>
      {data.length === 0 ? (
        <p className={styles.emptyMsg}>Sem dados suficientes ainda.</p>
      ) : (
        <div className={styles.rankList}>
          {data.map((h, i) => (
            <div key={h.id} className={styles.rankRow}>
              <div className={styles.rankPos} style={{
                background: i === 0 ? AMBER : i === 1 ? 'var(--surface)' : 'transparent',
                color: i === 0 ? '#111' : 'var(--ink3)',
                border: i < 2 ? '2px solid var(--border)' : 'none',
              }}>
                {i === 0 ? <PiTrophyBold size={12}/> : i + 1}
              </div>
              <div className={styles.rankInfo}>
                <div className={styles.rankName}>{h.name}</div>
                <div className={styles.rankBarWrap}>
                  <div className={styles.rankBar} style={{
                    width: `${h.rate}%`,
                    background: h.rate >= 80 ? '#27ae60' : h.rate >= 50 ? AMBER : '#e74c3c',
                  }}/>
                </div>
              </div>
              <div className={styles.rankRate} style={{
                color: h.rate >= 80 ? '#27ae60' : h.rate >= 50 ? AMBER_DK : '#e74c3c',
              }}>{h.rate}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PriorityChart({ habits, history }) {
  const data = useMemo(() => {
    const counts = { alta: 0, media: 0, baixa: 0 }
    const colors  = { alta: '#e74c3c', media: AMBER, baixa: '#27ae60' }
    const labels  = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
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
      priority: p, label: labels[p], color: colors[p], count: n,
      pct: total > 0 ? Math.round(n / total * 100) : 0,
    }))
  }, [habits, history])

  const total = data.reduce((a, d) => a + d.count, 0)

  return (
    <div className="card">
      <div className="card-title"><PiStarBold size={15}/> Distribuição por Prioridade</div>
      {total === 0 ? (
        <p className={styles.emptyMsg}>Conclua hábitos com prioridades definidas para ver a distribuição.</p>
      ) : (
        <>
          <div className={styles.stackBar}>
            {data.filter(d => d.pct > 0).map(d => (
              <div key={d.priority} className={styles.stackSeg}
                style={{ width:`${d.pct}%`, background:d.color }}
                title={`${d.label}: ${d.count} (${d.pct}%)`}/>
            ))}
          </div>
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
          <div className={styles.insight}>
            <PiTrophyBold size={12} color={AMBER_DK}/>
            {total} conclusões no total.
            {data[0].pct > 50
              ? ` Foco em hábitos de ${data[0].label.toLowerCase()} prioridade.`
              : ' Bom equilíbrio entre prioridades.'}
          </div>
        </>
      )}
    </div>
  )
}

function StatsOverview({ history, streak, daysActive, allPoints }) {
  const totalDone = useMemo(
    () => Object.values(history).reduce((a, r) => a + (r?.done || 0), 0),
    [history]
  )
  const bestDay = useMemo(
    () => Math.max(...Object.values(history).map(r => r?.done || 0), 0),
    [history]
  )
  const longestStreak = useMemo(() => {
    let max = 0, run = 0
    Object.keys(history).sort().forEach(k => {
      if (history[k]?.done > 0) { run++; max = Math.max(max, run) }
      else run = 0
    })
    return max
  }, [history])

  function scrollToChart(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const stats = [
    { icon: <PiCheckCircleFill size={16} color="#27ae60"/>, val: fmt(totalDone),     lbl: 'total feitos',   chartId: 'chart-trend'   },
    { icon: <PiCalendarBold    size={16} color="var(--ink3)"/>, val: String(daysActive), lbl: 'dias ativos',   chartId: 'chart-weekday' },
    { icon: <PiStarBold        size={16} color={AMBER_DK}/>,    val: String(bestDay),    lbl: 'melhor dia',    chartId: 'chart-trend'   },
    { icon: <PiLightningBold   size={16} color={AMBER_DK}/>,    val: fmt(allPoints),     lbl: 'io acumulados', chartId: null            },
  ]

  return (
    <div className="card">
      <div className="card-title"><PiTrophyBold size={15}/> Visão Geral</div>
      <button
        type="button"
        className={styles.streakHero}
        onClick={() => scrollToChart('chart-streaks')}
        title="Ver sequências por hábito"
      >
        <div className={styles.streakHeroMain}>
          <PiFireBold size={34} color={streak > 0 ? AMBER : 'var(--border)'}/>
          <div>
            <div className={styles.streakHeroVal}>{streak}</div>
            <div className={styles.streakHeroLbl}>dias em sequência</div>
          </div>
        </div>
        <div className={styles.streakHeroRight}>
          <div className={styles.streakHeroRecord}>
            <span className={styles.streakHeroRecVal}>{longestStreak}</span>
            <span className={styles.streakHeroRecLbl}>dias · recorde</span>
          </div>
          <span className={styles.heroArrow}>↓ ver</span>
        </div>
      </button>
      <div className={styles.statsGrid}>
        {stats.map(s => (
          <div
            key={s.lbl}
            className={`${styles.statItem} ${s.chartId ? styles.statItemLink : ''}`}
            onClick={s.chartId ? () => scrollToChart(s.chartId) : undefined}
            role={s.chartId ? 'button' : undefined}
            tabIndex={s.chartId ? 0 : undefined}
            onKeyDown={s.chartId ? e => e.key === 'Enter' && scrollToChart(s.chartId) : undefined}
            title={s.chartId ? 'Ver gráfico' : undefined}
          >
            {s.icon}
            <span className={styles.statVal}>{s.val}</span>
            <span className={styles.statLbl}>{s.lbl}</span>
            {s.chartId && <span className={styles.statArrow}>↓ ver</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// PÁGINA PRINCIPAL — PROGRESSO
// ─────────────────────────────────────────
export default function Progress() {
  const { habits, history }            = useApp()
  const { allPoints }                  = useHabits()
  const { streak, daysActive, last7 }  = useStats(history)
  const level                          = calcLevel(allPoints)
  const challenges                     = useMemo(() => buildChallenges(habits, history), [habits, history])
  const [mainTab, setMainTab]          = useState('conquistas')
  const [badgeTab, setBadgeTab]        = useState('conquistas')

  const prevEarnedRef = useRef(
    new Set(BADGES.filter(b => b.check(habits, history, streak, allPoints)).map(b => b.id))
  )

  const earned = BADGES.filter(b => b.check(habits, history, streak, allPoints)).length
  const shown  = useMemo(() => {
    if (badgeTab === 'conquistadas') return BADGES.filter(b =>  b.check(habits, history, streak, allPoints))
    if (badgeTab === 'pendentes')    return BADGES.filter(b => !b.check(habits, history, streak, allPoints))
    return BADGES
  }, [habits, history, streak, allPoints, badgeTab])

  const maxBar    = Math.max(...last7.map(d => d.done), 1)
  const todayDone = habits.filter(h => h.done)
  const todayPts  = todayDone.reduce((a, h) => a + (h.pts ?? 0), 0)

  return (
    <main className={styles.page}>

      {/* ── Tabs principais ── */}
      <div className={styles.mainTabBar}>
        {[['conquistas','Conquistas'],['estatisticas','Estatísticas']].map(([id,lbl]) => (
          <button key={id} type="button"
            className={`${styles.mainTab} ${mainTab === id ? styles.mainTabActive : ''}`}
            onClick={() => setMainTab(id)}>
            {id === 'conquistas' ? <PiMedalBold size={13}/> : <PiChartBarBold size={13}/>}
            {lbl}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          ABA CONQUISTAS
      ══════════════════════════════════════ */}
      {mainTab === 'conquistas' && (
        <>
          {/* Nível & io */}
          <div className="card">
            <div className="card-title"><PiStarBold size={15}/> Nível & IO</div>
            <div className={styles.levelBlock}>
              <span className={styles.levelIcon} style={{ color: level.color }}>
                <level.Icon size={20}/>
              </span>
              <div className={styles.levelInfo}>
                <span className={styles.levelName} style={{ color: level.color }}>{level.name}</span>
                <span className={styles.levelDesc}>{level.mantra}</span>
              </div>
              <span className={styles.ptsChip}>{allPoints} io</span>
            </div>
            {level.next && (
              <>
                <div className="pbar-wrap" style={{ margin:'8px 0 4px' }}>
                  <div className="pbar-fill" style={{ width:`${level.prog}%`, background:level.color, height:'100%' }}/>
                </div>
                <p className={styles.xpHint}>{allPoints} / {level.next} io → {level.nextName ?? 'próximo nível'}</p>
              </>
            )}
            <div className={styles.ptsSource}>
              <PiArrowUpBold size={12} color="var(--gold-dk)"/>
              <span>
                Hoje: <strong>+{todayPts} io</strong> de {todayDone.length} hábito{todayDone.length!==1?'s':''} concluído{todayDone.length!==1?'s':''}
                {habits.length > 0 && <> <br></br>• Cada hábito vale entre 0 e 30 io (configurável em Hábitos)</>}
              </span>
            </div>
            <div className={styles.weekBars}>
              {last7.map(d => (
                <div key={d.date} className={styles.wbarCol}>
                  <div className={styles.wbarWrap}>
                    <div className={`${styles.wbar} ${d.isToday ? styles.wbarToday : ''}`}
                      style={{ height:`${Math.round(d.done/maxBar*100)}%` }}/>
                  </div>
                  <span className={styles.wbarLbl}>{d.label.slice(0,3)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Desafios semanais */}
          <div className="card">
            <div className="card-title">
              <PiLightningBold size={15}/> Desafios da Semana
              <span className={styles.count}>{challenges.filter(c=>c.current>=c.target).length}/{challenges.length}</span>
            </div>
            {challenges.map(ch => <ChallengeCard key={ch.id} ch={ch}/>)}
          </div>

          {/* Conquistas */}
          <div className="card">
            <div className="card-title">
              <PiMedalBold size={15}/> Conquistas
              <span className={styles.count}>{earned}/{BADGES.length}</span>
            </div>
            <div className={styles.tabs}>
              {[['conquistas','Todas'],['conquistadas','Minhas'],['pendentes','Em aberto']].map(([id,lbl]) => (
                <button key={id} type="button"
                  className={`${styles.tabBtn} ${badgeTab===id ? styles.tabActive : ''}`}
                  onClick={() => setBadgeTab(id)}>{lbl}
                </button>
              ))}
            </div>
            {shown.length === 0 ? (
              <p className={styles.empty}>
                {badgeTab==='conquistadas' ? 'Nenhuma conquista ainda — complete hábitos!' : 'Todas conquistadas!'}
              </p>
            ) : (
              <div className={styles.badgeList}>
                {shown.map(b => (
                  <BadgeCard key={b.id} badge={b}
                    habits={habits} history={history}
                    streak={streak} allPoints={allPoints}
                    prevEarned={prevEarnedRef.current}/>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════
          ABA ESTATÍSTICAS
      ══════════════════════════════════════ */}
      {mainTab === 'estatisticas' && (
        <>
          <StatsOverview
            history={history} streak={streak}
            daysActive={daysActive} allPoints={allPoints}
          />

          <TrendChart history={history} />
          <WeekdayChart history={history} />
          <StreaksChart habits={habits} history={history} />
        </>
      )}

    </main>
  )
}

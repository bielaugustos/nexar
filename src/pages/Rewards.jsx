import { useState, useEffect, useMemo, useRef } from 'react'
import {
  PiStarBold, PiLightningBold, PiTrophyBold,
  PiMedalBold, PiCheckCircleFill, PiFireBold,
  PiArrowUpBold, PiQuestionBold,
  PiPlantBold, PiHammerBold, PiCoinsBold, PiCalendarBold,
  PiLightbulbBold,
} from 'react-icons/pi'
import { loadStorage } from '../services/storage'
import { useApp }      from '../context/AppContext'
import { useHabits }   from '../hooks/useHabits'
import { useStats }    from '../hooks/useStats'
import { useSound }    from '../hooks/useSound'
import { toast }       from '../components/Toast'
import { calcLevel }   from '../services/levels'
import styles          from './Rewards.module.css'

// ══════════════════════════════════════
// BADGES — lógica real baseada em ações
// ══════════════════════════════════════
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
    desc: 'Acumule 500 pontos no total',
    howto: 'Complete hábitos diariamente até atingir 500 pts',
    check: (_,__,___,pts) => pts >= 500,
    progress: (_,__,___,pts) => Math.min(100, Math.round(pts/500*100)),
    label: (_,__,___,pts) => `${Math.min(pts,500)}/500 pts`,
  },
]

function buildChallenges(habits, history) {
  const ws = new Date()
  const dow = ws.getDay()
  ws.setDate(ws.getDate() - (dow === 0 ? 6 : dow - 1))
  ws.setHours(0, 0, 0, 0)

  let weekDone = 0, perfectDays = 0, activeDays = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws); d.setDate(ws.getDate() + i)
    if (d > new Date()) break
    const k = d.toISOString().slice(0, 10)
    const rec = history[k]
    if (rec?.done > 0) {
      activeDays++
      weekDone += rec.done
      if (rec.total > 0 && rec.done === rec.total) perfectDays++
    }
  }
  const todayDone = habits.filter(x => x.done).length

  return [
    {
      id:'c1', Icon:PiCheckCircleFill, title:'20 hábitos esta semana',
      desc:'Some todos os hábitos concluídos de seg a dom.',
      reward:'+50 pts bônus', target:20, current:weekDone+todayDone,
    },
    {
      id:'c2', Icon:PiFireBold, title:'3 dias perfeitos',
      desc:'Complete 100% dos hábitos em 3 dias diferentes.',
      reward:'Badge Perfeito', target:3, current:perfectDays,
    },
    {
      id:'c3', Icon:PiCalendarBold, title:'Ativo 7 dias seguidos',
      desc:'Complete ao menos 1 hábito por dia durante 7 dias.',
      reward:'Badge Veterano', target:7, current:activeDays + (todayDone > 0 ? 1 : 0),
    },
  ]
}

// ── Badge card ──
function BadgeCard({ badge, habits, history, streak, allPoints, prevEarned }) {
  const earned       = badge.check(habits, history, streak, allPoints)
  const justUnlocked = earned && !prevEarned.has(badge.id)
  const { soundOn } = useApp()
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

      {showHow && !earned && (
        <p className={styles.howtoText}><PiLightbulbBold size={11} color="var(--gold-dk)"/> {badge.howto}</p>
      )}

      {!earned && (
        <div className={styles.badgeProgress}>
          <div className={styles.bpBar}>
            <div className={styles.bpFill} style={{ width:`${prog}%` }}/>
          </div>
          <span className={styles.bpTxt}>{lbl}</span>
        </div>
      )}
    </div>
  )
}

// ── Challenge card ──
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
      <span className={styles.chExpiry}>↻ Renova segunda-feira</span>
    </div>
  )
}

// ══════════════════════════════════════
// REWARDS — PÁGINA PRINCIPAL
// ══════════════════════════════════════
export default function Rewards() {
  const { habits, history }     = useApp()
  const { allPoints, totalPoints, avgPtsPerHabit } = useHabits()
  const { streak, last7 }       = useStats(history)
  const level                   = calcLevel(allPoints)
  const challenges               = useMemo(() => buildChallenges(habits, history), [habits, history])
  const [tab, setTab]           = useState('conquistas')

  const prevEarnedRef = useRef(
    new Set(BADGES.filter(b => b.check(habits, history, streak, allPoints)).map(b => b.id))
  )

  const earned = BADGES.filter(b => b.check(habits, history, streak, allPoints)).length
  const shown  = useMemo(() => {
    if (tab === 'conquistadas') return BADGES.filter(b =>  b.check(habits, history, streak, allPoints))
    if (tab === 'pendentes')    return BADGES.filter(b => !b.check(habits, history, streak, allPoints))
    return BADGES
  }, [habits, history, streak, allPoints, tab])

  const maxBar = Math.max(...last7.map(d => d.done), 1)

  // Hoje
  const todayDone = habits.filter(h => h.done)
  const todayPts  = todayDone.reduce((a, h) => a + (h.pts ?? 0), 0)

  return (
    <main className={styles.page}>

      {/* ── Nível e pontos ── */}
      <div className="card">
        <div className="card-title"><PiStarBold size={15}/> Nível & Pontos</div>

        {/* Nível atual */}
        <div className={styles.levelBlock}>
          <span className={styles.levelIcon} style={{ color: level.color }}><level.Icon size={20}/></span>
          <div className={styles.levelInfo}>
            <span className={styles.levelName} style={{ color: level.color }}>{level.name}</span>
            <span className={styles.levelDesc}>{level.mantra}</span>
          </div>
          <span className={styles.ptsChip}>{allPoints} pts</span>
        </div>

        {/* Barra de XP */}
        {level.next && (
          <>
            <div className="pbar-wrap" style={{ margin:'8px 0 4px' }}>
              <div className="pbar-fill" style={{ width:`${level.prog}%`, background:level.color, height:'100%' }}/>
            </div>
            <p className={styles.xpHint}>{allPoints} / {level.next} io → {level.nextName ?? 'próximo nível'}</p>
          </>
        )}

        {/* Como ganhar pontos — transparência */}
        <div className={styles.ptsSource}>
          <PiArrowUpBold size={12} color="var(--gold-dk)"/>
          <span>
            Hoje: <strong>+{todayPts} pts</strong> de {todayDone.length} hábito{todayDone.length!==1?'s':''} concluído{todayDone.length!==1?'s':''}
            {habits.length > 0 && <> — cada hábito vale entre 0 e 30 pts (configurável em Habits)</>}
          </span>
        </div>

        {/* Barras da semana */}
        <div className={styles.weekBars}>
          {last7.map(d => (
            <div key={d.date} className={styles.wbarCol}>
              <div className={styles.wbarWrap}>
                <div
                  className={`${styles.wbar} ${d.isToday ? styles.wbarToday : ''}`}
                  style={{ height:`${Math.round(d.done/maxBar*100)}%` }}
                />
              </div>
              <span className={styles.wbarLbl}>{d.label.slice(0,3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Desafios semanais ── */}
      <div className="card">
        <div className="card-title">
          <PiLightningBold size={15}/> Desafios da Semana
          <span className={styles.count}>{challenges.filter(c=>c.current>=c.target).length}/{challenges.length}</span>
        </div>
        {challenges.map(ch => <ChallengeCard key={ch.id} ch={ch}/>)}
      </div>

      {/* ── Conquistas ── */}
      <div className="card">
        <div className="card-title">
          <PiMedalBold size={15}/> Conquistas
          <span className={styles.count}>{earned}/{BADGES.length}</span>
        </div>

        <div className={styles.tabs}>
          {[['conquistas','Todas'],['conquistadas','Minhas'],['pendentes','Em aberto']].map(([id,lbl]) => (
            <button key={id} type="button"
              className={`${styles.tabBtn} ${tab===id ? styles.tabActive : ''}`}
              onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className={styles.empty}>
            {tab==='conquistadas' ? 'Nenhuma conquista ainda — complete hábitos!' : 'Todas conquistadas!'}
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

    </main>
  )
}

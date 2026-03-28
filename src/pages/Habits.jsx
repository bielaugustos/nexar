import { useState, useMemo, useCallback, useId, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PiCrownBold, PiCheckCircleBold,
  PiCheckSquareBold, PiPlusBold, PiPencilSimpleBold, PiXBold,
  PiTrashBold, PiFloppyDiskBold, PiStarBold, PiBrainBold,
  PiBarbell, PiBookOpenText, PiDropBold, PiCodeBold,
  PiLightningBold, PiFlame, PiHeartBold, PiLeafBold,
  PiMoonBold, PiSunBold, PiMusicNotesBold, PiPencilBold,
  PiTrophyBold, PiRocketLaunchBold, PiFlagBold, PiSmileyBold,
  PiCalendarBold, PiCheckCircleFill, PiListBold,
  PiNotePencilBold, PiClockBold, PiCalendarCheckBold,
  PiCheckBold, PiWarningBold,
  PiEyeBold, PiEyeSlashBold, PiCaretDownBold, PiTagBold, PiQuestionBold,
  PiMagnifyingGlassBold, PiArchiveBold, PiArrowCounterClockwiseBold,
} from 'react-icons/pi'
import { loadStorage }   from '../services/storage'
import { useApp }        from '../context/AppContext'
import { useHabits, useHabitStats } from '../hooks/useHabits'
import { calcLevel }     from '../services/levels'
import { useSound, playClickDirect, playSaveDirect } from '../hooks/useSound'
import { CheckBox }      from '../components/CheckBox'
import { toast }         from '../components/Toast'
import { usePlan }       from '../hooks/usePlan'
import styles            from './Habits.module.css'

// ══════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════
const ICON_MAP = {
  PiBrainBold, PiBarbell, PiBookOpenText, PiDropBold, PiCodeBold,
  PiStarBold, PiLightningBold, PiFlame, PiHeartBold, PiLeafBold,
  PiMoonBold, PiSunBold, PiMusicNotesBold, PiPencilBold,
  PiTrophyBold, PiRocketLaunchBold,
}
const ICON_OPTIONS = [
  { name: 'PiBrainBold',        label: 'Mente'      },
  { name: 'PiBarbell',          label: 'Musculação' },
  { name: 'PiBookOpenText',     label: 'Leitura'    },
  { name: 'PiDropBold',         label: 'Água'       },
  { name: 'PiCodeBold',         label: 'Código'     },
  { name: 'PiStarBold',         label: 'Estrela'    },
  { name: 'PiLightningBold',    label: 'Energia'    },
  { name: 'PiFlame',            label: 'Foco'       },
  { name: 'PiHeartBold',        label: 'Saúde'      },
  { name: 'PiLeafBold',         label: 'Natureza'   },
  { name: 'PiMoonBold',         label: 'Sono'       },
  { name: 'PiSunBold',          label: 'Manhã'      },
  { name: 'PiMusicNotesBold',   label: 'Música'     },
  { name: 'PiPencilBold',       label: 'Escrita'    },
  { name: 'PiTrophyBold',       label: 'Conquista'  },
  { name: 'PiRocketLaunchBold', label: 'Meta'       },
]
const PRI_COLORS     = { alta: '#e74c3c', media: '#F59E0B', baixa: '#27ae60' }
const PRI_LABELS     = { alta: 'Alta',    media: 'Média',   baixa: 'Baixa'   }
const PTS_OPTS       = [0, 5, 10, 15, 20, 25, 30]
const WEEK_SHORT     = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const WEEK_FULL      = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const PRIORITY_ORDER = { alta: 0, media: 1, baixa: 2 }
const SUB_PTS_OPTS   = [2, 3, 5, 7, 10]
const EST_OPTS       = [
  { val: 5,   label: '5 min'  },
  { val: 10,  label: '10 min' },
  { val: 15,  label: '15 min' },
  { val: 30,  label: '30 min' },
  { val: 45,  label: '45 min' },
  { val: 60,  label: '1 h'    },
  { val: 90,  label: '1,5 h'  },
  { val: 120, label: '2 h'    },
]

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════
function HabIcon({ name, size = 18, color }) {
  const Comp = ICON_MAP[name] || PiStarBold
  return <Comp size={size} color={color} />
}

function freqText(days) {
  if (!Array.isArray(days) || days.length === 7) return 'Diário'
  return `${days.length}×/sem`
}

function freqDescription(freq, days) {
  if (freq === 'diario' || !Array.isArray(days) || days.length === 7) return 'Todos os dias'
  return [...days].sort((a, b) => a - b).map(d => WEEK_FULL[d]).join(', ')
}

function localTodayStr() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-')
}

function formatDeadlineTag(iso) {
  if (!iso) return ''
  const [y, m, day] = iso.split('-').map(Number)
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  const thisYear = new Date().getFullYear()
  return y === thisYear ? `${day} ${months[m-1]}` : `${day} ${months[m-1]} ${y}`
}

function deadlineStatus(deadline) {
  if (!deadline) return null
  const today  = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(deadline + 'T00:00:00')
  const diff   = Math.round((target - today) / 86_400_000)
  if (diff < 0)  return { label: `Venceu há ${Math.abs(diff)}d`,    color: '#c0392b', urgent: true  }
  if (diff === 0) return { label: 'Vence hoje!',                     color: '#e67e22', urgent: true  }
  if (diff <= 3)  return { label: `Vence em ${diff}d`,              color: '#e67e22', urgent: true  }
  return           { label: `Prazo: ${diff}d restantes`,            color: 'var(--ink3)', urgent: false }
}

// ══════════════════════════════════════
// HELPERS DE CONTEXTO
// ══════════════════════════════════════
function lastDoneText(habitId, history) {
  for (let i = 1; i <= 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const k = d.toISOString().slice(0, 10)
    if (history[k]?.habits?.[habitId]) {
      if (i === 1) return 'ontem'
      if (i <= 6)  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
      return `há ${i}d`
    }
  }
  return null
}

// Barras de 7 dias para o painel rápido
function Week7Bars({ habitId, history }) {
  const bars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const k = d.toISOString().slice(0, 10)
    return {
      done:    Boolean(history[k]?.habits?.[habitId]),
      isToday: i === 6,
      label:   d.toLocaleDateString('pt-BR', { weekday: 'narrow' }),
    }
  })
  return (
    <div className={styles.week7}>
      {bars.map((b, i) => (
        <div key={i} className={styles.week7Col}>
          <div className={[styles.week7Bar, b.done && styles.week7Done, b.isToday && styles.week7Today].filter(Boolean).join(' ')} />
          <span className={[styles.week7Label, b.isToday && styles.week7LabelToday].filter(Boolean).join(' ')}>{b.label}</span>
        </div>
      ))}
    </div>
  )
}

// Painel rápido — contexto, notas, motivo
function QuickPanel({ habit, history, onEdit, onSave, onDelete }) {
  const [ptsOpen, setPtsOpen] = useState(false)
  const subDone  = (habit.subtasks || []).filter(s => s.done).length
  const subTotal = (habit.subtasks || []).length
  const dlStatus = habit.deadline ? deadlineStatus(habit.deadline) : null
  const lastDone = lastDoneText(habit.id, history)
  const stats    = useHabitStats(habit.id, history)

  // Próxima ocorrência (igual ao HabitCard)
  const todayDow = new Date().getDay()
  let nextOcc = null
  if (habit.done && habit.deadline) {
    const t = new Date(); t.setHours(0,0,0,0)
    const dl = new Date(habit.deadline + 'T00:00:00')
    if (dl >= t && Array.isArray(habit.days)) {
      for (let i = 1; i <= 7; i++) {
        if (habit.days.includes((todayDow + i) % 7)) {
          nextOcc = i === 1 ? 'amanhã' : `em ${i}d`; break
        }
      }
    }
  }

  return (
    <div className={styles.quickPanel}>
      {/* Agenda semanal + meta */}
      <div className={styles.quickField}>
        <div className={styles.dayBadges}>
          {[0,1,2,3,4,5,6].map(d => (
            <span key={d}
              className={[styles.dayBadge, habit.days?.includes(d) && styles.dayBadgeOn].filter(Boolean).join(' ')}
              title={WEEK_FULL[d]}>
              {WEEK_SHORT[d]}
            </span>
          ))}
        </div>
        {(lastDone || nextOcc || dlStatus) && (
          <div className={styles.taskMetaRow}>
            {lastDone && <span className={styles.taskMetaLast}>último: {lastDone}</span>}
            {nextOcc   && <span className={styles.repeatChip}>repete {nextOcc}</span>}
            {dlStatus  && (habit.done || dlStatus.urgent) && (
              <span className={styles.taskMetaDl} style={{ color: dlStatus.color }}>{dlStatus.label}</span>
            )}
          </div>
        )}
      </div>

      {habit.reason?.trim() && (
        <div className={styles.quickField}>
          <span className={styles.quickFieldLabel}>Por que isso importa</span>
          <p className={styles.quickFieldText}>{habit.reason}</p>
        </div>
      )}

      {habit.notes?.trim() && (
        <div className={styles.quickField}>
          <span className={styles.quickFieldLabel}>Notas</span>
          <p className={styles.quickFieldText}>{habit.notes}</p>
        </div>
      )}

      {subTotal > 0 && (
        <div className={styles.quickField}>
          <span className={styles.quickFieldLabel}>Subtarefas · {subDone}/{subTotal}</span>
          <div className={styles.quickSubList}>
            {habit.subtasks.map(s => (
              <div key={s.id} className={[styles.quickSub, s.done && styles.quickSubDone].filter(Boolean).join(' ')}>
                <span className={styles.quickSubDot} />
                {s.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pontuação inline */}
      {ptsOpen && (
        <SeedPtsCard
          earnedIo={stats.totalDone * (habit.pts ?? 0)}
          pts={habit.pts}
          onPtsChange={newPts => onSave({ ...habit, pts: newPts })}
        />
      )}

      <div className={styles.quickBtnRow}>
        <button type="button"
          className={[styles.ioChip, ptsOpen && styles.ioChipActive].filter(Boolean).join(' ')}
          onClick={() => setPtsOpen(o => !o)}
          aria-expanded={ptsOpen}
          aria-label={ptsOpen ? 'Fechar painel de pontos' : 'Abrir painel de pontos'}>
          <PiStarBold size={12} /> Pontos
        </button>
        <button type="button" className={styles.quickEditBtn} onClick={onEdit}
          aria-label="Editar configurações do hábito">
          <PiPencilSimpleBold size={14} /> Editar hábito
        </button>
        <button type="button" className={styles.quickDelBtn}
          onClick={() => { if (window.confirm(`Excluir "${habit.name}" permanentemente?`)) onDelete?.() }}
          aria-label={`Excluir hábito ${habit.name}`}>
          <PiTrashBold size={15} />
        </button>
      </div>
    </div>
  )
}


// ══════════════════════════════════════
// MINI HEATMAP
// ══════════════════════════════════════
function MiniHeatmap({ habitId, history }) {
  const weeks = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 4 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const dt = new Date(today)
        dt.setDate(today.getDate() - (3 - w) * 7 - (6 - d))
        const k = dt.toISOString().slice(0, 10)
        return {
          k,
          isFuture: dt > today,
          done: dt <= today && Boolean(history[k]?.habits?.[habitId]),
          label: dt.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
        }
      })
    )
  }, [habitId, history])

  return (
    <div className={styles.miniHm}>
      <p className={styles.miniHmTitle}>Últimas 4 semanas</p>
      {weeks.map((week, wi) => (
        <div key={wi} className={styles.miniHmRow}>
          {week.map(cell => (
            <div
              key={cell.k}
              className={[
                styles.miniCell,
                cell.isFuture ? styles.mcFuture : cell.done ? styles.mcDone : styles.mcEmpty,
              ].join(' ')}
              title={cell.isFuture ? '' : `${cell.label}: ${cell.done ? '✓' : '—'}`}
            />
          ))}
        </div>
      ))}
      <div className={styles.miniHmDays}>
        {WEEK_SHORT.map((d, i) => <span key={i} className={styles.miniHmDay}>{d}</span>)}
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// GERENCIADOR DE SUBTAREFAS
// ══════════════════════════════════════
function SubtasksEditor({ subtasks, onChange }) {
  const [newText, setNewText] = useState('')
  const { isPro } = usePlan()
  const MAX_SUBTASKS_FREE = 5
  
  function addSubtask() {
    const text = newText.trim()
    if (!text) return
    
    // Verifica limite de subtarefas
    if (!isPro && subtasks.length >= MAX_SUBTASKS_FREE) {
      toast(`Limite de ${MAX_SUBTASKS_FREE} subtarefas atingido. Plano Pro permite ilimitadas.`)
      return
    }
    
    // Subtarefas não têm pontuação própria — são passos de acompanhamento
    onChange([...subtasks, { id: Date.now(), text, done: false }])
    setNewText('')
  }

  function toggleDone(id) {
    playClickDirect()
    onChange(subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s))
  }

  function remove(id) {
    onChange(subtasks.filter(s => s.id !== id))
  }

  function updateText(id, text) {
    onChange(subtasks.map(s => s.id === id ? { ...s, text } : s))
  }

  const done = subtasks.filter(s => s.done).length

  return (
    <div className={styles.subtasksWrap}>
      {subtasks.length > 0 && (
        <div className={styles.subList}>
          {subtasks.map(sub => (
            <div key={sub.id} className={`${styles.subRow} ${sub.done ? styles.subDone : ''}`}>
              <button
                type="button"
                className={`${styles.subCheck} ${sub.done ? styles.subCheckDone : ''}`}
                onClick={() => toggleDone(sub.id)}
                aria-label={sub.done ? 'Desmarcar' : 'Marcar como feito'}
              >
                {sub.done && <PiCheckBold size={10} color="#111" />}
              </button>
              <input
                className={styles.subInput}
                value={sub.text}
                onChange={e => updateText(sub.id, e.target.value)}
                aria-label="Texto da subtarefa"
              />
              <button type="button" className={styles.subRemove} onClick={() => remove(sub.id)} aria-label="Remover">
                <PiXBold size={11} />
              </button>
            </div>
          ))}
          <div className={styles.subSummary}>
            <span>{done}/{subtasks.length} concluídas</span>
          </div>
        </div>
      )}

      <div className={styles.subAddRow}>
        <input
          className={`input ${styles.subAddInput}`}
          placeholder="Adicionar passo..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSubtask()}
        />
        <button
          type="button"
          className={`btn btn-primary ${styles.subAddBtn}`}
          onClick={addSubtask}
          disabled={!newText.trim()}
          aria-label="Adicionar"
        >
          <PiPlusBold size={12} />
        </button>
      </div>
      {!isPro && subtasks.length >= MAX_SUBTASKS_FREE - 3 && (
        <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 8, textAlign: 'center' }}>
          {subtasks.length >= MAX_SUBTASKS_FREE 
            ? `Limite de ${MAX_SUBTASKS_FREE} subtarefas atingido. Plano Pro permite ilimitadas.`
            : `${subtasks.length}/${MAX_SUBTASKS_FREE} subtarefas usadas`}
        </div>
      )}
    </div>
  )
}


// ══════════════════════════════════════
// SEMENTE — indicador de crescimento
// Visualiza a consistência do hábito
// como uma planta que evolui com o uso.
// 5 estágios: semente → broto → muda
//             → arbusto → árvore
// ══════════════════════════════════════
// ══════════════════════════════════════
// IO PTS CARD
// Usa o sistema de níveis de levels.js
// (mesmo da tela de Perfil e Stats).
// ══════════════════════════════════════
function SeedPtsCard({ earnedIo, pts, onPtsChange }) {
  const [tooltip,    setTooltip]    = useState(false)
  const [pressedPts, setPressedPts] = useState(null)
  const level = calcLevel(earnedIo)
  const LevelIcon = level.Icon

  function handlePtsClick(p) {
    onPtsChange(p)
    setPressedPts(p)
    setTimeout(() => setPressedPts(null), 380)
  }

  return (
    <div className={styles.ioPtsCard}>

      {/* ── Nível atual ── */}
      <div className={styles.ioLevel}>
        <div className={styles.ioLevelIcon} style={{ color: level.color, borderColor: level.color }}>
          <LevelIcon size={16} />
        </div>
        <div className={styles.ioLevelInfo}>
          <div className={styles.ioLevelTop}>
            <span className={styles.ioLevelName} style={{ color: level.color }}>{level.name}</span>
            {level.nextName && (
              <span className={styles.ioLevelNext}>→ {level.nextName}</span>
            )}
            {!level.nextName && (
              <span className={styles.ioLevelMax}>nível máximo</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.ioDivider}/>

      {/* ── Seletor io ── */}
      <div className={styles.ioPtsSection}>
        <div className={styles.ioPtsTop}>
          <button type="button" className={styles.ioTooltipTrigger}
            onClick={() => setTooltip(v => !v)}>
            <span className={styles.ioPtsSectionLabel}>Pontos em desenvolvimento [io]</span>
            <PiQuestionBold size={11} color={tooltip ? 'var(--ink)' : 'var(--ink3)'} />
          </button>
        </div>

        {tooltip && (
          <p className={styles.ioWhisper}>
            <strong>io</strong> são a moeda de evolução do Rootio. Cada vez que você conclui este hábito, ganha <strong>{pts} io</strong>. O total acumulado aparece em Stats e desbloqueia temas, o calendário, o Mentor IA e outras recompensas.
          </p>
        )}

        <div className={styles.ptsRow} role="group" aria-label="Selecionar pontos io por conclusão">
          {PTS_OPTS.map(p => (
            <button key={p} type="button"
              className={[
                styles.ptsOpt,
                pts === p && styles.ptsSel,
                pressedPts === p && styles.ptsPress,
              ].filter(Boolean).join(' ')}
              onClick={() => handlePtsClick(p)}
              aria-pressed={pts === p}
              aria-label={`${p} io por conclusão`}>
              {p}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}


// ══════════════════════════════════════
// PAINEL DE EDIÇÃO INLINE
// Dividido em 3 seções claramente separadas:
//   1. Identidade (nome, ícone, prioridade, pontos)
//   2. Detalhes   (subtarefas, notas, tempo, prazo)
//   3. Frequência (dias da semana, repetição)
// ══════════════════════════════════════
function EditPanel({ habit, history, onSave, onDelete, onClose }) {
  // ── Seção 1: Identidade ──
  const [name,     setName]     = useState(habit.name)
  const [priority, setPriority] = useState(habit.priority ?? 'media')
  const [pts,      setPts]      = useState(habit.pts ?? 20)
  const [icon,     setIcon]     = useState(habit.icon ?? 'PiStarBold')
  const [tags,     setTags]     = useState(Array.isArray(habit.tags) ? habit.tags : [])
  const [tagInput, setTagInput] = useState('')

  // ── Motivo ──
  const [reason,   setReason]   = useState(habit.reason ?? '')

  // ── Seção 2: Detalhes ──
  const [subtasks, setSubtasks] = useState(Array.isArray(habit.subtasks) ? habit.subtasks : [])
  const [notes,    setNotes]    = useState(habit.notes ?? '')
  const [estMins,  setEstMins]  = useState(habit.estMins ?? null)
  const [deadline,      setDeadline]      = useState(habit.deadline ?? '')
  const [deadlineOpen,  setDeadlineOpen]  = useState(false)
  const [period,        setPeriod]        = useState(habit.period ?? null)
  const [habitTime,     setHabitTime]     = useState(habit.habitTime ?? '')

  // Horas personalizadas: valor string do input (ex: "2.50")
  // Se estMins atual não está nos chips predefinidos, é personalizado
  const isCustomEst = estMins !== null && !EST_OPTS.some(o => o.val === estMins)
  const [customHrs, setCustomHrs] = useState(() => {
    if (habit.estMins != null && !EST_OPTS.some(o => o.val === habit.estMins)) {
      return String((habit.estMins / 60).toFixed(2))
    }
    return ''
  })
  const [customOpen, setCustomOpen] = useState(
    () => habit.estMins != null && !EST_OPTS.some(o => o.val === habit.estMins)
  )

  // ── Seção 3: Frequência ──
  const [freq,     setFreq]     = useState(habit.freq ?? 'diario')
  const [days,     setDays]     = useState(
    Array.isArray(habit.days) && habit.days.length > 0 ? habit.days : [0, 1, 2, 3, 4, 5, 6]
  )

  // Tab ativa no painel (simples | avancado)
  const [tab, setTab] = useState('simples')

  const freqPreview = useMemo(() => freqDescription(freq, days), [freq, days])
  const dlStatus    = deadline ? deadlineStatus(deadline) : null

  function changeFreq(f) {
    setFreq(f)
    if (f === 'diario') setDays([0, 1, 2, 3, 4, 5, 6])
  }

  function toggleDay(d) {
    setDays(prev =>
      prev.includes(d)
        ? prev.length > 1 ? prev.filter(x => x !== d) : prev
        : [...prev, d].sort((a, b) => a - b)
    )
  }

  function handleSave() {
    if (!name.trim()) { toast('Nome não pode ser vazio'); return }
    if (!days || days.length === 0) {
      toast('⚠️ Selecione pelo menos 1 dia de repetição')
      setTab('simples')
      return
    }
    playSaveDirect()
    onSave({
      ...habit,
      name: name.trim(), priority, pts, icon,
      subtasks, notes, reason, estMins, tags,
      deadline: deadline || null,
      period: period || null,
      habitTime: habitTime || null,
      freq, days,
    })
  }

  function handleDelete() {
    if (!window.confirm(`Excluir "${habit.name}" permanentemente?`)) return
    onDelete(habit.id)
  }

  function handleArchive() {
    onSave({ ...habit, archived: true })
    onClose?.()
  }

  const TABS = [
    { id: 'simples',  label: 'Simples',   icon: <PiSmileyBold size={13} />     },
    { id: 'avancado', label: 'Avançado',  icon: <PiNotePencilBold size={13} /> },
  ]

  return (
    <div className={styles.editPanel}>

      {/* Alerta de prazo próximo */}
      {dlStatus?.urgent && (
        <div className={styles.dlAlert} style={{ borderColor: dlStatus.color, color: dlStatus.color }}>
          <PiWarningBold size={13} />
          {dlStatus.label}
        </div>
      )}

      {/* Tabs de navegação do painel */}
      <div className={styles.panelTabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={[styles.panelTab, tab === t.id && styles.panelTabActive].filter(Boolean).join(' ')}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════
          TAB 1 — SIMPLES
          Nome, Prioridade, Ícone, Repetição, Motivo
      ════════════════════════ */}
      {tab === 'simples' && (
        <div className={styles.tabContent}>

          <div className={styles.field}>
            <label className={styles.fieldLabel}><PiPencilBold size={11} /> Nome</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoComplete="off"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}><PiFlagBold size={11} /> Prioridade</label>
            <div className={styles.priRow}>
              {['alta', 'media', 'baixa'].map(p => (
                <button key={p} type="button"
                  className={[styles.priOpt, priority === p && styles[`priSel_${p}`]].filter(Boolean).join(' ')}
                  onClick={() => setPriority(p)}>
                  <span className={styles.priDot} style={{ background: PRI_COLORS[p] }} />
                  {PRI_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}><PiSmileyBold size={11} /> Ícone</label>
            <div className={styles.iconGrid}>
              {ICON_OPTIONS.map(ic => (
                <button key={ic.name} type="button"
                  className={[styles.iconOpt, icon === ic.name && styles.iconSel].filter(Boolean).join(' ')}
                  onClick={() => setIcon(ic.name)} title={ic.label}>
                  <HabIcon name={ic.name} size={16} />
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}><PiCalendarBold size={11}/> Repetição</label>
            {days.length === 0 && (
              <div className={styles.freqWarning}>
                ⚠️ Escolha uma opção de repetição para o hábito aparecer no app.
              </div>
            )}
            <div className={styles.freqPresets}>
              {[
                { label: 'Não repetir', desc: 'Uma vez só',   val: [] },
                { label: 'Todo dia',       desc: 'Seg → Dom',     val: [0,1,2,3,4,5,6] },
                { label: 'Dias úteis',     desc: 'Seg → Sex',     val: [1,2,3,4,5]     },
                { label: 'Fins de semana', desc: 'Sáb e Dom',     val: [0,6]           },
                { label: 'Personalizado',  desc: 'Escolher dias', val: null            },
              ].map(opt => {
                const isCustom = opt.val === null
                const selected = !isCustom
                  ? JSON.stringify([...days].sort()) === JSON.stringify([...opt.val].sort())
                  : days.length > 0 && ![
                      JSON.stringify([0,1,2,3,4,5,6]),
                      JSON.stringify([1,2,3,4,5]),
                      JSON.stringify([0,6]),
                    ].includes(JSON.stringify([...days].sort()))
                return (
                  <button key={opt.label} type="button"
                    className={[styles.freqPreset, selected && styles.freqPresetSel].filter(Boolean).join(' ')}
                    onClick={() => { if (!isCustom) setDays(opt.val) }}>
                    <span className={styles.freqPresetLabel}>{opt.label}</span>
                    <span className={styles.freqPresetDesc}>{opt.desc}</span>
                  </button>
                )
              })}
            </div>
            <div className={styles.daysCompact}>
              {WEEK_FULL.map((full, i) => (
                <button key={i} type="button"
                  className={[styles.dayDot, days.includes(i) && styles.dayDotSel].filter(Boolean).join(' ')}
                  onClick={() => toggleDay(i)} aria-label={full} title={full}>
                  {WEEK_SHORT[i]}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}><PiHeartBold size={11} /> Por que isso importa?</label>
            <textarea
              className={`input ${styles.reasonArea}`}
              placeholder="Motivo pessoal para manter este hábito..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
          </div>

        </div>
      )}

      {/* ════════════════════════
          TAB 2 — AVANÇADO
          Etiquetas, Subtarefas, Notas, Tempo, Período, Prazo
      ════════════════════════ */}
      {tab === 'avancado' && (
        <div className={styles.tabContent}>

          {/* Etiquetas */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}><PiTagBold size={11} /> Etiquetas</label>
            <div className={styles.tagsWrap}>
              {tags.map(tag => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button type="button" className={styles.tagRemove}
                    onClick={() => setTags(tags.filter(t => t !== tag))}>×</button>
                </span>
              ))}
            </div>
            <div className={styles.tagInputRow}>
              <input
                className={`input ${styles.tagInput}`}
                placeholder="Nova etiqueta (Enter)"
                value={tagInput}
                maxLength={20}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    const t = tagInput.trim().toLowerCase().replace(/[^a-záéíóúâêôãõç\w\s-]/gi,'')
                    if (t && !tags.includes(t) && tags.length < 6) {
                      setTags([...tags, t]); setTagInput('')
                    }
                  }
                }}
              />
              <button type="button" className={styles.tagAddBtn}
                disabled={!tagInput.trim() || tags.length >= 6}
                onClick={() => {
                  const t = tagInput.trim().toLowerCase()
                  if (t && !tags.includes(t) && tags.length < 6) {
                    setTags([...tags, t]); setTagInput('')
                  }
                }}>
                <PiPlusBold size={12}/>
              </button>
            </div>
            <p className={styles.tagHint}>Até 6 etiquetas · use para agrupar hábitos por tema</p>
          </div>

          <div className={styles.detailsDivider} />

          {/* Subtarefas */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              <PiCheckSquareBold size={11} /> Subtarefas
              {subtasks.length > 0 && (
                <span className={styles.subCount}>
                  {subtasks.filter(s => s.done).length}/{subtasks.length}
                </span>
              )}
            </label>
            <SubtasksEditor subtasks={subtasks} onChange={setSubtasks} />
          </div>

          {/* Notas */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}><PiNotePencilBold size={11} /> Notas</label>
            <textarea
              className={`input ${styles.notesArea}`}
              placeholder="Observações, dicas, referências..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.detailsDivider}/>

          {/* Tempo estimado */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}><PiClockBold size={11}/> Tempo estimado</label>
            <div className={styles.estGridCompact}>
              <button type="button"
                className={[styles.estChip, estMins===null && !customOpen && styles.estChipSel].filter(Boolean).join(' ')}
                onClick={() => { setEstMins(null); setCustomHrs(''); setCustomOpen(false) }}>Nenhum</button>
              {EST_OPTS.map(o => (
                <button key={o.val} type="button"
                  className={[styles.estChip, estMins===o.val && styles.estChipSel].filter(Boolean).join(' ')}
                  onClick={() => { setEstMins(o.val); setCustomHrs(''); setCustomOpen(false) }}>
                  {o.label}
                </button>
              ))}
              {isCustomEst ? (
                <span className={styles.estTag}>
                  {Math.round(estMins / 60)}h
                  <button type="button" className={styles.estTagDel}
                    onClick={() => { setEstMins(null); setCustomHrs('') }}>
                    <PiXBold size={8}/>
                  </button>
                </span>
              ) : (
                <button type="button"
                  className={[styles.estChip, customOpen && styles.estChipSel].filter(Boolean).join(' ')}
                  onClick={() => {
                    if (!customOpen) { setCustomHrs(''); setCustomOpen(true) }
                    else { setCustomOpen(false); setCustomHrs('') }
                  }}>
                  + horas
                </button>
              )}
            </div>
            {customOpen && !isCustomEst && (
              <div className={styles.estCustomRow}>
                <input
                  autoFocus type="number" className="input"
                  placeholder="Quantas horas? ex: 3" min="1" step="1"
                  value={customHrs}
                  onChange={e => setCustomHrs(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = parseInt(customHrs, 10)
                      if (val > 0) { setEstMins(val * 60); setCustomOpen(false) }
                      else { setCustomOpen(false); setCustomHrs('') }
                    }
                    if (e.key === 'Escape') { setCustomOpen(false); setCustomHrs('') }
                  }}
                  onBlur={() => {
                    const val = parseInt(customHrs, 10)
                    if (val > 0) { setEstMins(val * 60); setCustomOpen(false) }
                    else { setCustomOpen(false); setCustomHrs('') }
                  }}
                />
              </div>
            )}
          </div>

          {/* Período preferido */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}><PiSunBold size={11}/> Período preferido</label>
            <div className={styles.estGridCompact}>
              {[
                { val: null,    label: 'Qualquer' },
                { val: 'manha', label: 'Manhã'    },
                { val: 'tarde', label: 'Tarde'    },
                { val: 'noite', label: 'Noite'    },
              ].map(o => (
                <button key={String(o.val)} type="button"
                  className={[styles.estChip, period===o.val && styles.estChipSel].filter(Boolean).join(' ')}
                  onClick={() => setPeriod(o.val)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.detailsDivider}/>

          {/* Prazo final */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}><PiCalendarCheckBold size={11}/> Prazo final</label>
            <div className={styles.estGridCompact}>
              <button type="button"
                className={[styles.estChip, !deadline && !deadlineOpen && styles.estChipSel].filter(Boolean).join(' ')}
                onClick={() => { setDeadline(''); setDeadlineOpen(false) }}>
                Nenhum
              </button>
              <button type="button"
                className={[styles.estChip, deadline === localTodayStr() && styles.estChipSel].filter(Boolean).join(' ')}
                onClick={() => { setDeadline(localTodayStr()); setDeadlineOpen(false) }}>
                Hoje
              </button>
              {deadline && deadline !== localTodayStr() ? (
                <span className={styles.estTag}>
                  {formatDeadlineTag(deadline)}
                  <button type="button" className={styles.estTagDel}
                    onClick={() => { setDeadline(''); setDeadlineOpen(false) }}>
                    <PiXBold size={8}/>
                  </button>
                </span>
              ) : (
                <button type="button"
                  className={[styles.estChip, deadlineOpen && styles.estChipSel].filter(Boolean).join(' ')}
                  onClick={() => setDeadlineOpen(o => !o)}>
                  ≠ dia
                </button>
              )}
            </div>
            {deadlineOpen && (
              <div className={styles.estCustomRow}>
                <input
                  type="date" className="input"
                  min={new Date().toISOString().slice(0,10)}
                  onChange={e => {
                    const val = e.target.value
                    if (val) { setDeadline(val); setTimeout(() => setDeadlineOpen(false), 50) }
                  }}
                />
              </div>
            )}
            {deadline && dlStatus && (
              <p className={styles.dlHint} style={{color: dlStatus.color}}>{dlStatus.label}</p>
            )}
          </div>

        </div>
      )}

      {/* Ações */}
      <div className={styles.panelActions}>
        <button type="button" className={`btn btn-primary ${styles.actionBtn}`} onClick={handleSave}>
          <PiFloppyDiskBold size={14} /> Salvar
        </button>
        <button type="button" className={`btn ${styles.actionBtn} ${styles.archiveBtn}`} onClick={handleArchive}>
          <PiArchiveBold size={14} /> Arquivar
        </button>
      </div>

    </div>
  )
}

// ══════════════════════════════════════
// TOMORROW CARD
// Preview de hábitos agendados para amanhã
// (não ativos hoje). Aparece como "fantasma"
// com borda tracejada + animação de respiração.
// Ao virar meia-noite, desaparece daqui e
// surge normalmente no bloco do dia.
// ══════════════════════════════════════
function TomorrowCard({ habit, history, onSave, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const priColor = PRI_COLORS[habit.priority ?? 'media']

  return (
    <article
      className={styles.tomorrowCard}
      style={{ '--pri-color': priColor }}
    >
      <div
        className={styles.tomorrowRow}
        onClick={() => { setExpanded(e => !e); setEditMode(false) }}
        role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && (setExpanded(v => !v), setEditMode(false))}
        aria-expanded={expanded}
      >
        <div className={styles.tomorrowBtn}>
          <PiMoonBold size={14} color="var(--ink3)" />
        </div>

        <div className={styles.taskContent}>
          <div className={styles.taskName}>
            <HabIcon name={habit.icon} size={14} color="var(--ink3)" />
            <span className={styles.taskNameText}>{habit.name}</span>
          </div>
          <div className={styles.taskMetaRow}>
            <span className={styles.tomorrowChip}>amanhã</span>
            {habit.estMins && (
              <span className={styles.taskMetaLast}>~{habit.estMins}min</span>
            )}
          </div>
        </div>

        <span className={styles.tomorrowPts}>+{habit.pts}</span>
        <span className={[styles.expandArrow, expanded && styles.expandArrowOpen].filter(Boolean).join(' ')}>
          <PiCaretDownBold size={12} color="var(--ink3)" />
        </span>
      </div>

      {expanded && !editMode && (
        <QuickPanel
          habit={habit} history={history}
          onEdit={() => setEditMode(true)}
          onSave={onSave}
          onDelete={() => { onDelete(habit.id); setExpanded(false) }}
        />
      )}

      {expanded && editMode && (
        <div className={styles.editPanelInner}>
          <EditPanel
            habit={habit} history={history}
            onSave={updated => { onSave(updated); setExpanded(false); setEditMode(false) }}
            onDelete={id => { onDelete(id); setExpanded(false); setEditMode(false) }}
            onClose={() => setEditMode(false)}
          />
        </div>
      )}
    </article>
  )
}

// ══════════════════════════════════════
// HABIT CARD
// — borda esquerda com cor de prioridade
// — botão +pts para concluir (tap)
// — swipe direita para concluir (mobile)
// — toque longo para seleção múltipla
// — toque no card abre QuickPanel, botão editar abre EditPanel
// ══════════════════════════════════════
function HabitCard({ habit, history, onToggle, onSave, onDelete, selecting, selected, onSelect, onLongPress }) {
  const [expanded,   setExpanded]   = useState(false)
  const [editMode,   setEditMode]   = useState(false)
  const [ptsBounce,  setPtsBounce]  = useState(false)
  const [floatKey,   setFloatKey]   = useState(0)
  const [swipeDelta, setSwipeDelta] = useState(0)
  const [ptsFlash,   setPtsFlash]   = useState(false)
  const prevPts        = useRef(habit.pts)
  const longPressTimer = useRef(null)
  const swipeStartX    = useRef(null)
  const swipeStartY    = useRef(null)
  const isSwiping      = useRef(false)

  useEffect(() => {
    if (habit.pts !== prevPts.current) {
      prevPts.current = habit.pts
      setPtsFlash(true)
      setTimeout(() => setPtsFlash(false), 400)
    }
  }, [habit.pts])

  const todayDow    = new Date().getDay()
  const activeToday = Array.isArray(habit.days) && habit.days.includes(todayDow)
  const dlStatus    = habit.deadline ? deadlineStatus(habit.deadline) : null
  const priColor    = PRI_COLORS[habit.priority ?? 'media']
  const lastDone    = lastDoneText(habit.id, history)

  // Próxima ocorrência — só mostra quando concluído hoje e tem prazo ativo (não vencido)
  let nextOcc = null
  if (habit.done && habit.deadline) {
    const t = new Date(); t.setHours(0, 0, 0, 0)
    const dl = new Date(habit.deadline + 'T00:00:00')
    if (dl >= t && Array.isArray(habit.days)) {
      for (let i = 1; i <= 7; i++) {
        if (habit.days.includes((todayDow + i) % 7)) {
          nextOcc = i === 1 ? 'amanhã' : `em ${i}d`
          break
        }
      }
    }
  }

  function handlePtsClick(e) {
    e.stopPropagation()
    if (selecting) { onSelect(habit.id); return }
    if (!activeToday) return
    if (!habit.done) {
      setPtsBounce(true)
      setFloatKey(k => k + 1)
      setTimeout(() => setPtsBounce(false), 700)
    }
    onToggle(habit.id)
  }

  function onTouchStart(e) {
    if (editMode) return  // não rastreia swipe/longpress enquanto o painel de edição está aberto
    const t = e.touches[0]
    swipeStartX.current = t.clientX
    swipeStartY.current = t.clientY
    isSwiping.current   = false
    longPressTimer.current = setTimeout(() => onLongPress?.(), 500)
  }

  function onTouchMove(e) {
    if (!swipeStartX.current) return
    const t  = e.touches[0]
    const dx = t.clientX - swipeStartX.current
    const dy = Math.abs(t.clientY - swipeStartY.current)
    if (!isSwiping.current && dy > 10 && dy > Math.abs(dx)) {
      clearTimeout(longPressTimer.current)
      swipeStartX.current = null
      return
    }
    if (Math.abs(dx) > 8) {
      isSwiping.current = true
      clearTimeout(longPressTimer.current)
      setSwipeDelta(Math.max(0, Math.min(90, dx)))
    }
  }

  function onTouchEnd() {
    clearTimeout(longPressTimer.current)
    if (isSwiping.current && swipeDelta > 65 && !habit.done && activeToday) {
      onToggle(habit.id)
    }
    setSwipeDelta(0)
    isSwiping.current   = false
    swipeStartX.current = null
  }

  function handleExpandToggle() {
    if (selecting) { onSelect(habit.id); return }
    setExpanded(e => {
      if (e) setEditMode(false)
      return !e
    })
  }

  return (
    <article
      className={[styles.habitCard, selected && styles.habitSelected].filter(Boolean).join(' ')}
      style={{ '--pri-color': priColor, position: 'relative', overflow: 'hidden' }}
    >
      {/* Indicador de swipe */}
      <div className={styles.swipeUnderlay} style={{ opacity: Math.min(1, swipeDelta / 65) }}>
        <PiCheckBold size={16} color="#fff" />
      </div>

      {/* Conteúdo deslizável */}
      <div
        className={styles.swipeInner}
        style={{ transform: `translateX(${swipeDelta}px)`, transition: swipeDelta === 0 ? 'transform .2s ease' : 'none' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={() => { if (!editMode) longPressTimer.current = setTimeout(() => onLongPress?.(), 500) }}
        onMouseUp={() => clearTimeout(longPressTimer.current)}
        onMouseLeave={() => clearTimeout(longPressTimer.current)}
      >
        {/* ── Linha principal ── */}
        <div
          className={styles.taskRow}
          onClick={handleExpandToggle}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && handleExpandToggle()}
          aria-expanded={expanded}
        >
          {/* Botão +pts */}
          <div className={styles.ptsBtnWrap}>
            <button
              type="button"
              className={[
                styles.ptsBtn,
                habit.done   && styles.ptsBtnDone,
                ptsBounce    && styles.ptsBtnPress,
                !activeToday && styles.ptsBtnInactive,
              ].filter(Boolean).join(' ')}
              onClick={handlePtsClick}
              aria-label={habit.done ? 'Desmarcar' : `+${habit.pts} pts`}
            >
              {habit.done
                ? <PiCheckBold size={11} color="var(--bg)" />
                : <HabIcon name={habit.icon} size={13} color="var(--pri-color, var(--ink2))" />
              }
            </button>
            {ptsBounce && (
              <span key={floatKey} className={styles.ptsFloat}>+{habit.pts}</span>
            )}
          </div>

          <div className={styles.taskContent}>
            <div className={styles.taskName}>
              <span className={[styles.taskNameText, habit.done && styles.taskNameDone].filter(Boolean).join(' ')}>
                {habit.name}
              </span>
              {!activeToday && <span className={styles.notTodayChip}>não hoje</span>}
            </div>
          </div>

          <span className={[styles.habPts, ptsFlash && styles.habPtsFlash].filter(Boolean).join(' ')}>
            +{habit.pts}
          </span>
          <span className={[styles.expandArrow, expanded && styles.expandArrowOpen].filter(Boolean).join(' ')}>
            <PiCaretDownBold size={10} color={expanded ? 'var(--bg)' : 'var(--ink3)'} />
          </span>
        </div>

        {/* ── QuickPanel — contexto, histórico, notas ── */}
        {expanded && !editMode && (
          <QuickPanel
            habit={habit} history={history}
            onEdit={() => setEditMode(true)}
            onSave={onSave}
            onDelete={() => { onDelete(habit.id); setExpanded(false) }}
          />
        )}

        {/* ── EditPanel — modo edição completo ── */}
        {expanded && editMode && (
          <div className={styles.editPanelInner}>
            <EditPanel
              habit={habit} history={history}
              onSave={updated => { onSave(updated); setExpanded(false); setEditMode(false) }}
              onDelete={id => { onDelete(id); setExpanded(false); setEditMode(false) }}
              onClose={() => setEditMode(false)}
            />
          </div>
        )}
      </div>
    </article>
  )
}

// ══════════════════════════════════════
// HABITS — PÁGINA PRINCIPAL
// ══════════════════════════════════════
// ══════════════════════════════════════
// CALENDÁRIO MENSAL
// Navegação entre meses com cor por %
// de conclusão de hábitos do dia.
// ══════════════════════════════════════
function MonthCalendar({ history, habits }) {
  const today = new Date()
  const [viewDate,    setViewDate]    = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(null)
  const [showGuide,   setShowGuide]   = useState(false)

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthLabel = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const firstDay   = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayISO    = today.toISOString().slice(0, 10)

  function goMonth(delta) {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const iso  = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const rec  = history[iso]
    const done = rec?.done  || 0
    const tot  = rec?.total || 0
    const pct  = tot > 0 ? Math.round(done / tot * 100) : -1
    cells.push({ d, iso, done, tot, pct, isToday: iso === todayISO, isFuture: iso > todayISO })
  }

  const getColor = (pct) => {
    if (pct < 0)   return 'var(--surface)'
    if (pct === 0) return '#f5d5d5'
    if (pct < 50)  return '#fde8c8'
    if (pct < 100) return '#fac78a'
    return '#b8e8b8'
  }

  const WEEK = ['D','S','T','Q','Q','S','S']


  return (
    <div className="card" style={{ marginTop:8 }}>
      <div className="card-title">
        <span className={styles.calTitleGroup}>
          <PiCalendarBold size={15}/> Calendário
          <button type="button" className={styles.calGuideBtn} onClick={() => setShowGuide(v => !v)}
            title="Como usar o calendário">
            <PiQuestionBold size={13} color={showGuide ? 'var(--ink)' : 'var(--ink3)'} />
          </button>
        </span>
        <div className={styles.calNav}>
          <button type="button" className={styles.calNavBtn} onClick={() => goMonth(-1)}>‹</button>
          <span className={styles.calMonthLabel}>{monthLabel}</span>
          <button type="button" className={styles.calNavBtn} onClick={() => goMonth(1)}>›</button>
          {!isCurrentMonth && (
            <button type="button" className={styles.calTodayBtn}
              onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}>
              Hoje
            </button>
          )}
        </div>
      </div>

      {showGuide && (
        <div className={styles.calGuide}>
          <p className={styles.calGuideTitle}>Como usar</p>
          <ol className={styles.calGuideList}>
            <li><strong>Navegue pelos meses</strong> com os botões ‹ e ›. O botão <em>Hoje</em> volta ao mês atual quando você estiver em outro mês.</li>
            <li><strong>Clique em qualquer dia passado</strong> para abrir o detalhe e ver quais hábitos foram concluídos naquele dia.</li>
            <li><strong>O número no canto inferior</strong> de cada célula indica quantos hábitos foram concluídos no dia.</li>
            <li><strong>Dias futuros</strong> aparecem sem cor e não são clicáveis.</li>
          </ol>
          <p className={styles.calGuideTitle}>Legenda de cores</p>
          <ul className={styles.calGuideColors}>
            <li><span className={styles.calGuideSwatch} style={{ background:'var(--surface)', border:'1px solid var(--border)' }}/> Sem registro</li>
            <li><span className={styles.calGuideSwatch} style={{ background:'#f5d5d5' }}/> 0% — nenhum hábito feito</li>
            <li><span className={styles.calGuideSwatch} style={{ background:'#fde8c8' }}/> Abaixo de 50%</li>
            <li><span className={styles.calGuideSwatch} style={{ background:'#fac78a' }}/> Entre 50% e 99%</li>
            <li><span className={styles.calGuideSwatch} style={{ background:'#b8e8b8' }}/> 100% — dia perfeito</li>
          </ul>
        </div>
      )}

      <div className={styles.calGrid}>
        {WEEK.map((d,i) => (
          <div key={i} className={styles.calWeekHead}>{d}</div>
        ))}
        {cells.map((cell, i) => (
          cell === null
            ? <div key={`e${i}`} className={styles.calCellEmpty}/>
            : (
              <div key={cell.iso}
                className={[
                  styles.calCell,
                  cell.isToday && styles.calCellToday,
                  cell.isFuture && styles.calCellFuture,
                  !cell.isFuture && styles.calCellClickable,
                  selectedDay === cell.iso && styles.calCellSelected,
                ].filter(Boolean).join(' ')}
                style={{ background: cell.isFuture ? 'transparent' : getColor(cell.pct) }}
                onClick={() => !cell.isFuture && setSelectedDay(d => d === cell.iso ? null : cell.iso)}
                title={cell.tot > 0 ? `${cell.done}/${cell.tot} hábitos` : cell.iso}>
                <span className={styles.calDayNum}>{cell.d}</span>
                {cell.done > 0 && <span className={styles.calDone}>{cell.done}</span>}
              </div>
            )
        ))}
      </div>

      {/* Detalhe do dia selecionado */}
      {selectedDay && (() => {
        const rec = history[selectedDay]
        // Obter todos os hábitos concluídos neste dia (sem filtrar por dia da semana)
        // pois o usuário quer ver o que fez naquele dia, não apenas o que estava programado
        const doneIds = Object.keys(rec?.habits || {}).map(Number)
        const dateLabel = new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', {
          weekday: 'long', day: 'numeric', month: 'long',
        })
        return (
          <div className={styles.dayDetail}>
            <div className={styles.dayDetailHeader}>
              <span className={styles.dayDetailDate}>{dateLabel}</span>
              <button type="button" className={styles.dayDetailClose} onClick={() => setSelectedDay(null)}>
                <PiXBold size={12} />
              </button>
            </div>
            {doneIds.length > 0 ? (
              <div className={styles.dayDetailList}>
                {doneIds.map(id => {
                  const hab = habits.find(h => h.id === id)
                  return (
                    <div key={id} className={styles.dayDetailHabit}>
                      <PiCheckBold size={11} color="#27ae60" />
                      <span>{hab ? hab.name : `Hábito #${id}`}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className={styles.dayDetailEmpty}>
                {rec ? 'Nenhum hábito concluído neste dia' : 'Sem registro para este dia'}
              </p>
            )}
          </div>
        )
      })()}

    </div>
  )
}


// ══════════════════════════════════════
// STEPS PROGRESS
// Barra de steps por hábito — cada segmento
// representa um hábito, colorido por status.
// ══════════════════════════════════════
function StepsProgress({ todayHabs }) {
  const done  = todayHabs.filter(h => h.done).length
  const total = todayHabs.length
  if (total === 0) return null

  const PO = { alta: 0, media: 1, baixa: 2 }
  const sorted = [...todayHabs].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return (PO[a.priority] ?? 1) - (PO[b.priority] ?? 1)
  })

  const allDone = done === total

  return (
    <div className={`card ${styles.stepsCard}`}>
      <div className={styles.stepsHeader}>
        <span className={[styles.stepsLabel, allDone && styles.stepsLabelDone].filter(Boolean).join(' ')}>
          {allDone ? 'Dia completo' : 'Hoje'}
        </span>
        <div className={styles.stepsCount}>
          <span className={styles.stepsDoneNum} style={{ color: allDone ? '#27ae60' : 'var(--ink)' }}>{done}</span>
          <span className={styles.stepsOf}>/{total}</span>
        </div>
      </div>
      <div className={styles.stepsRow}>
        {sorted.map(h => (
          <div
            key={h.id}
            className={[
              styles.step,
              h.done ? styles.stepDone
                : h.priority === 'alta'  ? styles.stepAlta
                : h.priority === 'media' ? styles.stepMedia
                : styles.stepBaixa,
            ].join(' ')}
            title={h.name}
          />
        ))}
      </div>
      <div className={styles.stepsLegend}>
        <span className={styles.stepsLegItem}><span className={`${styles.stepsLegDot} ${styles.stepDone}`}/>concluído</span>
        <span className={styles.stepsLegItem}><span className={`${styles.stepsLegDot} ${styles.stepAlta}`}/>alta</span>
        <span className={styles.stepsLegItem}><span className={`${styles.stepsLegDot} ${styles.stepMedia}`}/>média</span>
        <span className={styles.stepsLegItem}><span className={`${styles.stepsLegDot} ${styles.stepBaixa}`}/>baixa</span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// MODAL: Limite de hábitos (free → pro)
// ══════════════════════════════════════
const FREE_ITEMS = [
  'Até 10 hábitos',
  'Histórico e gráficos básicos',
  'Finanças pessoais',
  'Conquistas e recompensas',
]
const PRO_ITEMS = [
  'Hábitos ilimitados',
  'Mentor IA (sem chave própria)',
  'Resumo diário personalizado',
  'Sugestão de hábitos por IA',
  'Temas exclusivos',
  'Backup e exportação JSON',
]

function HabitLimitModal({ onUpgrade, onStayFree }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 360, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PiCrownBold size={18} color="var(--gold-dk)" />
          <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)' }}>Limite atingido</span>
        </div>

        <p style={{ fontSize: 12, color: 'var(--ink2)', margin: 0, lineHeight: 1.5 }}>
          Você chegou ao limite de <strong>10 hábitos</strong> do plano gratuito.
          Faça upgrade para criar quantos quiser.
        </p>

        {/* Comparação */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Free */}
          <div style={{ background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 6, padding: '10px 12px' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink3)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Gratuito</p>
            {FREE_ITEMS.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 5 }}>
                <PiCheckCircleBold size={12} color="var(--ink3)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--ink2)', lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
          {/* Pro */}
          <div style={{ background: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 6, padding: '10px 12px' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Pro</p>
            {PRO_ITEMS.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 5 }}>
                <PiCheckCircleBold size={12} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--bg)', lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <button type="button" className="btn btn-primary" style={{ justifyContent: 'center', gap: 6, fontSize: 13 }} onClick={onUpgrade}>
          <PiCrownBold size={14} /> Ver plano Pro
        </button>
        <button type="button" className="btn" style={{ justifyContent: 'center', fontSize: 12, color: 'var(--ink3)', border: '1.5px solid var(--border)' }} onClick={onStayFree}>
          Continuar com 10 hábitos
        </button>
      </div>
    </div>
  )
}

export default function Habits() {
  const { habits, history, toggleHabit, saveHabit, addHabit, deleteHabit, soundOn } = useApp()
  const { allPoints } = useHabits()
  const { playCheck, playUncheck } = useSound(soundOn)
  const { can, isPro } = usePlan()
  const navigate = useNavigate()
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [limitDecided,   setLimitDecided]   = useState(
    () => localStorage.getItem('nex_habit_limit_decided') === 'true'
  )

  // calOwned: reativo via usePlan (sincroniza eventos nex_plan_changed + nex_shop_changed)
  const calOwned = can('habits_calendar')

  const [calVisible, setCalVisible] = useState(() => loadStorage('nex_cal_visible', true))
  useEffect(() => {
    const sync = () => setCalVisible(loadStorage('nex_cal_visible', true))
    window.addEventListener('nex_shop_changed', sync)
    return () => window.removeEventListener('nex_shop_changed', sync)
  }, [])

  const [newName,      setNewName]      = useState('')
  const [selecting,    setSelecting]    = useState(false)
  const [selected,     setSelected]     = useState(new Set())
  const [doneOpen,     setDoneOpen]     = useState(false)
  const [tomorrowOpen, setTomorrowOpen] = useState(true)
  const [archivedOpen, setArchivedOpen] = useState(false)
  const [search,       setSearch]       = useState('')

  const todayDow    = new Date().getDay()
  const tomorrowDow = (todayDow + 1) % 7

  const todayHabs = useMemo(
    () => habits.filter(h => !h.archived && Array.isArray(h.days) && h.days.includes(todayDow)),
    [habits, todayDow]
  )

  // Hábitos agendados para amanhã:
  // — exclusivos de amanhã (não são de hoje): sempre aparecem
  // — ativos hoje E amanhã (ex: diário): só aparecem se já foram concluídos hoje
  const tomorrowHabs = useMemo(
    () => habits.filter(h =>
      !h.archived &&
      Array.isArray(h.days) &&
      h.days.includes(tomorrowDow) &&
      (!h.days.includes(todayDow) || h.done)
    ),
    [habits, tomorrowDow, todayDow]
  )

  const archivedHabs = useMemo(
    () => habits.filter(h => h.archived),
    [habits]
  )

  // ── Três blocos de ação ──
  const priorities = useMemo(() =>
    todayHabs
      .filter(h => !h.done && (h.priority === 'alta' || h.priority === 'media'))
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)),
    [todayHabs]
  )
  const normal = useMemo(() =>
    todayHabs.filter(h => !h.done && h.priority === 'baixa'),
    [todayHabs]
  )
  const done = useMemo(() =>
    todayHabs.filter(h => h.done),
    [todayHabs]
  )

  const total     = todayHabs.length
  const doneCount = done.length
  const todayRate = total > 0 ? Math.round(doneCount / total * 100) : 0

  const searchLower = search.toLowerCase()
  const filteredPriorities = search ? priorities.filter(h => h.name.toLowerCase().includes(searchLower)) : priorities
  const filteredNormal     = search ? normal.filter(h => h.name.toLowerCase().includes(searchLower)) : normal
  const filteredDone       = search ? done.filter(h => h.name.toLowerCase().includes(searchLower)) : done
  const filteredTomorrow   = search ? tomorrowHabs.filter(h => h.name.toLowerCase().includes(searchLower)) : tomorrowHabs
  const filteredArchived   = search ? archivedHabs.filter(h => h.name.toLowerCase().includes(searchLower)) : archivedHabs

  function unarchiveHabit(id) {
    const hab = habits.find(h => h.id === id)
    if (hab) saveHabit({ ...hab, archived: false })
  }

  const handleToggle = useCallback((id) => {
    const hab = habits.find(h => h.id === id)
    if (!hab) return
    if (!hab.done) { playCheck(); toast(`+${hab.pts} pts!`) }
    else playUncheck()
    toggleHabit(id)
  }, [habits, playCheck, playUncheck, toggleHabit])

  const FREE_HABIT_LIMIT = 10
  const atLimit = !isPro && habits.length >= FREE_HABIT_LIMIT

  function handleAdd() {
    const n = newName.trim()
    if (!n) return
    if (atLimit) {
      if (!limitDecided) setShowLimitModal(true)
      return
    }
    playSaveDirect()
    addHabit({ name: n, done: false, pts: 20, icon: 'PiStarBold', priority: 'media',
      freq: 'diario', days: [0,1,2,3,4,5,6], subtasks: [], notes: '', estMins: null, deadline: null,
      createdAt: new Date().toISOString().slice(0, 10) })
    setNewName('')
    toast(`"${n}" adicionado!`)
  }

  function handleUpgrade() {
    setShowLimitModal(false)
    navigate('/profile')
  }

  function handleStayFree() {
    localStorage.setItem('nex_habit_limit_decided', 'true')
    setLimitDecided(true)
    setShowLimitModal(false)
  }

  function cardProps(hab) {
    return {
      habit: hab, history,
      onToggle: handleToggle,
      onSave:   saveHabit,
      onDelete: deleteHabit,
      selecting,
      selected: selected.has(hab.id),
      onSelect: (id) => {
        const next = new Set(selected)
        next.has(id) ? next.delete(id) : next.add(id)
        setSelected(next)
      },
      onLongPress: () => { setSelecting(true); setSelected(new Set([hab.id])) },
    }
  }

  return (
    <main className={styles.page}>

      {/* ── Busca ── */}
      <div className={styles.searchBar}>
        <PiMagnifyingGlassBold size={14} color="var(--ink3)" />
        <input
          className={styles.searchInput}
          placeholder="Buscar hábito..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoComplete="off"
        />
        {search && (
          <button type="button" className={styles.searchClear} onClick={() => setSearch('')}>
            <PiXBold size={12} />
          </button>
        )}
      </div>

      {/* ── Steps progress ── */}
      <StepsProgress todayHabs={todayHabs} />

      {/* ── Modo seleção ── */}
      {selecting && selected.size > 0 && (
        <div className={`card ${styles.selectBarCard}`}>
          <div className={styles.selectBar}>
            <span className={styles.selectCount}>{selected.size} selecionado{selected.size > 1 ? 's' : ''}</span>
            <button type="button" className={styles.selectDelBtn}
              onClick={() => {
                if (!window.confirm(`Excluir ${selected.size} hábito${selected.size > 1 ? 's' : ''}?`)) return
                selected.forEach(id => deleteHabit(id))
                setSelected(new Set()); setSelecting(false)
                toast(`${selected.size} excluído${selected.size > 1 ? 's' : ''}!`)
              }}>
              <PiTrashBold size={13} /> Excluir
            </button>
            <button type="button" className={styles.selectCancelBtn}
              onClick={() => { setSelecting(false); setSelected(new Set()) }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── BLOCO 1: PRIORIDADES ── */}
      {filteredPriorities.length > 0 && (
        <div className={`card ${styles.block}`}>
          <div className={styles.blockHeader}>
            <PiFlagBold size={11} />
            <span className={styles.blockTitle}>Prioridades</span>
            <span className={styles.blockCount}>{filteredPriorities.length}</span>
          </div>
          <div className={styles.habitList}>
            {filteredPriorities.map(hab => <HabitCard key={hab.id} {...cardProps(hab)} />)}
          </div>
        </div>
      )}

      {/* ── BLOCO 2: HÁBITOS + ADICIONAR ── */}
      <div className={`card ${styles.block}`}>
        <div className={styles.blockHeader}>
          <PiListBold size={11} />
          <span className={styles.blockTitle}>Hábitos</span>
          {filteredNormal.length > 0 && <span className={styles.blockCount}>{filteredNormal.length}</span>}
        </div>
        {filteredNormal.length > 0 ? (
          <div className={styles.habitList}>
            {filteredNormal.map(hab => <HabitCard key={hab.id} {...cardProps(hab)} />)}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyStateText}>Nenhum hábito ainda.</span>
            <span className={styles.emptyStateHint}>Use o campo abaixo para criar o primeiro.</span>
          </div>
        )}
        {atLimit && limitDecided ? (
          <div className={styles.addRow} style={{ opacity: 0.5, cursor: 'not-allowed', userSelect: 'none' }}>
            <PiCrownBold size={14} color="var(--gold-dk)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--ink3)', flex: 1 }}>
              Limite de 10 hábitos atingido — <button type="button" onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: 'var(--ink2)', fontWeight: 700, textDecoration: 'underline' }}>ver plano Pro</button>
            </span>
          </div>
        ) : (
          <div className={styles.addRow}>
            <PiPlusBold size={14} color="var(--ink3)" style={{ flexShrink: 0 }} />
            <input
              className={styles.addInput}
              placeholder="Novo hábito..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoComplete="off"
            />
            {newName.trim() && (
              <button type="button" className={styles.addBtn} onClick={handleAdd}>
                <PiCheckBold size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {showLimitModal && (
        <HabitLimitModal onUpgrade={handleUpgrade} onStayFree={handleStayFree} />
      )}

      {/* Tudo concluído */}
      {filteredPriorities.length === 0 && filteredNormal.length === 0 && doneCount > 0 && !search && (
        <div className={`card ${styles.allDoneCard}`}>
          <PiCheckCircleFill size={18} color="#27ae60" />
          <span className={styles.allDoneText}>Dia completo — todos os hábitos concluídos!</span>
        </div>
      )}

      {/* ── BLOCO 3: CONCLUÍDOS ── */}
      {filteredDone.length > 0 && (
        <div className={`card ${styles.block}`}>
          <button
            type="button"
            className={`${styles.blockHeader} ${styles.blockHeaderBtn}`}
            onClick={() => setDoneOpen(o => !o)}
          >
            <PiCheckCircleFill size={11} color="#27ae60" />
            <span className={styles.blockTitle}>Concluídos</span>
            <span className={styles.blockCount}>{filteredDone.length}</span>
            <PiCaretDownBold size={10} color="var(--ink3)"
              style={{ marginLeft: 'auto', transform: doneOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>
          {doneOpen && (
            <div className={styles.habitList}>
              {filteredDone.map(hab => <HabitCard key={hab.id} {...cardProps(hab)} />)}
            </div>
          )}
        </div>
      )}

      {/* ── BLOCO: AMANHÃ ── */}
      {filteredTomorrow.length > 0 && (
        <div className={`card ${styles.block} ${styles.tomorrowBlock}`}>
          <button
            type="button"
            className={`${styles.blockHeader} ${styles.blockHeaderBtn}`}
            onClick={() => setTomorrowOpen(o => !o)}
          >
            <PiMoonBold size={11} />
            <span className={styles.blockTitle}>Amanhã</span>
            <span className={styles.blockCount}>{filteredTomorrow.length}</span>
            <PiCaretDownBold size={10} color="var(--ink3)"
              style={{ marginLeft: 'auto', transform: tomorrowOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>
          {tomorrowOpen && (
            <div className={styles.habitList}>
              {filteredTomorrow.map(hab => (
                <TomorrowCard
                  key={hab.id} habit={hab} history={history}
                  onSave={saveHabit} onDelete={deleteHabit}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BLOCO: ARQUIVADOS ── */}
      {filteredArchived.length > 0 && (
        <div className={`card ${styles.block}`}>
          <button
            type="button"
            className={`${styles.blockHeader} ${styles.blockHeaderBtn}`}
            onClick={() => setArchivedOpen(o => !o)}
          >
            <PiArchiveBold size={11} />
            <span className={styles.blockTitle}>Arquivados</span>
            <span className={styles.blockCount}>{filteredArchived.length}</span>
            <PiCaretDownBold size={10} color="var(--ink3)"
              style={{ marginLeft: 'auto', transform: archivedOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>
          {archivedOpen && (
            <div className={styles.habitList}>
              {filteredArchived.map(hab => (
                <div key={hab.id} className={styles.archivedCard}>
                  <HabIcon name={hab.icon} size={13} color="var(--ink3)" />
                  <span className={styles.archivedName}>{hab.name}</span>
                  <button type="button" className={styles.unarchiveBtn}
                    onClick={() => unarchiveHabit(hab.id)} title="Restaurar hábito">
                    <PiArrowCounterClockwiseBold size={13} />
                  </button>
                  <button type="button" className={styles.archiveDelBtn}
                    onClick={() => { if (window.confirm(`Excluir "${hab.name}" permanentemente?`)) deleteHabit(hab.id) }}
                    title="Excluir permanentemente">
                    <PiTrashBold size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {calOwned && calVisible
        ? <MonthCalendar history={history} habits={habits} />
        : !calOwned && (
          <div className="card">
            <div className={styles.calLocked}>
              <div className={styles.calLockedIcon}>
                <PiCalendarBold size={22} color="var(--ink3)" />
              </div>
              <p className={styles.calLockedTitle}>Calendário bloqueado</p>
              <p className={styles.calLockedDesc}>
                Desbloqueie com <strong>500 io</strong> na loja de recompensas.
              </p>
              <div className={styles.calLockedBarWrap}>
                <div
                  className={styles.calLockedBarFill}
                  style={{ width: `${Math.min(100, Math.round(allPoints / 500 * 100))}%` }}
                />
              </div>
              <p className={styles.calLockedProgress}>{allPoints} / 500 io</p>
            </div>
          </div>
        )
      }
    </main>
  )
}

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '../hooks/usePlan'
import { PlanLimitModal } from '../components/PlanLimitModal'
import {
  PiBriefcaseBold, PiBookOpenTextBold, PiTargetBold,
  PiPlusBold, PiXBold, PiCheckBold, PiTrashBold,
  PiPencilSimpleBold, PiFloppyDiskBold, PiCalendarBold,
  PiStarBold, PiArrowRightBold,
  PiCheckCircleBold, PiClockBold, PiLinkBold,
  PiCaretDownBold, PiCaretUpBold, PiLockSimpleBold, PiCrownBold,
  PiQuestionBold, PiCheckSquareBold,
} from 'react-icons/pi'
import { toast } from '../components/Toast'
import { playSaveDirect } from '../hooks/useSound'
import { useAuth } from '../context/AuthContext'
import { upsertRows, fetchRows } from '../services/supabase'
import { loadStorage } from '../services/storage'
import styles from './Career.module.css'

// ══════════════════════════════════════
// STORAGE
// ══════════════════════════════════════
const KEYS = {
  readings: 'nex_career_readings',
  goals:    'nex_career_goals',
  projects: 'nex_career_projects',
}
const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb } catch { return fb } }
const save = (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// ══════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════
const READING_TYPES   = ['Livro', 'Curso', 'Artigo', 'Podcast', 'Vídeo']
const READING_STATUS  = [
  { id: 'quero',      label: 'Quero ler',  color: '#95a5a6' },
  { id: 'lendo',      label: 'Em andamento', color: '#2980b9' },
  { id: 'concluido',  label: 'Concluído',  color: '#27ae60' },
  { id: 'pausado',    label: 'Pausado',    color: '#e67e22' },
]
const PROJECT_STATUS  = [
  { id: 'planejando',  label: 'Planejando',    color: '#95a5a6' },
  { id: 'andamento',   label: 'Em andamento',  color: '#2980b9' },
  { id: 'pausado',     label: 'Pausado',       color: '#e67e22' },
  { id: 'concluido',   label: 'Concluído',     color: '#27ae60' },
]
const GOAL_AREAS = ['Tecnologia', 'Comunicação', 'Liderança', 'Criatividade', 'Negócios', 'Saúde', 'Outro']

function todayISO() { return new Date().toISOString().slice(0, 10) }
function daysLeft(iso) {
  if (!iso) return null
  const diff = Math.round((new Date(iso + 'T00:00:00') - new Date()) / 86_400_000)
  return diff
}
function fmtDeadline(iso) {
  if (!iso) return null
  const d = daysLeft(iso)
  if (d < 0)   return { txt: `Venceu há ${Math.abs(d)}d`,  color: '#c0392b' }
  if (d === 0) return { txt: 'Vence hoje',                  color: '#e67e22' }
  if (d <= 7)  return { txt: `${d}d restantes`,            color: '#e67e22' }
  return               { txt: `${d}d restantes`,            color: 'var(--ink3)' }
}

// ══════════════════════════════════════
// HOOK — estado de carreira
// ══════════════════════════════════════
function useCareer() {
  const [readings,  setReadings]  = useState(() => load(KEYS.readings, []))
  const [goals,     setGoals]     = useState(() => load(KEYS.goals,    []))
  const [projects,  setProjects]  = useState(() => load(KEYS.projects, []))

  const { isLoggedIn, user } = useAuth()
  const userId = user?.id ?? null

  useEffect(() => {
    if (!isLoggedIn || !userId) return

    async function loadFromDB() {
      const { data: readingsData } = await fetchRows('career_readings', userId)
      if (readingsData?.length > 0) {
        setReadings(readingsData)
        save(KEYS.readings, readingsData)
      }

      const { data: goalsData } = await fetchRows('career_goals', userId)
      if (goalsData?.length > 0) {
        setGoals(goalsData)
        save(KEYS.goals, goalsData)
      }

      const { data: projectsData } = await fetchRows('career_projects', userId)
      if (projectsData?.length > 0) {
        setProjects(projectsData)
        save(KEYS.projects, projectsData)
      }
    }

    loadFromDB()
  }, [isLoggedIn, userId])

  const upd = (setter, key, table) => (list) => {
    setter(list)
    save(key, list)
    if (isLoggedIn && userId) {
      const rows = list.map(r => ({ ...r, user_id: userId }))
      if (rows.length > 0) {
        upsertRows(table, rows)
          .catch(e => console.warn(`[Sync] ${table}:`, e))
      }
    }
  }

  const updReadings  = upd(setReadings,  KEYS.readings,  'career_readings')
  const updGoals     = upd(setGoals,     KEYS.goals,     'career_goals')
  const updProjects  = upd(setProjects,  KEYS.projects,  'career_projects')

  return { readings, goals, projects, updReadings, updGoals, updProjects }
}

// ══════════════════════════════════════
// LEITURAS & ESTUDOS
// ══════════════════════════════════════
function AddReadingForm({ onSave, onClose }) {
  const [title,  setTitle]  = useState('')
  const [author, setAuthor] = useState('')
  const [type,   setType]   = useState('Livro')
  const [status, setStatus] = useState('quero')
  const [notes,  setNotes]  = useState('')
  const [link,   setLink]   = useState('')

  function submit() {
    if (!title.trim()) { toast('Informe o título'); return }
    onSave({ id: Date.now(), title: title.trim(), author: author.trim(), type, status, notes: notes.trim(), link: link.trim(), createdAt: todayISO(), rating: null })
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeader}>
        <span className={styles.formTitle}>Novo item</span>
        <button type="button" className={styles.closeBtn} onClick={onClose}><PiXBold size={15}/></button>
      </div>

      <div className={styles.typeRow}>
        {READING_TYPES.map(t => (
          <button key={t} type="button"
            className={`${styles.typeChip} ${type === t ? styles.typeChipSel : ''}`}
            onClick={() => setType(t)}>{t}</button>
        ))}
      </div>

      <input className="input" placeholder="Título *" value={title} autoFocus
        onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />

      <input className="input" placeholder="Autor / Criador (opcional)"
        value={author} onChange={e => setAuthor(e.target.value)} />

      <div className={styles.statusRow}>
        {READING_STATUS.map(s => (
          <button key={s.id} type="button"
            className={`${styles.statusChip} ${status === s.id ? styles.statusChipSel : ''}`}
            style={status === s.id ? { borderColor: s.color, color: s.color } : {}}
            onClick={() => setStatus(s.id)}>{s.label}</button>
        ))}
      </div>

      <input className="input" placeholder="Link (opcional)" value={link}
        onChange={e => setLink(e.target.value)} />

      <textarea className={`input ${styles.notesArea}`} placeholder="Notas pessoais..." rows={2}
        value={notes} onChange={e => setNotes(e.target.value)} />

      <button type="button" className="btn btn-primary"
        style={{ justifyContent: 'center', width: '100%' }} onClick={submit}>
        <PiFloppyDiskBold size={14}/> Salvar
      </button>
    </div>
  )
}

function ReadingCard({ item, onUpdate, onDelete }) {
  const [editing, setEditing]   = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes]       = useState(item.notes || '')
  const [rating, setRating]     = useState(item.rating || 0)
  const statusInfo = READING_STATUS.find(s => s.id === item.status) || READING_STATUS[0]

  function cycleStatus() {
    const idx  = READING_STATUS.findIndex(s => s.id === item.status)
    const next = READING_STATUS[(idx + 1) % READING_STATUS.length]
    onUpdate({ ...item, status: next.id })
    toast(`${item.title} → ${next.label}`)
  }

  function saveNotes() {
    playSaveDirect()
    onUpdate({ ...item, notes, rating })
    setEditing(false)
    toast('Notas salvas!')
  }

  return (
    <div className={`${styles.readingCard} ${item.status === 'concluido' ? styles.rcDone : ''}`}>
      <div className={styles.rcHeader} onClick={() => setExpanded(e => !e)} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setExpanded(p => !p)}>
        <div className={styles.rcLeft}>
          <button type="button" className={styles.statusDot}
            style={{ background: statusInfo.color, borderColor: statusInfo.color }}
            onClick={e => { e.stopPropagation(); cycleStatus() }}
            title={`Status: ${statusInfo.label} — clique para avançar`}
          />
          <div className={styles.rcInfo}>
            <span className={styles.rcTitle}>{item.title}</span>
            <span className={styles.rcMeta}>
              {item.type}
              {item.author && ` · ${item.author}`}
              <span className={styles.rcStatusLbl} style={{ color: statusInfo.color }}>
                {' · '}{statusInfo.label}
              </span>
            </span>
          </div>
        </div>
        <div className={styles.rcRight}>
          {item.rating > 0 && (
            <span className={styles.rcRating}>{'★'.repeat(item.rating)}{'☆'.repeat(5-item.rating)}</span>
          )}
          {expanded ? <PiCaretUpBold size={13}/> : <PiCaretDownBold size={13}/>}
        </div>
      </div>

      {expanded && (
        <div className={styles.rcBody}>
          {item.link && (
            <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.rcLink}>
              <PiLinkBold size={11}/> {item.link}
            </a>
          )}

          {editing ? (
            <>
              <div className={styles.ratingRow}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button"
                    className={`${styles.starBtn} ${rating >= n ? styles.starOn : ''}`}
                    onClick={() => setRating(n)}>★</button>
                ))}
                {rating > 0 && (
                  <button type="button" className={styles.starClear} onClick={() => setRating(0)}>limpar</button>
                )}
              </div>
              <textarea className={`input ${styles.notesArea}`} rows={3}
                value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas, resumo, aprendizados..."/>
              <div style={{ display:'flex', gap:6 }}>
                <button type="button" className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={saveNotes}>
                  <PiFloppyDiskBold size={13}/> Salvar
                </button>
                <button type="button" className="btn" onClick={() => setEditing(false)}><PiXBold size={13}/></button>
              </div>
            </>
          ) : (
            <>
              {item.notes && <p className={styles.rcNotes}>{item.notes}</p>}
              <div className={styles.rcActions}>
                <button type="button" className={`btn ${styles.rcEditBtn}`} onClick={() => setEditing(true)}>
                  <PiPencilSimpleBold size={12}/> Editar notas
                </button>
                <button type="button" className={styles.deleteBtn}
                  onClick={() => { if (window.confirm(`Remover "${item.title}"?`)) onDelete(item.id) }}>
                  <PiTrashBold size={13}/>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const FREE_READINGS_LIMIT = 10
const FREE_GOALS_LIMIT    = 1

const CAREER_FREE_ITEMS = ['Até 10 leituras/cursos', '1 meta de crescimento', 'Avaliação por estrelas']
const CAREER_PRO_ITEMS  = ['Leituras ilimitadas', 'Metas ilimitadas', 'Projetos profissionais', 'Tags e links por item']

function ReadingsSection({ readings, onUpdate }) {
  const [showForm,       setShowForm]       = useState(false)
  const [filter,         setFilter]         = useState('todos')
  const [showModal,      setShowModal]      = useState(false)
  const [limitDecided,   setLimitDecided]   = useState(() => localStorage.getItem('nex_career_readings_decided') === 'true')
  const { isPro } = usePlan()
  const navigate  = useNavigate()

  const atLimit = !isPro && readings.length >= FREE_READINGS_LIMIT

  function add(item) {
    if (atLimit) { setShowModal(true); return }
    playSaveDirect()
    onUpdate([item, ...readings]); setShowForm(false)
    toast(`"${item.title}" adicionado!`)
  }

  function handleOpenForm() {
    if (atLimit) { setShowModal(true); return }
    setShowForm(s => !s)
  }

  function handleUpgrade() { setShowModal(false); navigate('/profile') }
  function handleStay()    { localStorage.setItem('nex_career_readings_decided', 'true'); setLimitDecided(true); setShowModal(false) }
  function upd(item) { onUpdate(readings.map(r => r.id === item.id ? item : r)) }
  function del(id)   { onUpdate(readings.filter(r => r.id !== id)); toast('Removido.') }

  const filtered = filter === 'todos' ? readings : readings.filter(r => r.status === filter)

  const counts = useMemo(() => {
    const c = {}
    readings.forEach(r => { c[r.status] = (c[r.status] || 0) + 1 })
    return c
  }, [readings])

  return (
    <div className="card">
      <div className="card-title">
        <PiBookOpenTextBold size={15}/> Leituras & Estudos
        {atLimit && limitDecided ? (
          <button type="button" className={`btn ${styles.addBtn}`} style={{ opacity: 0.7, gap: 4 }} onClick={() => setShowModal(true)}>
            <PiLockSimpleBold size={11}/> Limite
          </button>
        ) : (
          <button type="button" className={`btn btn-primary ${styles.addBtn}`} onClick={handleOpenForm}>
            <PiPlusBold size={11}/> Adicionar
          </button>
        )}
      </div>

      {showForm && <AddReadingForm onSave={add} onClose={() => setShowForm(false)}/>}

      {showModal && (
        <PlanLimitModal
          description={`Você atingiu o limite de ${FREE_READINGS_LIMIT} leituras e cursos do plano gratuito.`}
          freeItems={CAREER_FREE_ITEMS}
          proItems={CAREER_PRO_ITEMS}
          stayFreeLabel="Continuar com 10 leituras"
          onUpgrade={handleUpgrade}
          onClose={handleStay}
        />
      )}

      {readings.length > 0 && (
        <div className={styles.filterRow}>
          {[
            { id:'todos',     label:`Todos (${readings.length})` },
            { id:'lendo',     label:`Lendo (${counts.lendo||0})` },
            { id:'quero',     label:`Quero (${counts.quero||0})` },
            { id:'concluido', label:`Feitos (${counts.concluido||0})` },
          ].map(f => (
            <button key={f.id} type="button"
              className={`${styles.filterBtn} ${filter===f.id ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 && !showForm ? (
        <div className="empty-state" style={{ padding:'16px 0' }}>
          <PiBookOpenTextBold size={28} color="var(--ink3)"/>
          <p>{readings.length === 0 ? 'Nenhuma leitura cadastrada ainda.' : 'Nenhum item neste filtro.'}</p>
        </div>
      ) : (
        <div className={styles.cardList}>
          {filtered.map(item => <ReadingCard key={item.id} item={item} onUpdate={upd} onDelete={del}/>)}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// METAS DE CRESCIMENTO
// ══════════════════════════════════════
function GoalCard({ goal, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [editMilestone, setEditMilestone] = useState('')
  const dl = goal.deadline ? fmtDeadline(goal.deadline) : null
  const done = goal.milestones?.filter(m => m.done).length || 0
  const total = goal.milestones?.length || 0
  const pct = total > 0 ? Math.round(done / total * 100) : 0
  
  // Carregar hábito vinculado
  const linkedHabit = useMemo(() => {
    if (!goal.linkedHabitId) return null
    try {
      const habits = loadStorage('nex_habits') || []
      return habits.find(h => h.id === goal.linkedHabitId) || null
    } catch {
      return null
    }
  }, [goal.linkedHabitId])
 
  function addMilestone() {
    const text = editMilestone.trim()
    if (!text) return
    const updated = { ...goal, milestones: [...(goal.milestones || []), { id: Date.now(), text, done: false }] }
    onUpdate(updated); setEditMilestone('')
  }

  function toggleMilestone(id) {
    onUpdate({ ...goal, milestones: goal.milestones.map(m => m.id === id ? { ...m, done: !m.done } : m) })
  }

  function removeMilestone(id) {
    onUpdate({ ...goal, milestones: goal.milestones.filter(m => m.id !== id) })
  }

  return (
    <div className={`${styles.goalCard} ${pct === 100 ? styles.goalDone : ''}`}>
      <div className={styles.goalHeader}
        onClick={() => setExpanded(e => !e)} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setExpanded(p => !p)}>
        <div className={styles.goalMain}>
          <div className={styles.goalTitleRow}>
            <span className={styles.goalTitle}>{goal.title}</span>
            {pct === 100 && <span className={styles.goalComplete}>✓</span>}
          </div>
          <div className={styles.goalMeta}>
            <span className={styles.areaTag} style={{ background: '#e8f0fe', color: '#185FA5', borderColor: '#185FA5' }}>
              {goal.area}
            </span>
            {linkedHabit && (
              <span className={styles.habitTag} style={{ background: '#f0f9ff', color: '#0288d1', borderColor: '#0288d1' }}>
                <PiCheckSquareBold size={10}/> {linkedHabit.title}
              </span>
            )}
            {dl && <span className={styles.deadlineTag} style={{ color: dl.color }}>{dl.txt}</span>}
            {total > 0 && <span className={styles.progressTag}>{done}/{total} marcos</span>}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {total > 0 && (
            <div className={styles.goalPct} style={{
              color: pct === 100 ? '#27ae60' : pct >= 50 ? '#2980b9' : 'var(--ink3)'
            }}>{pct}%</div>
          )}
          {expanded ? <PiCaretUpBold size={13}/> : <PiCaretDownBold size={13}/>}
        </div>
      </div>

      {total > 0 && (
        <div className={styles.goalBarWrap}>
          <div className={styles.goalBarFill} style={{ width:`${pct}%`, background: pct===100?'#27ae60':'var(--gold)' }}/>
        </div>
      )}

      {expanded && (
        <div className={styles.goalBody}>
          {goal.notes && <p className={styles.goalNotes}>{goal.notes}</p>}

          {/* Marcos */}
          <div className={styles.milestonesWrap}>
            {(goal.milestones || []).map(m => (
              <div key={m.id} className={`${styles.milestone} ${m.done ? styles.milestoneDone : ''}`}>
                <button type="button"
                  className={`${styles.mCheck} ${m.done ? styles.mCheckDone : ''}`}
                  onClick={() => toggleMilestone(m.id)}>
                  {m.done && <PiCheckBold size={9} color="#fff"/>}
                </button>
                <span className={styles.mText}>{m.text}</span>
                <button type="button" className={styles.mDel} onClick={() => removeMilestone(m.id)}>
                  <PiXBold size={10}/>
                </button>
              </div>
            ))}

            {/* Adicionar marco */}
            <div className={styles.addMilestoneRow}>
              <input className={`input ${styles.mInput}`} placeholder="Novo marco..."
                value={editMilestone} onChange={e => setEditMilestone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMilestone()} />
              <button type="button" className={`btn btn-primary ${styles.mAddBtn}`}
                onClick={addMilestone} disabled={!editMilestone.trim()}>
                <PiPlusBold size={12}/>
              </button>
            </div>
          </div>

          <div className={styles.goalActions}>
            <button type="button" className={styles.deleteBtn}
              onClick={() => { if (window.confirm(`Remover meta "${goal.title}"?`)) onDelete(goal.id) }}>
              <PiTrashBold size={13}/> Remover meta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddGoalForm({ onSave, onClose }) {
  const [title,    setTitle]    = useState('')
  const [area,     setArea]     = useState(GOAL_AREAS[0])
  const [deadline, setDeadline] = useState('')
  const [notes,    setNotes]    = useState('')
  const [linkedHabitId, setLinkedHabitId] = useState('')
  
  // Carregar hábitos disponíveis para vincular
  const habits = useMemo(() => {
    try {
      return loadStorage('nex_habits') || []
    } catch {
      return []
    }
  }, [])

  function submit() {
    if (!title.trim()) { toast('Informe o título da meta'); return }
    onSave({ 
      id: Date.now(), 
      title: title.trim(), 
      area, 
      deadline: deadline || null, 
      notes: notes.trim(), 
      milestones: [], 
      linkedHabitId: linkedHabitId || null,
      createdAt: todayISO() 
    })
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeader}>
        <span className={styles.formTitle}>Nova meta de crescimento</span>
        <button type="button" className={styles.closeBtn} onClick={onClose}><PiXBold size={15}/></button>
      </div>
      <input className="input" placeholder="Título da meta *" value={title} autoFocus
        onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
      <div className={styles.areaGrid}>
        {GOAL_AREAS.map(a => (
          <button key={a} type="button"
            className={`${styles.areaChip} ${area===a ? styles.areaChipSel : ''}`}
            onClick={() => setArea(a)}>{a}</button>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <PiCalendarBold size={13} color="var(--ink3)"/>
        <input className="input" type="date" style={{ flex:1 }}
          value={deadline} min={todayISO()} onChange={e => setDeadline(e.target.value)} />
      </div>
      
      {/* Vincular hábito */}
      {habits.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <PiCheckSquareBold size={13} color="var(--ink3)"/>
          <select className="input" style={{ flex:1 }} value={linkedHabitId} onChange={e => setLinkedHabitId(e.target.value)}>
            <option value="">Vincular hábito (opcional)</option>
            {habits.map(h => (
              <option key={h.id} value={h.id}>{h.title}</option>
            ))}
          </select>
        </div>
      )}
      
      <textarea className={`input ${styles.notesArea}`} placeholder="Descrição, motivação..." rows={2}
        value={notes} onChange={e => setNotes(e.target.value)} />
      <button type="button" className="btn btn-primary"
        style={{ justifyContent:'center', width:'100%' }} onClick={submit}>
        <PiFloppyDiskBold size={14}/> Criar meta
      </button>
    </div>
  )
}

function GoalsSection({ goals, onUpdate }) {
  const [showForm,     setShowForm]     = useState(false)
  const [showModal,    setShowModal]    = useState(false)
  const [limitDecided, setLimitDecided] = useState(() => localStorage.getItem('nex_career_goals_decided') === 'true')
  const { isPro } = usePlan()
  const navigate  = useNavigate()

  const atLimit = !isPro && goals.length >= FREE_GOALS_LIMIT

  function add(g) {
    if (atLimit) { setShowModal(true); return }
    playSaveDirect()
    onUpdate([...goals, g]); setShowForm(false)
    toast(`Meta "${g.title}" criada!`)
  }

  function handleOpenForm() {
    if (atLimit) { setShowModal(true); return }
    setShowForm(s => !s)
  }

  function handleUpgrade() { setShowModal(false); navigate('/profile') }
  function handleStay()    { localStorage.setItem('nex_career_goals_decided', 'true'); setLimitDecided(true); setShowModal(false) }
  function upd(g) { onUpdate(goals.map(x => x.id === g.id ? g : x)) }
  function del(id) { onUpdate(goals.filter(g => g.id !== id)); toast('Meta removida.') }

  const active   = goals.filter(g => (g.milestones?.filter(m=>m.done).length||0) < (g.milestones?.length||1))
  const complete = goals.filter(g => g.milestones?.length > 0 && g.milestones.every(m=>m.done))

  return (
    <div className="card">
      <div className="card-title">
        <PiTargetBold size={15}/> Metas de Crescimento
        {atLimit && limitDecided ? (
          <button type="button" className={`btn ${styles.addBtn}`} style={{ opacity: 0.7, gap: 4 }} onClick={() => setShowModal(true)}>
            <PiLockSimpleBold size={11}/> Limite
          </button>
        ) : (
          <button type="button" className={`btn btn-primary ${styles.addBtn}`} onClick={handleOpenForm}>
            <PiPlusBold size={11}/> Nova
          </button>
        )}
      </div>

      {showForm && <AddGoalForm onSave={add} onClose={() => setShowForm(false)}/>}

      {showModal && (
        <PlanLimitModal
          description="O plano gratuito permite apenas 1 meta de crescimento ativa."
          freeItems={CAREER_FREE_ITEMS}
          proItems={CAREER_PRO_ITEMS}
          stayFreeLabel="Continuar com 1 meta"
          onUpgrade={handleUpgrade}
          onClose={handleStay}
        />
      )}

      {goals.length === 0 && !showForm ? (
        <div className="empty-state" style={{ padding:'16px 0' }}>
          <PiTargetBold size={28} color="var(--ink3)"/>
          <p>Nenhuma meta de crescimento ainda.<br/>Defina o que quer alcançar na carreira.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <p className={styles.sectionLabel}>Em andamento</p>
              {active.map(g => <GoalCard key={g.id} goal={g} onUpdate={upd} onDelete={del}/>)}
            </>
          )}
          {complete.length > 0 && (
            <>
              <p className={styles.sectionLabel} style={{ marginTop: active.length > 0 ? 12 : 0 }}>
                Concluídas ({complete.length})
              </p>
              {complete.map(g => <GoalCard key={g.id} goal={g} onUpdate={upd} onDelete={del}/>)}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// PROJETOS PROFISSIONAIS
// ══════════════════════════════════════
function ProjectCard({ project, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [newTask, setNewTask]   = useState('')
  const status = PROJECT_STATUS.find(s => s.id === project.status) || PROJECT_STATUS[0]
  const dl = project.deadline ? fmtDeadline(project.deadline) : null
  const doneTasks  = project.tasks?.filter(t => t.done).length || 0
  const totalTasks = project.tasks?.length || 0
  
  // Carregar hábito vinculado
  const linkedHabit = useMemo(() => {
    if (!project.linkedHabitId) return null
    try {
      const habits = loadStorage('nex_habits') || []
      return habits.find(h => h.id === project.linkedHabitId) || null
    } catch {
      return null
    }
  }, [project.linkedHabitId])
 
  function cycleStatus() {
    const idx  = PROJECT_STATUS.findIndex(s => s.id === project.status)
    const next = PROJECT_STATUS[(idx + 1) % PROJECT_STATUS.length]
    onUpdate({ ...project, status: next.id })
    toast(`${project.name} → ${next.label}`)
  }
 
  function addTask() {
    const text = newTask.trim()
    if (!text) return
    onUpdate({ ...project, tasks: [...(project.tasks||[]), { id:Date.now(), text, done:false }] })
    setNewTask('')
  }
 
  function toggleTask(id) {
    onUpdate({ ...project, tasks: project.tasks.map(t => t.id===id ? {...t,done:!t.done} : t) })
  }
 
  function removeTask(id) {
    onUpdate({ ...project, tasks: project.tasks.filter(t => t.id !== id) })
  }

  return (
    <div className={`${styles.projectCard} ${project.status==='concluido' ? styles.projectDone : ''}`}>
      <div className={styles.projectHeader}
        onClick={() => setExpanded(e=>!e)} role="button" tabIndex={0}
        onKeyDown={e => e.key==='Enter' && setExpanded(p=>!p)}>
        <button type="button" className={styles.statusDot}
          style={{ background: status.color, borderColor: status.color }}
          onClick={e => { e.stopPropagation(); cycleStatus() }}
          title={`${status.label} — clique para avançar`}/>
        <div className={styles.projectInfo}>
          <span className={styles.projectName}>{project.name}</span>
          <div className={styles.projectMeta}>
            <span className={styles.statusLabel} style={{ color: status.color }}>{status.label}</span>
            {linkedHabit && (
              <span className={styles.habitTag} style={{ background: '#f0f9ff', color: '#0288d1', borderColor: '#0288d1' }}>
                <PiCheckSquareBold size={10}/> {linkedHabit.title}
              </span>
            )}
            {dl && <span style={{ fontSize:10, color:dl.color, fontWeight:700 }}>· {dl.txt}</span>}
            {totalTasks > 0 && <span className={styles.taskCount}>· {doneTasks}/{totalTasks} tarefas</span>}
          </div>
        </div>
        {expanded ? <PiCaretUpBold size={13}/> : <PiCaretDownBold size={13}/>}
      </div>

      {totalTasks > 0 && (
        <div className={styles.projectBar}>
          <div className={styles.projectBarFill}
            style={{ width:`${Math.round(doneTasks/totalTasks*100)}%`,
                     background: project.status==='concluido'?'#27ae60':'var(--gold)' }}/>
        </div>
      )}

      {expanded && (
        <div className={styles.projectBody}>
          {project.notes && <p className={styles.projectNotes}>{project.notes}</p>}

          {/* Tarefas */}
          <div className={styles.tasksWrap}>
            {(project.tasks||[]).map(t => (
              <div key={t.id} className={`${styles.task} ${t.done ? styles.taskDone : ''}`}>
                <button type="button"
                  className={`${styles.mCheck} ${t.done ? styles.mCheckDone : ''}`}
                  onClick={() => toggleTask(t.id)}>
                  {t.done && <PiCheckBold size={9} color="#fff"/>}
                </button>
                <span className={styles.mText}>{t.text}</span>
                <button type="button" className={styles.mDel} onClick={() => removeTask(t.id)}>
                  <PiXBold size={10}/>
                </button>
              </div>
            ))}
            <div className={styles.addMilestoneRow}>
              <input className={`input ${styles.mInput}`} placeholder="Nova tarefa..."
                value={newTask} onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key==='Enter' && addTask()} />
              <button type="button" className={`btn btn-primary ${styles.mAddBtn}`}
                onClick={addTask} disabled={!newTask.trim()}>
                <PiPlusBold size={12}/>
              </button>
            </div>
          </div>

          <div className={styles.goalActions}>
            <button type="button" className={styles.deleteBtn}
              onClick={() => { if (window.confirm(`Remover projeto "${project.name}"?`)) onDelete(project.id) }}>
              <PiTrashBold size={13}/> Remover projeto
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddProjectForm({ onSave, onClose }) {
  const [name,     setName]     = useState('')
  const [notes,    setNotes]    = useState('')
  const [deadline, setDeadline] = useState('')
  const [tags,     setTags]     = useState('')
  const [linkedHabitId, setLinkedHabitId] = useState('')
  
  // Carregar hábitos disponíveis para vincular
  const habits = useMemo(() => {
    try {
      return loadStorage('nex_habits') || []
    } catch {
      return []
    }
  }, [])
 
  function submit() {
    if (!name.trim()) { toast('Informe o nome do projeto'); return }
    playSaveDirect()
    onSave({
      id: Date.now(), name: name.trim(), status: 'planejando',
      notes: notes.trim(), deadline: deadline||null,
      tags: tags.split(',').map(t=>t.trim()).filter(Boolean),
      linkedHabitId: linkedHabitId || null,
      tasks: [], createdAt: todayISO(),
    })
    toast(`Projeto "${name.trim()}" criado!`)
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeader}>
        <span className={styles.formTitle}>Novo projeto</span>
        <button type="button" className={styles.closeBtn} onClick={onClose}><PiXBold size={15}/></button>
      </div>
      <input className="input" placeholder="Nome do projeto *" value={name} autoFocus
        onChange={e => setName(e.target.value)} onKeyDown={e => e.key==='Enter' && submit()} />
      <textarea className={`input ${styles.notesArea}`} placeholder="Descrição, objetivo..." rows={2}
        value={notes} onChange={e => setNotes(e.target.value)} />
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <PiCalendarBold size={13} color="var(--ink3)"/>
        <input className="input" type="date" style={{ flex:1 }}
          value={deadline} min={todayISO()} onChange={e => setDeadline(e.target.value)} />
      </div>
      
      {/* Vincular hábito */}
      {habits.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <PiCheckSquareBold size={13} color="var(--ink3)"/>
          <select className="input" style={{ flex:1 }} value={linkedHabitId} onChange={e => setLinkedHabitId(e.target.value)}>
            <option value="">Vincular hábito (opcional)</option>
            {habits.map(h => (
              <option key={h.id} value={h.id}>{h.title}</option>
            ))}
          </select>
        </div>
      )}
      
      <input className="input" placeholder="Tags (separadas por vírgula)" value={tags}
        onChange={e => setTags(e.target.value)} />
      <button type="button" className="btn btn-primary"
        style={{ justifyContent:'center', width:'100%' }} onClick={submit}>
        <PiFloppyDiskBold size={14}/> Criar projeto
      </button>
    </div>
  )
}

function ProjectsSection({ projects, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('todos')
  const { isPro } = usePlan()
  const navigate  = useNavigate()

  function add(p) { onUpdate([...projects, p]); setShowForm(false) }
  function upd(p) { onUpdate(projects.map(x => x.id===p.id ? p : x)) }
  function del(id) { onUpdate(projects.filter(p=>p.id!==id)); toast('Projeto removido.') }

  const shown = statusFilter==='todos' ? projects : projects.filter(p=>p.status===statusFilter)

  if (!isPro) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: '24px 20px', textAlign: 'center' }}>
        <PiLockSimpleBold size={28} color="var(--ink3)"/>
        <div>
          <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', marginBottom: 4 }}>Projetos Profissionais</p>
          <p style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6 }}>
            Organize projetos de trabalho com tarefas, prazos e progresso.<br/>
            Disponível no plano Pro.
          </p>
        </div>
        <button type="button" className="btn btn-primary" style={{ gap: 6 }} onClick={() => navigate('/profile')}>
          <PiCrownBold size={13}/> Ver plano Pro
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-title">
        <PiBriefcaseBold size={15}/> Projetos Profissionais
        <button type="button" className={`btn btn-primary ${styles.addBtn}`}
          onClick={() => setShowForm(s=>!s)}>
          <PiPlusBold size={11}/> Novo
        </button>
      </div>

      {showForm && <AddProjectForm onSave={add} onClose={() => setShowForm(false)}/>}

      {projects.length > 0 && (
        <div className={styles.filterRow}>
          {[
            { id:'todos',      label:'Todos' },
            { id:'andamento',  label:'Ativos' },
            { id:'planejando', label:'Planejando' },
            { id:'concluido',  label:'Feitos' },
          ].map(f => (
            <button key={f.id} type="button"
              className={`${styles.filterBtn} ${statusFilter===f.id ? styles.filterActive : ''}`}
              onClick={() => setStatusFilter(f.id)}>{f.label}</button>
          ))}
        </div>
      )}

      {shown.length === 0 && !showForm ? (
        <div className="empty-state" style={{ padding:'16px 0' }}>
          <PiBriefcaseBold size={28} color="var(--ink3)"/>
          <p>{projects.length===0 ? 'Nenhum projeto cadastrado.' : 'Nenhum projeto neste filtro.'}</p>
        </div>
      ) : (
        <div className={styles.cardList}>
          {shown.map(p => <ProjectCard key={p.id} project={p} onUpdate={upd} onDelete={del}/>)}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// PAINEL DE RESUMO
// ══════════════════════════════════════
function CareerSummary({ readings, goals, projects }) {
  const lendo    = readings.filter(r => r.status === 'lendo').length
  const goalsPct = goals.length > 0
    ? Math.round(goals.filter(g => g.milestones?.length > 0 && g.milestones.every(m=>m.done)).length / goals.length * 100)
    : 0
  const projAtivos = projects.filter(p => p.status === 'andamento').length

  if (readings.length + goals.length + projects.length === 0) return null

  return (
    <div className="card">
      <div className="card-title"><PiBriefcaseBold size={15}/> Visão Geral</div>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryVal}>{lendo}</span>
          <span className={styles.summaryLbl}>estudando agora</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryVal}>{readings.filter(r=>r.status==='concluido').length}</span>
          <span className={styles.summaryLbl}>leituras feitas</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryVal}>{projAtivos}</span>
          <span className={styles.summaryLbl}>projetos ativos</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryVal}>{goals.length > 0 ? `${goalsPct}%` : '—'}</span>
          <span className={styles.summaryLbl}>metas concluídas</span>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// CAREER — PÁGINA PRINCIPAL
// ══════════════════════════════════════
export default function Career() {
  const { readings, goals, projects, updReadings, updGoals, updProjects } = useCareer()
  const [tab, setTab]         = useState('leituras')
  const [showHelp, setShowHelp] = useState(false)

  const isEmpty = readings.length + goals.length + projects.length === 0

  const TABS = [
    { id: 'leituras',  label: 'Estudos',   Icon: PiBookOpenTextBold },
    { id: 'metas',     label: 'Metas',     Icon: PiTargetBold       },
    { id: 'projetos',  label: 'Projetos',  Icon: PiBriefcaseBold    },
  ]

  return (
    <main className={styles.page}>

      {/* Intro — aparece automático quando vazio, ou via botão ? */}
      {(isEmpty || showHelp) && (
        <div className="card" style={{ borderLeft: '4px solid var(--gold-dk)', paddingLeft: 12, position: 'relative' }}>
          {showHelp && !isEmpty && (
            <button type="button" className="btn" style={{ position: 'absolute', top: 8, right: 8, padding: '3px 6px' }}
              onClick={() => setShowHelp(false)}>
              <PiXBold size={12}/>
            </button>
          )}
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Carreira & Estudos</p>
          <p style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6, marginBottom: 8 }}>
            Seu espaço de crescimento profissional. Registre livros e cursos que moldam sua visão,
            defina metas de habilidades e acompanhe projetos profissionais.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { n: 1, text: 'Aba Estudos — adicione livros, cursos, podcasts e acompanhe seu progresso' },
              { n: 2, text: 'Aba Metas — defina uma habilidade que quer desenvolver com marcos e prazo' },
              { n: 3, text: 'Aba Projetos — (Pro) organize projetos profissionais com tarefas e status' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--ink)', color: 'var(--bg)', borderRadius: 3, padding: '1px 5px', flexShrink: 0, marginTop: 1 }}>{s.n}</span>
                <span style={{ fontSize: 11, color: 'var(--ink3)', lineHeight: 1.5 }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CareerSummary readings={readings} goals={goals} projects={projects}/>

      {/* Tabs de navegação interna + botão ? */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className={styles.navTabs} style={{ flex: 1 }}>
          {TABS.map(t => (
            <button key={t.id} type="button"
              className={`${styles.navTab} ${tab===t.id ? styles.navTabActive : ''}`}
              onClick={() => setTab(t.id)}>
              <t.Icon size={14}/> {t.label}
            </button>
          ))}
        </div>
        {!isEmpty && (
          <button type="button"
            className={`btn ${showHelp ? 'btn-primary' : ''}`}
            style={{ padding: '7px 10px', flexShrink: 0, borderRadius: 4 }}
            onClick={() => setShowHelp(h => !h)}
            title="Como usar esta tela">
            <PiQuestionBold size={14}/>
          </button>
        )}
      </div>

      {tab === 'leituras'  && <ReadingsSection readings={readings} onUpdate={updReadings}/>}
      {tab === 'metas'     && <GoalsSection    goals={goals}       onUpdate={updGoals}/>}
      {tab === 'projetos'  && <ProjectsSection projects={projects} onUpdate={updProjects}/>}

    </main>
  )
}

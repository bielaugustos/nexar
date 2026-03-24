import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '../hooks/usePlan'
import { PlanLimitModal } from '../components/PlanLimitModal'
import {
  PiRocketLaunchBold, PiTargetBold, PiPlusBold, PiXBold,
  PiCheckBold, PiTrashBold, PiPencilSimpleBold, PiFloppyDiskBold,
  PiCalendarBold, PiCalendarCheckBold, PiCaretDownBold, PiCaretUpBold,
  PiFlagBold, PiArrowUpBold, PiArrowRightBold, PiArrowDownBold,
  PiCircleDashedBold, PiSpinnerBold, PiCheckCircleBold, PiPauseBold,
  PiLockSimpleBold, PiCrownBold, PiQuestionBold,
} from 'react-icons/pi'
import { toast } from '../components/Toast'
import styles from './Projects.module.css'

// ══════════════════════════════════════
// PILAR 4 — PROJETOS & METAS PESSOAIS
// Objetivos de médio prazo com marcos,
// prazo e progresso visual.
// Dados: nex_projects, nex_personal_goals
// ══════════════════════════════════════

const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb } catch { return fb } }
const save = (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// ── Constantes ──
function todayISO() { return new Date().toISOString().slice(0, 10) }

function fmtDate(iso) {
  if (!iso) return null
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day:'numeric', month:'short', year:'numeric' })
}

function deadlineBadge(iso) {
  if (!iso) return null
  const diff = Math.round((new Date(iso + 'T00:00:00') - new Date()) / 86_400_000)
  if (diff < 0)   return { txt: `Venceu há ${Math.abs(diff)}d`, color: '#c0392b' }
  if (diff === 0) return { txt: 'Vence hoje',                    color: '#e67e22' }
  if (diff <= 7)  return { txt: `${diff}d restantes`,           color: '#e67e22' }
  if (diff <= 30) return { txt: `${diff}d restantes`,           color: '#2980b9' }
  return               { txt: `${diff}d restantes`,             color: 'var(--ink3)' }
}

const PRIORITY_OPTS = [
  { id: 'alta',  label: 'Alta',  Icon: PiArrowUpBold,    color: '#e74c3c' },
  { id: 'media', label: 'Média', Icon: PiArrowRightBold, color: '#e67e22' },
  { id: 'baixa', label: 'Baixa', Icon: PiArrowDownBold,  color: '#27ae60' },
]

const STATUS_OPTS = [
  { id: 'planejando', label: 'Planejando',   Icon: PiCircleDashedBold, color: '#95a5a6' },
  { id: 'andamento',  label: 'Em andamento', Icon: PiSpinnerBold,      color: '#2980b9' },
  { id: 'pausado',    label: 'Pausado',      Icon: PiPauseBold,        color: '#e67e22' },
  { id: 'concluido',  label: 'Concluído',    Icon: PiCheckCircleBold,  color: '#27ae60' },
]

const CATEGORIES = ['Pessoal', 'Saúde', 'Finanças', 'Aprendizado', 'Criativo', 'Social', 'Outro']

// ── Helpers UI ──
function PriorityDot({ priority, size = 10 }) {
  const p = PRIORITY_OPTS.find(x => x.id === priority) || PRIORITY_OPTS[1]
  return <span style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', background:p.color, flexShrink:0 }}/>
}

function StatusBadge({ status }) {
  const s = STATUS_OPTS.find(x => x.id === status) || STATUS_OPTS[0]
  return (
    <span className={styles.statusBadge} style={{ color: s.color, borderColor: s.color }}>
      <s.Icon size={10}/> {s.label}
    </span>
  )
}

// ══════════════════════════════════════
// MILESTONE — marco de progresso
// ══════════════════════════════════════
function MilestoneList({ milestones, onChange }) {
  const [newText, setNewText] = useState('')

  function add() {
    const t = newText.trim()
    if (!t) return
    onChange([...(milestones||[]), { id: Date.now(), text: t, done: false, date: todayISO() }])
    setNewText('')
  }

  function toggle(id) {
    onChange(milestones.map(m => m.id === id ? { ...m, done: !m.done } : m))
  }

  function remove(id) {
    onChange(milestones.filter(m => m.id !== id))
  }

  const done  = (milestones||[]).filter(m => m.done).length
  const total = (milestones||[]).length

  return (
    <div className={styles.milestones}>
      {total > 0 && (
        <div className={styles.msHeader}>
          <span className={styles.msLabel}>Marcos de progresso</span>
          <span className={styles.msCount}>{done}/{total}</span>
        </div>
      )}
      <div className={styles.msList}>
        {(milestones||[]).map(m => (
          <div key={m.id} className={`${styles.msRow} ${m.done ? styles.msDone : ''}`}>
            <button type="button" className={`${styles.msCheck} ${m.done ? styles.msCheckDone : ''}`}
              onClick={() => toggle(m.id)}>
              {m.done && <PiCheckBold size={9} color="#fff"/>}
            </button>
            <span className={styles.msText}>{m.text}</span>
            <button type="button" className={styles.msDel} onClick={() => remove(m.id)}>
              <PiXBold size={10}/>
            </button>
          </div>
        ))}
      </div>
      <div className={styles.msAdd}>
        <input className={`input ${styles.msInput}`} placeholder="Adicionar marco..."
          value={newText} onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} />
        <button type="button" className={`btn btn-primary ${styles.msAddBtn}`}
          onClick={add} disabled={!newText.trim()}>
          <PiPlusBold size={12}/>
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// FORM — NOVO PROJETO / META
// ══════════════════════════════════════
function ProjectForm({ onSave, onClose, initial }) {
  const [title,    setTitle]    = useState(initial?.title    || '')
  const [desc,     setDesc]     = useState(initial?.desc     || '')
  const [category, setCategory] = useState(initial?.category || 'Pessoal')
  const [priority, setPriority] = useState(initial?.priority || 'media')
  const [deadline, setDeadline] = useState(initial?.deadline || '')
  const [status,   setStatus]   = useState(initial?.status   || 'planejando')

  function submit() {
    if (!title.trim()) { toast('Informe o título do projeto'); return }
    onSave({
      id:         initial?.id || Date.now(),
      title:      title.trim(),
      desc:       desc.trim(),
      category,
      priority,
      deadline:   deadline || null,
      status,
      milestones: initial?.milestones || [],
      notes:      initial?.notes || '',
      createdAt:  initial?.createdAt || todayISO(),
    })
  }

  return (
    <div className={styles.form}>
      <div className={styles.formHeader}>
        <span className={styles.formTitle}>{initial ? 'Editar projeto' : 'Novo projeto'}</span>
        <button type="button" className={styles.closeBtn} onClick={onClose}><PiXBold size={15}/></button>
      </div>

      <input className="input" placeholder="Título *" value={title} autoFocus
        onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key==='Enter' && submit()} />

      <textarea className={`input ${styles.descArea}`} placeholder="Descrição, motivação, contexto..." rows={2}
        value={desc} onChange={e => setDesc(e.target.value)} />

      {/* Categoria */}
      <div className={styles.chipRow}>
        {CATEGORIES.map(c => (
          <button key={c} type="button"
            className={`${styles.chip} ${category===c ? styles.chipSel : ''}`}
            onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      {/* Prioridade */}
      <div className={styles.fieldRow}>
        <span className={styles.fieldLbl}>Prioridade</span>
        <div className={styles.chipRow}>
          {PRIORITY_OPTS.map(p => (
            <button key={p.id} type="button"
              className={`${styles.chip} ${priority===p.id ? styles.chipSel : ''}`}
              style={priority===p.id ? { borderColor:p.color, color:p.color } : {}}
              onClick={() => setPriority(p.id)}>
              <p.Icon size={11}/> {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className={styles.fieldRow}>
        <span className={styles.fieldLbl}>Status</span>
        <div className={styles.chipRow}>
          {STATUS_OPTS.map(s => (
            <button key={s.id} type="button"
              className={`${styles.chip} ${status===s.id ? styles.chipSel : ''}`}
              style={status===s.id ? { borderColor:s.color, color:s.color } : {}}
              onClick={() => setStatus(s.id)}>
              <s.Icon size={11}/> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prazo */}
      <div className={styles.fieldRow}>
        <PiCalendarBold size={13} color="var(--ink3)"/>
        <input className="input" type="date" style={{ flex:1 }}
          value={deadline} min={todayISO()} onChange={e => setDeadline(e.target.value)} />
        {deadline && (
          <button type="button" className={styles.clearBtn} onClick={() => setDeadline('')}>
            <PiXBold size={11}/>
          </button>
        )}
      </div>

      <button type="button" className="btn btn-primary"
        style={{ justifyContent:'center', width:'100%' }} onClick={submit}>
        <PiFloppyDiskBold size={14}/> {initial ? 'Salvar alterações' : 'Criar projeto'}
      </button>
    </div>
  )
}

// ══════════════════════════════════════
// PROJECT CARD — expansível
// ══════════════════════════════════════
function ProjectCard({ project, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [editing,  setEditing]  = useState(false)
  const [notes,    setNotes]    = useState(project.notes || '')

  const ms    = project.milestones || []
  const done  = ms.filter(m => m.done).length
  const total = ms.length
  const pct   = total > 0 ? Math.round(done / total * 100) : 0
  const dl    = deadlineBadge(project.deadline)
  const pri   = PRIORITY_OPTS.find(p => p.id === project.priority) || PRIORITY_OPTS[1]

  function cycleStatus() {
    const idx  = STATUS_OPTS.findIndex(s => s.id === project.status)
    const next = STATUS_OPTS[(idx + 1) % STATUS_OPTS.length]
    onUpdate({ ...project, status: next.id })
    toast(`→ ${next.label}`)
  }

  function saveEdit(updated) {
    onUpdate({ ...project, ...updated, milestones: project.milestones, notes })
    setEditing(false)
    toast('Projeto atualizado!')
  }

  function saveNotes() {
    onUpdate({ ...project, notes })
    toast('Notas salvas!')
  }

  if (editing) {
    return (
      <div className={styles.cardWrap}>
        <ProjectForm initial={project} onSave={saveEdit} onClose={() => setEditing(false)}/>
      </div>
    )
  }

  const isDone = project.status === 'concluido'

  return (
    <div className={`${styles.card} ${isDone ? styles.cardDone : ''}`}>

      {/* Barra de progresso no topo */}
      {total > 0 && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill}
            style={{ width:`${pct}%`, background: isDone ? '#27ae60' : 'var(--gold)' }}/>
        </div>
      )}

      {/* Header clicável */}
      <div className={styles.cardHeader} onClick={() => setExpanded(e => !e)}
        role="button" tabIndex={0} onKeyDown={e => e.key==='Enter' && setExpanded(p=>!p)}>
        <div className={styles.cardLeft}>
          <PriorityDot priority={project.priority}/>
          <div className={styles.cardInfo}>
            <span className={styles.cardTitle}>{project.title}</span>
            <div className={styles.cardMeta}>
              <StatusBadge status={project.status}/>
              <span className={styles.catTag}>{project.category}</span>
              {dl && <span className={styles.dlTag} style={{ color:dl.color }}>{dl.txt}</span>}
              {total > 0 && (
                <span className={styles.msTag}>{pct}% · {done}/{total} marcos</span>
              )}
            </div>
          </div>
        </div>
        {expanded ? <PiCaretUpBold size={13} color="var(--ink3)"/> : <PiCaretDownBold size={13} color="var(--ink3)"/>}
      </div>

      {/* Corpo expandido */}
      {expanded && (
        <div className={styles.cardBody}>
          {project.desc && <p className={styles.cardDesc}>{project.desc}</p>}

          {/* Marcos */}
          <MilestoneList
            milestones={project.milestones}
            onChange={ms => {
              // Detect which milestone changed for activity log
              const prev = project.milestones || []
              const changed = ms.find((m,i) => prev[i]?.done !== m.done)
              const log = changed
                ? [...(project.activityLog||[]), {
                    id: Date.now(),
                    text: `Marco "${changed.text}" ${changed.done ? '✓ concluído' : '↩ reaberto'}`,
                    date: new Date().toISOString().slice(0,10)
                  }].slice(-20)
                : (project.activityLog||[])
              onUpdate({ ...project, milestones: ms, activityLog: log })
            }}
          />

          {/* Notas */}
          <div className={styles.notesWrap}>
            <textarea className={`input ${styles.notesArea}`} rows={2}
              placeholder="Notas, links, referências..."
              value={notes} onChange={e => setNotes(e.target.value)}/>
            {notes !== (project.notes || '') && (
              <button type="button" className={`btn btn-primary ${styles.saveNotesBtn}`}
                onClick={saveNotes}>
                <PiFloppyDiskBold size={12}/> Salvar notas
              </button>
            )}
          </div>

          <ActivityLog project={project}/>

          {/* Ações */}
          <div className={styles.cardActions}>
            <button type="button" className={`btn ${styles.actionBtn}`}
              onClick={cycleStatus} title="Avançar status">
              <PiArrowRightBold size={12}/> Avançar status
            </button>
            <button type="button" className={`btn ${styles.actionBtn}`}
              onClick={() => setEditing(true)}>
              <PiPencilSimpleBold size={12}/> Editar
            </button>
            <button type="button" className={styles.deleteBtn}
              onClick={() => { if (window.confirm(`Remover "${project.title}"?`)) onDelete(project.id) }}>
              <PiTrashBold size={12}/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// PAINEL DE RESUMO
// ══════════════════════════════════════
function Summary({ projects }) {
  if (!projects.length) return null

  const active   = projects.filter(p => p.status === 'andamento').length
  const done     = projects.filter(p => p.status === 'concluido').length
  const overdue  = projects.filter(p => {
    if (!p.deadline || p.status === 'concluido') return false
    return new Date(p.deadline + 'T00:00:00') < new Date()
  }).length

  const allMs    = projects.flatMap(p => p.milestones || [])
  const msDone   = allMs.filter(m => m.done).length
  const msTotal  = allMs.length
  const msPct    = msTotal > 0 ? Math.round(msDone / msTotal * 100) : 0

  return (
    <div className="card">
      <div className="card-title"><PiRocketLaunchBold size={15}/> Visão Geral</div>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <span className={styles.sumVal}>{active}</span>
          <span className={styles.sumLbl}>em andamento</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.sumVal}>{done}</span>
          <span className={styles.sumLbl}>concluídos</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.sumVal} style={{ color: overdue > 0 ? '#e74c3c' : 'var(--ink)' }}>
            {overdue}
          </span>
          <span className={styles.sumLbl}>vencidos</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.sumVal}>{msTotal > 0 ? `${msPct}%` : '—'}</span>
          <span className={styles.sumLbl}>marcos feitos</span>
        </div>
      </div>
      {msTotal > 0 && (
        <div className={styles.globalBar}>
          <div className={styles.globalFill} style={{ width:`${msPct}%` }}/>
          <span className={styles.globalLbl}>{msDone}/{msTotal} marcos concluídos</span>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// PROJECTS — PÁGINA PRINCIPAL
// ══════════════════════════════════════
// ── Gráfico de atividade recente ──
function ActivityLog({ project }) {
  const log = [...(project.activityLog || [])].reverse().slice(0, 8)
  if (!log.length) return null

  return (
    <div className={styles.actLog}>
      <span className={styles.actLogTitle}>Atividade recente</span>
      {log.map(entry => (
        <div key={entry.id} className={styles.actLogRow}>
          <span className={styles.actLogDot}/>
          <span className={styles.actLogText}>{entry.text}</span>
          <span className={styles.actLogDate}>{entry.date?.slice(5).replace('-','/')}</span>
        </div>
      ))}
    </div>
  )
}


const FREE_PROJECTS_LIMIT = 3
const PROJ_FREE_ITEMS = [`Até ${FREE_PROJECTS_LIMIT} projetos ativos`, 'Marcos com progresso', 'Status e log de atividade']
const PROJ_PRO_ITEMS  = ['Projetos ilimitados', 'Prazo, prioridade, categorias', 'Filtros e ordenação completos']

export default function Projects() {
  const [projects,     setProjects]     = useState(() => load('nex_projects', []))
  const [showForm,     setShowForm]     = useState(false)
  const [filter,       setFilter]       = useState('todos')
  const [sortBy,       setSortBy]       = useState('prioridade')
  const [showModal,    setShowModal]    = useState(false)
  const [limitDecided, setLimitDecided] = useState(() => localStorage.getItem('nex_proj_limit_decided') === 'true')
  const [showHelp,     setShowHelp]     = useState(false)
  const { isPro } = usePlan()
  const navigate  = useNavigate()

  const activeCount = projects.filter(x => x.status === 'andamento' || x.status === 'planejando').length
  const atLimit     = !isPro && activeCount >= FREE_PROJECTS_LIMIT

  function upd(list) { setProjects(list); save('nex_projects', list) }

  function add(p) {
    if (atLimit) { setShowModal(true); return }
    upd([p, ...projects]); setShowForm(false); toast(`"${p.title}" criado!`)
  }

  function handleOpenForm() {
    if (atLimit) { setShowModal(true); return }
    setShowForm(s => !s)
  }

  function handleUpgrade() { setShowModal(false); navigate('/profile') }
  function handleStay()    { localStorage.setItem('nex_proj_limit_decided', 'true'); setLimitDecided(true); setShowModal(false) }
  function update(p) { upd(projects.map(x => x.id === p.id ? p : x)) }
  function del(id) { upd(projects.filter(p => p.id !== id)); toast('Projeto removido.') }

  const PRI_ORDER = { alta: 0, media: 1, baixa: 2 }

  const shown = useMemo(() => {
    let list = [...projects]

    // Filtro por status
    if (filter === 'ativos')     list = list.filter(p => p.status === 'andamento')
    if (filter === 'planejando') list = list.filter(p => p.status === 'planejando')
    if (filter === 'concluidos') list = list.filter(p => p.status === 'concluido')
    if (filter === 'vencidos')   list = list.filter(p => {
      if (!p.deadline || p.status === 'concluido') return false
      return new Date(p.deadline + 'T00:00:00') < new Date()
    })

    // Ordenação
    if (sortBy === 'prioridade') list.sort((a,b) => (PRI_ORDER[a.priority]||1) - (PRI_ORDER[b.priority]||1))
    if (sortBy === 'prazo')      list.sort((a,b) => {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1; if (!b.deadline) return -1
      return a.deadline.localeCompare(b.deadline)
    })
    if (sortBy === 'criacao')    list.sort((a,b) => b.id - a.id)

    return list
  }, [projects, filter, sortBy])

  const FILTERS = [
    { id:'todos',      label:'Todos', count: projects.length },
    { id:'ativos',     label:'Ativos', count: projects.filter(p=>p.status==='andamento').length },
    { id:'planejando', label:'Planejando', count: projects.filter(p=>p.status==='planejando').length },
    { id:'concluidos', label:'Feitos', count: projects.filter(p=>p.status==='concluido').length },
  ]

  return (
    <main className={styles.page}>

      {/* Intro — aparece automático quando vazio, ou via botão ? */}
      {(projects.length === 0 || showHelp) && (
        <div className="card" style={{ borderLeft: '4px solid var(--gold-dk)', paddingLeft: 12, position: 'relative' }}>
          {showHelp && projects.length > 0 && (
            <button type="button" className="btn" style={{ position: 'absolute', top: 8, right: 8, padding: '3px 6px' }}
              onClick={() => setShowHelp(false)}>
              <PiXBold size={12}/>
            </button>
          )}
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Projetos & Metas de Vida</p>
          <p style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6, marginBottom: 8 }}>
            Seus projetos pessoais de médio e longo prazo — aprender um idioma, escrever um livro,
            completar uma maratona. Diferente de Carreira, aqui é sobre quem você quer se tornar como pessoa.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { n: 1, text: 'Crie um projeto com título, prazo e prioridade' },
              { n: 2, text: 'Adicione marcos para dividir o objetivo em etapas' },
              { n: 3, text: 'Atualize o status conforme avança (Planejando → Em andamento → Concluído)' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--ink)', color: 'var(--bg)', borderRadius: 3, padding: '1px 5px', flexShrink: 0, marginTop: 1 }}>{s.n}</span>
                <span style={{ fontSize: 11, color: 'var(--ink3)', lineHeight: 1.5 }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Summary projects={projects}/>

      {/* Lista de projetos */}
      <div className="card">
        <div className="card-title">
          <PiRocketLaunchBold size={15}/> Meus Projetos
          {projects.length > 0 && (
            <button type="button"
              className={`btn ${showHelp ? 'btn-primary' : ''}`}
              style={{ padding: '3px 7px', marginLeft: 4 }}
              onClick={() => setShowHelp(h => !h)}
              title="Como usar esta tela">
              <PiQuestionBold size={12}/>
            </button>
          )}
          {atLimit && limitDecided ? (
            <button type="button" className={`btn ${styles.addBtn}`} style={{ opacity: 0.7, gap: 4 }} onClick={() => setShowModal(true)}>
              <PiLockSimpleBold size={11}/> <PiCrownBold size={11} color="var(--gold-dk)"/>
            </button>
          ) : (
            <button type="button" className={`btn btn-primary ${styles.addBtn}`} onClick={handleOpenForm}>
              <PiPlusBold size={11}/> Novo
            </button>
          )}
        </div>

        {showForm && <ProjectForm onSave={add} onClose={() => setShowForm(false)}/>}

        {showModal && (
          <PlanLimitModal
            description={`Você atingiu o limite de ${FREE_PROJECTS_LIMIT} projetos ativos do plano gratuito.`}
            freeItems={PROJ_FREE_ITEMS}
            proItems={PROJ_PRO_ITEMS}
            stayFreeLabel={`Continuar com ${FREE_PROJECTS_LIMIT} projetos`}
            onUpgrade={handleUpgrade}
            onClose={handleStay}
          />
        )}

        {/* Filtros + ordenação */}
        {projects.length > 0 && (
          <div className={styles.controls}>
            <div className={styles.filters}>
              {FILTERS.map(f => (
                <button key={f.id} type="button"
                  className={`${styles.filterBtn} ${filter===f.id ? styles.filterActive : ''}`}
                  onClick={() => setFilter(f.id)}>
                  {f.label}
                  {f.count > 0 && <span className={styles.filterCount}>{f.count}</span>}
                </button>
              ))}
            </div>
            <select className={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="prioridade">↕ Prioridade</option>
              <option value="prazo">↕ Prazo</option>
              <option value="criacao">↕ Mais recentes</option>
            </select>
          </div>
        )}

        {/* Lista */}
        {shown.length === 0 && !showForm ? (
          <div className="empty-state" style={{ padding:'20px 0' }}>
            <PiRocketLaunchBold size={32} color="var(--ink3)"/>
            <p>
              {projects.length === 0
                ? 'Nenhum projeto ainda.\nDefina seu próximo objetivo.'
                : 'Nenhum projeto neste filtro.'}
            </p>
            {projects.length === 0 && (
              <button type="button" className="btn btn-primary"
                style={{ marginTop:12, justifyContent:'center' }}
                onClick={() => setShowForm(true)}>
                <PiPlusBold size={13}/> Criar primeiro projeto
              </button>
            )}
          </div>
        ) : (
          <div className={styles.cardList}>
            {shown.map(p => (
              <ProjectCard key={p.id} project={p} onUpdate={update} onDelete={del}/>
            ))}
          </div>
        )}
      </div>

    </main>
  )
}

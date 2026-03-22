import { useState, useRef, useEffect } from 'react'
import {
  PiBookOpenTextBold, PiPencilSimpleBold, PiTrashBold,
  PiPlusBold, PiCheckBold, PiCalendarBold, PiSmileyBold,
  PiTagBold, PiMagnifyingGlassBold,
  PiSmileyWinkBold, PiSmileyMehBold, PiSmileySadBold, PiSmileyAngryBold,
} from 'react-icons/pi'
import { toast } from '../components/Toast'
import styles from './Mentor.module.css'

// ══════════════════════════════════════
// DIÁRIO DE REFLEXÃO — substitui o Mentor IA
// Funciona 100% offline via localStorage.
// O usuário registra reflexões, humor e
// conquistas. IA pode ser reintroduzida
// como feature opcional futura.
// ══════════════════════════════════════

const MOOD_OPTIONS = [
  { key: 'great',      Icon: PiSmileyBold,      label: 'Ótimo',      color: '#27ae60' },
  { key: 'good',       Icon: PiSmileyWinkBold,   label: 'Bem',        color: '#2ecc71' },
  { key: 'neutral',    Icon: PiSmileyMehBold,    label: 'Neutro',     color: '#95a5a6' },
  { key: 'tired',      Icon: PiSmileySadBold,    label: 'Cansado',    color: '#e67e22' },
  { key: 'frustrated', Icon: PiSmileyAngryBold,  label: 'Frustrado',  color: '#e74c3c' },
]

const PROMPTS = [
  'O que foi bom hoje?',
  'Qual hábito foi mais desafiador?',
  'O que aprendi sobre mim mesmo?',
  'O que faria diferente amanhã?',
  'Qual foi meu maior progresso esta semana?',
  'O que estou grato hoje?',
]

function loadEntries() {
  try { return JSON.parse(localStorage.getItem('nex_journal') || '[]') }
  catch { return [] }
}
function saveEntries(entries) {
  localStorage.setItem('nex_journal', JSON.stringify(entries))
}

function fmt(isoDate) {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

// ── Formulário de nova entrada ──
function NewEntry({ onSave, onCancel }) {
  const [text,  setText]  = useState('')
  const [mood,  setMood]  = useState(null)
  const [tags,  setTags]  = useState([])
  const [tagIn, setTagIn] = useState('')
  const [promptIdx, setPromptIdx] = useState(() => Math.floor(Math.random() * PROMPTS.length))
  const ref = useRef(null)

  useEffect(() => { ref.current?.focus() }, [])

  function addTag() {
    const t = tagIn.trim().toLowerCase()
    if (t && !tags.includes(t) && tags.length < 5) setTags([...tags, t])
    setTagIn('')
  }

  function submit() {
    if (!text.trim()) { toast('Escreva algo antes de salvar.'); return }
    onSave({
      id:   Date.now(),
      date: new Date().toISOString().slice(0, 10),
      text: text.trim(),
      mood: mood ? { key: mood.key, label: mood.label, color: mood.color } : null,
      tags,
    })
    toast('Reflexão salva!')
  }

  const nextPrompt = () => setPromptIdx(i => (i + 1) % PROMPTS.length)

  return (
    <div className={styles.newEntry}>
      {/* Prompt de reflexão */}
      <div className={styles.promptRow}>
        <span className={styles.promptText}>{PROMPTS[promptIdx]}</span>
        <button type="button" className={styles.promptNext} onClick={nextPrompt} title="Outro prompt">↻</button>
      </div>

      {/* Textarea */}
      <textarea
        ref={ref}
        className={`input ${styles.entryTextarea}`}
        placeholder="Escreva sua reflexão..."
        value={text}
        onChange={e => setText(e.target.value)}
        rows={5}
      />

      {/* Humor */}
      <div className={styles.moodRow}>
        <span className={styles.moodLabel}><PiSmileyBold size={13}/> Como você está?</span>
        <div className={styles.moodOptions}>
          {MOOD_OPTIONS.map(m => (
            <button key={m.key} type="button"
              className={`${styles.moodBtn} ${mood?.key === m.key ? styles.moodSel : ''}`}
              style={mood?.key === m.key ? { borderColor: m.color, background: m.color + '22' } : {}}
              onClick={() => setMood(m)} title={m.label}>
              <m.Icon size={18}/>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className={styles.tagRow}>
        <PiTagBold size={13} color="var(--ink3)"/>
        <div className={styles.tagList}>
          {tags.map(t => (
            <span key={t} className={styles.tag}>
              #{t}
              <button type="button" className={styles.tagDel} onClick={() => setTags(tags.filter(x => x !== t))}>×</button>
            </span>
          ))}
          <input
            className={styles.tagInput}
            placeholder="+ tag"
            value={tagIn}
            onChange={e => setTagIn(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
            maxLength={20}
          />
        </div>
      </div>

      {/* Ações */}
      <div className={styles.entryActions}>
        <button type="button" className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={submit}>
          <PiCheckBold size={14}/> Salvar reflexão
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Card de entrada do diário ──
function EntryCard({ entry, onDelete }) {
  const mood = entry.mood ? MOOD_OPTIONS.find(m => m.key === entry.mood.key) : null

  return (
    <div className={styles.entryCard}>
      <div className={styles.entryHeader}>
        <span className={styles.entryDate}><PiCalendarBold size={11}/> {fmt(entry.date)}</span>
        {mood && (
          <span className={styles.entryMood} style={{ color: mood.color }}>
            <mood.Icon size={13}/> {entry.mood.label}
          </span>
        )}
        <button type="button" className={styles.entryDel}
          onClick={() => { if (window.confirm('Remover esta reflexão?')) onDelete(entry.id) }}>
          <PiTrashBold size={12}/>
        </button>
      </div>

      <p className={styles.entryText}>{entry.text}</p>

      {entry.tags?.length > 0 && (
        <div className={styles.entryTags}>
          {entry.tags.map(t => <span key={t} className={styles.tag}>#{t}</span>)}
        </div>
      )}
    </div>
  )
}

// ── Estatísticas do diário ──
function JournalStats({ entries }) {
  const total = entries.length
  const thisWeek = entries.filter(e => {
    const d = new Date(e.date + 'T12:00:00')
    const now = new Date(); now.setHours(0,0,0,0)
    const dow = now.getDay()
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - dow)
    return d >= weekStart
  }).length

  const moodCounts = {}
  entries.forEach(e => { if (e.mood) moodCounts[e.mood.emoji] = (moodCounts[e.mood.emoji] || 0) + 1 })
  const topMood = Object.entries(moodCounts).sort((a,b) => b[1]-a[1])[0]

  const allTags = entries.flatMap(e => e.tags || [])
  const tagCounts = {}
  allTags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1)
  const topTags = Object.entries(tagCounts).sort((a,b) => b[1]-a[1]).slice(0,3)

  return (
    <div className="card">
      <div className="card-title"><PiBookOpenTextBold size={15}/> Seu Diário</div>
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statVal}>{total}</span>
          <span className={styles.statLbl}>reflexões</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statVal}>{thisWeek}</span>
          <span className={styles.statLbl}>esta semana</span>
        </div>
        {topMood && (
          <div className={styles.statBox}>
            <span className={styles.statVal}>{topMood[0]}</span>
            <span className={styles.statLbl}>humor freq.</span>
          </div>
        )}
      </div>
      {topTags.length > 0 && (
        <div className={styles.topTags}>
          {topTags.map(([t]) => <span key={t} className={styles.tag}>#{t}</span>)}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// MENTOR (agora: Diário) — PÁGINA
// ══════════════════════════════════════
export default function Mentor() {
  const [entries,   setEntries]   = useState(loadEntries)
  const [writing,   setWriting]   = useState(false)
  const [search,    setSearch]    = useState('')

  function handleSave(entry) {
    const updated = [entry, ...entries]
    setEntries(updated); saveEntries(updated)
    setWriting(false)
  }

  function handleDelete(id) {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated); saveEntries(updated)
    toast('Reflexão removida.')
  }

  const filtered = search.trim()
    ? entries.filter(e =>
        e.text.toLowerCase().includes(search.toLowerCase()) ||
        e.tags?.some(t => t.includes(search.toLowerCase()))
      )
    : entries

  return (
    <main className={styles.page}>

      {entries.length > 0 && <JournalStats entries={entries} />}

      <div className="card">
        <div className="card-title">
          <PiBookOpenTextBold size={15}/> Diário de Reflexão
          {!writing && (
            <button type="button" className={`btn btn-primary ${styles.newBtn}`}
              onClick={() => setWriting(true)}>
              <PiPlusBold size={11}/> Nova entrada
            </button>
          )}
        </div>

        {writing ? (
          <NewEntry onSave={handleSave} onCancel={() => setWriting(false)} />
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <PiBookOpenTextBold size={32} color="var(--ink3)"/>
            <p>Seu diário está vazio.<br/>Registre sua primeira reflexão do dia.</p>
            <button type="button" className="btn btn-primary"
              style={{ justifyContent:'center', marginTop:12 }}
              onClick={() => setWriting(true)}>
              <PiPencilSimpleBold size={14}/> Começar a escrever
            </button>
          </div>
        ) : (
          <>
            {/* Busca */}
            <div className={styles.searchRow}>
              <PiMagnifyingGlassBold size={14} color="var(--ink3)"/>
              <input className={styles.searchInput} placeholder="Buscar reflexões ou tags..."
                value={search} onChange={e => setSearch(e.target.value)}/>
            </div>

            {filtered.length === 0 ? (
              <p style={{ fontSize:12, color:'var(--ink3)', padding:'8px 0' }}>Nenhuma reflexão encontrada.</p>
            ) : (
              filtered.map(e => <EntryCard key={e.id} entry={e} onDelete={handleDelete}/>)
            )}
          </>
        )}
      </div>
    </main>
  )
}

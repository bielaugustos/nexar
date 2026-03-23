import { useState, useRef, useEffect } from 'react'
import {
  PiBookOpenTextBold, PiPencilSimpleBold, PiTrashBold,
  PiPlusBold, PiCheckBold, PiCalendarBold, PiSmileyBold,
  PiTagBold, PiMagnifyingGlassBold,
  PiSmileyWinkBold, PiSmileyMehBold, PiSmileySadBold, PiSmileyAngryBold,
  PiRobotBold, PiPaperPlaneTiltBold, PiArrowCounterClockwiseBold,
  PiKeyBold, PiSpinnerBold, PiChatCircleTextBold,
  PiLockBold, PiLockOpenBold, PiArrowRightBold, PiPlayBold,
  PiHeartBold, PiSunBold, PiSparkleBold, PiLeafBold,
  PiTargetBold, PiEyeBold, PiFireBold, PiMoonBold,
  PiCompassBold, PiDropBold, PiStarBold, PiHouseBold,
  PiButterflyBold, PiLightbulbBold, PiGiftBold,
  PiPuzzlePieceBold, PiPaletteBold, PiMedalBold,
  PiUserCircleBold,
} from 'react-icons/pi'
import { toast } from '../components/Toast'
import { streamMessage, buildMentorSystem } from '../services/claudeAPI'
import { useApp } from '../context/AppContext'
import { playPinKeyDirect, playErrorDirect, playClickDirect, playSaveDirect } from '../hooks/useSound'
import styles from './Mentor.module.css'

// ══════════════════════════════════════
// PROMPTS — inspiradores, íntimos
// cada par (índices 0-1, 2-3…) é exibido junto
// ══════════════════════════════════════
const PROMPTS = [
  { Icon: PiPencilSimpleBold, text: 'O que aconteceu hoje que vale guardar para sempre?' },
  { Icon: PiHeartBold,        text: 'Quem ou o que fez você sorrir genuinamente hoje?' },
  { Icon: PiSunBold,          text: 'Como você se sente agora mesmo, honestamente?' },
  { Icon: PiSparkleBold,      text: 'Qual pequeno momento de hoje merece ser lembrado?' },
  { Icon: PiLeafBold,         text: 'O que você aprendeu sobre si mesmo esta semana?' },
  { Icon: PiChatCircleTextBold, text: 'Qual pensamento não sai da sua cabeça ultimamente?' },
  { Icon: PiHeartBold,        text: 'Por que você é grato hoje — algo que normalmente ignora?' },
  { Icon: PiTargetBold,       text: 'O que fez hoje que seu eu de ontem não faria?' },
  { Icon: PiEyeBold,          text: 'Daqui a um ano, o que você gostaria de ter escrito hoje?' },
  { Icon: PiFireBold,         text: 'Qual foi o maior obstáculo que você superou recentemente?' },
  { Icon: PiMoonBold,         text: 'O que ficou inacabado hoje — e tudo bem com isso?' },
  { Icon: PiHeartBold,        text: 'A quem você gostaria de agradecer, mas ainda não agradeceu?' },
  { Icon: PiCompassBold,      text: 'Para onde sua vida está caminhando? Você está feliz com esse caminho?' },
  { Icon: PiDropBold,         text: 'O que você está carregando que poderia simplesmente soltar?' },
  { Icon: PiStarBold,         text: 'Qual versão de você apareceu mais hoje?' },
  { Icon: PiBookOpenTextBold, text: 'Se hoje fosse um capítulo do seu livro, como você o chamaria?' },
  { Icon: PiHouseBold,        text: 'O que te faz sentir em casa — dentro de você mesmo?' },
  { Icon: PiButterflyBold,    text: 'Em que aspecto você percebe que está crescendo?' },
  { Icon: PiLightbulbBold,    text: 'Qual ideia ou insight surgiu hoje que não quer esquecer?' },
  { Icon: PiGiftBold,         text: 'Qual foi o presente inesperado do dia de hoje?' },
  { Icon: PiPuzzlePieceBold,  text: 'O que faz sentido na sua vida agora que antes parecia confuso?' },
  { Icon: PiSparkleBold,      text: 'O que está florescendo na sua vida, mesmo que lentamente?' },
  { Icon: PiUserCircleBold,   text: 'O que você quer que as pessoas próximas saibam sobre você?' },
  { Icon: PiSunBold,          text: 'O que está diferente em você comparado há seis meses atrás?' },
  { Icon: PiMedalBold,        text: 'Qual conquista sua você subestima mas deveria celebrar?' },
  { Icon: PiPaletteBold,      text: 'Se você pudesse redesenhar amanhã do zero, como seria?' },
  { Icon: PiLeafBold,         text: 'O que você está nutrindo em você mesmo que ainda não contou pra ninguém?' },
  { Icon: PiMoonBold,         text: 'Qual foi o melhor momento desta semana — por menor que pareça?' },
  { Icon: PiCompassBold,      text: 'O que te faz sentir que está no caminho certo?' },
  { Icon: PiHeartBold,        text: 'O que você precisa ouvir de si mesmo hoje?' },
]

// ══════════════════════════════════════
// HUMOR
// ══════════════════════════════════════
const MOOD_OPTIONS = [
  { key: 'great',      Icon: PiSmileyBold,      label: 'Ótimo',      color: '#27ae60' },
  { key: 'good',       Icon: PiSmileyWinkBold,   label: 'Bem',        color: '#2ecc71' },
  { key: 'neutral',    Icon: PiSmileyMehBold,    label: 'Neutro',     color: '#95a5a6' },
  { key: 'tired',      Icon: PiSmileySadBold,    label: 'Cansado',    color: '#e67e22' },
  { key: 'frustrated', Icon: PiSmileyAngryBold,  label: 'Frustrado',  color: '#e74c3c' },
]

// ══════════════════════════════════════
// CADEADO — PIN de 4 dígitos
// ══════════════════════════════════════
function hashPin(pin) { return btoa('nex_' + pin + '_diary') }
function getStoredPin() { return localStorage.getItem('nex_journal_pin') || '' }
function checkPin(pin) { return getStoredPin() === hashPin(pin) }
function savePin(pin) { localStorage.setItem('nex_journal_pin', hashPin(pin)) }
function removePin() { localStorage.removeItem('nex_journal_pin') }

function PinDots({ value, max = 4 }) {
  return (
    <div className={styles.pinDots}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`${styles.pinDot} ${i < value.length ? styles.pinDotFilled : ''}`} />
      ))}
    </div>
  )
}

function PinScreen({ mode, onSuccess, onCancel }) {
  const [step,    setStep]    = useState(1)
  const [pin,     setPin]     = useState('')
  const [confirm, setConfirm] = useState('')
  const [error,   setError]   = useState('')

  function press(d) {
    playPinKeyDirect()
    setError('')
    if (step === 1) {
      const next = pin + d
      setPin(next)
      if (next.length === 4) setTimeout(() => submit(next), 120)
    } else {
      const next = confirm + d
      setConfirm(next)
      if (next.length === 4) setTimeout(() => submitConfirm(next), 120)
    }
  }

  function del() {
    playClickDirect()
    setError('')
    if (step === 1) setPin(p => p.slice(0, -1))
    else setConfirm(c => c.slice(0, -1))
  }

  function submit(p) {
    if (mode === 'unlock') {
      if (checkPin(p)) { onSuccess() }
      else { playErrorDirect(); setError('PIN incorreto'); setPin('') }
    } else if (mode === 'remove') {
      if (checkPin(p)) { removePin(); onSuccess() }
      else { playErrorDirect(); setError('PIN incorreto'); setPin('') }
    } else if (mode === 'set') {
      setStep(2)
    }
  }

  function submitConfirm(c) {
    if (c !== pin) { playErrorDirect(); setError('PINs não conferem'); setConfirm(''); setStep(1); setPin('') }
    else { savePin(pin); onSuccess() }
  }

  const title = { unlock: 'Diário trancado', set: step === 1 ? 'Criar PIN' : 'Confirmar PIN', remove: 'Remover cadeado' }[mode]
  const subtitle = { unlock: 'Digite seu PIN para acessar', set: step === 1 ? 'Escolha 4 dígitos' : 'Repita o PIN', remove: 'Digite seu PIN atual' }[mode]
  const current = step === 1 ? pin : confirm

  return (
    <div className={styles.pinOverlay}>
      <div className={styles.pinBox}>
        <div className={styles.pinIcon}><PiLockBold size={26} color="var(--gold-dk)"/></div>
        <p className={styles.pinTitle}>{title}</p>
        <p className={styles.pinSubtitle}>{subtitle}</p>
        <PinDots value={current}/>
        {error && <p className={styles.pinError}>{error}</p>}
        <div className={styles.pinGrid}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
            d === '' ? <div key={i}/> :
            d === '⌫' ? (
              <button key={i} type="button" className={`${styles.pinKey} ${styles.pinKeyDel}`} onClick={del}>{d}</button>
            ) : (
              <button key={i} type="button" className={styles.pinKey}
                onClick={() => press(String(d))} disabled={current.length >= 4}>{d}</button>
            )
          ))}
        </div>
        {onCancel && (
          <button type="button" className="btn" style={{ marginTop:6, fontSize:11, justifyContent:'center' }} onClick={onCancel}>
            Cancelar
          </button>
        )}

        {mode === 'unlock' && (
          <button type="button" className={styles.forgotBtn}
            onClick={() => {
              if (window.confirm(
                'Redefinir PIN?\n\nSuas reflexões continuam salvas — o cadeado é uma proteção de interface, não criptografia real.\n\nO PIN atual será removido e você poderá criar um novo.'
              )) {
                removePin()
                onSuccess()
              }
            }}>
            Esqueci o PIN
          </button>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// DIÁRIO — storage
// ══════════════════════════════════════
function loadEntries() {
  try { return JSON.parse(localStorage.getItem('nex_journal') || '[]') }
  catch { return [] }
}
function saveEntries(entries) { localStorage.setItem('nex_journal', JSON.stringify(entries)) }
function fmt(isoDate) {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

// ──────────────────────────────────────
// Textarea autogrow
// ──────────────────────────────────────
function AutoTextarea({ value, onChange, placeholder, className }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <textarea ref={ref} className={className} placeholder={placeholder} value={value} onChange={onChange}
      style={{ resize:'none', overflow:'hidden', minHeight:140, transition:'height .1s ease' }}/>
  )
}

// ──────────────────────────────────────
// Par de prompts — atual + próxima,
// animados com slide único na troca
// ──────────────────────────────────────
function PromptPair({ onSelect, selected }) {
  const [pairStart, setPairStart] = useState(() => {
    const r = Math.floor(Math.random() * Math.floor(PROMPTS.length / 2)) * 2
    return r
  })
  const [anim, setAnim] = useState('in') // 'in' | 'out'

  const pa = PROMPTS[pairStart % PROMPTS.length]
  const pb = PROMPTS[(pairStart + 1) % PROMPTS.length]

  function next() {
    setAnim('out')
    setTimeout(() => {
      setPairStart(p => (p + 2) % PROMPTS.length)
      onSelect(0)
      setAnim('in')
    }, 200)
  }

  return (
    <div className={styles.promptWrap}>
      <div className={`${styles.promptPair} ${anim === 'out' ? styles.promptPairOut : styles.promptPairIn}`}>
        {[pa, pb].map((p, i) => (
          <button key={i} type="button"
            className={`${styles.promptCard} ${selected === i ? styles.promptCardActive : ''}`}
            onClick={() => onSelect(i)}>
            <p.Icon size={15} className={styles.promptCardIcon}/>
            <span className={styles.promptCardText}>{p.text}</span>
          </button>
        ))}
      </div>
      <button type="button" className={styles.promptNext} onClick={next} title="Próximo par">
        <PiArrowRightBold size={13}/>
      </button>
    </div>
  )
}

// ──────────────────────────────────────
// Formulário de nova entrada
// ──────────────────────────────────────
function NewEntry({ onSave, onCancel }) {
  const [text,     setText]     = useState('')
  const [mood,     setMood]     = useState(null)
  const [tags,     setTags]     = useState([])
  const [tagIn,    setTagIn]    = useState('')
  const [selPair,  setSelPair]  = useState(0)
  const [pairStart]             = useState(() => {
    const r = Math.floor(Math.random() * Math.floor(PROMPTS.length / 2)) * 2
    return r
  })

  // sincroniza com PromptPair via callback — guardamos o par corrente separado
  const [currentPair, setCurrentPair] = useState(pairStart)
  const activePrompt = PROMPTS[(currentPair + selPair) % PROMPTS.length]

  function addTag() {
    const t = tagIn.trim().toLowerCase()
    if (t && !tags.includes(t) && tags.length < 5) setTags([...tags, t])
    setTagIn('')
  }

  function submit() {
    if (!text.trim()) { toast('Escreva algo antes de salvar.'); return }
    playSaveDirect()
    onSave({
      id:     Date.now(),
      date:   new Date().toISOString().slice(0, 10),
      text:   text.trim(),
      prompt: activePrompt.text,
      mood:   mood ? { key: mood.key, label: mood.label, color: mood.color } : null,
      tags,
    })
    toast('Reflexão salva!')
  }

  return (
    <div className={styles.newEntry}>
      <PromptPairControlled
        onPairChange={pair => { setCurrentPair(pair); setSelPair(0) }}
        onSelect={setSelPair}
        selected={selPair}
        initialPair={pairStart}
      />

      <AutoTextarea
        className={`input ${styles.entryTextarea}`}
        placeholder="Escreva livremente, isso é só seu..."
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <div className={styles.moodRow}>
        <span className={styles.moodLabel}><PiSmileyBold size={13}/> Como você está?</span>
        <div className={styles.moodOptions}>
          {MOOD_OPTIONS.map(m => (
            <button key={m.key} type="button"
              className={`${styles.moodBtn} ${mood?.key === m.key ? styles.moodSel : ''}`}
              style={mood?.key === m.key ? { borderColor: m.color, background: m.color + '22' } : {}}
              onClick={() => { playClickDirect(); setMood(m) }} title={m.label}>
              <m.Icon size={18}/>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tagRow}>
        <PiTagBold size={13} color="var(--ink3)"/>
        <div className={styles.tagList}>
          {tags.map(t => (
            <span key={t} className={styles.tag}>
              #{t}
              <button type="button" className={styles.tagDel} onClick={() => setTags(tags.filter(x => x !== t))}>×</button>
            </span>
          ))}
          <input className={styles.tagInput} placeholder="+ tag" value={tagIn}
            onChange={e => setTagIn(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
            maxLength={20}/>
        </div>
      </div>

      <div className={styles.entryActions}>
        <button type="button" className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={submit}>
          <PiCheckBold size={14}/> Salvar reflexão
        </button>
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}

// Versão controlada do par de prompts (expõe o par atual via callback)
function PromptPairControlled({ onPairChange, onSelect, selected, initialPair }) {
  const [pairStart, setPairStart] = useState(initialPair)
  const [anim,      setAnim]      = useState('in')

  const pa = PROMPTS[pairStart % PROMPTS.length]
  const pb = PROMPTS[(pairStart + 1) % PROMPTS.length]

  function next() {
    setAnim('out')
    setTimeout(() => {
      const next = (pairStart + 2) % PROMPTS.length
      setPairStart(next)
      onPairChange(next)
      onSelect(0)
      setAnim('in')
    }, 200)
  }

  return (
    <div className={styles.promptWrap}>
      <div className={`${styles.promptPair} ${anim === 'out' ? styles.promptPairOut : styles.promptPairIn}`}>
        {[pa, pb].map((p, i) => (
          <button key={i} type="button"
            className={`${styles.promptCard} ${selected === i ? styles.promptCardActive : ''}`}
            onClick={() => onSelect(i)}>
            <p.Icon size={15} className={styles.promptCardIcon}/>
            <span className={styles.promptCardText}>{p.text}</span>
          </button>
        ))}
      </div>
      <button type="button" className={styles.promptNext} onClick={next} title="Próximo par">
        <PiArrowRightBold size={13}/>
      </button>
    </div>
  )
}

// ──────────────────────────────────────
// Card de entrada
// ──────────────────────────────────────
function EntryCard({ entry, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const mood = entry.mood ? MOOD_OPTIONS.find(m => m.key === entry.mood.key) : null
  const long = entry.text.length > 200

  return (
    <div className={styles.entryCard}>
      <div className={styles.entryHeader}>
        <span className={styles.entryDate}><PiCalendarBold size={11}/> {fmt(entry.date)}</span>
        {mood && <span className={styles.entryMood} style={{ color: mood.color }}><mood.Icon size={13}/> {entry.mood.label}</span>}
        <button type="button" className={styles.entryDel}
          onClick={() => { if (window.confirm('Remover esta reflexão?')) onDelete(entry.id) }}>
          <PiTrashBold size={12}/>
        </button>
      </div>
      {entry.prompt && <p className={styles.entryPrompt}>{entry.prompt}</p>}
      <p className={`${styles.entryText} ${long && !expanded ? styles.entryTextClamped : ''}`}>{entry.text}</p>
      {long && (
        <button type="button" className={styles.entryExpand} onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Ver menos ↑' : 'Ver mais ↓'}
        </button>
      )}
      {entry.tags?.length > 0 && (
        <div className={styles.entryTags}>{entry.tags.map(t => <span key={t} className={styles.tag}>#{t}</span>)}</div>
      )}
    </div>
  )
}

// ──────────────────────────────────────
// Estatísticas
// ──────────────────────────────────────
function JournalStats({ entries }) {
  const total = entries.length
  const thisWeek = entries.filter(e => {
    const d = new Date(e.date + 'T12:00:00')
    const now = new Date(); now.setHours(0,0,0,0)
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
    return d >= weekStart
  }).length
  const moodCounts = {}
  entries.forEach(e => { if (e.mood) moodCounts[e.mood.key] = (moodCounts[e.mood.key] || 0) + 1 })
  const topMoodKey = Object.entries(moodCounts).sort((a,b) => b[1]-a[1])[0]?.[0]
  const topMood = topMoodKey ? MOOD_OPTIONS.find(m => m.key === topMoodKey) : null
  const allTags = entries.flatMap(e => e.tags || [])
  const tagCounts = {}
  allTags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1)
  const topTags = Object.entries(tagCounts).sort((a,b) => b[1]-a[1]).slice(0,3)

  return (
    <div className="card">
      <div className="card-title"><PiBookOpenTextBold size={15}/> Seu Diário</div>
      <div className={styles.statsRow}>
        <div className={styles.statBox}><span className={styles.statVal}>{total}</span><span className={styles.statLbl}>reflexões</span></div>
        <div className={styles.statBox}><span className={styles.statVal}>{thisWeek}</span><span className={styles.statLbl}>esta semana</span></div>
        {topMood && <div className={styles.statBox}><topMood.Icon size={20} color={topMood.color}/><span className={styles.statLbl}>humor freq.</span></div>}
      </div>
      {topTags.length > 0 && <div className={styles.topTags}>{topTags.map(([t]) => <span key={t} className={styles.tag}>#{t}</span>)}</div>}
    </div>
  )
}

// ══════════════════════════════════════
// EMPTY STATE — botão COMEÇAR
// ══════════════════════════════════════
function EmptyDiary({ onStart }) {
  const [pressing, setPressing] = useState(false)

  function handle() {
    setPressing(true)
    setTimeout(() => { setPressing(false); onStart() }, 560)
  }

  return (
    <div className="empty-state">
      <PiBookOpenTextBold size={32} color="var(--ink3)"/>
      <p>Seu diário está vazio.<br/>Registre sua primeira reflexão do dia.</p>
      <button
        type="button"
        className={`${styles.comecarBtn} ${pressing ? styles.comecarBtnPress : ''}`}
        onClick={handle}
        disabled={pressing}
      >
        <PiPlayBold size={13}/> COMEÇAR
      </button>
    </div>
  )
}

// ══════════════════════════════════════
// MENTOR IA
// ══════════════════════════════════════
function MentorIA({ habits, history }) {
  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef(null)
  const apiKey = localStorage.getItem('nex_apikey') || ''
  const hasKey = apiKey.startsWith('sk-ant-')

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || streaming) return
    if (!hasKey) { toast('Configure sua chave API no Perfil.'); return }
    const userMsg = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next); setInput('')
    const system = buildMentorSystem(habits, history)
    let aiText = ''
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])
    streamMessage({
      messages: next.map(m => ({ role: m.role, content: m.content })),
      system,
      onChunk: chunk => {
        aiText += chunk
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: aiText } : m))
      },
      onDone: () => {
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, streaming: false } : m))
        setStreaming(false)
      },
      onError: err => { setMessages(prev => prev.slice(0, -1)); toast('Erro: ' + err); setStreaming(false) },
    })
  }

  if (!hasKey) return (
    <div className="card">
      <div className="card-title"><PiRobotBold size={15}/> Mentor IA</div>
      <div className="empty-state">
        <PiKeyBold size={32} color="var(--ink3)"/>
        <p>Configure sua chave API Claude<br/>no Perfil para ativar o Mentor IA.</p>
        <div style={{ background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:4, padding:'10px 12px', marginTop:8, width:'100%' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'var(--ink2)', margin:'0 0 8px' }}>O que o Mentor IA faz:</p>
          {['Analisa seus hábitos e progresso','Responde dúvidas sobre sua rotina','Dá conselhos personalizados','Identifica padrões e sugere melhorias'].map(f => (
            <div key={f} style={{ display:'flex', gap:6, marginBottom:4, alignItems:'center' }}>
              <PiCheckBold size={11} color="var(--gold-dk)"/>
              <span style={{ fontSize:11, color:'var(--ink2)' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:0, padding:0, overflow:'hidden' }}>
      <div style={{ padding:'10px 14px', borderBottom:'1.5px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
        <PiRobotBold size={15} color="var(--gold-dk)"/>
        <span style={{ fontWeight:700, fontSize:13, color:'var(--ink)' }}>Mentor IA</span>
        {messages.length > 0 && (
          <button type="button" className="btn" style={{ marginLeft:'auto', padding:'3px 8px', fontSize:10 }} onClick={() => setMessages([])}>
            <PiArrowCounterClockwiseBold size={11}/> Limpar
          </button>
        )}
      </div>
      <div className={styles.chatMessages}>
        {messages.length === 0 && (
          <div style={{ textAlign:'center', padding:'24px 16px' }}>
            <PiChatCircleTextBold size={28} color="var(--ink3)" style={{ marginBottom:8 }}/>
            <p style={{ fontSize:12, color:'var(--ink3)', margin:0 }}>Olá! Sou seu mentor.<br/>Pergunte sobre seus hábitos ou progresso.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`${styles.chatBubble} ${m.role === 'user' ? styles.chatUser : styles.chatAI}`}>
            {m.role === 'assistant' && <span className={styles.chatIcon}><PiRobotBold size={12}/></span>}
            <span className={styles.chatText}>
              {m.content || (m.streaming ? <PiSpinnerBold size={13} className={styles.spin}/> : '')}
            </span>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div style={{ padding:'10px 12px', borderTop:'1.5px solid var(--border)', display:'flex', gap:8 }}>
        <input className="input" placeholder="Pergunte algo ao seu mentor..." value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          disabled={streaming} style={{ flex:1, fontSize:12 }}/>
        <button type="button" className="btn btn-primary" onClick={send} disabled={streaming || !input.trim()} style={{ padding:'6px 10px' }}>
          <PiPaperPlaneTiltBold size={14}/>
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// MENTOR — PÁGINA
// ══════════════════════════════════════
export default function Mentor() {
  const { habits, history } = useApp()
  const [tab,     setTab]     = useState('diario')
  const [entries, setEntries] = useState(loadEntries)
  const [writing, setWriting] = useState(false)
  const [search,  setSearch]  = useState('')

  const hasPin = !!getStoredPin()
  const [locked,  setLocked]  = useState(hasPin)
  const [pinMode, setPinMode] = useState(null)

  function handleSave(entry) {
    const updated = [entry, ...entries]
    setEntries(updated); saveEntries(updated); setWriting(false)
  }
  function handleDelete(id) {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated); saveEntries(updated); toast('Reflexão removida.')
  }

  const filtered = search.trim()
    ? entries.filter(e => e.text.toLowerCase().includes(search.toLowerCase()) || e.tags?.some(t => t.includes(search.toLowerCase())))
    : entries

  return (
    <main className={styles.page}>

      <div className={styles.tabs}>
        <button type="button" className={`${styles.tab} ${tab === 'diario' ? styles.tabActive : ''}`} onClick={() => setTab('diario')}>
          <PiBookOpenTextBold size={13}/> Diário
        </button>
        <button type="button" className={`${styles.tab} ${tab === 'mentor' ? styles.tabActive : ''}`} onClick={() => setTab('mentor')}>
          <PiRobotBold size={13}/> Mentor IA
        </button>
      </div>

      {tab === 'diario' && (
        <>
          {entries.length > 0 && !locked && <JournalStats entries={entries} />}

          <div className="card">
            <div className="card-title">
              <PiBookOpenTextBold size={15}/> Diário de Reflexão

              <button type="button" className={styles.lockBtn}
                title={locked ? 'Desbloquear' : hasPin ? 'Protegido — clique para remover PIN' : 'Proteger com PIN'}
                onClick={() => { if (locked) setPinMode('unlock'); else if (hasPin) setPinMode('remove'); else setPinMode('set') }}>
                {locked
                  ? <PiLockBold size={15} color="var(--gold-dk)"/>
                  : hasPin
                    ? <PiLockOpenBold size={15} color="#27ae60"/>
                    : <PiLockOpenBold size={15} color="var(--ink3)"/>
                }
              </button>

              {!writing && !locked && (
                <button type="button" className={`btn btn-primary ${styles.newBtn}`} onClick={() => setWriting(true)}>
                  <PiPlusBold size={11}/> Nova entrada
                </button>
              )}
            </div>

            {/* Dica discreta sobre o cadeado — só aparece quando não há PIN */}
            {!hasPin && !locked && !writing && (
              <div className={styles.lockHint}>
                <div className={styles.lockHintStep}>
                  <span className={styles.lockHintNum}>1</span>
                  Toque no cadeado acima para criar um PIN de 4 dígitos
                </div>
                <div className={styles.lockHintStep}>
                  <span className={styles.lockHintNum}>2</span>
                  Suas reflexões ficam ocultas até você digitar o PIN
                </div>
              </div>
            )}

            {/* PIN */}
            {pinMode && (
              <PinScreen mode={pinMode}
                onSuccess={() => {
                  if (pinMode === 'unlock') setLocked(false)
                  setPinMode(null)
                  toast(pinMode === 'set' ? 'PIN criado! Diário protegido.' : pinMode === 'remove' ? 'Cadeado removido.' : 'Diário desbloqueado.')
                }}
                onCancel={() => setPinMode(null)}
              />
            )}

            {/* Bloqueado */}
            {locked && !pinMode && (
              <div className="empty-state" style={{ padding:'24px 0' }}>
                <PiLockBold size={36} color="var(--gold-dk)"/>
                <p>Suas reflexões estão protegidas.<br/>Toque no cadeado para acessar.</p>
                <button type="button" className="btn btn-primary" style={{ justifyContent:'center', marginTop:12 }} onClick={() => setPinMode('unlock')}>
                  Desbloquear
                </button>
              </div>
            )}

            {/* Desbloqueado */}
            {!locked && (
              writing ? (
                <NewEntry onSave={handleSave} onCancel={() => setWriting(false)} />
              ) : entries.length === 0 ? (
                <EmptyDiary onStart={() => setWriting(true)} />
              ) : (
                <>
                  <div className={styles.searchRow}>
                    <PiMagnifyingGlassBold size={14} color="var(--ink3)"/>
                    <input className={styles.searchInput} placeholder="Buscar reflexões ou tags..."
                      value={search} onChange={e => setSearch(e.target.value)}/>
                  </div>
                  {filtered.length === 0
                    ? <p style={{ fontSize:12, color:'var(--ink3)', padding:'8px 0' }}>Nenhuma reflexão encontrada.</p>
                    : filtered.map(e => <EntryCard key={e.id} entry={e} onDelete={handleDelete}/>)
                  }
                </>
              )
            )}
          </div>
        </>
      )}

      {tab === 'mentor' && <MentorIA habits={habits} history={history}/>}
    </main>
  )
}

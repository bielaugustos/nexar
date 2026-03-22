import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { loadStorage, saveStorage } from '../services/storage'
import { applyTheme, initTheme } from '../services/themes'

// ══════════════════════════════════════
// MIGRAÇÃO DE DADOS
// Garante que hábitos antigos (sem o campo
// "days") não quebrem o app. Sempre que
// carregar do storage, normaliza o formato.
// ══════════════════════════════════════
function migrateHabit(h) {
  return {
    // ── Campos base ──
    id:       h.id       ?? Date.now(),
    name:     h.name     ?? 'Hábito',
    done:     h.done     ?? false,
    pts:      h.pts      ?? 20,
    icon:     h.icon     ?? 'PiStarBold',
    priority: h.priority ?? 'media',
    freq:     h.freq     ?? 'diario',
    days:     Array.isArray(h.days) && h.days.length > 0
                ? h.days
                : [0, 1, 2, 3, 4, 5, 6],

    // ── Campos novos — migração segura (undefined → valor padrão) ──

    // Subtarefas: [{ id, text, done, pts }]
    subtasks: Array.isArray(h.subtasks) ? h.subtasks : [],

    // Notas de texto livre
    notes:    h.notes    ?? '',

    // Motivo — por que esse hábito importa para o usuário
    reason:   h.reason   ?? '',

    // Etiquetas — array de strings
    tags:     Array.isArray(h.tags) ? h.tags : [],

    // Data de criação (ISO)
    createdAt: h.createdAt ?? null,

    // Tempo médio estimado em minutos (ex: 30 = "~30 min")
    estMins:  h.estMins  != null ? Number(h.estMins) : null,

    // Data limite (ISO string "YYYY-MM-DD") — independente da frequência
    // A frequência diz "quando repetir", a deadline diz "até quando"
    deadline: h.deadline ?? null,

    // Período preferido do dia: null | 'manha' | 'tarde' | 'noite'
    period: ['manha', 'tarde', 'noite'].includes(h.period) ? h.period : null,

    // Horário preferido (HH:MM) — quando fazer o hábito
    habitTime: h.habitTime ?? null,
  }
}

function migrateHabits(raw) {
  if (!Array.isArray(raw)) return DEFAULT_HABITS
  return raw.map(migrateHabit)
}

// ══════════════════════════════════════
// DADOS PADRÃO
// ══════════════════════════════════════
const DEFAULT_HABITS = [
  { id: 1, name: 'Meditação', done: false, pts: 20, icon: 'PiBrainBold',   priority: 'alta',  freq: 'diario',        days: [0,1,2,3,4,5,6] },
  { id: 2, name: 'Exercício', done: false, pts: 30, icon: 'PiBarbell',     priority: 'alta',  freq: 'personalizado', days: [1,3,5] },
  { id: 3, name: 'Leitura',   done: false, pts: 20, icon: 'PiBookOpenText',priority: 'media', freq: 'diario',        days: [0,1,2,3,4,5,6] },
  { id: 4, name: 'Água',      done: false, pts: 10, icon: 'PiDropBold',    priority: 'baixa', freq: 'diario',        days: [0,1,2,3,4,5,6] },
  { id: 5, name: 'Código',    done: false, pts: 30, icon: 'PiCodeBold',    priority: 'media', freq: 'personalizado', days: [1,2,3,4,5] },
]

// Usa data LOCAL (não UTC) — evita bug de fuso: às 22h em UTC-3,
// toISOString() retornaria amanhã. getFullYear/Month/Date são sempre locais.
function todayStr() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

// ══════════════════════════════════════
// CONTEXTO
// ══════════════════════════════════════
const AppContext = createContext(null)

export function AppProvider({ children }) {
  // Ao carregar, verifica se o dia mudou e reseta done dos hábitos
  const [habits, setHabits] = useState(() => {
    const raw = migrateHabits(loadStorage('nex_habits', DEFAULT_HABITS))
    const lastReset = loadStorage('nex_last_reset', '')
    const today     = todayStr()
    if (lastReset !== today) {
      // Novo dia — reseta done de todos os hábitos
      const reset = raw.map(h => ({ ...h, done: false }))
      saveStorage('nex_habits', reset)
      saveStorage('nex_last_reset', today)
      return reset
    }
    return raw
  })
  const [history, setHistory] = useState(() => loadStorage('nex_history', {}))
  const [theme,   setThemeState] = useState(() => initTheme())
  const [soundOn, setSoundOnState] = useState(() => loadStorage('nex_sound', true))

  // Aplica o tema no <html> sempre que mudar (incluindo na montagem inicial)
  useEffect(() => {
    applyTheme(theme)
  }, [theme])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { saveStorage('nex_sound',  soundOn) }, [soundOn])

  // Persiste hábitos e atualiza histórico do dia
  useEffect(() => {
    saveStorage('nex_habits', habits)
    const today  = todayStr()
    const habMap = {}
    habits.forEach(h => { if (h.done) habMap[h.id] = true })
    const updated = {
      ...history,
      [today]: {
        done:   habits.filter(h => h.done).length,
        total:  habits.length,
        habits: habMap,
      },
    }
    setHistory(updated)
    saveStorage('nex_history', updated)
  }, [habits]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset automático à meia-noite (fuso local) ──
  // Calcula exatamente quantos ms faltam para 00:00:01 local e agenda o reset.
  // Após cada reset, reagenda para a próxima meia-noite (loop infinito correto).
  const midnightTimer = useRef(null)
  useEffect(() => {
    function scheduleNext() {
      const now  = new Date()
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
      const ms   = next - now
      midnightTimer.current = setTimeout(() => {
        const today = todayStr()
        setHabits(prev => prev.map(h => ({ ...h, done: false })))
        saveStorage('nex_last_reset', today)
        scheduleNext()
      }, ms)
    }
    scheduleNext()
    return () => clearTimeout(midnightTimer.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ações (useCallback para identidade estável) ──

  const toggleHabit = useCallback((id) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h))
  }, [])

  const saveHabit = useCallback((updated) => {
    // Garante migração mesmo ao salvar da tela de edição
    const safe = migrateHabit(updated)
    setHabits(prev =>
      prev.some(h => h.id === safe.id)
        ? prev.map(h => h.id === safe.id ? safe : h)
        : [...prev, safe]
    )
  }, [])

  const addHabit = useCallback((habit) => {
    const safe = migrateHabit({ ...habit, id: Date.now() })
    setHabits(prev => [...prev, safe])
  }, [])

  const deleteHabit = useCallback((id) => {
    setHabits(prev => prev.filter(h => h.id !== id))
  }, [])

  const resetDay = useCallback(() => {
    setHabits(prev => prev.map(h => ({ ...h, done: false })))
    saveStorage('nex_last_reset', todayStr())
  }, [])

  const setTheme = useCallback((id) => {
    setThemeState(id)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(t => t === 'dark' ? 'light' : 'dark')
  }, [])

  const setSoundOn = useCallback((val) => {
    setSoundOnState(typeof val === 'function' ? val : () => val)
  }, [])

  const value = {
    habits, history, theme, soundOn,
    toggleHabit, saveHabit, addHabit, deleteHabit, resetDay,
    toggleTheme, setTheme, setSoundOn,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider')
  return ctx
}

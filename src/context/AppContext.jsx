// ══════════════════════════════════════
// CONTEXTO GLOBAL — AppContext
//
// Estado central da aplicação. Contém:
//   • habits   — lista de hábitos com migração segura
//   • history  — histórico diário de conclusões
//   • theme    — tema de cores ativo
//   • soundOn  — preferência de som
//   • plan     — plano do usuário ('free' | 'pro')
//
// Ações expostas:
//   toggleHabit, saveHabit, addHabit, deleteHabit, resetDay,
//   setTheme, toggleTheme, setSoundOn, setPlan
//
// Persistência: localStorage com prefixo "nex_"
// Reset automático: todos os dias à meia-noite (fuso local)
//
// Supabase-ready: quando migrar auth, mover `plan` para
// ser derivado de user.user_metadata via hook usePlan.js.
// O restante do contexto (habits, history…) pode coexistir.
// ══════════════════════════════════════
import {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react'
import { loadStorage, saveStorage } from '../services/storage'
import { applyTheme, initTheme }    from '../services/themes'

// ══════════════════════════════════════
// UTILITÁRIOS DE DATA
//
// Usa data LOCAL (não UTC) para evitar o bug
// de fuso: às 22h em UTC-3, toISOString()
// retornaria "amanhã". getFullYear/Month/Date
// são sempre no fuso do dispositivo.
// ══════════════════════════════════════
function todayStr() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

// ══════════════════════════════════════
// MIGRAÇÃO DE HÁBITOS
//
// Garante retrocompatibilidade: hábitos
// gravados em versões antigas do app são
// normalizados com todos os campos novos
// e valores padrão seguros.
//
// Regra: nunca lançar erro — se um campo
// for inválido ou ausente, usa o padrão.
// ══════════════════════════════════════
function migrateHabit(h) {
  return {
    // ── Identidade ──
    id:       h.id       ?? Date.now(),
    name:     h.name     ?? 'Hábito',
    icon:     h.icon     ?? 'PiStarBold',

    // ── Progresso diário ──
    done:     h.done     ?? false,
    pts:      h.pts      ?? 20,

    // ── Classificação ──
    priority: h.priority ?? 'media',

    // ── Frequência ──
    // freq: 'diario' ou 'personalizado'
    // days: array de 0 (Dom) a 6 (Sáb)
    freq: h.freq ?? 'diario',
    days: Array.isArray(h.days) && h.days.length > 0
      ? h.days
      : [0, 1, 2, 3, 4, 5, 6],

    // ── Contexto e metadados ──
    subtasks:  Array.isArray(h.subtasks) ? h.subtasks : [],
    notes:     h.notes    ?? '',
    reason:    h.reason   ?? '',   // "por que esse hábito importa"
    tags:      Array.isArray(h.tags) ? h.tags : [],
    createdAt: h.createdAt ?? null,

    // ── Planejamento ──
    // estMins: tempo estimado (null = não definido)
    estMins:   h.estMins != null ? Number(h.estMins) : null,

    // deadline: "YYYY-MM-DD" — até quando praticar (independente da freq.)
    deadline:  h.deadline ?? null,

    // period: null | 'manha' | 'tarde' | 'noite'
    period: ['manha', 'tarde', 'noite'].includes(h.period) ? h.period : null,

    // habitTime: "HH:MM" — horário sugerido
    habitTime: h.habitTime ?? null,

    // ── Arquivamento ──
    archived:  h.archived ?? false,
  }
}

function migrateHabits(raw) {
  if (!Array.isArray(raw)) return DEFAULT_HABITS
  return raw.map(migrateHabit)
}

// ══════════════════════════════════════
// HÁBITOS PADRÃO
// Usados na primeira vez que o app abre,
// antes de qualquer customização.
// ══════════════════════════════════════
const DEFAULT_HABITS = [
  { id: 1, name: 'Meditação', done: false, pts: 20, icon: 'PiBrainBold',    priority: 'alta',  freq: 'diario',        days: [0,1,2,3,4,5,6] },
  { id: 2, name: 'Exercício', done: false, pts: 30, icon: 'PiBarbell',      priority: 'alta',  freq: 'personalizado', days: [1,3,5]          },
  { id: 3, name: 'Leitura',   done: false, pts: 20, icon: 'PiBookOpenText', priority: 'media', freq: 'diario',        days: [0,1,2,3,4,5,6] },
  { id: 4, name: 'Água',      done: false, pts: 10, icon: 'PiDropBold',     priority: 'baixa', freq: 'diario',        days: [0,1,2,3,4,5,6] },
  { id: 5, name: 'Código',    done: false, pts: 30, icon: 'PiCodeBold',     priority: 'media', freq: 'personalizado', days: [1,2,3,4,5]     },
]

// ══════════════════════════════════════
// CRIAÇÃO DO CONTEXTO
// ══════════════════════════════════════
const AppContext = createContext(null)

// ══════════════════════════════════════
// PROVIDER
// ══════════════════════════════════════
export function AppProvider({ children }) {

  // ── Estado inicial: hábitos com auto-reset de dia ──
  const [habits, setHabits] = useState(() => {
    const raw       = migrateHabits(loadStorage('nex_habits', DEFAULT_HABITS))
    const lastReset = loadStorage('nex_last_reset', '')
    const today     = todayStr()

    // Se o app abriu em um novo dia, reseta done de todos os hábitos
    if (lastReset !== today) {
      const reset = raw.map(h => ({ ...h, done: false }))
      saveStorage('nex_habits', reset)
      saveStorage('nex_last_reset', today)
      return reset
    }

    return raw
  })

  const [history,   setHistory]    = useState(() => loadStorage('nex_history', {}))
  const [theme,     setThemeState] = useState(() => initTheme())
  const [soundOn,   setSoundOnSt]  = useState(() => loadStorage('nex_sound', true))
  const [plan,      setPlanState]  = useState(() => loadStorage('nex_plan', 'free'))

  // ── Efeitos de persistência e sincronização ──

  // Aplica o tema no <html> sempre que mudar
  useEffect(() => { applyTheme(theme) }, [theme]) // eslint-disable-line react-hooks/exhaustive-deps

  // Persiste preferência de som
  useEffect(() => { saveStorage('nex_sound', soundOn) }, [soundOn])

  // Persiste plano e notifica outros componentes
  useEffect(() => {
    saveStorage('nex_plan', plan)
    window.dispatchEvent(new Event('nex_plan_changed'))
  }, [plan])

  // Persiste hábitos e registra o dia atual no histórico
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
  //
  // Calcula exatamente quantos ms faltam para 00:00:01 local
  // e agenda o reset. Após cada reset, reagenda para a próxima
  // meia-noite — loop correto sem drift de intervalo.
  const midnightTimer = useRef(null)

  useEffect(() => {
    function agendarProximoReset() {
      const agora     = new Date()
      const proxima   = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1, 0, 0, 1)
      const msRestantes = proxima - agora

      midnightTimer.current = setTimeout(() => {
        setHabits(prev => prev.map(h => ({ ...h, done: false })))
        saveStorage('nex_last_reset', todayStr())
        agendarProximoReset() // reagenda para a próxima noite
      }, msRestantes)
    }

    agendarProximoReset()
    return () => clearTimeout(midnightTimer.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════
  // AÇÕES — useCallback para identidade
  // estável (evita re-renders desnecessários
  // em componentes filhos que as recebem)
  // ══════════════════════════════════════

  // Alterna o estado done de um hábito pelo id
  const toggleHabit = useCallback((id) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h))
  }, [])

  // Cria ou atualiza um hábito (upsert por id)
  const saveHabit = useCallback((updated) => {
    const safe = migrateHabit(updated) // garante campos novos ao salvar da tela de edição
    setHabits(prev =>
      prev.some(h => h.id === safe.id)
        ? prev.map(h => h.id === safe.id ? safe : h)
        : [...prev, safe]
    )
  }, [])

  // Adiciona um novo hábito (gera id por timestamp)
  const addHabit = useCallback((habit) => {
    const safe = migrateHabit({ ...habit, id: Date.now() })
    setHabits(prev => [...prev, safe])
  }, [])

  // Remove permanentemente um hábito pelo id
  const deleteHabit = useCallback((id) => {
    setHabits(prev => prev.filter(h => h.id !== id))
  }, [])

  // Reseta manualmente o dia (sem esperar meia-noite)
  const resetDay = useCallback(() => {
    setHabits(prev => prev.map(h => ({ ...h, done: false })))
    saveStorage('nex_last_reset', todayStr())
  }, [])

  // Define o tema pelo id (ex: 'dark', 'glass', 'sakura')
  const setTheme = useCallback((id) => {
    setThemeState(id)
  }, [])

  // Alterna entre claro e escuro (atalho rápido)
  const toggleTheme = useCallback(() => {
    setThemeState(t => t === 'dark' ? 'light' : 'dark')
  }, [])

  // Atualiza preferência de som (aceita valor ou função atualizadora)
  const setSoundOn = useCallback((val) => {
    setSoundOnSt(typeof val === 'function' ? val : () => val)
  }, [])

  // Define o plano do usuário ('free' | 'pro')
  // Supabase: substituir por mutation na tabela de subscriptions
  const setPlan = useCallback((val) => {
    setPlanState(val)
  }, [])

  // ── Valor exposto pelo contexto ──
  const value = {
    habits, history, theme, soundOn, plan,
    toggleHabit, saveHabit, addHabit, deleteHabit, resetDay,
    toggleTheme, setTheme, setSoundOn, setPlan,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// ══════════════════════════════════════
// HOOK DE ACESSO
// Lança erro descritivo se usado fora
// do AppProvider — facilita debugging.
// ══════════════════════════════════════
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>')
  return ctx
}

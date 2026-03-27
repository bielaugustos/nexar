// ══════════════════════════════════════
// CONTEXTO GLOBAL — AppContext
//
// Estado central da aplicação:
//   • habits   — lista de hábitos (com migração de versão)
//   • history  — histórico diário de conclusões
//   • theme    — tema de cores ativo
//   • soundOn  — preferência de som
//   • plan     — plano do usuário ('free' | 'pro')
//
// Persistência: localStorage ("nex_*") + Supabase em background.
// Reset automático de hábitos: todos os dias à meia-noite (fuso local).
// ══════════════════════════════════════
import {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react'
import { loadStorage, saveStorage } from '../services/storage'
import { applyTheme, initTheme }    from '../services/themes'
import { useAuth }                  from './AuthContext'
import { upsertRows, fetchRows, deleteRow } from '../services/supabase'

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

  // ── Auth — sync em background quando logado ──
  const { isLoggedIn, user, profile } = useAuth()
  const userId = user?.id ?? null

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

  // Sincroniza plano com o perfil Supabase quando o profile carrega
  useEffect(() => {
    if (profile?.plan) {
      setPlanState(profile.plan)
      saveStorage('nex_plan', profile.plan)
    }
  }, [profile?.plan]) // eslint-disable-line react-hooks/exhaustive-deps

  // Carrega hábitos e histórico do Supabase quando o usuário loga
  useEffect(() => {
    if (!isLoggedIn || !userId) return

    async function loadFromDB() {
      const { data: habitsData } = await fetchRows('habits', userId)
      if (habitsData?.length > 0) {
        const migrated = migrateHabits(habitsData)
        setHabits(migrated)
        saveStorage('nex_habits', migrated)
      }

      const { data: histRows } = await fetchRows('habit_history', userId)
      if (histRows?.length > 0) {
        const histObj = Object.fromEntries(
          histRows.map(r => [r.date, {
            done:   r.done,
            total:  r.total,
            habits: r.habits ?? {},
          }])
        )
        setHistory(histObj)
        saveStorage('nex_history', histObj)
      }
    }

    loadFromDB()
  }, [isLoggedIn, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sincroniza histórico com Supabase em background sempre que mudar
  useEffect(() => {
    if (!isLoggedIn || !userId) return
    const entries = Object.entries(history)
    if (entries.length === 0) return

    const rows = entries.map(([date, val]) => ({
      user_id: userId,
      date,
      done:   val.done   ?? 0,
      total:  val.total  ?? 0,
      habits: val.habits ?? {},
    }))

    upsertRows('habit_history', rows, { onConflict: 'user_id,date' })
      .catch(e => console.warn('[Sync] history:', e))
  }, [history, isLoggedIn, userId]) // eslint-disable-line react-hooks/exhaustive-deps

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
  //
  // Lógica inteligente:
  // - Reseta done=false em todos os hábitos
  // - Para usuários Pro: deleta hábitos únicos (não repetem amanhã)
  // - Para Free: mantém comportamento atual
  const midnightTimer = useRef(null)

  useEffect(() => {
    function agendarProximoReset() {
      const agora     = new Date()
      const proxima   = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1, 0, 0, 1)
      const msRestantes = proxima - agora

      midnightTimer.current = setTimeout(() => {
        // Calcula o dia de semana de amanhã (0=Dom, 6=Sáb)
        const amanha = new Date()
        amanha.setDate(amanha.getDate() + 1)
        const tomorrowDow = amanha.getDay()

        setHabits(prev => {
          // Para Pro: identifica hábitos únicos (não repetem amanhã)
          // Um hábito é "único" se seus days NÃO incluem o dia de amanhã
          const isPro = plan === 'pro'

          // Primeiro: reseta todos para done=false
          let updated = prev.map(h => ({ ...h, done: false }))

          // Segundo: para Pro, deleta hábitos únicos que foram concluídos
          if (isPro) {
            const uniqueDoneHabits = prev.filter(h =>
              h.done &&                          // foi concluído hoje
              (
                (Array.isArray(h.days) && h.days.length === 0) ||  // não repete (days vazio)
                (!Array.isArray(h.days) || !h.days.includes(tomorrowDow))  // NÃO repete amanhã
              )
            )

            if (uniqueDoneHabits.length > 0) {
              // Salva no histórico antes de deletar
              const today = todayStr()
              const newHistory = { ...history }
              uniqueDoneHabits.forEach(h => {
                if (!newHistory[today]) {
                  newHistory[today] = { done: 0, total: 0, habits: {} }
                }
                newHistory[today].habits[h.id] = true
              })
              setHistory(newHistory)
              saveStorage('nex_history', newHistory)

              // Remove hábitos únicos da lista
              const idsToDelete = new Set(uniqueDoneHabits.map(h => h.id))
              updated = updated.filter(h => !idsToDelete.has(h.id))
            }
          }

          return updated
        })

        saveStorage('nex_last_reset', todayStr())
        agendarProximoReset() // reagenda para a próxima noite
      }, msRestantes)
    }

    agendarProximoReset()
    return () => clearTimeout(midnightTimer.current)
  }, [plan, history]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ações — useCallback para identidade estável entre renders ──

  // Alterna o estado done de um hábito pelo id
  const toggleHabit = useCallback((id) => {
    setHabits(prev => {
      const updated = prev.map(h => h.id === id ? { ...h, done: !h.done } : h)
      if (isLoggedIn && userId) {
        const habit = updated.find(h => h.id === id)
        if (habit) {
          upsertRows('habits', [{ ...habit, user_id: userId }])
            .catch(e => console.warn('[Sync] toggleHabit:', e))
        }
      }
      return updated
    })
  }, [isLoggedIn, userId])

  // Cria ou atualiza um hábito (upsert por id)
  const saveHabit = useCallback((updated) => {
    const safe = migrateHabits([updated])[0]
    setHabits(prev => {
      const list = prev.some(h => h.id === safe.id)
        ? prev.map(h => h.id === safe.id ? safe : h)
        : [...prev, safe]
      if (isLoggedIn && userId) {
        upsertRows('habits', [{ ...safe, user_id: userId }])
          .catch(e => console.warn('[Sync] saveHabit:', e))
      }
      return list
    })
  }, [isLoggedIn, userId])

  // Adiciona um novo hábito (gera id por timestamp)
  const addHabit = useCallback((habit) => {
    const safe = migrateHabits([habit])[0]
    setHabits(prev => {
      const updated = [...prev, safe]
      if (isLoggedIn && userId) {
        upsertRows('habits', [{ ...safe, user_id: userId }])
          .catch(e => console.warn('[Sync] addHabit:', e))
      }
      return updated
    })
  }, [isLoggedIn, userId])

  // Remove permanentemente um hábito pelo id
  const deleteHabit = useCallback((id) => {
    setHabits(prev => {
      const updated = prev.filter(h => h.id !== id)
      if (isLoggedIn && userId) {
        deleteRow('habits', id, userId)
          .catch(e => console.warn('[Sync] deleteHabit:', e))
      }
      return updated
    })
  }, [isLoggedIn, userId])

  // Reseta manualmente o dia (sem esperar meia-noite)
  const resetDay = useCallback(() => {
    setHabits(prev => prev.map(h => ({ ...h, done: false })))
    saveStorage('nex_last_reset', todayStr())
  }, [])

  // Define o tema pelo id (ex: 'dark', 'glass', 'sakura')
  const setTheme = useCallback((id) => { setThemeState(id) }, [])

  // Alterna entre claro e escuro (atalho rápido)
  const toggleTheme = useCallback(() => {
    setThemeState(t => t === 'dark' ? 'light' : 'dark')
  }, [])

  // Atualiza preferência de som
  const setSoundOn = useCallback((val) => { setSoundOnSt(val) }, [])

  // Define o plano do usuário ('free' | 'pro')
  const setPlan = useCallback((val) => { setPlanState(val) }, [])

  // ── Valor exposto pelo contexto ──
  const value = {
    habits, history, theme, soundOn, plan,
    toggleHabit, saveHabit, addHabit, deleteHabit, resetDay,
    toggleTheme, setTheme, setSoundOn, setPlan,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// ── Hook de acesso ──
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>')
  return ctx
}

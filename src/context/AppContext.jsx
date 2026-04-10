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
import { upsertRows, fetchRows, deleteRow, updateProfilePoints } from '../services/supabase'
import { analytics }                from '../services/analytics'

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
    id: h.id ?? Date.now(),
    name: h.name ?? 'Hábito',
    icon: h.icon ?? 'PiStarBold',
    done: h.done ?? false,
    pts: h.pts ?? 20,
    priority: h.priority ?? 'media',
    freq: h.freq ?? 'diario',
    days: Array.isArray(h.days) ? h.days : [0,1,2,3,4,5,6],
    archived: h.archived ?? false,
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
// ══════════════════════════════════════════════════════════
export function AppProvider({ children }) {

  // ── Estado para loading enquanto carrega do DB
  const [isLoadingFromDB, setIsLoadingFromDB] = useState(false)

  // ── Estado inicial: hábitos com auto-reset de dia
  // Só carrega do localStorage se NÃO estiver carregando do DB
  const [habits, setHabits] = useState(() => {
    // Se veio de um logout+login, o localStorage foi limpo
    // Usa valores padrões mas não faz reset automático aqui
    const raw = migrateHabits(loadStorage('nex_habits', DEFAULT_HABITS))
    return raw
  })

  const [history, setHistory] = useState(() => loadStorage('nex_history', {}))
  const [theme, setThemeState] = useState(() => initTheme())
  const [soundOn, setSoundOnSt] = useState(() => loadStorage('nex_sound', true))
  const [plan, setPlanState] = useState(() => loadStorage('nex_plan', 'free'))

  // ── Auth — sync em background quando logado ──
  const { isLoggedIn, user, profile, session } = useAuth()
  const userId = user?.id ?? null

  // ── Estado para indicar que dados foram carregados do DB
  const [loadedFromDB, setLoadedFromDB] = useState(false)

  // ── Sincroniza plano com o perfil Supabase quando o profile carrega
  useEffect(() => {
    if (profile?.plan) {
      setPlanState(profile.plan)
      saveStorage('nex_plan', profile.plan)
      window.dispatchEvent(new Event('nex_plan_changed'))
    }
  }, [profile?.plan])

  // ── Efeitos de persistência e sincronização ──

  // Aplica o tema no <html> sempre que mudar
  useEffect(() => { applyTheme(theme) }, [theme])

  // Persiste preferência de som
  useEffect(() => { saveStorage('nex_sound', soundOn) }, [soundOn])

  // Persiste plano e notifica outros componentes
  useEffect(() => {
    saveStorage('nex_plan', plan)
    window.dispatchEvent(new Event('nex_plan_changed'))
  }, [plan])

  // Carrega hábitos e histórico do Supabase quando o usuário loga
  useEffect(() => {
    if (!isLoggedIn || !userId) return
    
    const userEnteredWithPassword = !!session?.user
    if (!userEnteredWithPassword) return

    setIsLoadingFromDB(true)
    
    async function loadFromDB() {
      try {
        // Primeiro carrega o history do Supabase
        const { data: histRows } = await fetchRows('habit_history', userId)
        let histObj = {}
        if (histRows?.length > 0) {
          histObj = Object.fromEntries(
            histRows.map(r => [r.date, {
              done:   r.done,
              total:  r.total,
              habits: r.habits ?? {},
            }])
          )
          setHistory(histObj)
          saveStorage('nex_history', histObj)
        }

        // Depois carrega habits usando o history atualizado
        const { data: habitsData } = await fetchRows('habits', userId)
        if (habitsData?.length > 0) {
          const today = todayStr()
          const todayDone = histObj[today]?.habits || {}
          
          const migrated = migrateHabits(habitsData).map(h => ({
            ...h,
            done: todayDone[h.id] === true
          }))
          
          setHabits(migrated)
          saveStorage('nex_habits', migrated)
        }
        
        // Atualiza last_reset para hoje para evitar reset automático
        saveStorage('nex_last_reset', todayStr())
        
        setLoadedFromDB(true)
      } catch (e) {
        console.error('[AppContext] Erro ao carregar do DB:', e)
      } finally {
        setIsLoadingFromDB(false)
      }
    }

    loadFromDB()
  }, [isLoggedIn, userId, session])

  // Reset diário - só executa após carregar do DB
  useEffect(() => {
    if (isLoadingFromDB) return
    if (!loadedFromDB && isLoggedIn) return
    
    const lastReset = loadStorage('nex_last_reset', '')
    const today = todayStr()

    // Só reseta se já passou para um novo dia E já carregou os dados do DB
    if (lastReset !== today && loadedFromDB) {
      const reset = habits.map(h => ({ ...h, done: false }))
      setHabits(reset)
      saveStorage('nex_habits', reset)
      saveStorage('nex_last_reset', today)
    }
  }, [loadedFromDB, isLoadingFromDB, isLoggedIn, habits])

  // Sincroniza histórico com Supabase em background apenas quando usuário entrou com senha
  useEffect(() => {
    if (!isLoggedIn || !userId) return
    
    const userEnteredWithPassword = !!session?.user
    if (!userEnteredWithPassword) return
    
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
  }, [history, isLoggedIn, userId, session])

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
  }, [habits])

  // ── Reset automático à meia-noite (fuso local) ──
  const midnightTimer = useRef(null)

  useEffect(() => {
    function agendarProximoReset() {
      const agora     = new Date()
      const proxima   = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1, 0, 0, 1)
      const msRestantes = proxima - agora

      midnightTimer.current = setTimeout(() => {
        const amanha = new Date()
        amanha.setDate(amanha.getDate() + 1)
        const tomorrowDow = amanha.getDay()

        setHabits(prev => {
          const isPro = plan === 'pro'
          let updated = prev.map(h => ({ ...h, done: false }))

          if (isPro) {
            const uniqueDoneHabits = prev.filter(h =>
              h.done &&
              (
                (Array.isArray(h.days) && h.days.length === 0) ||
                (!Array.isArray(h.days) || !h.days.includes(tomorrowDow))
              )
            )

            if (uniqueDoneHabits.length > 0) {
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

              const idsToDelete = new Set(uniqueDoneHabits.map(h => h.id))
              updated = updated.filter(h => !idsToDelete.has(h.id))
            }
          }

          return updated
        })

        saveStorage('nex_last_reset', todayStr())
        agendarProximoReset()
      }, msRestantes)
    }

    agendarProximoReset()
    return () => clearTimeout(midnightTimer.current)
  }, [plan, history])

  // ── Ações — useCallback para identidade estável entre renders ──

  // Alterna o estado done de um hábito pelo id
  const toggleHabit = useCallback((id) => {
    setHabits(prev => {
      const updated = prev.map(h => h.id === id ? { ...h, done: !h.done } : h)
      
      if (isLoggedIn && userId) {
        const habit = updated.find(h => h.id === id)
        if (habit) {
          const habitToSync = { ...habit, user_id: userId }
          upsertRows('habits', [habitToSync])
            .catch(e => console.warn('[Sync] toggleHabit:', e))
          
          // Sincroniza o history imediatamente
          const today = todayStr()
          const habMap = {}
          updated.forEach(h => { if (h.done) habMap[h.id] = true })
          const historyRow = {
            user_id: userId,
            date: today,
            done: updated.filter(h => h.done).length,
            total: updated.length,
            habits: habMap,
          }
          upsertRows('habit_history', [historyRow], { onConflict: 'user_id,date' })
            .catch(e => console.warn('[Sync] toggleHabit history:', e))
          
          analytics.track('habit_toggled', {
            habit_id: id,
            habit_name: habit.name,
            done: !habit.done,
          })
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
        analytics.track('habit_saved', {
          habit_id: safe.id,
          habit_name: safe.name,
          is_new: !prev.some(h => h.id === safe.id),
        })
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
        analytics.track('habit_created', {
          habit_id: safe.id,
          habit_name: safe.name,
          priority: safe.priority,
          freq: safe.freq,
        })
      }
      return updated
    })
  }, [isLoggedIn, userId])

  // Remove permanentemente um hábito pelo id
  const deleteHabit = useCallback((id) => {
    setHabits(prev => {
      const habit = prev.find(h => h.id === id)
      const updated = prev.filter(h => h.id !== id)
      if (isLoggedIn && userId) {
        deleteRow('habits', id, userId)
          .catch(e => console.warn('[Sync] deleteHabit:', e))
        if (habit) {
          analytics.track('habit_deleted', {
            habit_id: id,
            habit_name: habit.name,
          })
        }
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
  const setTheme = useCallback((id) => {
    setThemeState(id)
    analytics.track('theme_changed', { theme_id: id })
  }, [])

  // Alterna entre claro e escuro (atalho rápido)
  const toggleTheme = useCallback(() => {
    setThemeState(t => t === 'dark' ? 'light' : 'dark')
  }, [])

  // Atualiza preferência de som
  const setSoundOn = useCallback((val) => { setSoundOnSt(val) }, [])

  // Define o plano do usuário ('free' | 'pro')
  const setPlan = useCallback((val) => {
    setPlanState(val)
    analytics.track('plan_changed', { plan: val })
  }, [])

  // ── Sincronização de pontos com o perfil ──
  // Usa useRef para evitar chamadas duplicadas
  const lastSyncedPoints = useRef(null)
  
  useEffect(() => {
    if (!isLoggedIn || !userId) return

    const todayKey = new Date().toISOString().slice(0, 10)
    const avgPtsPerHabit = habits.length > 0
      ? Math.round(habits.reduce((a, h) => a + (h.pts ?? 15), 0) / habits.length)
      : 15

    const pontosPasados = Object.entries(history)
      .filter(([date]) => date !== todayKey)
      .reduce((acc, [, registro]) => {
        return acc + ((registro?.done ?? 0) * avgPtsPerHabit)
      }, 0)

    const todayDow = new Date().getDay()
    const todayHabits = habits.filter(h => Array.isArray(h.days) && h.days.includes(todayDow))
    
    const pontosHoje = todayHabits
      .filter(h => h.done)
      .reduce((acc, h) => acc + (h.pts ?? 0), 0)

    const totalPoints = pontosPasados + pontosHoje

    // Evita chamadas duplicadas se os pontos não mudaram
    if (lastSyncedPoints.current === totalPoints) return
    
    lastSyncedPoints.current = totalPoints

    updateProfilePoints(userId, totalPoints, user?.email, profile?.username)
      .then(({ data }) => {
        window.dispatchEvent(new CustomEvent('profile-points-updated', { detail: { points: totalPoints } }))
      })
      .catch(e => console.warn('[Sync] updateProfilePoints:', e))
  }, [isLoggedIn, userId, habits, history, user?.email, profile?.username])

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

<environment_details>
# Visual Studio Code Visible Files
src/pages/Mentor.jsx

# Visual Studio Code Open Tabs
index.html
vite.config.js
src/pages/Profile.jsx
src/pages/Mentor.module.css
src/pages/Mentor.jsx

# Current Time
30/03/2026, 10:34:35 AM (America/Sao_Paulo, UTC-3:00)

# Context Window Usage
107.307 / 131K tokens used (82%)

# Current Mode
ACT MODE
</environment_details>
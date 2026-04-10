// src/services/supabase.js
// ══════════════════════════════════════════════════════
// IOROOT — Cliente Supabase
// Inicialização única compartilhada por todo o app.
// As chaves vêm das variáveis de ambiente do Vite —
// nunca hardcoded no código.
// ══════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn('[Rootio] Supabase não configurado — rodando em modo offline.')
}

export const supabase = (SUPABASE_URL && SUPABASE_ANON)
  ? createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        // Persiste a sessão no localStorage do dispositivo
        persistSession:    true,
        autoRefreshToken:  true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'Accept': 'application/json',
        },
      },
    })
  : null

// ── Auth helpers ───────────────────────────────────────

export async function signUp({ email, password, username, birthdate }) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase não configurado' } }
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, birthdate } },
  })
  
  // Cria o perfil automaticamente após o cadastro
  if (!error && data?.user) {
    try {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        username: username,
        birthdate: birthdate,
        plan: 'free',
        points: 0,
        avatar: '🌱',
      })
    } catch (e) {
      console.warn('[Supabase] Erro ao criar perfil:', e)
    }
  }
  
  return { data, error }
}

export async function signIn({ email, password }) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase não configurado' } }
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function resetPassword(email) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase não configurado' } }
  }
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}

export async function signOut() {
  // Primeiro: sincroniza dados locais para o Supabase
  const userId = (await getSession())?.user?.id
  
  if (userId && supabase) {
    try {
      const { loadStorage } = await import('./storage')
      
      // Habits
      const habits = loadStorage('nex_habits', [])
      if (habits.length > 0) {
        await supabase.from('habits').upsert(habits.map(h => ({ ...h, user_id: userId })))
      }
      
      // History
      const history = loadStorage('nex_history', {})
      const historyRows = Object.entries(history).map(([date, val]) => ({
        user_id: userId, date,
        done: val.done ?? 0, total: val.total ?? 0, habits: val.habits ?? {},
      }))
      if (historyRows.length > 0) {
        await supabase.from('habit_history').upsert(historyRows, { onConflict: 'user_id,date' })
      }
      
      // Transactions
      const transactions = loadStorage('nex_fin_transactions', [])
      if (transactions.length > 0) {
        await supabase.from('transactions').upsert(
          transactions.map(t => ({
            id: t.id, user_id: userId, type: t.type,
            amount: t.amount, description: t.desc,
            category: t.category, date: t.date,
          }))
        )
      }
      
      // Goals
      const goals = loadStorage('nex_fin_goals', [])
      if (goals.length > 0) {
        await supabase.from('financial_goals').upsert(goals.map(g => ({ ...g, user_id: userId })))
      }
      
      // Emergency
      const emergency = loadStorage('nex_fin_emergency', null)
      if (emergency) {
        await supabase.from('emergency_fund').upsert([{
          user_id: userId, target: emergency.target ?? 0, current: emergency.current ?? 0,
        }], { onConflict: 'user_id' })
      }
      
      // Life Projects
      const projects = loadStorage('nex_projects', [])
      if (projects.length > 0) {
        await supabase.from('life_projects').upsert(projects.map(p => ({ ...p, user_id: userId })))
      }
      
      // Journal
      const journal = loadStorage('nex_journal', [])
      if (journal.length > 0) {
        await supabase.from('journal').upsert(journal.map(j => ({ ...j, user_id: userId })))
      }
      
      console.log('[Sync] Dados sincronizados antes do logout')
    } catch (e) {
      console.warn('[Sync] Erro ao sincronizar antes do logout:', e)
    }
  }

  const APP_KEYS = [
    'nex_habits', 'nex_history', 'nex_last_reset',
    'nex_fin_transactions', 'nex_fin_goals', 'nex_fin_emergency',
    'nex_fin_income', 'nex_fin_monthgoal',
    'nex_career_readings', 'nex_career_goals', 'nex_career_projects',
    'nex_projects', 'nex_journal',
    'nex_cats_income', 'nex_cats_expense',
    'nex_fin_tx_decided', 'nex_fin_goal_decided',
    'nex_plan', 'nex_theme', 'nex_sound',
    'nex_username', 'nex_avatar',
    'ior_auth_skipped', 'ior_migration_done',
  ]
  APP_KEYS.forEach(key => localStorage.removeItem(key))

  if (supabase) {
    await supabase.auth.signOut()
  }

  // Redireciona para a tela inicial e força reload completo
  window.location.href = '/'
  window.location.reload()
}

export async function getSession() {
  if (!supabase) {
    return null
  }
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export function onAuthChange(callback) {
  if (!supabase) {
    // Supabase não configurado — retorna subscription vazia
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

// ── Profile ────────────────────────────────────────────

export async function getProfile(userId) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase não configurado' } }
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function updateProfile(userId, updates) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase não configurado' } }
  }
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

export async function updateEmail(newEmail) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase não configurado' } }
  }
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail
  })
  return { data, error }
}

export async function updatePassword(newPassword) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase não configurado' } }
  }
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  return { data, error }
}

// ── Pontos do perfil ──────────────────────────────────────

// Garante que o perfil existe antes de atualizar
async function ensureProfileExists(userId, email, username) {
  if (!supabase) {
    return false
  }
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (existing) return true
    
    // Cria o perfil se não existir
    await supabase.from('profiles').insert({
      id: userId,
      email: email || '',
      username: username || '',
      plan: 'free',
      points: 0,
      avatar: '🌱',
    })
    return true
  } catch (e) {
    console.warn('[Supabase] Erro ao garantir perfil:', e)
    return false
  }
}

export async function updateProfilePoints(userId, points, email = '', username = '') {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase não configurado' } }
  }
  // Garante que o perfil existe antes de atualizar
  await ensureProfileExists(userId, email, username)
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ points, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// ── Sync genérico ──────────────────────────────────────
// Usado pelo syncService para cada tabela

export async function upsertRows(table, rows, options = {}) {
  if (!supabase) {
    return { error: { message: 'Supabase não configurado' } }
  }
  const { error } = await supabase.from(table).upsert(rows, options)
  return { error }
}

export async function fetchRows(table, userId) {
  if (!supabase) {
    return { data: [], error: { message: 'Supabase não configurado' } }
  }

  // Tables sem coluna 'id' - apenas habit_history
  const noIdTables = ['habit_history']
  
  let query = supabase.from(table).select('*').eq('user_id', userId)
  
  // Só ordenar por 'date' se for habit_history
  // Para outras tabelas, não ordenar (deixa como veio do banco)
  if (table === 'habit_history') {
    query = query.order('date', { ascending: true })
  }
  
  const { data, error } = await query
  return { data: data ?? [], error }
}

export async function deleteRow(table, id, userId) {
  if (!supabase) {
    return { error: { message: 'Supabase não configurado' } }
  }
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  return { error }
}

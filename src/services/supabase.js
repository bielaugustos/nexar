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
  console.warn('[Ioroot] Supabase não configurado — rodando em modo offline.')
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, birthdate } },
  })
  return { data, error }
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}

export async function signOut() {
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

  await supabase.auth.signOut()

  // Redireciona para a tela inicial e força reload completo
  // Isso garante que o React Router não mantenha o estado da rota anterior
  window.location.href = '/'
  window.location.reload()
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

// ── Profile ────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

export async function updateEmail(newEmail) {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail
  })
  return { data, error }
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  return { data, error }
}

// ── Pontos do perfil ──────────────────────────────────────

export async function updateProfilePoints(userId, points) {
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
  const { error } = await supabase.from(table).upsert(rows, options)
  return { error }
}

export async function fetchRows(table, userId) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: true })
  return { data: data ?? [], error }
}

export async function deleteRow(table, id, userId) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  return { error }
}

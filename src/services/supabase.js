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
    })
  : null

// ── Auth helpers ───────────────────────────────────────

export async function signUp({ email, password, username }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
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

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
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

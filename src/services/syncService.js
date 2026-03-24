// src/services/syncService.js
// Sincronização e migração localStorage → Supabase

import { supabase, upsertRows, fetchRows } from './supabase'
import { loadStorage, saveStorage } from './storage'

const LOCAL_KEYS = {
  habits:          'nex_habits',
  history:         'nex_history',
  transactions:    'nex_fin_transactions',
  goals:           'nex_fin_goals',
  emergency:       'nex_fin_emergency',
  finConfig:       'nex_fin_config',
  careerReadings:  'nex_career_readings',
  careerGoals:     'nex_career_goals',
  careerProjects:  'nex_career_projects',
  lifeProjects:    'nex_projects',
  journal:         'nex_journal',
}

// Verifica se há dados locais relevantes
export function hasLocalData() {
  return Object.values(LOCAL_KEYS).some(key => {
    const val = localStorage.getItem(key)
    if (!val) return false
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed.length > 0
      if (typeof parsed === 'object') return Object.keys(parsed).length > 0
      return false
    } catch { return false }
  })
}

// Migra todos os dados locais para o Supabase
export async function migrateLocalToSupabase(userId) {
  const errors = []

  // Hábitos
  const habits = loadStorage('nex_habits', [])
  if (habits.length > 0) {
    const rows = habits.map(h => ({ ...h, user_id: userId }))
    const { error } = await upsertRows('habits', rows)
    if (error) errors.push('habits: ' + error.message)
  }

  // Histórico (objeto → array de linhas)
  const history = loadStorage('nex_history', {})
  const historyRows = Object.entries(history).map(([date, val]) => ({
    user_id: userId,
    date,
    done:   val.done   ?? 0,
    total:  val.total  ?? 0,
    habits: val.habits ?? {},
  }))
  if (historyRows.length > 0) {
    const { error } = await upsertRows('habit_history', historyRows, { onConflict: 'user_id,date' })
    if (error) errors.push('history: ' + error.message)
  }

  // Transações financeiras
  const transactions = loadStorage('nex_fin_transactions', [])
  if (transactions.length > 0) {
    const rows = transactions.map(t => ({
      id: t.id, user_id: userId, type: t.type,
      amount: t.amount, description: t.desc,
      category: t.category, date: t.date,
    }))
    const { error } = await upsertRows('transactions', rows)
    if (error) errors.push('transactions: ' + error.message)
  }

  // Metas financeiras
  const finGoals = loadStorage('nex_fin_goals', [])
  if (finGoals.length > 0) {
    const rows = finGoals.map(g => ({ ...g, user_id: userId }))
    const { error } = await upsertRows('financial_goals', rows)
    if (error) errors.push('financial_goals: ' + error.message)
  }

  // Reserva de emergência
  const emergency = loadStorage('nex_fin_emergency', null)
  if (emergency) {
    const { error } = await upsertRows('emergency_fund', [{
      user_id: userId, target: emergency.target ?? 0, current: emergency.current ?? 0
    }])
    if (error) errors.push('emergency: ' + error.message)
  }

  // Leituras de carreira
  const readings = loadStorage('nex_career_readings', [])
  if (readings.length > 0) {
    const rows = readings.map(r => ({ ...r, user_id: userId }))
    const { error } = await upsertRows('career_readings', rows)
    if (error) errors.push('career_readings: ' + error.message)
  }

  // Metas de carreira
  const careerGoals = loadStorage('nex_career_goals', [])
  if (careerGoals.length > 0) {
    const rows = careerGoals.map(g => ({ ...g, user_id: userId }))
    const { error } = await upsertRows('career_goals', rows)
    if (error) errors.push('career_goals: ' + error.message)
  }

  // Projetos de carreira
  const careerProjects = loadStorage('nex_career_projects', [])
  if (careerProjects.length > 0) {
    const rows = careerProjects.map(p => ({ ...p, user_id: userId }))
    const { error } = await upsertRows('career_projects', rows)
    if (error) errors.push('career_projects: ' + error.message)
  }

  // Projetos de vida
  const lifeProjects = loadStorage('nex_projects', [])
  if (lifeProjects.length > 0) {
    const rows = lifeProjects.map(p => ({ ...p, user_id: userId }))
    const { error } = await upsertRows('life_projects', rows)
    if (error) errors.push('life_projects: ' + error.message)
  }

  // Diário
  const journal = loadStorage('nex_journal', [])
  if (journal.length > 0) {
    const rows = journal.map(j => ({ ...j, user_id: userId }))
    const { error } = await upsertRows('journal', rows)
    if (error) errors.push('journal: ' + error.message)
  }

  return { success: errors.length === 0, errors }
}

// Aplica dados remotos no localStorage (sincronização nuvem → local após login)
export function applyRemoteData(data) {
  if (data.habits?.length)                           saveStorage('nex_habits',           data.habits)
  if (data.history && Object.keys(data.history).length > 0)
                                                     saveStorage('nex_history',          data.history)
  if (data.transactions?.length)                     saveStorage('nex_fin_transactions', data.transactions)
  if (data.financial_goals?.length)                  saveStorage('nex_fin_goals',        data.financial_goals)
  if (data.emergency)                                saveStorage('nex_fin_emergency',    data.emergency)
  if (data.career_readings?.length)                  saveStorage('nex_career_readings',  data.career_readings)
  if (data.career_goals?.length)                     saveStorage('nex_career_goals',     data.career_goals)
  if (data.career_projects?.length)                  saveStorage('nex_career_projects',  data.career_projects)
  if (data.life_projects?.length)                    saveStorage('nex_projects',         data.life_projects)
  if (data.journal?.length)                          saveStorage('nex_journal',          data.journal)
}

// Limpa todos os dados locais após migração confirmada
export function clearLocalData() {
  Object.values(LOCAL_KEYS).forEach(key => localStorage.removeItem(key))
  localStorage.removeItem('nex_last_reset')
  localStorage.removeItem('ior_auth_skipped')
}

// Carrega dados do Supabase para o estado local (usado no login)
export async function loadFromSupabase(userId) {
  const results = {}

  const tables = [
    { key: 'habits',          table: 'habits' },
    { key: 'career_readings', table: 'career_readings' },
    { key: 'career_goals',    table: 'career_goals' },
    { key: 'career_projects', table: 'career_projects' },
    { key: 'life_projects',   table: 'life_projects' },
    { key: 'transactions',    table: 'transactions' },
    { key: 'financial_goals', table: 'financial_goals' },
    { key: 'journal',         table: 'journal' },
  ]

  for (const { key, table } of tables) {
    const { data } = await fetchRows(table, userId)
    results[key] = data
  }

  // Histórico — converte array de linhas de volta para objeto
  const { data: histRows } = await fetchRows('habit_history', userId)
  results.history = Object.fromEntries(
    (histRows ?? []).map(r => [r.date, {
      done: r.done, total: r.total, habits: r.habits
    }])
  )

  // Reserva de emergência — linha única
  const { data: emFund } = await supabase
    .from('emergency_fund')
    .select('*')
    .eq('user_id', userId)
    .single()
  results.emergency = emFund ?? null

  return results
}

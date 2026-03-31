// src/services/syncService.js
// ══════════════════════════════════════
// Sincronização bidirecional: IndexedDB ↔ Supabase.
//
// Funções exportadas:
//   hasLocalData()           — detecta dados locais
//   migrateLocalToSupabase() — sobe dados locais para a nuvem
//   applyRemoteData()        — aplica dados da nuvem no IndexedDB
//   clearLocalData()         — limpa IndexedDB após migração
//   loadFromSupabase()       — carrega todos os dados do Supabase
// ══════════════════════════════════════
import { supabase, upsertRows, fetchRows } from './supabase'
import { loadStorage, saveStorage } from './storage'

// ── Mapeamento de chaves IndexedDB ──
const LOCAL_KEYS = {
  habits:         'nex_habits',
  history:        'nex_history',
  transactions:   'nex_fin_transactions',
  goals:          'nex_fin_goals',
  emergency:      'nex_fin_emergency',
  finConfig:      'nex_fin_config',
  careerReadings: 'nex_career_readings',
  careerGoals:    'nex_career_goals',
  careerProjects: 'nex_career_projects',
  lifeProjects:   'nex_projects',
  journal:        'nex_journal',
}

// ── Detecção de dados locais ──

export function hasLocalData() {
  return Object.values(LOCAL_KEYS).some(key => {
    const val = localStorage.getItem(key)
    if (!val) return false
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed))        return parsed.length > 0
      if (typeof parsed === 'object')   return Object.keys(parsed).length > 0
      return false
    } catch { return false }
  })
}

// ── Resumo de dados locais para consentimento (LGPD) ──

export function getDataSummary() {
  const habits = loadStorage('nex_habits', [])
  const history = loadStorage('nex_history', {})
  const transactions = loadStorage('nex_fin_transactions', [])
  const goals = loadStorage('nex_fin_goals', [])
  const readings = loadStorage('nex_career_readings', [])
  const careerProjects = loadStorage('nex_career_projects', [])
  const lifeProjects = loadStorage('nex_projects', [])
  const journal = loadStorage('nex_journal', [])

  return {
    habits: habits.length,
    history: Object.keys(history).length,
    transactions: transactions.length,
    goals: goals.length,
    readings: readings.length,
    projects: careerProjects.length + lifeProjects.length,
    journal: journal.length,
  }
}

// ── Migração IndexedDB → Supabase ──

export async function migrateLocalToSupabase(userId) {
  const errors = []

  async function upsert(table, rows, options) {
    if (!rows?.length) return
    const { error } = await upsertRows(table, rows, options)
    if (error) errors.push(`${table}: ${error.message}`)
  }

  // Hábitos
  const habits = loadStorage('nex_habits', [])
  await upsert('habits', habits.map(h => ({ ...h, user_id: userId })))

  // Histórico (objeto → array de linhas)
  const history    = loadStorage('nex_history', {})
  const historyRows = Object.entries(history).map(([date, val]) => ({
    user_id: userId, date,
    done: val.done ?? 0, total: val.total ?? 0, habits: val.habits ?? {},
  }))
  await upsert('habit_history', historyRows, { onConflict: 'user_id,date' })

  // Transações financeiras
  const transactions = loadStorage('nex_fin_transactions', [])
  await upsert('transactions', transactions.map(t => ({
    id: t.id, user_id: userId, type: t.type,
    amount: t.amount, description: t.desc,
    category: t.category, date: t.date,
  })))

  // Metas financeiras
  const finGoals = loadStorage('nex_fin_goals', [])
  await upsert('financial_goals', finGoals.map(g => ({ ...g, user_id: userId })))

  // Reserva de emergência (tabela com unique constraint em user_id)
  const emergency = loadStorage('nex_fin_emergency', null)
  if (emergency) {
    await upsert('emergency_fund', [{
      user_id: userId, target: emergency.target ?? 0, current: emergency.current ?? 0,
    }], { onConflict: 'user_id' })
  }

  // Carreira
  const readings      = loadStorage('nex_career_readings',  [])
  const careerGoals   = loadStorage('nex_career_goals',     [])
  const careerProjects = loadStorage('nex_career_projects', [])
  await upsert('career_readings',  readings.map(r      => ({ ...r, user_id: userId })))
  await upsert('career_goals',     careerGoals.map(g   => ({ ...g, user_id: userId })))
  await upsert('career_projects',  careerProjects.map(p => ({ ...p, user_id: userId })))

  // Projetos de vida
  const lifeProjects = loadStorage('nex_projects', [])
  await upsert('life_projects', lifeProjects.map(p => ({ ...p, user_id: userId })))

  // Diário
  const journal = loadStorage('nex_journal', [])
  await upsert('journal', journal.map(j => ({ ...j, user_id: userId })))

  return { success: errors.length === 0, errors }
}

// ── Merge de history preservando maior streak ──
// Compara timestamps e mantém dados mais completos
// Evita perda de streak ao sincronizar entre dispositivos
function mergeHistoryPreservingStreak(localHistory, remoteHistory) {
  const merged = { ...localHistory }
  
  for (const [date, remoteData] of Object.entries(remoteHistory)) {
    const localData = merged[date]
    
    if (!localData) {
      // Remoto tem dados que local não tem
      merged[date] = remoteData
    } else {
      // Merge inteligente: mantém dados mais completos
      const localDone = localData.done || 0
      const remoteDone = remoteData.done || 0
      
      if (remoteDone > localDone) {
        // Remoto tem mais conclusões
        merged[date] = remoteData
      } else if (remoteDone === localDone && remoteData.habits) {
        // Mesmo número de conclusões, merge dos hábitos
        merged[date] = {
          ...localData,
          habits: { ...localData.habits, ...remoteData.habits }
        }
      }
      // Se local tem mais conclusões, mantém local
    }
  }
  
  return merged
}

// ── Aplicar dados remotos no IndexedDB ──
// Usa merge inteligente para history (preserva streak)
export function applyRemoteData(data) {
  if (data.habits?.length) {
    saveStorage('nex_habits', data.habits)
  }
  
  if (data.history && Object.keys(data.history).length > 0) {
    // Usa merge preservando streak
    const localHistory = loadStorage('nex_history', {})
    const mergedHistory = mergeHistoryPreservingStreak(localHistory, data.history)
    saveStorage('nex_history', mergedHistory)
  }
  
  if (data.transactions?.length) {
    saveStorage('nex_fin_transactions', data.transactions)
  }
  
  if (data.financial_goals?.length) {
    saveStorage('nex_fin_goals', data.financial_goals)
  }
  
  if (data.emergency) {
    saveStorage('nex_fin_emergency', data.emergency)
  }
  
  if (data.career_readings?.length) {
    saveStorage('nex_career_readings', data.career_readings)
  }
  
  if (data.career_goals?.length) {
    saveStorage('nex_career_goals', data.career_goals)
  }
  
  if (data.career_projects?.length) {
    saveStorage('nex_career_projects', data.career_projects)
  }
  
  if (data.life_projects?.length) {
    saveStorage('nex_projects', data.life_projects)
  }
  
  if (data.journal?.length) {
    saveStorage('nex_journal', data.journal)
  }
}

// ── Limpeza após migração confirmada ──

export function clearLocalData() {
  Object.values(LOCAL_KEYS).forEach(key => localStorage.removeItem(key))
  localStorage.removeItem('nex_last_reset')
  localStorage.removeItem('ior_auth_skipped')
}

// ── Carrega todos os dados do Supabase ──

export async function loadFromSupabase(userId) {
  const results = {}

  const tables = [
    { key: 'habits',          table: 'habits'          },
    { key: 'career_readings', table: 'career_readings' },
    { key: 'career_goals',    table: 'career_goals'    },
    { key: 'career_projects', table: 'career_projects' },
    { key: 'life_projects',   table: 'life_projects'   },
    { key: 'transactions',    table: 'transactions'    },
    { key: 'financial_goals', table: 'financial_goals' },
    { key: 'journal',         table: 'journal'         },
  ]

  for (const { key, table } of tables) {
    const { data } = await fetchRows(table, userId)
    results[key] = data
  }

  // Histórico — array de linhas → objeto indexado por data
  const { data: histRows } = await fetchRows('habit_history', userId)
  results.history = Object.fromEntries(
    (histRows ?? []).map(r => [r.date, { done: r.done, total: r.total, habits: r.habits }])
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

// ── Apagar todos os dados do Supabase (LGPD) ──

export async function clearCloudData(userId) {
  const errors = []

  const tables = [
    'habits', 'habit_history', 'transactions', 'financial_goals',
    'emergency_fund', 'career_readings', 'career_goals',
    'career_projects', 'life_projects', 'journal'
  ]

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId)
    if (error) errors.push(`${table}: ${error.message}`)
  }

  return { success: errors.length === 0, errors }
}

// ── Apagar TUDO (local + nuvem) - LGPD ──

export async function deleteAllData(userId) {
  const cloudResult = await clearCloudData(userId)
  clearLocalData()
  return cloudResult
}

// ══════════════════════════════════════════════════════
// DETECÇÃO DE CONFLITOS
// ══════════════════════════════════════════════════════

// ── Obtém o timestamp de dados locais ──
function getLocalTimestamp(data) {
  if (!data) return null
  
  // Se for um array, retorna o timestamp mais recente
  if (Array.isArray(data)) {
    if (data.length === 0) return null
    const timestamps = data
      .map(item => item.last_updated || item.updated_at || item.createdAt || null)
      .filter(Boolean)
    return timestamps.length > 0 ? Math.max(...timestamps) : null
  }
  
  // Se for um objeto, retorna o timestamp mais recente
  if (typeof data === 'object') {
    const values = Object.values(data)
    if (values.length === 0) return null
    const timestamps = values
      .map(val => val.last_updated || val.updated_at || val.createdAt || null)
      .filter(Boolean)
    return timestamps.length > 0 ? Math.max(...timestamps) : null
  }
  
  return null
}

// ── Obtém o timestamp de dados remotos ──
function getRemoteTimestamp(data) {
  if (!data) return null
  
  // Se for um array, retorna o timestamp mais recente
  if (Array.isArray(data)) {
    if (data.length === 0) return null
    const timestamps = data
      .map(item => item.last_updated || item.updated_at || item.createdAt || null)
      .filter(Boolean)
    return timestamps.length > 0 ? Math.max(...timestamps) : null
  }
  
  // Se for um objeto, retorna o timestamp mais recente
  if (typeof data === 'object') {
    const values = Object.values(data)
    if (values.length === 0) return null
    const timestamps = values
      .map(val => val.last_updated || val.updated_at || val.createdAt || null)
      .filter(Boolean)
    return timestamps.length > 0 ? Math.max(...timestamps) : null
  }
  
  return null
}

// ── Detecta conflitos entre dados locais e remotos ──
export async function detectConflicts(localData, remoteData) {
  const conflicts = []
  
  // Tipos de dados para verificar
  const dataTypes = [
    { type: 'habits', localKey: 'nex_habits', remoteKey: 'habits' },
    { type: 'history', localKey: 'nex_history', remoteKey: 'history' },
    { type: 'transactions', localKey: 'nex_fin_transactions', remoteKey: 'transactions' },
    { type: 'journal', localKey: 'nex_journal', remoteKey: 'journal' },
    { type: 'career_readings', localKey: 'nex_career_readings', remoteKey: 'career_readings' },
    { type: 'life_projects', localKey: 'nex_projects', remoteKey: 'life_projects' },
    { type: 'fin_goals', localKey: 'nex_fin_goals', remoteKey: 'financial_goals' },
    { type: 'fin_config', localKey: 'nex_fin_config', remoteKey: 'fin_config' },
    { type: 'fin_emergency', localKey: 'nex_fin_emergency', remoteKey: 'emergency' },
  ]
  
  for (const { type, localKey, remoteKey } of dataTypes) {
    const local = localData[localKey] !== undefined ? localData[localKey] : loadStorage(localKey, null)
    const remote = remoteData[remoteKey]
    
    // Se não há dados em nenhum dos lados, não há conflito
    if (!local && !remote) continue
    
    // Se há dados apenas em um lado, não há conflito (apenas dados novos)
    if (!local || !remote) continue
    
    // Calcula timestamps
    const localTimestamp = getLocalTimestamp(local)
    const remoteTimestamp = getRemoteTimestamp(remote)
    
    // Se não há timestamps em nenhum lado, considera como conflito
    if (!localTimestamp && !remoteTimestamp) {
      conflicts.push({
        type,
        local,
        remote,
        localTimestamp: null,
        remoteTimestamp: null,
      })
      continue
    }
    
    // Se há timestamps diferentes, há um conflito
    // Consideramos conflito se a diferença for menor que 1 minuto (pode ser edição simultânea)
    const timeDiff = Math.abs(localTimestamp - remoteTimestamp)
    if (timeDiff < 60000) { // 1 minuto em milissegundos
      conflicts.push({
        type,
        local,
        remote,
        localTimestamp,
        remoteTimestamp,
      })
    }
  }
  
  return conflicts
}

// ── Aplica as resoluções escolhidas pelo usuário ──
export function applyResolutions(resolutions, localData, remoteData) {
  const result = { ...localData }
  
  for (const [type, resolution] of Object.entries(resolutions)) {
    // Mapeia o tipo para as chaves corretas
    const keyMap = {
      habits: { local: 'nex_habits', remote: 'habits' },
      history: { local: 'nex_history', remote: 'history' },
      transactions: { local: 'nex_fin_transactions', remote: 'transactions' },
      journal: { local: 'nex_journal', remote: 'journal' },
      career_readings: { local: 'nex_career_readings', remote: 'career_readings' },
      life_projects: { local: 'nex_projects', remote: 'life_projects' },
      fin_goals: { local: 'nex_fin_goals', remote: 'financial_goals' },
      fin_config: { local: 'nex_fin_config', remote: 'fin_config' },
      fin_emergency: { local: 'nex_fin_emergency', remote: 'emergency' },
    }
    
    const keys = keyMap[type]
    if (!keys) continue
    
    if (resolution === 'local') {
      // Mantém dados locais
      result[keys.local] = localData[keys.local]
    } else if (resolution === 'remote') {
      // Mantém dados remotos
      result[keys.remote] = remoteData[keys.remote]
      // Atualiza localStorage com dados remotos
      saveStorage(keys.local, remoteData[keys.remote])
    }
  }
  
  return result
}

// ── Carrega todos os dados locais ──
export function loadAllLocalData() {
  return {
    'nex_habits': loadStorage('nex_habits', []),
    'nex_history': loadStorage('nex_history', {}),
    'nex_fin_transactions': loadStorage('nex_fin_transactions', []),
    'nex_fin_goals': loadStorage('nex_fin_goals', []),
    'nex_fin_config': loadStorage('nex_fin_config', null),
    'nex_fin_emergency': loadStorage('nex_fin_emergency', null),
    'nex_career_readings': loadStorage('nex_career_readings', []),
    'nex_career_goals': loadStorage('nex_career_goals', []),
    'nex_career_projects': loadStorage('nex_career_projects', []),
    'nex_projects': loadStorage('nex_projects', []),
    'nex_journal': loadStorage('nex_journal', []),
  }
}

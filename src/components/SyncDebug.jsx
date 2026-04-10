import { useState, useEffect } from 'react'
import { loadStorage } from '../services/storage'
import { supabase, fetchRows, getProfile, upsertRows } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

const STORAGE_KEYS = {
  habits: 'nex_habits',
  history: 'nex_history',
  transactions: 'nex_fin_transactions',
  goals: 'nex_fin_goals',
  emergency: 'nex_fin_emergency',
  income: 'nex_fin_income',
  monthGoal: 'nex_fin_monthgoal',
  careerReadings: 'nex_career_readings',
  careerGoals: 'nex_career_goals',
  careerProjects: 'nex_career_projects',
  lifeProjects: 'nex_projects',
  journal: 'nex_journal',
}

const TABLES = {
  profile: 'profiles',
  habits: 'habits',
  history: 'habit_history',
  transactions: 'transactions',
  goals: 'financial_goals',
  emergency: 'emergency_fund',
  config: 'finance_config',
  careerReadings: 'career_readings',
  careerGoals: 'career_goals',
  careerProjects: 'career_projects',
  lifeProjects: 'life_projects',
  journal: 'journal',
}

export default function SyncDebug() {
  const { user, profile, isLoggedIn } = useAuth()
  const [localData, setLocalData] = useState({})
  const [remoteData, setRemoteData] = useState({})
  const [remoteErrors, setRemoteErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [activeTab, setActiveTab] = useState('local')
  const [syncMessage, setSyncMessage] = useState('')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'não configurado'

  useEffect(() => {
    refreshLocalData()
  }, [])

  function refreshLocalData() {
    const data = {}
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      data[key] = loadStorage(storageKey, key.includes('history') ? {} : [])
    }
    setLocalData(data)
  }

  async function syncLocalToRemote() {
    if (!user?.id) return
    setSyncing(true)
    setSyncMessage('Sincronizando...')

    try {
      const results = []

      // Habits
      const habits = loadStorage('nex_habits', [])
      if (habits.length > 0) {
        const rows = habits.map(h => ({ 
          id: h.id, user_id: user.id, 
          name: h.name, icon: h.icon, done: h.done, 
          pts: h.pts, priority: h.priority, freq: h.freq, 
          days: h.days, archived: h.archived 
        }))
        const { error } = await upsertRows('habits', rows)
        results.push(`habits: ${error ? error.message : 'OK'}`)
      }

      // History
      const history = loadStorage('nex_history', {})
      if (Object.keys(history).length > 0) {
        const historyRows = Object.entries(history).map(([date, val]) => ({
          user_id: user.id, date,
          done: val.done ?? 0, total: val.total ?? 0, habits: val.habits ?? {},
        }))
        const { error } = await upsertRows('habit_history', historyRows, { onConflict: 'user_id,date' })
        results.push(`habit_history: ${error ? error.message : 'OK'}`)
      }

      // Transactions
      const transactions = loadStorage('nex_fin_transactions', [])
      if (transactions.length > 0) {
        const rows = transactions.map(t => ({
          id: t.id || String(Date.now()), user_id: user.id, 
          type: t.type, amount: t.amount, 
          description: t.desc, category: t.category, date: t.date,
        }))
        const { error } = await upsertRows('transactions', rows)
        results.push(`transactions: ${error ? error.message : 'OK'}`)
      }

      // Goals (financial_goals)
      const goals = loadStorage('nex_fin_goals', [])
      if (goals.length > 0) {
        const rows = goals.map(g => ({
          id: g.id, user_id: user.id,
          name: g.name, target: g.target, current: g.current,
          icon: g.icon, deadline: g.deadline,
          saved: g.saved, aportes: g.aportes,
        }))
        const { error } = await upsertRows('financial_goals', rows)
        results.push(`financial_goals: ${error ? error.message : 'OK'}`)
      }

      // Emergency
      const emergency = loadStorage('nex_fin_emergency', null)
      if (emergency) {
        const { error } = await supabase.from('emergency_fund').upsert([{
          user_id: user.id, target: emergency.target ?? 0, current: emergency.current ?? 0,
        }], { onConflict: 'user_id' })
        results.push(`emergency_fund: ${error ? error.message : 'OK'}`)
      }

      // Income/MonthGoal (finance_config)
      const income = loadStorage('nex_fin_income', null)
      const monthGoal = loadStorage('nex_fin_monthgoal', null)
      if (income || monthGoal) {
        const { error } = await supabase.from('finance_config').upsert([{
          user_id: user.id, 
          income: income,
          month_goal: monthGoal?.target,
          month_goal_label: monthGoal?.label,
        }], { onConflict: 'user_id' })
        results.push(`finance_config: ${error ? error.message : 'OK'}`)
      }

      // Career Readings
      const careerReadings = loadStorage('nex_career_readings', [])
      if (careerReadings.length > 0) {
        const rows = careerReadings.map(r => ({
          id: r.id, user_id: user.id,
          title: r.title, author: r.author, category: r.category,
          type: r.type, status: r.status, notes: r.notes,
          link: r.link, rating: r.rating, createdAt: r.createdAt,
        }))
        const { error } = await upsertRows('career_readings', rows)
        results.push(`career_readings: ${error ? error.message : 'OK'}`)
      }

      // Career Goals
      const careerGoals = loadStorage('nex_career_goals', [])
      if (careerGoals.length > 0) {
        const rows = careerGoals.map(g => ({
          id: g.id, user_id: user.id,
          title: g.title, description: g.description,
          area: g.area, deadline: g.deadline, status: g.status,
          notes: g.notes, milestones: g.milestones, linkedHabitId: g.linkedHabitId,
          createdAt: g.createdAt,
        }))
        const { error } = await upsertRows('career_goals', rows)
        results.push(`career_goals: ${error ? error.message : 'OK'}`)
      }

      // Career Projects
      const careerProjects = loadStorage('nex_career_projects', [])
      if (careerProjects.length > 0) {
        const rows = careerProjects.map(p => ({
          id: p.id, user_id: user.id,
          title: p.title, description: p.description,
          tech: p.tech, link: p.link, status: p.status, createdAt: p.createdAt,
        }))
        const { error } = await upsertRows('career_projects', rows)
        results.push(`career_projects: ${error ? error.message : 'OK'}`)
      }

      // Life Projects
      const lifeProjects = loadStorage('nex_projects', [])
      if (lifeProjects.length > 0) {
        const rows = lifeProjects.map(p => ({
          id: p.id, user_id: user.id,
          title: p.title, description: p.description,
          category: p.category, status: p.status,
          pinned: p.pinned, milestones: p.milestones,
          deadline: p.deadline, priority: p.priority,
          notes: p.notes, desc: p.desc,
        }))
        const { error } = await upsertRows('life_projects', rows)
        results.push(`life_projects: ${error ? error.message : 'OK'}`)
      }

      // Journal
      const journal = loadStorage('nex_journal', [])
      if (journal.length > 0) {
        const rows = journal.map(j => ({
          id: j.id, user_id: user.id,
          text: j.text, mood: j.mood, tags: j.tags,
          date: j.date, prompt: j.prompt,
        }))
        const { error } = await upsertRows('journal', rows)
        results.push(`journal: ${error ? error.message : 'OK'}`)
      }

      setSyncMessage(results.join(' | '))
      setTimeout(() => {
        loadRemoteData()
        setSyncing(false)
      }, 1000)

    } catch (e) {
      setSyncMessage('Erro: ' + e.message)
      setSyncing(false)
    }
  }

  async function loadRemoteData() {
    if (!user?.id) return
    setLoading(true)

    const results = {}
    const errors = {}

    for (const [key, table] of Object.entries(TABLES)) {
      try {
        if (table === 'profiles') {
          const { data: d, error } = await getProfile(user.id)
          results[key] = d
          if (error) errors[key] = error.message
        } else if (table === 'emergency_fund' || table === 'finance_config') {
          const { data: d, error } = await supabase
            .from(table)
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()
          results[key] = d
          if (error) errors[key] = error.message
        } else {
          const { data: d, error } = await fetchRows(table, user.id)
          results[key] = d ?? []
          if (error) errors[key] = error.message
        }
      } catch (e) {
        errors[key] = e.message
      }
    }

    setRemoteData(results)
    setRemoteErrors(errors)
    setLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'remote' && isLoggedIn) {
      loadRemoteData()
    }
  }, [activeTab, isLoggedIn, user?.id])

  function formatData(key, data) {
    if (!data) return 'null'
    if (Array.isArray(data)) return `${data.length} itens`
    if (typeof data === 'object') return `${Object.keys(data).length} chaves`
    return String(data)
  }

  function renderLocalRow([key, storageKey]) {
    const data = localData[key]
    const jsonStr = JSON.stringify(data, null, 2) || ''
    return (
      <tr key={key}>
        <td>{key}</td>
        <td>{storageKey}</td>
        <td>{formatData(key, data)}</td>
        <td className="debug-preview">
          <pre>{jsonStr.slice(0, 300)}</pre>
        </td>
      </tr>
    )
  }

  function renderRemoteRow([key, table]) {
    const data = remoteData[key]
    const error = remoteErrors[key]
    const jsonStr = JSON.stringify(data, null, 2) || ''
    return (
      <tr key={key}>
        <td>{key}</td>
        <td>{table}</td>
        <td>{formatData(key, data)}</td>
        <td className={error ? 'debug-error-cell' : 'debug-preview'}>
          {error ? (
            <span className="debug-error">❌ {error}</span>
          ) : (
            <pre>{jsonStr.slice(0, 300)}</pre>
          )}
        </td>
      </tr>
    )
  }

  if (!supabase) {
    return (
      <div className="sync-debug">
        <h2>🔍 Debug de Sincronização</h2>
        <p className="debug-error">⚠️ Supabase não configurado. Verifique o arquivo .env</p>
        <p>VITE_SUPABASE_URL: {supabaseUrl}</p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="sync-debug">
        <h2>🔍 Debug de Sincronização</h2>
        <p className="debug-warning">Faça login para ver os dados remotos.</p>
      </div>
    )
  }

  return (
    <div className="sync-debug">
      <h2>🔍 Debug de Sincronização</h2>
      
      <div className="debug-user">
        <strong>Supabase:</strong> {supabaseUrl}
        <br />
        <strong>Usuário:</strong> {user?.email} ({user?.id?.slice(0, 8)}...)
        <br />
        <strong>Perfil:</strong> {profile?.username} | Pontos: {profile?.points} | Plano: {profile?.plan}
      </div>

      <div className="debug-actions">
        <button 
          onClick={() => { refreshLocalData(); setActiveTab('local') }}
          disabled={loading || syncing}
        >
          🔄 Atualizar Local
        </button>
        <button 
          onClick={syncLocalToRemote}
          disabled={loading || syncing}
          className={syncing ? 'syncing' : ''}
        >
          {syncing ? '⏳ Sincronizando...' : '☁️ Enviar para Supabase'}
        </button>
        <button 
          onClick={loadRemoteData}
          disabled={loading || syncing}
        >
          {loading ? '⏳ Carregando...' : '📥 Baixar do Supabase'}
        </button>
      </div>

      {syncMessage && <div className="debug-message">{syncMessage}</div>}

      <div className="debug-tabs">
        <button
          className={activeTab === 'local' ? 'active' : ''}
          onClick={() => setActiveTab('local')}
        >
          📱 Local ({Object.keys(STORAGE_KEYS).length})
        </button>
        <button
          className={activeTab === 'remote' ? 'active' : ''}
          onClick={() => setActiveTab('remote')}
        >
          ☁️ Remoto ({Object.keys(TABLES).length})
        </button>
      </div>

      {activeTab === 'local' && (
        <table className="debug-table">
          <thead>
            <tr>
              <th>Chave</th>
              <th>Storage</th>
              <th>Tamanho</th>
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(STORAGE_KEYS).map(renderLocalRow)}
          </tbody>
        </table>
      )}

      {activeTab === 'remote' && !loading && (
        <>
          <div className="debug-summary">
            {Object.keys(remoteErrors).length === 0 ? (
              <span className="debug-success">✅ Todas as tabelas OK!</span>
            ) : (
              <span className="debug-error">❌ {Object.keys(remoteErrors).length} tabelas com erro</span>
            )}
          </div>
          <table className="debug-table">
            <thead>
              <tr>
                <th>Dado</th>
                <th>Tabela</th>
                <th>Tamanho</th>
                <th>Preview / Erro</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(TABLES).map(renderRemoteRow)}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

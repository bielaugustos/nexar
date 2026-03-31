// src/services/claudeAPI.js
// ══════════════════════════════════════
// Toda comunicação com a Anthropic passa
// por aqui. Trocar de modelo ou endpoint
// exige mudar só este arquivo.
// ══════════════════════════════════════

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL   = 'claude-sonnet-4-6'
const HEADERS = {
  'Content-Type':  'application/json',
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
}
const INVALID_KEY = 'sk-ant-sua-chave-aqui'

function getKey() {
  return localStorage.getItem('nex_apikey') || import.meta.env.VITE_ANTHROPIC_KEY || ''
}

// ── Helper interno — fetch sem streaming ──
async function _fetchClaude(key, body) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { ...HEADERS, 'x-api-key': key },
    body: JSON.stringify({ model: MODEL, ...body }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Erro ${response.status}`)
  }
  const data = await response.json()
  return data.content?.[0]?.text?.trim() || ''
}

// ── Streaming — retorna token a token ──
export async function streamMessage({ messages, system, onChunk, onDone, onError }) {
  const key = getKey()
  if (!key || key === INVALID_KEY) {
    onError('Configure sua chave em .env: VITE_ANTHROPIC_KEY=sk-ant-...')
    return
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { ...HEADERS, 'x-api-key': key },
      body: JSON.stringify({ model: MODEL, max_tokens: 1024, system, stream: true, messages }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      onError(err.error?.message || `Erro ${response.status}`)
      return
    }

    const reader  = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const evt = JSON.parse(data)
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            onChunk(evt.delta.text)
          }
        } catch {}
      }
    }

    onDone()
  } catch (e) {
    onError(e.message || 'Erro de conexão')
  }
}

// ── Resposta simples (sem streaming) ──
export async function askClaude({ messages, system }) {
  const key = getKey()
  if (!key || key === INVALID_KEY) {
    throw new Error('Configure sua chave em .env: VITE_ANTHROPIC_KEY=sk-ant-...')
  }
  const text = await _fetchClaude(key, { max_tokens: 800, system, messages })
  return text
}

// ── Sugestão de hábitos (retorna JSON) ──
export async function suggestHabits(existingHabits) {
  const names = existingHabits.map(h => h.name).join(', ')
  const result = await askClaude({
    system: 'Sugira 3 hábitos complementares PT-BR',
    messages: [{ role: 'user', content: `Atuais: ${names}` }],
  })
  const clean = result.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// ── System prompt do Mentor ──
export function buildMentorSystem(habits, history) {
  const done    = habits.filter(h => h.done)
  const pending = habits.filter(h => !h.done)
  const rate    = Math.round(done.length / habits.length * 100) || 0

  // Resumo compacto: apenas últimos 3 dias com dados
  const weekSummary = Array.from({ length: 3 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    const r    = history[date]
    return r ? `${date}: ${r.done}/${r.total}` : null
  }).filter(Boolean).join('\n')

  return `Mentor Ioversoroot. Coach dev pessoal. Direto, motivador, empático. PT-BR. Máx 3 parágrafos.

HOJE: ${rate}% (${done.length}/${habits.length})
Feitos: ${done.map(h => h.name).join(', ') || 'nenhum'}
Pendentes: ${pending.map(h => h.name).join(', ') || 'todos feitos'}
${weekSummary ? `Últimos dias:\n${weekSummary}` : ''}`
}

// ── Streak — helper interno compartilhado ──
function calcStreak(history) {
  let streak = 0
  for (let i = 1; i < 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    if (history[d.toISOString().slice(0, 10)]?.done > 0) streak++
    else break
  }
  return streak
}

// ── Resumo diário — 1 frase motivacional, cacheada por dia ──
export async function getDailySummary(habits, history, apiKey) {
  const today    = new Date().toISOString().slice(0, 10)
  const cacheKey = `nex_daily_summary_${today}`
  const cached   = localStorage.getItem(cacheKey)
  if (cached) return cached

  const done    = habits.filter(h => h.done)
  const pending = habits.filter(h => !h.done)
  const rate    = habits.length > 0 ? Math.round(done.length / habits.length * 100) : 0
  const streak  = calcStreak(history)

  const key = apiKey || localStorage.getItem('nex_apikey') || ''
  if (!key || key === INVALID_KEY) return null

  try {
    const text = await _fetchClaude(key, {
      max_tokens: 80,
      system: 'Frase motivacional PT-BR, máx 20 palavras. Direta, impactante. Sem saudação.',
      messages: [{
        role: 'user',
        content: `${rate}% hoje. ${done.length} feitos. ${streak}d sequência.`,
      }],
    })
    if (text) localStorage.setItem(cacheKey, text)
    return text || null
  } catch { return null }
}

// ── Badge personalizado por IA — cacheado indefinidamente ──
export async function generatePersonalBadge(habits, history, apiKey) {
  const cacheKey = 'nex_personal_badge'
  const cached   = localStorage.getItem(cacheKey)
  if (cached) {
    try { return JSON.parse(cached) } catch {}
  }

  const daysActive  = Object.values(history).filter(r => r?.done > 0).length
  const totalDone   = Object.values(history).reduce((a, r) => a + (r?.done || 0), 0)
  const topHabit    = habits
    .map(h => ({ name: h.name, score: Object.values(history).filter(r => r?.habits?.[h.id]).length }))
    .sort((a, b) => b.score - a.score)[0]?.name || 'nenhum'
  const streak = calcStreak(history)

  const key = apiKey || localStorage.getItem('nex_apikey') || ''
  if (!key || key === INVALID_KEY) return null

  try {
    const text = await _fetchClaude(key, {
      max_tokens: 150,
      system: 'Badge personalizado app hábitos. JSON válido, sem markdown: {"icon":"emoji","name":"2-3 palavras","desc":"máx 12 palavras","reason":"curto"}',
      messages: [{
        role: 'user',
        content: `${daysActive}d ativos, ${totalDone} feitos, ${streak}d seq, top: ${topHabit}.`,
      }],
    })
    const clean = text.replace(/```json|```/g, '').trim()
    const badge = JSON.parse(clean)
    localStorage.setItem(cacheKey, JSON.stringify(badge))
    return badge
  } catch { return null }
}
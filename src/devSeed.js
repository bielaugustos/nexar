/**
 * devSeed.js — Modo de desenvolvimento Rootio
 * Popula o localStorage com 90 dias de dados realistas
 * de um usuário fictício chamado "Lucas Andrade".
 *
 * Como usar:
 *   No console do browser → seedDevMode()
 *   Ou importe e chame em main.jsx durante desenvolvimento.
 */

function iso(daysAgo = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

// ──────────────────────────────────────────────────────
// HÁBITOS
// ──────────────────────────────────────────────────────
const HABITS = [
  {
    id: 1001, name: 'Leitura 20 min', done: false,
    pts: 15, icon: 'PiBookOpenText', priority: 'alta',
    freq: 'diario', days: [0,1,2,3,4,5,6],
    reason: 'Quero ler 24 livros esse ano.',
    notes: 'Ler antes de dormir, longe do celular.',
    subtasks: [], tags: ['desenvolvimento', 'foco'],
    estMins: 20, deadline: null, period: 'noite',
    habitTime: '22:00', createdAt: iso(90), archived: false,
  },
  {
    id: 1002, name: 'Exercício físico', done: false,
    pts: 25, icon: 'PiBarbell', priority: 'alta',
    freq: 'diario', days: [1,2,3,4,5],
    reason: 'Saúde é o único ativo que não tem substituto.',
    notes: 'Academia ou corrida de 40 min.',
    subtasks: [
      { id: 201, text: 'Aquecimento 5 min', done: false },
      { id: 202, text: 'Treino principal', done: false },
      { id: 203, text: 'Alongamento', done: false },
    ],
    tags: ['saúde'], estMins: 45, deadline: null,
    period: 'manha', habitTime: '07:00', createdAt: iso(88), archived: false,
  },
  {
    id: 1003, name: 'Meditação', done: false,
    pts: 10, icon: 'PiBrainBold', priority: 'media',
    freq: 'diario', days: [0,1,2,3,4,5,6],
    reason: 'Reduzir ansiedade e melhorar foco.',
    notes: 'App Insight Timer, 10 minutos.',
    subtasks: [], tags: ['mindfulness'],
    estMins: 10, deadline: null, period: 'manha',
    habitTime: '06:30', createdAt: iso(85), archived: false,
  },
  {
    id: 1004, name: 'Estudar inglês', done: false,
    pts: 20, icon: 'PiCodeBold', priority: 'media',
    freq: 'diario', days: [1,2,3,4,5],
    reason: 'Abrir portas internacionais na carreira.',
    notes: 'Duolingo + 1 episódio de série sem legenda.',
    subtasks: [], tags: ['carreira', 'idioma'],
    estMins: 30, deadline: iso(-30), period: null,
    habitTime: null, createdAt: iso(80), archived: false,
  },
  {
    id: 1005, name: 'Sem redes sociais após 22h', done: false,
    pts: 10, icon: 'PiMoonBold', priority: 'media',
    freq: 'diario', days: [0,1,2,3,4,5,6],
    reason: 'Dormir melhor e ter mais energia.',
    notes: 'Celular no modo "não perturbe" a partir das 22h.',
    subtasks: [], tags: ['sono', 'foco'],
    estMins: null, deadline: null, period: 'noite',
    habitTime: '22:00', createdAt: iso(75), archived: false,
  },
  {
    id: 1006, name: 'Beber 2L de água', done: false,
    pts: 5, icon: 'PiDropBold', priority: 'baixa',
    freq: 'diario', days: [0,1,2,3,4,5,6],
    reason: 'Hidratação impacta diretamente concentração.',
    notes: 'Garrafa de 500ml — 4x ao dia.',
    subtasks: [], tags: ['saúde'],
    estMins: null, deadline: null, period: null,
    habitTime: null, createdAt: iso(70), archived: false,
  },
  {
    id: 1007, name: 'Revisar finanças', done: false,
    pts: 15, icon: 'PiStarBold', priority: 'baixa',
    freq: 'diario', days: [0],
    reason: 'Controlar onde o dinheiro vai.',
    notes: 'Todo domingo, atualizar planilha + app.',
    subtasks: [], tags: ['finanças'],
    estMins: 15, deadline: null, period: null,
    habitTime: null, createdAt: iso(60), archived: false,
  },
  {
    id: 1008, name: 'Journaling', done: false,
    pts: 10, icon: 'PiPencilBold', priority: 'baixa',
    freq: 'diario', days: [1,3,5],
    reason: 'Processar emoções e clarificar objetivos.',
    notes: 'Pelo menos 3 frases. Sem julgamento.',
    subtasks: [], tags: ['reflexão', 'mindfulness'],
    estMins: 15, deadline: null, period: 'noite',
    habitTime: '21:30', createdAt: iso(50), archived: false,
  },
]

// ──────────────────────────────────────────────────────
// HISTÓRICO (90 dias)
// ──────────────────────────────────────────────────────
function buildHistory() {
  const history = {}
  const habitIds = HABITS.map(h => h.id)

  for (let d = 1; d <= 90; d++) {
    const dateStr = iso(d)
    const dow = new Date(dateStr + 'T12:00:00').getDay()

    const dayHabits = HABITS.filter(h =>
      Array.isArray(h.days) && h.days.includes(dow)
    )
    if (dayHabits.length === 0) continue

    const completionRate = d > 60 ? 0.5
      : d > 30 ? 0.7
      : 0.85

    const doneMap = {}
    dayHabits.forEach(h => {
      if (Math.random() < completionRate) doneMap[h.id] = true
    })

    const doneCount = Object.keys(doneMap).length
    history[dateStr] = {
      habits: doneMap,
      done: doneCount,
      total: dayHabits.length,
    }
  }
  return history
}

// ──────────────────────────────────────────────────────
// FINANÇAS
// ──────────────────────────────────────────────────────
function buildTransactions() {
  const txs = []
  let id = 3001

  // Salário mensal (últimos 3 meses)
  for (let m = 0; m < 3; m++) {
    const d = new Date()
    d.setDate(5)
    d.setMonth(d.getMonth() - m)
    txs.push({ id: id++, type: 'income', desc: 'Salário', category: 'Salário',
      amount: 6800, date: d.toISOString().slice(0,10) })
  }

  // Freelance
  txs.push({ id: id++, type: 'income', desc: 'Freelance — landing page', category: 'Freelance',
    amount: 1200, date: iso(45) })
  txs.push({ id: id++, type: 'income', desc: 'Freelance — consultoria', category: 'Freelance',
    amount: 800, date: iso(12) })

  // Despesas recorrentes
  const recorrentes = [
    { desc: 'Aluguel', cat: 'Moradia', amt: 1800 },
    { desc: 'Supermercado', cat: 'Alimentação', amt: 620 },
    { desc: 'Academia', cat: 'Saúde', amt: 110 },
    { desc: 'Plano de saúde', cat: 'Saúde', amt: 290 },
    { desc: 'Internet', cat: 'Moradia', amt: 120 },
    { desc: 'Spotify + Netflix', cat: 'Lazer', amt: 65 },
  ]
  for (let m = 0; m < 3; m++) {
    recorrentes.forEach((r, i) => {
      const d = new Date()
      d.setDate(8 + i)
      d.setMonth(d.getMonth() - m)
      txs.push({ id: id++, type: 'expense', desc: r.desc, category: r.cat,
        amount: r.amt, date: d.toISOString().slice(0,10) })
    })
  }

  // Despesas avulsas
  const avulsas = [
    { desc: 'Restaurante', cat: 'Alimentação', amt: 87, daysAgo: 3 },
    { desc: 'Uber', cat: 'Transporte', amt: 23, daysAgo: 5 },
    { desc: 'Livros — Amazon', cat: 'Educação', amt: 134, daysAgo: 8 },
    { desc: 'Farmácia', cat: 'Saúde', amt: 58, daysAgo: 10 },
    { desc: 'Presente aniversário', cat: 'Outros', amt: 150, daysAgo: 15 },
    { desc: 'Curso online', cat: 'Educação', amt: 297, daysAgo: 20 },
    { desc: 'Gasolina', cat: 'Transporte', amt: 180, daysAgo: 22 },
    { desc: 'Jantar fora', cat: 'Alimentação', amt: 145, daysAgo: 28 },
    { desc: 'Roupas', cat: 'Outros', amt: 320, daysAgo: 35 },
    { desc: 'Suplemento', cat: 'Saúde', amt: 189, daysAgo: 40 },
  ]
  avulsas.forEach(a => {
    txs.push({ id: id++, type: 'expense', desc: a.desc, category: a.cat,
      amount: a.amt, date: iso(a.daysAgo) })
  })

  return txs.sort((a, b) => b.date.localeCompare(a.date))
}

// ──────────────────────────────────────────────────────
// METAS FINANCEIRAS
// ──────────────────────────────────────────────────────
const GOALS = [
  {
    id: 4001, name: 'Viagem para Portugal', icon: '✈️',
    target: 12000, saved: 4200,
    deadline: iso(-180), color: '#3498db',
    createdAt: iso(60),
  },
  {
    id: 4002, name: 'Notebook novo', icon: '💻',
    target: 5500, saved: 3800,
    deadline: iso(-60), color: '#8e44ad',
    createdAt: iso(45),
  },
  {
    id: 4003, name: 'Reserva para MBA', icon: '🎓',
    target: 30000, saved: 8500,
    deadline: iso(-365), color: '#27ae60',
    createdAt: iso(30),
  },
]

// ──────────────────────────────────────────────────────
// DIÁRIO (Mentor)
// ──────────────────────────────────────────────────────
const JOURNAL_ENTRIES = [
  {
    id: 5001,
    prompt: 'O que aconteceu hoje que vale guardar para sempre?',
    text: 'Terminei o primeiro módulo do curso de product design. Demorei mais do que o esperado mas finalmente clicou o conceito de hierarquia visual. Pequena vitória, mas vitória.',
    mood: '😊', tags: ['aprendizado', 'design'],
    date: iso(2), createdAt: new Date(Date.now() - 2*864e5).toISOString(),
  },
  {
    id: 5002,
    prompt: 'Qual obstáculo você superou hoje, mesmo que pequeno?',
    text: 'Não queria ir malhar de jeito nenhum. Coloquei o tênis assim mesmo e fui. Não foi o melhor treino da vida, mas fui. Às vezes aparecer já é o suficiente.',
    mood: '💪', tags: ['exercício', 'disciplina'],
    date: iso(5), createdAt: new Date(Date.now() - 5*864e5).toISOString(),
  },
  {
    id: 5003,
    prompt: 'Que escolha de hoje seu eu de amanhã vai agradecer?',
    text: 'Dormi cedo. Simples assim. Nada de séries até meia-noite. Acordei com energia de verdade pela primeira vez em semanas. Preciso lembrar que isso é uma escolha, não sorte.',
    mood: '😴', tags: ['sono', 'autocuidado'],
    date: iso(8), createdAt: new Date(Date.now() - 8*864e5).toISOString(),
  },
  {
    id: 5004,
    prompt: 'Quem ou o que fez você sorrir genuinamente hoje?',
    text: 'Ligação com minha mãe. Ela contou uma história ridícula do meu sobrinho e ri de verdade por uns 5 minutos. Às vezes a vida boa está nessas pequenas coisas sem filtro.',
    mood: '😄', tags: ['família', 'gratidão'],
    date: iso(12), createdAt: new Date(Date.now() - 12*864e5).toISOString(),
  },
  {
    id: 5005,
    prompt: 'O que você gostaria de ter feito diferente hoje?',
    text: 'Fiquei rolando feed por quase uma hora antes de dormir. Sabia que estava fazendo errado em tempo real e mesmo assim continuei. Amanhã — celular do outro lado do quarto.',
    mood: '😤', tags: ['foco', 'telas'],
    date: iso(18), createdAt: new Date(Date.now() - 18*864e5).toISOString(),
  },
]

// ──────────────────────────────────────────────────────
// FUNÇÃO PRINCIPAL
// ──────────────────────────────────────────────────────
export function seedDevMode() {
  // Plano e funcionalidades
  localStorage.setItem('nex_plan', 'pro')
  localStorage.setItem('nex_shop_owned', JSON.stringify([
    'util_calendar', 'util_mentor', 'util_progress',
  ]))

  // Hábitos e histórico
  localStorage.setItem('nex_habits', JSON.stringify(HABITS))
  localStorage.setItem('nex_history', JSON.stringify(buildHistory()))
  localStorage.setItem('nex_last_reset', iso(1)) // reset foi ontem, hoje ainda não

  // Finanças
  const txs = buildTransactions()
  localStorage.setItem('nex_fin_transactions', JSON.stringify(txs))
  localStorage.setItem('nex_fin_income', JSON.stringify(6800))
  localStorage.setItem('nex_fin_monthgoal', JSON.stringify({ target: 1500, enabled: true }))
  // emergency: current = saldo poupado, target = 6x despesas mensais (~R$3.005/mês)
  localStorage.setItem('nex_fin_emergency', JSON.stringify({ current: 8400, target: 18030 }))
  localStorage.setItem('nex_fin_goals', JSON.stringify(GOALS))
  localStorage.setItem('nex_cats_income', JSON.stringify(['Salário', 'Freelance', 'Investimentos', 'Outros']))
  localStorage.setItem('nex_cats_expense', JSON.stringify(['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros']))

  // Diário
  localStorage.setItem('nex_journal', JSON.stringify(JOURNAL_ENTRIES))

  // UI
  localStorage.setItem('nex_cal_visible', 'true')
  localStorage.setItem('nex_sound', 'true')

  console.log('[Rootio DevSeed] ✓ 90 dias de dados populados. Recarregue a página.')
  return '✓ DevSeed aplicado — recarregue a página (F5)'
}

// Expõe no window para uso direto no console
if (typeof window !== 'undefined') {
  window.seedDevMode = seedDevMode
}

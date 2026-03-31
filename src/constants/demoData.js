// ══════════════════════════════════════
// DADOS DE DEMONSTRAÇÃO - CONSTANTES
// ══════════════════════════════════════

export const DEMO_HABITS = [
  {
    id:1, name:'Meditação', done:true, pts:20, icon:'PiBrainBold',
    priority:'alta', freq:'diario', days:[0,1,2,3,4,5,6],
    subtasks:[],
    notes:'Usar app Headspace. Foco na respiração e no corpo.',
    reason:'Reduz estresse e melhora minha clareza mental ao longo do dia.',
    tags:['mente','manhã'], estMins:15, deadline:null, createdAt:'2024-10-01',
  },
  {
    id:2, name:'Exercício', done:false, pts:30, icon:'PiBarbell',
    priority:'alta', freq:'personalizado', days:[1,3,5],
    subtasks:[
      {id:21,text:'Aquecimento 5 min',  done:false},
      {id:22,text:'Treino principal',    done:false},
      {id:23,text:'Alongamento final',   done:false},
    ],
    notes:'Seg: pernas · Qua: costas · Sex: peito e ombro.',
    reason:'Saúde é a base de tudo. Energia, disposição e longevidade.',
    tags:['corpo','saúde'], estMins:60, deadline:null, createdAt:'2024-10-01',
  },
  {
    id:3, name:'Leitura', done:true, pts:20, icon:'PiBookOpenText',
    priority:'media', freq:'diario', days:[0,1,2,3,4,5,6],
    subtasks:[],
    notes:'Mínimo 20 páginas. Atualmente: Atomic Habits — James Clear.',
    reason:'Cada livro é um mentor disponível 24h. Conhecimento composto.',
    tags:['mente','aprendizado'], estMins:30, deadline:null, createdAt:'2024-10-01',
  },
  {
    id:4, name:'Código', done:false, pts:30, icon:'PiCodeBold',
    priority:'media', freq:'personalizado', days:[1,2,3,4,5],
    subtasks:[],
    notes:'Foco: React + TypeScript. Side projects e contribuições open source.',
    reason:'Construir fluência técnica que abre portas para projetos maiores.',
    tags:['carreira','tech'], estMins:90, deadline:null, createdAt:'2024-10-15',
  },
  {
    id:5, name:'Água', done:false, pts:10, icon:'PiDropBold',
    priority:'baixa', freq:'diario', days:[0,1,2,3,4,5,6],
    subtasks:[
      {id:51,text:'500 ml pela manhã', done:false},
      {id:52,text:'500 ml à tarde',    done:false},
      {id:53,text:'500 ml à noite',    done:false},
    ],
    notes:'Meta: 1,5 L mínimo. Usar garrafa de 500 ml como referência.',
    reason:'Hidratação afeta diretamente foco, humor e energia.',
    tags:['saúde'], estMins:null, deadline:null, createdAt:'2024-10-01',
  },
  {
    id:6, name:'Diário', done:false, pts:15, icon:'PiPencilBold',
    priority:'baixa', freq:'diario', days:[0,1,2,3,4,5,6],
    subtasks:[],
    notes:'3 gratidões + 1 aprendizado do dia. Máximo 10 min.',
    reason:'Registro de progresso e clareza mental. Quem escreve, processa.',
    tags:['reflexão','mente'], estMins:10, deadline:null, createdAt:'2024-10-20',
  },
  {
    id:7, name:'Sono', done:false, pts:15, icon:'PiMoonBold',
    priority:'baixa', freq:'diario', days:[0,1,2,3,4,5,6],
    subtasks:[],
    notes:'Dormir antes das 23h. Meta: 8h por noite. Celular fora do quarto.',
    reason:'Sem sono de qualidade, nenhum dos outros hábitos funciona direito.',
    tags:['saúde','noite'], estMins:null, deadline:null, createdAt:'2024-11-01',
  },
]

export function generateDemoHistory(days = 90) {
  const HABIT_DEFS = DEMO_HABITS.map(h => ({ id: h.id, days: h.days }))
  let seed = 42
  function rng() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff }

  const history = {}

  for (let i = 1; i <= days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const k   = d.toISOString().slice(0, 10)
    const dow = d.getDay()
    const dayHabits = HABIT_DEFS.filter(h => h.days.includes(dow))
    if (!dayHabits.length) continue

    const hm = {}

    if (i <= 22) {
      dayHabits.forEach(h => { if (rng() > 0.12) hm[h.id] = true })
      if (!Object.keys(hm).length) hm[dayHabits[0].id] = true
    } else if (i <= 70) {
      dayHabits.forEach(h => { if (rng() > 0.28) hm[h.id] = true })
    } else {
      dayHabits.forEach(h => { if (rng() > 0.50) hm[h.id] = true })
    }

    history[k] = {
      done:   Object.keys(hm).length,
      total:  dayHabits.length,
      habits: hm,
    }
  }

  return history
}

export function generateDemoFinances() {
  function isoFin(daysAgo = 0) {
    const d = new Date(); d.setDate(d.getDate() - daysAgo)
    return d.toISOString().slice(0, 10)
  }
  function isoMonth(monthsAgo, day) {
    const d = new Date(); d.setDate(day); d.setMonth(d.getMonth() - monthsAgo)
    return d.toISOString().slice(0, 10)
  }

  const FIN_TXS = []
  let txId = 3001

  for (let m = 0; m < 3; m++) {
    FIN_TXS.push({ id: txId++, type: 'income',  desc: 'Salário',  category: 'Salário',    amount: 6800, date: isoMonth(m, 5) })
  }
  FIN_TXS.push({ id: txId++, type: 'income',  desc: 'Freelance — landing page', category: 'Freelance', amount: 1200, date: isoFin(45) })
  FIN_TXS.push({ id: txId++, type: 'income',  desc: 'Freelance — consultoria',  category: 'Freelance', amount:  800, date: isoFin(12) })

  const REC = [
    { desc: 'Aluguel',           cat: 'Moradia',      amt: 1800 },
    { desc: 'Supermercado',      cat: 'Alimentação',  amt:  620 },
    { desc: 'Academia',          cat: 'Saúde',        amt:  110 },
    { desc: 'Plano de saúde',    cat: 'Saúde',        amt:  290 },
    { desc: 'Internet',          cat: 'Moradia',      amt:  120 },
    { desc: 'Spotify + Netflix', cat: 'Lazer',        amt:   65 },
  ]
  for (let m = 0; m < 3; m++) {
    REC.forEach((r, i) => {
      FIN_TXS.push({ id: txId++, type: 'expense', desc: r.desc, category: r.cat, amount: r.amt, date: isoMonth(m, 8 + i) })
    })
  }
  const AVULSAS = [
    { desc: 'Restaurante',          cat: 'Alimentação', amt:  87, d:  3 },
    { desc: 'Uber',                 cat: 'Transporte',  amt:  23, d:  5 },
    { desc: 'Livros — Amazon',      cat: 'Educação',    amt: 134, d:  8 },
    { desc: 'Farmácia',             cat: 'Saúde',       amt:  58, d: 10 },
    { desc: 'Presente aniversário', cat: 'Outros',      amt: 150, d: 15 },
    { desc: 'Curso online',         cat: 'Educação',    amt: 297, d: 20 },
    { desc: 'Gasolina',             cat: 'Transporte',  amt: 180, d: 22 },
    { desc: 'Jantar fora',          cat: 'Alimentação', amt: 145, d: 28 },
    { desc: 'Roupas',               cat: 'Outros',      amt: 320, d: 35 },
    { desc: 'Suplemento',           cat: 'Saúde',       amt: 189, d: 40 },
    { desc: 'Cinema',               cat: 'Lazer',       amt:  60, d: 50 },
    { desc: 'Dentista',             cat: 'Saúde',       amt: 250, d: 55 },
  ]
  AVULSAS.forEach(a => {
    FIN_TXS.push({ id: txId++, type: 'expense', desc: a.desc, category: a.cat, amount: a.amt, date: isoFin(a.d) })
  })
  FIN_TXS.sort((a, b) => b.date.localeCompare(a.date))

  return {
    transactions: FIN_TXS,
    income: 6800,
    monthgoal: { target: 1500, enabled: true },
    emergency: { current: 8400, target: 18030 },
    goals: [
      { id: 4001, name: 'Viagem para Portugal', icon: '✈️', target: 12000, saved: 4200, deadline: isoFin(-180), color: '#3498db', createdAt: isoFin(60), aportes: [] },
      { id: 4002, name: 'Notebook novo',         icon: '💻', target:  5500, saved: 3800, deadline: isoFin(-60),  color: '#8e44ad', createdAt: isoFin(45), aportes: [] },
      { id: 4003, name: 'Reserva para MBA',      icon: '🎓', target: 30000, saved: 8500, deadline: isoFin(-365), color: '#27ae60', createdAt: isoFin(30), aportes: [] },
    ],
    catsIncome: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
    catsExpense: ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'],
  }
}

export const DEMO_JOURNAL = [
  { id: 5001, prompt: 'O que aconteceu hoje que vale guardar?', text: 'Terminei o primeiro módulo do curso de product design. Finalmente clicou o conceito de hierarquia visual.', mood: '😊', tags: ['aprendizado','design'], date: new Date(Date.now()-2*864e5).toISOString().slice(0,10),  createdAt: new Date(Date.now()-2*864e5).toISOString() },
  { id: 5002, prompt: 'Qual obstáculo você superou hoje?',      text: 'Não queria ir malhar. Coloquei o tênis assim mesmo e fui. Às vezes aparecer já é o suficiente.',          mood: '💪', tags: ['exercício','disciplina'], date: new Date(Date.now()-5*864e5).toISOString().slice(0,10),  createdAt: new Date(Date.now()-5*864e5).toISOString() },
  { id: 5003, prompt: 'Que escolha de hoje seu eu de amanhã vai agradecer?', text: 'Dormi cedo. Acordei com energia de verdade pela primeira vez em semanas.',                     mood: '😴', tags: ['sono','autocuidado'],    date: new Date(Date.now()-8*864e5).toISOString().slice(0,10),  createdAt: new Date(Date.now()-8*864e5).toISOString() },
  { id: 5004, prompt: 'Quem fez você sorrir genuinamente hoje?', text: 'Ligação com minha mãe. Ela contou uma história ridícula do meu sobrinho e ri de verdade por uns 5 min.', mood: '😄', tags: ['família','gratidão'],     date: new Date(Date.now()-12*864e5).toISOString().slice(0,10), createdAt: new Date(Date.now()-12*864e5).toISOString() },
]

export const DEMO_CAREER = {
  readings: [
    {id:1,title:'Atomic Habits',author:'James Clear',type:'Livro',status:'concluido',notes:'Melhor livro sobre hábitos que já li.',rating:5,createdAt:'2024-10-10'},
    {id:2,title:'Deep Work',author:'Cal Newport',type:'Livro',status:'lendo',notes:'Foco no trabalho profundo e sessões sem distração.',rating:4,createdAt:'2024-11-01'},
    {id:3,title:'React Avançado',author:'Kent C. Dodds',type:'Curso',status:'lendo',notes:'Patterns de performance e composição.',createdAt:'2024-11-15'},
    {id:4,title:'The Pragmatic Programmer',author:'Hunt & Thomas',type:'Livro',status:'lista',createdAt:'2024-12-01'},
  ],
  goals: [
    {id:1,title:'Dominar React + TypeScript',area:'Tecnologia',milestones:[
      {id:1,text:'Completar curso avançado',done:true},
      {id:2,text:'Construir 3 projetos próprios',done:true},
      {id:3,text:'Contribuir para open source',done:false},
      {id:4,text:'Deploy de SaaS pessoal',done:false},
    ],createdAt:'2024-10-01'},
    {id:2,title:'Comunicação e liderança',area:'Soft Skills',milestones:[
      {id:1,text:'Fazer 10 apresentações técnicas',done:false},
      {id:2,text:'Mentorar 2 pessoas',done:false},
    ],createdAt:'2024-11-01'},
  ],
  projects: [
    {id:1,name:'Portfolio Pessoal',status:'andamento',notes:'Site profissional com case studies.',
     tasks:[{id:1,text:'Design',done:true},{id:2,text:'Desenvolvimento',done:true},{id:3,text:'Deploy',done:false}],createdAt:'2024-10-15'},
    {id:2,name:'Ioversoroot App',status:'andamento',notes:'PWA de hábitos e produtividade.',
     tasks:[{id:1,text:'MVP',done:true},{id:2,text:'Design system',done:true},{id:3,text:'Loja',done:false}],createdAt:'2024-11-01'},
  ],
}

export const DEMO_PROJECTS = [
  {id:1,title:'Aprender Espanhol',category:'Aprendizado',priority:'media',status:'andamento',
   milestones:[
     {id:1,text:'Completar nível A1',done:true},
     {id:2,text:'Assistir série sem legenda',done:false},
     {id:3,text:'Conversação básica fluente',done:false},
   ],desc:'Meta de longo prazo. 20 min/dia consistentes.',createdAt:'2024-10-01'},
  {id:2,title:'Correr 10km',category:'Saúde',priority:'alta',status:'andamento',
   milestones:[
     {id:1,text:'Correr 1km sem parar',done:true},
     {id:2,text:'Correr 5km',done:true},
     {id:3,text:'Correr 10km',done:false},
   ],createdAt:'2024-11-01'},
  {id:3,title:'Economizar R$ 10k',category:'Finanças',priority:'alta',status:'andamento',
   milestones:[
     {id:1,text:'Reserva de emergência (3 meses)',done:true},
     {id:2,text:'Investir mensalmente',done:false},
     {id:3,text:'Atingir meta dos 10k',done:false},
   ],desc:'Fundo de liberdade para projetos próprios.',createdAt:'2024-10-20'},
]

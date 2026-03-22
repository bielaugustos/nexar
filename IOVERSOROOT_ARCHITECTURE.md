# ioversoroot — Arquitetura Técnica

> Documento de arquitetura, schema de dados e decisões de design.
> Versão 0.2.0 · Atualizado em março de 2026.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Stack Técnica](#stack-técnica)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Schema de Dados (localStorage)](#schema-de-dados-localstorage)
- [Estado Global — AppContext](#estado-global--appcontext)
- [Hooks](#hooks)
- [Serviços](#serviços)
- [Telas e Componentes](#telas-e-componentes)
- [Navegação](#navegação)
- [Sistema de Temas](#sistema-de-temas)
- [Sistema de Pontos e Níveis](#sistema-de-pontos-e-níveis)
- [PWA e Service Worker](#pwa-e-service-worker)
- [Inteligência Artificial](#inteligência-artificial)
- [Documentação Legal](#documentação-legal)

---

## Visão Geral

ioversoroot é um sistema de vida **offline-first** organizado em 5 pilares. Toda a persistência é feita via `localStorage` — não há backend, não há servidor, não há conta de usuário.

```
Pilar 1 — Rotina e Hábitos      → /habits       ✅
Pilar 2 — Finanças e Patrimônio → /finance      ✅
Pilar 3 — Carreira e Estudos    → /career       ✅
Pilar 4 — Projetos de Vida      → /projects     ✅
Pilar 5 — Bem-estar Mental      → /mentor       🚧 em desenvolvimento
```

---

## Stack Técnica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | React | 18.2 |
| Build | Vite | 5.1 |
| Roteamento | React Router | 6.22 |
| Estado global | Context API + useState | — |
| Persistência | localStorage | — |
| Ícones | Phosphor Icons (react-icons/pi) | 5.5 |
| Fontes | Space Grotesk + Inter | Google Fonts |
| Estilo | CSS Modules + variáveis CSS | — |
| PWA | Service Worker + manifest.json | — |
| IA (preparado) | Claude API (claude-sonnet-4-6) | Anthropic |
| Deploy | Vercel | — |

---

## Estrutura de Arquivos

```
ioversoroot-app/
├── public/
│   ├── manifest.json
│   ├── sw.js                    # Service Worker (Stale-While-Revalidate)
│   ├── offline.html
│   └── icons/
│       ├── icon.svg
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── App.jsx                  # BrowserRouter + rotas + SplashScreen
│   ├── main.jsx                 # Entry point — aplica tema antes do React montar
│   ├── styles/
│   │   └── global.css           # Variáveis CSS, temas via [data-theme], reset
│   ├── context/
│   │   └── AppContext.jsx       # Estado global: habits, history, theme, soundOn
│   ├── hooks/
│   │   ├── useHabits.js         # completed, total, rate, allPoints, useHabitStats
│   │   ├── useStats.js          # streak, daysActive, last7, heatmapWeeks
│   │   └── useSound.js          # Web Audio API: playCheck, playUncheck, playBadge
│   ├── services/
│   │   ├── themes.js            # THEMES{}, applyTheme(id), initTheme()
│   │   ├── levels.js            # LEVELS[], calcLevel(io) — 6 níveis por pontuação
│   │   ├── storage.js           # loadStorage(key, fb), saveStorage(key, val)
│   │   └── claudeAPI.js         # Integração IA — preparado, não ativado
│   ├── components/
│   │   ├── Header.jsx           # Logo ioversoroot + streak pill
│   │   ├── BottomNav.jsx        # Nav com 4 fixos + até 3 desbloqueáveis
│   │   ├── CheckBox.jsx         # Checkbox reutilizável
│   │   ├── Toast.jsx            # Notificação inline (auto-dismiss 2.5s)
│   │   ├── SplashScreen.jsx     # Tela de entrada animada (~1.35s)
│   │   ├── LegalModal.jsx       # Bottom sheet: Termos, Privacidade, Cookies
│   │   └── AITeaser.jsx         # Card IA com roadmap e compromisso de privacidade
│   └── pages/
│       ├── Home.jsx + .module.css
│       ├── Habits.jsx + .module.css
│       ├── Finance.jsx + .module.css
│       ├── Progress.jsx + .module.css   # Rota ativa /progress — Conquistas + Estatísticas
│       ├── Career.jsx + .module.css
│       ├── Projects.jsx + .module.css
│       ├── Mentor.jsx + .module.css
│       ├── Profile.jsx + .module.css
│       ├── Stats.jsx + .module.css      # Não roteado — legado (conteúdo migrado para Progress)
│       └── Rewards.jsx + .module.css    # Não roteado — legado (conteúdo migrado para Progress)
├── index.html
├── vite.config.js
├── package.json
├── README.md                    # Documentação para o usuário
└── IOVERSOROOT_ARCHITECTURE.md  # Este arquivo
```

---

## Schema de Dados (localStorage)

Todos os dados são prefixados com `nex_`.

### Hábitos

```typescript
// nex_habits: Habit[]
interface Habit {
  id:        number           // Date.now() na criação
  name:      string
  done:      boolean          // resetado a cada dia (reset automático à meia-noite)
  pts:       number           // 0 | 5 | 10 | 15 | 20 | 25 | 30
  icon:      string           // nome do ícone Phosphor (ex: 'PiStarBold')
  priority:  'alta' | 'media' | 'baixa'
  freq:      'diario' | 'personalizado'
  days:      number[]         // [0..6] — 0=Dom, nunca vazio
  subtasks:  Subtask[]
  notes:     string
  estMins:   number | null    // tempo estimado em minutos
  deadline:  string | null    // 'YYYY-MM-DD'
  tags:      string[]         // até 6 etiquetas
  hidden:    boolean          // oculto da lista padrão
  createdAt: string | null    // 'YYYY-MM-DD'
}

interface Subtask {
  id:   number
  text: string
  done: boolean
  pts:  number
}
```

### Histórico

```typescript
// nex_history: Record<string, DayRecord>
// chave = 'YYYY-MM-DD'
interface DayRecord {
  done:   number                       // hábitos concluídos no dia
  total:  number                       // total de hábitos ativos no dia
  habits: Record<string, boolean>      // { [habitId]: true }
}
```

### Finanças

```typescript
// nex_fin_transactions: Transaction[]
interface Transaction {
  id:       number
  type:     'income' | 'expense'
  amount:   number           // BRL
  desc:     string
  category: string
  date:     string           // 'YYYY-MM-DD'
}

// nex_fin_goals: Goal[]
interface Goal {
  id:       number
  name:     string
  icon:     string           // chave de ICON_OPTS (ex: 'target', 'plane', 'house')
  target:   number
  saved:    number
  deadline: string | null
  aportes:  Aporte[]
}

interface Aporte {
  id:     number
  amount: number
  date:   string             // 'YYYY-MM-DD'
}

// nex_fin_emergency: { target: number, current: number }
// nex_fin_income:    number
// nex_fin_month_goal_YYYY-MM: { target: number }
// nex_cats_income:   string[]
// nex_cats_expense:  string[]
```

> **Compatibilidade retroativa:** Goals criados antes da refatoração podem ter `emoji: string` em vez de `icon`. O componente `GoalIcon` trata isso com fallback para o primeiro ícone da lista.

### Carreira

```typescript
// nex_career_readings: Reading[]
interface Reading {
  id:        number
  title:     string
  author:    string
  type:      'Livro' | 'Curso' | 'Artigo'
  status:    'para-ler' | 'lendo' | 'concluido'
  rating:    number          // 0–5
  notes:     string
  link:      string
  createdAt: string
}

// nex_career_goals: CareerGoal[]
interface CareerGoal {
  id:         number
  title:      string
  area:       string
  milestones: Milestone[]
  createdAt:  string
}

// nex_career_projects: CareerProject[]
interface CareerProject {
  id:        number
  name:      string
  status:    string
  tasks:     Task[]
  tags:      string[]
  notes:     string
  createdAt: string
}
```

### Projetos de Vida

```typescript
// nex_projects: Project[]
interface Project {
  id:          number
  title:       string
  desc:        string
  category:    string        // Pessoal | Saúde | Finanças | Aprendizado | Criativo | Social | Outro
  priority:    'alta' | 'media' | 'baixa'
  status:      'planejando' | 'andamento' | 'pausado' | 'concluido'
  milestones:  Milestone[]
  activityLog: ActivityEntry[]
  notes:       string
  deadline:    string | null
  createdAt:   string
}

interface Milestone {
  id:   number
  text: string
  done: boolean
  date: string
}

interface ActivityEntry {
  id:   number
  text: string
  date: string
}
```

### Diário

```typescript
// nex_journal: JournalEntry[]
interface JournalEntry {
  id:     number
  text:   string
  mood:   MoodRecord | null
  tags:   string[]
  date:   string            // 'YYYY-MM-DD'
  prompt: string
}

// Mood serializado sem função React (apenas dados)
interface MoodRecord {
  key:   string   // 'great' | 'good' | 'neutral' | 'tired' | 'frustrated'
  label: string   // ex: 'Ótimo'
  color: string   // ex: '#27ae60'
}
```

> O ícone do humor é resolvido em tempo de render via `MOOD_OPTIONS.find(m => m.key === entry.mood.key)`. Funções React não são serializáveis para localStorage.

### Perfil e configurações

```typescript
nex_username:    string      // nome do usuário
nex_avatar:      string      // emoji do avatar ativo
nex_theme:       string      // 'light' | 'dark' | 'midnight' | 'forest' | 'sakura' | 'desert' | 'dracula' | 'nord'
nex_sound:       boolean
nex_shop_owned:  string[]    // IDs desbloqueados na loja
nex_cal_visible: boolean     // visibilidade do calendário mensal em /habits
nex_last_reset:  string      // 'YYYY-MM-DD' — controle do reset diário
nex_devmode:     string      // 'true' | 'false'
nex_apikey:      string      // chave Claude API (opt-in do usuário)
```

### Itens da loja

```
Utilitários: util_progress (gratuito) | util_calendar (500 io, togglável) | util_career | util_projects
Avatares:    avatar_eagle | avatar_monk | avatar_lightning | avatar_cosmos (todos gratuitos)
Temas:       theme_sakura | theme_desert (800 io) | theme_dracula | theme_nord (1000 io) | theme_midnight | theme_forest (1200 io)
```

**Padrão de reatividade entre páginas:** ao adquirir ou alternar um item, `Profile.jsx` dispara `window.dispatchEvent(new Event('nex_shop_changed'))`. Componentes interessados (ex: `Habits.jsx`, `BottomNav.jsx`) ouvem esse evento e releem o `localStorage` para atualizar seu estado.

---

## Estado Global — AppContext

```
AppContext
├── habits[]      → nex_habits (migrateHabit() normaliza na leitura/escrita)
├── history{}     → nex_history (atualizado a cada toggleHabit)
├── theme         → nex_theme (applyTheme() injeta vars no :root)
└── soundOn       → nex_sound

Ações expostas:
  toggleHabit(id)   → inverte done, grava DayRecord no history
  saveHabit(habit)  → normaliza via migrateHabit, substitui ou insere
  addHabit(habit)   → id = Date.now(), migra, insere
  deleteHabit(id)   → remove da lista
  resetDay()        → done = false em todos (chamado ao detectar mudança de data)
  setTheme(id)      → applyTheme(id)
  setSoundOn(val)   → persiste em nex_sound
```

### Migração de dados — `migrateHabit()`

Garante compatibilidade retroativa. Campos ausentes recebem valores padrão:

```javascript
function migrateHabit(h) {
  return {
    id:        h.id       ?? Date.now(),
    name:      h.name     ?? 'Hábito',
    done:      h.done     ?? false,
    pts:       h.pts      ?? 20,
    icon:      h.icon     ?? 'PiStarBold',
    priority:  h.priority ?? 'media',
    freq:      h.freq     ?? 'diario',
    days:      Array.isArray(h.days) && h.days.length > 0 ? h.days : [0,1,2,3,4,5,6],
    subtasks:  Array.isArray(h.subtasks) ? h.subtasks : [],
    notes:     h.notes    ?? '',
    estMins:   h.estMins  != null ? Number(h.estMins) : null,
    deadline:  h.deadline ?? null,
    tags:      Array.isArray(h.tags) ? h.tags : [],
    hidden:    h.hidden   ?? false,
    createdAt: h.createdAt ?? null,
  }
}
```

---

## Hooks

### `useHabits()`

```typescript
{
  completed:       number   // hábitos concluídos hoje
  total:           number   // total de hábitos ativos hoje
  rate:            number   // taxa de conclusão 0-100
  totalPoints:     number   // pontos do dia
  allPoints:       number   // total histórico (io acumulado)
  avgPtsPerHabit:  number   // média de pts configurada nos hábitos
}
```

### `useHabitStats(habitId, history)`

```typescript
{
  totalDone: number   // total de vezes concluído
  rate7:     number   // taxa dos últimos 7 dias (0-100)
  streak:    number   // dias consecutivos atual
}
```

Alimenta o `SeedPtsCard` — score = `rate7 × 0.6 + min(streak,30) × 1.3 + min(totalDone,10)`

### `useStats(history)`

```typescript
{
  streak:        number       // sequência atual
  daysActive:    number       // total de dias com atividade
  last7:         DayStat[]    // últimos 7 dias para Chart7Days
  avgRate7:      number       // média últimos 7 dias
  bestDay:       DayStat      // melhor dia da semana
  heatmapWeeks:  WeekData[]   // 52 semanas para HeatmapAnual
}
```

### `useSound(enabled)`

Usa Web Audio API — sem arquivos externos. `AudioContext` criado no primeiro gesto do usuário (exigência Safari/Chrome mobile).

```typescript
{
  playCheck():   void   // acorde Dó-Mi-Sol ao marcar hábito
  playUncheck(): void   // tom descendente ao desmarcar
  playBadge():   void   // fanfarra ao desbloquear badge
  playSuccess(): void   // acorde ascendente
}
```

---

## Serviços

### `themes.js`

```javascript
// 8 temas disponíveis
export const THEMES = {
  light, dark, midnight, forest, sakura, desert, dracula, nord
}

// Aplica variáveis CSS no :root e data-theme no <html>
export function applyTheme(themeId: string): void

// Lê nex_theme do localStorage e aplica antes do React montar
export function initTheme(): string
```

Variáveis CSS por tema: `--bg`, `--surface`, `--white`, `--ink`, `--ink2`, `--ink3`, `--border`, `--shadow`

### `levels.js`

```javascript
// 6 níveis em ordem crescente de pontuação (io)
const LEVELS = [
  { min:       0, name: 'Impulso',  color: '#a0522d', Icon: PiLightningBold,            mantra: 'Algo começou.' },
  { min:     500, name: 'Rastro',   color: '#2e7d32', Icon: PiPencilSimpleBold,          mantra: 'Você está deixando marca.' },
  { min:   4_000, name: 'Ritmo',    color: '#1565c0', Icon: PiArrowCounterClockwiseBold, mantra: 'Previsível. Confiável.' },
  { min:  15_000, name: 'Forma',    color: '#6a1b9a', Icon: PiFireBold,                  mantra: 'Isso é parte de você.' },
  { min:  50_000, name: 'Essência', color: '#b71c1c', Icon: PiTrophyBold,                mantra: 'Difícil separar da pessoa.' },
  { min: 200_000, name: 'Raiz',     color: '#1b5e20', Icon: PiLeafBold,                  mantra: 'Impossível arrancar.' },
]

export function calcLevel(earnedIo): {
  name, color, Icon, mantra, nextName, next, prog
}
```

Limiares calibrados para ~70 io/dia (5 hábitos × 20pts × 70% taxa):
- Rastro: ~1 semana · Ritmo: ~2 meses · Forma: ~7 meses · Essência: ~2 anos · Raiz: ~8 anos

### `storage.js`

```javascript
export function loadStorage(key: string, fallback: any): any
export function saveStorage(key: string, value: any): void
// Ambos tratam JSON.parse/stringify com try/catch silencioso
```

### `claudeAPI.js`

Arquivo preparado para integração futura. Estrutura de funções documentadas. Não é importado em nenhuma página atualmente.

---

## Telas e Componentes

### Home (`/`)

| Componente | Função | Dados |
|---|---|---|
| WordOfDay | Palavra motivacional PT-BR curada | `nex_wod_YYYY-MM-DD` (cache diário) |
| ProgressoCard | Barra + 4 stats | `habits`, `history` |
| UrgentesCard | Pendentes com filtros e ordenação | `habits` |
| Chart7Days | Gráfico de barras 7 dias | `history` (desbloqueado: daysActive ≥ 7) |
| HeatmapAnual | Grade 52×7 com intensidade | `history` (desbloqueado: daysActive ≥ 30) |

> **Dev mode bypass:** quando `nex_devmode = 'true'`, `effectiveDays = 99` — todos os gráficos desbloqueados.

### Habits (`/habits`)

| Componente | Função |
|---|---|
| HabitCard | Card expansível com seta animada (max-height CSS) |
| EditPanel | 2 abas: **Simples** (Nome, Prioridade, Ícone, Repetição, Por que isso importa) · **Avançado** (Etiquetas, Subtarefas, Notas, Tempo estimado, Período preferido, Prazo final) |
| SeedPtsCard | Crescimento visual + pontos unificados — ao final da aba Simples |
| SubtasksEditor | Editor de subtarefas inline |
| MonthCalendar | Calendário mensal com intensidade de cor + botão Hoje + guia interativo (?) |

**Comportamento do calendário:** exibido apenas quando `util_calendar` está adquirido (`nex_shop_owned`) **e** `nex_cal_visible = true`. Quando adquirido mas oculto, não renderiza nada. Quando não adquirido, exibe estado bloqueado com instrução de compra.

**Guia do calendário:** botão `?` no título abre painel passo a passo explicando como interpretar as cores e obter informações. A legenda estática abaixo do calendário foi removida.

**Comportamento de conclusão:** hábitos marcados somem da lista por padrão. Visíveis no filtro `feitos`. Reset automático a cada mudança de data (checkado a cada 30s e no foco da aba).

**Seleção múltipla:** long press (mobile) ou link "Selecionar hábitos para excluir" (desktop). Barra de ação aparece no topo com contador e botão de exclusão.

### Finance (`/finance`)

Três visões controladas por `MonthTabBar` e estado `quickMode`:

| Estado `quickMode` | Visão | Componentes principais |
|---|---|---|
| `null` | Finanças (visão mensal) | MonthTabBar + OverviewCard + TransactionList + MonthGoalCard + CategoryBreakdown |
| `'reserve'` | Reserva de Emergência | EmergencyCard (hero meses protegidos + milestones + depósito rápido) |
| `'meta'` | Metas Financeiras | GoalsCard (criação com ICON_OPTS + aportes com histórico + desfazer) |

**MonthTabBar:** barra deslizante com setas que navega pelos últimos 12 meses. Estado `monthOffset` determina `viewMonth = thisMonth + offset`.

**EmergencyCard:** exibe meses protegidos calculado sobre média real de despesas. Quatro milestones visuais (Começou → 25% → 50% → Completa) com ícones Phosphor. Estado de setup guiado para início.

**GoalsCard:** criação com seletor de 12 ícones Phosphor (`ICON_OPTS`), aportes com histórico scrollável e desfazer último aporte. Separação visual entre metas ativas e concluídas.

### Progress (`/progress`) — Experiência

Tela unificada de evolução pessoal com dois tabs principais: **Conquistas** e **Estatísticas**.

**Tab Conquistas:**

| Componente | Função |
|---|---|
| LevelBlock | Ícone + nome + mantra do nível atual com cor do nível |
| Barra XP | Progresso para o próximo nível em io |
| WeekBars | Barras dos últimos 7 dias (hábitos feitos por dia) |
| BadgeCard | 8 badges com lógica real de desbloqueio |
| ChallengeCard | 10 desafios semanais (renovam toda segunda-feira) |

**Badges (BADGES):**

| Badge | Condição |
|---|---|
| Primeiro Passo | Completar qualquer hábito |
| Meio Caminho | 50% dos hábitos do dia |
| Dia Perfeito | 100% dos hábitos num dia |
| Chama Viva | Streak de 3 dias |
| Semana Completa | Streak de 7 dias |
| Veterano | 30 dias ativos no total |
| Arquiteto | 7 ou mais hábitos cadastrados |
| Acumulador | 500 io no total |

**Desafios semanais:** 10 desafios construídos via `buildChallenges(habits, history)`, calculando atividade da semana atual (seg–dom). Renovam toda segunda-feira.

**Tab Estatísticas** — gráficos desbloqueados progressivamente por `daysActive`:

| Threshold | Componente |
|---|---|
| sempre | PersonalRecords (6 cards clicáveis com análise) |
| 3 dias | TrendChart (linha 30 dias) |
| 7 dias | WeekdayChart + ConsistencyRanking |
| 14 dias | StreaksChart + PriorityChart |

### Career (`/career`)

Três abas: Estudos (livros/cursos/artigos) · Metas (marcos checkáveis) · Projetos (kanban leve).

Ativado em Perfil → Carreira na navegação (`util_career`).

### Projects (`/projects`)

Status clicável com log de atividade automático. Filtros: Ativos / Planejando / Feitos / Vencidos.

Ativado em Perfil → Projetos na navegação (`util_projects`).

### Mentor (`/mentor`) — 🚧 Em desenvolvimento

Tela ainda não finalizada. O arquivo `Mentor.jsx` existe com estrutura de diário de reflexão (entradas, tags, busca, humor), mas a tela não está disponível na navegação e o design/funcionalidades ainda estão sendo definidos.

### Profile (`/profile`)

| Seção | Componente / Função |
|---|---|
| Hero | HeroCard (avatar emoji, nome, nível com ícone Phosphor, barra XP) |
| Evolução | MonthlyChart (SVG + tendência 30 dias) |
| Aparência | ThemePicker (dropdown com 8 temas, cadeado para pagos) — botão ocupa largura total |
| Loja | RewardsShop (drawer animado com utilitários, avatares e temas) |
| Navegação | Toggles para Experiência (grátis), Carreira e Projetos |
| Dados | Exportar/importar JSON + resetar dia |
| IA | AITeaser (roadmap + privacidade) |
| Dev | DevCard (dados demo em todos os pilares, simula 120 dias) |
| Footer | LegalModal (Termos, Privacidade, Cookies) |

**Loja (SHOP_ITEMS)** — itens ordenados por custo crescente, gratuitos primeiro:

| ID | Nome | Custo | Categoria | Observação |
|---|---|---|---|---|
| `util_progress` | Experiência | Grátis | Utilitário | Adiciona /progress à navegação |
| `util_calendar` | Calendário | 500 io | Utilitário | Toggle após aquisição; controla `nex_cal_visible` |
| `avatar_eagle` | Águia 🦅 | Grátis | Avatar | — |
| `avatar_monk` | Monge 🧘 | Grátis | Avatar | — |
| `avatar_lightning` | Relâmpago ⚡ | Grátis | Avatar | — |
| `avatar_cosmos` | Cosmos 🪐 | Grátis | Avatar | — |
| `theme_sakura` | Sakura 🌸 | 800 io | Tema | — |
| `theme_desert` | Desert 🏜️ | 800 io | Tema | — |
| `theme_dracula` | Dracula 🧛 | 1.000 io | Tema | — |
| `theme_nord` | Nord 🏔️ | 1.000 io | Tema | — |
| `theme_midnight` | Midnight 🌌 | 1.200 io | Tema | — |
| `theme_forest` | Forest 🌿 | 1.200 io | Tema | — |

**Toggle component:** itens da loja com `toggle: true` (ex: `util_calendar`) exibem o componente `Toggle` padrão do app após aquisição, em vez de um checkmark estático. Itens toggleáveis não têm opacidade reduzida.

---

## Navegação

```
Barra fixa (sempre visível):
  /          Início      PiHouseBold
  /habits    Hábitos     PiCheckSquareBold
  /finance   Finanças    PiCurrencyDollarBold
  /profile   Perfil      PiUserCircleBold

Desbloqueáveis (controlados por nex_shop_owned):
  /progress  util_progress  → PiChartBarBold  (Experiência — gratuito)
  /career    util_career    → PiBriefcaseBold (Carreira)
  /projects  util_projects  → PiRocketLaunchBold (Projetos)

Acessível por rota direta (sem item de nav):
  /mentor    Diário
```

Itens desbloqueáveis animam com `entering → visible` (pop + brilho). Estado sincronizado via evento `nex_shop_changed` e listener de `storage`.

---

## Sistema de Temas

```javascript
// Aplicado em main.jsx ANTES do React montar (evita flash)
const savedTheme = localStorage.getItem('nex_theme') || 'light'
applyTheme(savedTheme)

// applyTheme injeta variáveis no :root e data-theme no <html>
// CSS Modules usa var(--bg), var(--ink), etc.
// Temas escuros: [data-theme='dark'] .classe { ... }
```

**Temas gratuitos:** light, dark

**Temas da loja (io):**

| Tema | Custo | Estilo |
|---|---|---|
| Sakura | 800 io | Rosa minimalista |
| Desert | 800 io | Terracota |
| Dracula | 1.000 io | Roxo escuro |
| Nord | 1.000 io | Azul ártico |
| Midnight | 1.200 io | Azul profundo |
| Forest | 1.200 io | Verde musgo |

---

## Sistema de Pontos e Níveis

```javascript
// Pontos acumulados — calculado em useHabits()
const avgPtsPerHabit = média dos habit.pts de todos os hábitos
const allPoints = Σ(history[day].done × avgPtsPerHabit) + todayPoints

// 6 Níveis (io = pontos acumulados)
0–499       → Impulso   (marrom)
500–3.999   → Rastro    (verde escuro)
4k–14.999   → Ritmo     (azul)
15k–49.999  → Forma     (roxo)
50k–199.999 → Essência  (vermelho)
200k+       → Raiz      (verde profundo)
```

**Semente de crescimento por hábito:**
```javascript
score = min(100, rate7 × 0.6 + min(streak, 30) × 1.3 + min(totalDone, 10))
// Estágios: 0=Semente, 20=Broto, 40=Muda, 65=Arbusto, 85=Árvore
```

---

## PWA e Service Worker

**Estratégia:** Stale-While-Revalidate

- Responde do cache imediatamente (offline funciona na mesma velocidade)
- Atualiza o cache em background após a resposta
- Fallback para `offline.html` quando offline e sem cache
- Versão atual: `nex-v2` — limpa caches de versões anteriores no activate

```javascript
// sw.js — fluxo de fetch
cache.match(request) → cached || fetch(request)
  → fetch: atualiza cache em background
  → fetch falhou + navigate: retorna offline.html
```

**Instalação iOS:** Safari → Compartilhar → Adicionar à Tela de Início

---

## Inteligência Artificial

A integração está preparada mas não ativada. O arquivo `claudeAPI.js` existe com a estrutura de funções documentada. Não é importado em nenhuma página atualmente.

**Princípios de design:**
1. Opt-in explícito — nunca automático
2. Chave de API do usuário — nunca de um servidor compartilhado (`nex_apikey`)
3. Controle granular — usuário escolhe quais dados enviar
4. Sem armazenamento intermediário — dados vão do dispositivo direto para a API Anthropic
5. Conformidade LGPD

**Funcionalidades planejadas por pilar:**

| Pilar | Funcionalidade | Dados enviados |
|---|---|---|
| Hábitos | Análise de padrões e sugestões | `history` (últimos 30 dias), `habits` |
| Finanças | Insight de gastos | `transactions` (sem dados bancários) |
| Projetos | Priorização de marcos | `projects` (status e prazos) |
| Carreira | Próximos passos | `readings`, `career_goals` |
| Bem-estar | Reflexão guiada | `journal` (entradas selecionadas) |

---

## Documentação Legal

Os três documentos legais estão implementados como bottom sheet dentro do app (`LegalModal.jsx`).

### Termos de Uso — Pontos principais

- Dados armazenados exclusivamente no dispositivo do usuário
- App fornecido "como está", sem garantias de disponibilidade contínua
- IA requer chave própria e consentimento explícito
- Conteúdo gerado por IA não substitui orientação profissional
- Sem backup automático — usuário responsável por exportar regularmente

### Política de Privacidade — Pontos principais

- Nenhuma coleta de dados por parte do ioversoroot
- Nenhum analytics ou rastreamento de comportamento
- Nenhum cookie de terceiros
- IA processada diretamente pela API Anthropic, sob a política deles
- Dados excluídos via Perfil → Seus Dados → ou limpeza do navegador
- Conformidade com LGPD (Lei nº 13.709/2018)
- Direitos do usuário: acesso, correção e exclusão exercidos diretamente no app

### Política de Cookies — Pontos principais

O ioversoroot não usa cookies. Usa `localStorage` (armazenamento local, não transmitido):

| Chave | Conteúdo |
|---|---|
| `nex_habits` | Hábitos e configurações |
| `nex_history` | Histórico de conclusão |
| `nex_fin_*` | Dados financeiros |
| `nex_career_*` | Carreira e estudos |
| `nex_projects` | Projetos de vida |
| `nex_journal` | Diário de reflexão |
| `nex_shop_owned` | Itens desbloqueados na loja |
| `nex_cal_visible` | Visibilidade do calendário em /habits |
| `nex_theme` | Tema visual |
| `nex_sound` | Preferência de sons |
| `nex_username`, `nex_avatar` | Perfil |
| `nex_last_reset` | Controle de reset diário |
| `nex_devmode` | Modo desenvolvedor |

Fontes externas carregadas (sem rastreamento): Google Fonts (Space Grotesk + Inter).

---

*ioversoroot v0.2.0 · © 2025–2026 · Todos os direitos reservados*

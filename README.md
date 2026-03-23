# Rootio — Evolução Pessoal com IA

Aplicativo de desenvolvimento pessoal que une rastreamento de hábitos, finanças, carreira e mentoramento com IA — tudo armazenado localmente, sem conta obrigatória.

---

<<<<<<< HEAD
<img width="1153" height="801" alt="project8" src="https://github.com/user-attachments/assets/ee4dfc19-ac08-438b-921a-746f24a4deba" />


## Visão Geral

=======
## Visão Geral

>>>>>>> 93f48be ((fix) prepare to upscale app with navigation map)
| Área | O que faz |
|---|---|
| **Hábitos** | CRUD completo com subtarefas, prioridades, frequência personalizada e histórico |
| **Finanças** | Lança receitas/despesas, define metas de economia e fundo de emergência |
| **Progresso** | Dashboard analytics com heatmap 52 semanas, sequências e badges |
| **Carreira** | Rastreia leituras, metas profissionais e projetos |
| **Projetos** | Gerencia projetos pessoais com milestones |
| **Mentor** | Chat em tempo real com Claude + diário com PIN e registro de humor |
| **Perfil** | Temas, avatar, plano free/pro, loja de desbloqueáveis e gestão de dados |

---

## Tech Stack

- **React 18** + **Vite 5** — build e dev server
- **React Router v6** — navegação client-side com lazy loading
- **Context API** — estado global (hábitos, histórico, tema, som)
- **CSS Modules** — estilos escopados por componente
- **Web Audio API** — sons procedurais sem arquivos de áudio
- **localStorage** — persistência local-first, offline por padrão
- **Anthropic Claude API** — IA com streaming para mentor e sugestões

---

## Instalação

```bash
git clone https://github.com/seu-usuario/ioversoroot
cd ioversoroot
npm install
npm run dev
```

**Opcional — IA (Mentor e sugestões de hábitos):**

```bash
# .env.local
IA_KEY=sk-ant-...
```

Ou insira a chave diretamente em **Perfil → Preferências → Chave de API**.

---

## Scripts

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção
npm run preview  # preview local do build
```

---

## Estrutura de Pastas

```
src/
├── pages/          # telas da aplicação (lazy-loaded)
│   ├── Home.jsx        → dashboard principal
│   ├── Habits.jsx      → gerenciador de hábitos
│   ├── Finance.jsx     → controle financeiro
│   ├── Progress.jsx    → analytics e conquistas
│   ├── Mentor.jsx      → chat com IA + diário
│   ├── Career.jsx      → desenvolvimento de carreira
│   ├── Projects.jsx    → projetos pessoais
│   └── Profile.jsx     → perfil, loja e configurações
│
├── components/     # UI compartilhada
│   ├── BottomNav.jsx   → navegação mobile
│   ├── SideNav.jsx     → navegação desktop
│   ├── Header.jsx      → cabeçalho mobile
│   ├── Toast.jsx       → notificações globais
│   ├── CheckBox.jsx    → checkbox animado acessível
│   ├── OfflineBanner.jsx
│   └── SplashScreen.jsx
│
├── context/
│   └── AppContext.jsx  → estado global da aplicação
│
├── hooks/
│   ├── useHabits.js    → métricas do dia atual
│   ├── useStats.js     → analytics semanais/anuais
│   └── useSound.js     → Web Audio API
│
├── services/
│   ├── storage.js      → wrapper localStorage
│   ├── levels.js       → sistema de progressão (6 níveis)
│   ├── themes.js       → 9 temas com variáveis CSS
│   └── claudeAPI.js    → integração Anthropic
│
└── styles/
    └── global.css      → reset, variáveis, utilitários
```

---

## Funcionalidades Principais

### Sistema de Pontos (io)
Cada hábito concluído gera pontos (`io`). Pontos acumulam para:
- Subir de nível (6 tiers: Impulso → Raiz)
- Comprar desbloqueáveis na Loja

### Gamificação
- **6 níveis** com mantras e barras de progresso
- **8 conquistas** (badges) com critérios específicos
- **3 desafios semanais** rotativos
- Sons procedurais em todas as interações

### Desbloqueáveis (Loja)
Comprados com `io` acumulados:

| ID | Item | Desbloqueia |
|---|---|---|
| `util_progress` | Página Experiência | Analytics completo + heatmap |
| `util_career` | Página Carreira | Leituras, metas e projetos profissionais |
| `util_projects` | Página Projetos | Projetos pessoais com milestones |
| `util_mentor` | Página Mentor | Chat com IA + diário com PIN |
| `avatar_*` | Avatares | 4 emojis exclusivos no perfil |

### Plano Pro
Ativado via Perfil → Plano. Desbloqueia:
- **Insights** no dashboard (tendência 14 dias, melhor dia da semana, consistência 30d)
- Acesso completo à aba Analytics no Progress

### Temas
9 temas disponíveis com transição suave: **Light, Dark, Midnight, Forest, Sakura, Desert, Dracula, Nord, Glass**

---

## Armazenamento Local

Todos os dados ficam no `localStorage` com prefixo `nex_`:

```
nex_habits              → array de hábitos
nex_history             → histórico diário { "YYYY-MM-DD": {...} }
nex_theme               → tema atual
nex_sound               → preferência de som
nex_shop_owned          → itens comprados na loja
nex_plan                → "free" | "pro"
nex_fin_transactions    → transações financeiras
nex_fin_goals           → metas de economia
nex_career_readings     → leituras e cursos
nex_career_goals        → metas profissionais
nex_journal_pin         → PIN do diário (hash btoa)
```

Exportação/importação JSON disponível em **Perfil → Dados**.

---

## Acessibilidade

- Landmarks semânticos: `<nav>`, `<main>`, `<aside>`, `<header>`
- `aria-current="page"` nos links ativos
- `aria-live="polite"` nas notificações toast
- `aria-hidden` em ícones decorativos
- `role="checkbox"` com `aria-checked` no componente CheckBox
- Navegação por teclado em todos os elementos interativos
- Contraste conforme WCAG 2.1

---

## Deploy

O projeto está configurado para deploy no **Vercel** (`.vercel/project.json` incluso). Qualquer push para `main` dispara o deploy automático.

```bash
vercel --prod  # deploy manual
```

---

## Licença

Projeto pessoal — todos os direitos reservados.

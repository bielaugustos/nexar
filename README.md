<h1 style='color:orange'> Rootio — Sua Evolução Pessoal com IA </h1>

Um app de crescimento pessoal que combina rastreamento de hábitos, finanças, carreira e mentoria com IA — tudo roda localmente, sem necessidade de criar conta.

![alt text](public/icons/preview.webp)

<p style="color:pink"> Imagem de exenplo: (Se fosse gerado pela IA desta era, seriam muitas excessões e parâmetros) </p>

---

## O que rolou no app

| Módulo |Features |
|--------|----------|
| **Hábitos** | CRUD completo, subtarefas, prioridades, frequência自定义 e histórico |
| **Finanças** | Registra receitas/despesas, metas de economia e fundo de emergência |
| **Progresso** | Dashboard analytics com heatmap 52 semanas, sequências e badges |
| **Carreira** | Acompanha leituras, metas profissionais e projetos |
| **Projetos** | Gerencia projetos pessoais com milestones |
| **Mentor** | Chat em tempo real com Claude + diário com PIN e humor do dia |
| **Perfil** | Temas, avatar, plano free/pro, loja de goodies e gestão de dados |

---

## 🚀 Stack

- **React 18** + **Vite 5** — build e dev server
- **React Router v6** — navegação client-side com lazy loading
- **Context API** — estado global (hábitos, histórico, tema, som)
- **CSS Modules** — estilos escopados por componente
- **Web Audio API** — sounds procedurais, zero arquivos de áudio
- **localStorage** — persistência local-first, offline por padrão
- **Anthropic Claude API** — IA com streaming para mentor e suggestions

---

## 🧭 Mapa de Rotas

```
/                   → Home (dashboard)
/habits             → Hábitos
/finance            → Finanças
/progress           → Experiência        🔒 requer purchase na loja
/mentor             → Mentor             🔒 requer purchase na loja
/career             → Carreira           🔒 requer purchase na loja
/projects           → Projetos           🔒 requer purchase na loja
/profile            → Perfil
/*                  → redireciona para /
```

---

## 💾 Como a sync funciona

```
Arquitetura: offline-first
  localStorage → fonte primária (always available)
  Supabase     → sincronização em background (quando logado)

Escrita (hábitos):
  toggleHabit / saveHabit / addHabit / deleteHabit
      │
      ▼
  setHabits (atualiza React state)
      │
      ├── saveStorage('nex_habits', ...)  ← imediato
      │
      └── upsertRows('habits', ...)       ← background (.catch warn)
          (só se isLoggedIn && userId)

Leitura no login:
  INITIAL_SESSION + !hasLocalData()
      │
      ▼
  loadFromSupabase(userId)
      │
      ▼
  applyRemoteData(data)  → salva em localStorage
      │
      ▼
  window.location.reload()

Tabelas syncadas:
  habits · habit_history · transactions
  financial_goals · emergency_fund
  career_readings · career_goals · career_projects
  life_projects · journal
```

---

## ♿ Acessibilidade

- Landmarks semânticos: `<nav>`, `<main>`, `<aside>`, `<header>`
- `aria-current="page"` nos links ativos
- `aria-live="polite"` nas notificações toast
- `aria-hidden` em ícones decorativos
- `role="checkbox"` com `aria-checked` no componente CheckBox
- Keyboard navigation em todos os interactive elements
- Contraste conforme WCAG 2.1

---

## 📄 Licença

Projeto pessoal — todos os direitos reservados.

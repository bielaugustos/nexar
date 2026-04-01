# Rootio — Plataforma de Desenvolvimento Pessoal Inteligente

Uma solução SaaS de desenvolvimento pessoal que integra rastreamento de hábitos, gestão financeira, planejamento de carreira e mentoria com inteligência artificial. Arquitetura offline-first com sincronização em nuvem opcional, proporcionando privacidade máxima e acessibilidade universal.

![Rootio Preview](public/icons/preview.webp)

---

## Visão Geral do Produto

Rootio é uma plataforma digital de autogestão projetada para profissionais e indivíduos que buscam otimizar seu desenvolvimento pessoal de forma estruturada e orientada por dados. A solução combina funcionalidades essenciais de produtividade com IA generativa para oferecer uma experiência personalizada e escalável.

### Proposição de Valor

- **Privacidade por Design**: Dados armazenados localmente com opção de backup criptografado na nuvem
- **IA Contextual**: Mentoria personalizada baseada em padrões de comportamento e objetivos do usuário
- **Arquitetura Resiliente**: Funcionalidade completa offline com sincronização transparente
- **Gamificação Estratégica**: Sistema de engajamento baseado em progresso e conquistas
- **Escalabilidade Técnica**: Arquitetura modular preparada para expansão de funcionalidades

---

## Módulos do Produto

| Módulo | Funcionalidades Principais | Valor de Negócio |
|---------|-------------------------|-------------------|
| **Hábitos** | CRUD completo, subtarefas, priorização, frequência configurável, histórico detalhado | Aumento de produtividade através de rastreamento sistemático |
| **Finanças** | Registro de transações, metas de economia, fundo de emergência, categorização inteligente | Controle financeiro com visualização de tendências |
| **Progresso** | Dashboard analítico, heatmap anual, sequências de consistência, sistema de badges | Motivação através de visualização de progresso |
| **Carreira** | Acompanhamento de leituras, metas profissionais, gestão de projetos | Alinhamento entre aprendizado e objetivos de carreira |
| **Projetos** | Gestão de projetos pessoais com milestones e prazos | Organização de iniciativas complexas |
| **Mentor IA** | Chat em tempo real com Claude, diário com PIN, rastreamento de humor | Orientação personalizada baseada em IA |
| **Perfil** | Personalização de temas, avatar, gestão de plano (Free/Pro), loja de funcionalidades | Experiência customizada e monetização |

---

## Arquitetura Técnica

### Stack Tecnológica

- **Frontend**: React 18 + Vite 5 — Build otimizado e desenvolvimento ágil
- **Navegação**: React Router v6 — Routing client-side com lazy loading de componentes
- **Gerenciamento de Estado**: Context API — Estado global centralizado e escalável
- **Estilização**: CSS Modules — Componentes com estilos escopados e manuteníveis
- **Áudio**: Web Audio API — Sons procedurais, zero dependências de assets
- **Persistência**: localStorage — Arquitetura local-first com fallback em nuvem
- **Inteligência Artificial**: Anthropic Claude API — Streaming em tempo real para interações naturais

### Diferenciais Técnicos

1. **Offline-First Architecture**: Funcionalidade completa sem conexão à internet
2. **Sincronização Híbrida**: LocalStorage como fonte primária, Supabase como backup opcional
3. **Performance Otimizada**: Lazy loading, code splitting e renderização eficiente
4. **Acessibilidade WCAG 2.1**: Conformidade com padrões internacionais de acessibilidade
5. **Progressive Web App**: Suporte a instalação nativa e funcionalidade offline

---

## Mapa de Funcionalidades

```
/                   → Dashboard Principal
/habits             → Gestão de Hábitos
/finance            → Controle Financeiro
/progress           → Analytics e Métricas      🔒 Premium
/mentor             → Mentoria com IA            🔒 Premium
/career             → Planejamento de Carreira  🔒 Premium
/projects           → Gestão de Projetos        🔒 Premium
/profile            → Configurações de Perfil
/*                  → Redirecionamento para Home
```

**Nota**: Funcionalidades Premium desbloqueadas através de compras na loja interna.

---

## Estratégia de Sincronização

### Arquitetura de Dados

```
Offline-First Architecture:
  localStorage → Fonte Primária (sempre disponível)
  Supabase     → Backup e Sincronização (quando autenticado)
```

### Fluxo de Escrita

```
Operação (hábitos, finanças, etc.)
    │
    ▼
Atualização de Estado React
    │
    ├── saveStorage('nex_*', ...)  ← Persistência imediata (local)
    │
    └── upsertRows('table', ...)     ← Sincronização em background (nuvem)
        (condicional: isLoggedIn && userId)
```

### Fluxo de Leitura

```
Login Inicial + Ausência de Dados Locais
    │
    ▼
loadFromSupabase(userId)
    │
    ▼
applyRemoteData(data)  → Persistência em localStorage
    │
    ▼
Recarregamento da Aplicação
```

### Entidades Sincronizadas

- `habits` — Lista de hábitos ativos
- `habit_history` — Histórico de conclusões diárias
- `transactions` — Transações financeiras
- `financial_goals` — Metas de economia
- `emergency_fund` — Reserva de emergência
- `career_readings` — Leituras de desenvolvimento profissional
- `career_goals` — Metas de carreira
- `career_projects` — Projetos profissionais
- `life_projects` — Projetos pessoais
- `journal` — Diário de reflexões

---

## Acessibilidade e Inclusão

### Conformidade WCAG 2.1

- **Landmarks Semânticos**: Uso correto de `<nav>`, `<main>`, `<aside>`, `<header>`
- **Navegação por Teclado**: Todos os elementos interativos acessíveis via keyboard
- **ARIA Attributes**: `aria-current="page"`, `aria-live="polite"`, `aria-hidden`
- **Contraste Visual**: Cores em conformidade com rácios de contraste WCAG
- **Screen Readers**: Componentes com descrições apropriadas para leitores de tela

### Design Inclusivo

- Interface responsiva adaptável a diferentes tamanhos de tela
- Suporte a tecnologias assistivas
- Feedback visual e auditivo para ações do usuário
- Personalização de temas para acessibilidade visual

---

## Modelo de Negócio

### Estrutura de Monetização

- **Plano Gratuito**: Acesso a funcionalidades essenciais (Hábitos, Finanças, Perfil)
- **Plano Premium**: Acesso a funcionalidades avançadas (Progresso, Mentor, Carreira, Projetos)
- **Loja de Funcionalidades**: Desbloqueio individual de módulos específicos

### Estratégia de Crescimento

1. **Engajamento**: Gamificação e sistema de conquistas
2. **Retenção**: IA personalizada e progresso visível
3. **Monetização**: Upgrade para Premium através de valor percebido
4. **Expansão**: Novos módulos baseados em feedback de usuários

---

## Licença e Propriedade Intelectual

Este projeto é propriedade exclusiva. Todos os direitos reservados.

© 2024 Rootio. Todos os direitos reservados.

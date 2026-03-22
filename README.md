# ioversoroot — Evolução Pessoal

> **Versão 0.1.0** · 2025/2026 · React + Vite · PWA Offline-First

ioroot é um aplicativo de desenvolvimento pessoal organizado em **5 pilares de vida**. Funciona 100% offline — todos os seus dados ficam no seu dispositivo, nunca em servidores externos. Com conexão à internet, a integração com Inteligência Artificial (em desenvolvimento) expande as capacidades de análise e personalização.

---

## Sumário

- [Instalação](#instalação)
- [Funcionalidades](#funcionalidades)
- [Inteligência Artificial](#inteligência-artificial)
- [Privacidade e Dados](#privacidade-e-dados)
- [PWA — Instalar no Celular](#pwa--instalar-no-celular)
- [Stack Técnica](#stack-técnica)
- [Desenvolvimento](#desenvolvimento)
- [Roadmap](#roadmap)
- [Licença](#licença)

---

## Instalação

### Pré-requisitos

- Node.js 18+
- npm 9+

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor de desenvolvimento
npm run dev
# Acesse: http://localhost:5173

# 3. Build para produção
npm run build

# 4. Preview do build
npm run preview
```

### Deploy (Vercel)

```bash
npm install -g vercel
npm run build
vercel --prod
```

---

## Funcionalidades

### Início

A tela principal do seu dia.

- **Palavra do Dia** — palavra motivacional em português, rotacionando com 40 palavras curadas
- **Progresso do Dia** — barra de progresso, pontos, sequência atual e recorde pessoal
- **Pendentes de Hoje** — hábitos não concluídos com filtros (Alta, Com prazo, Todos) e ordenação
- **Gráfico de Atividade 7 Dias** — disponível após 7 dias de uso
- **Heatmap Anual** — disponível após 30 dias de uso, visualização do ano com intensidade por cor

> Hábitos concluídos somem da lista automaticamente. Para vê-los, use o filtro **Feitos** na tela Hábitos.

---

### Hábitos

#### Criando um hábito

1. Digite o nome no campo "Adicionar um hábito..." na parte inferior da tela
2. Pressione **Enter** ou clique em **+**
3. Clique no hábito para expandir e configurar os detalhes

#### Configurações — 3 abas

**Aba Geral**
- Nome, Prioridade (Alta / Média / Baixa), Ícone
- **Etiquetas** (até 6) — aparecem como filtros automáticos nos chips
- **Pontos por conclusão** (0–30 pts) e **Semente de crescimento** (Semente → Broto → Muda → Arbusto → Árvore)

**Aba Detalhes**
- Subtarefas (passos dentro do hábito)
- Notas livres

**Aba Frequência**
- Presets: Todo dia / Dias úteis / Fins de semana / Personalizado
- Tempo estimado e Prazo final

#### Filtros disponíveis

Chips deslizáveis: Todos · Pendentes · Feitos · Alta · Média · Baixa · Prazo · Ocultos · #etiqueta

#### Excluir em massa

- **Mobile:** pressione e segure (long press) em qualquer hábito → modo de seleção
- **Desktop:** clique em "Selecionar hábitos para excluir" abaixo dos filtros
- Selecione os hábitos → clique em **Excluir selecionados**

#### Calendário Mensal

Histórico de conclusão com intensidade de cor, navegável entre meses. Botão **Hoje** retorna ao mês atual.

---

### Finanças

Três abas acessíveis pela barra de navegação interna:

**Finanças** — visão mensal completa
- Navegação entre os últimos 12 meses via barra de abas deslizante com setas
- Saldo do mês em destaque com pulso visual ao registrar transações
- Botões de entrada e saída com formulário inline no card de Movimentações
- Categorias de entrada e saída customizáveis
- Meta do mês com barra de progresso e botão para editar ou remover

**Reserva** — Reserva de Emergência
- Hero com número de **meses protegidos** calculado sobre a média real de despesas
- Barra de progresso com status (Adequada / Parcial / Insuficiente)
- Depósito rápido com vibração háptica
- Milestones visuais (Começou → 25% → 50% → Completa)
- Estado de setup guiado para quem ainda não começou

**Metas** — Metas Financeiras
- Criação com seletor de ícone (12 opções Phosphor), nome, valor alvo e prazo
- Aportes com histórico e desfazer último aporte
- Sugestão de aporte mensal automática baseada no prazo
- Separação visual entre metas ativas e concluídas

> Categorias de entrada e saída são customizáveis por tipo.

---

### Carreira

Espaço para crescimento profissional — trabalho, negócio ou ambições.

- **Estudos** — livros, cursos e artigos com status, avaliação por estrelas e notas
- **Metas** — objetivos com marcos checkáveis e barra de progresso
- **Projetos** — kanban leve com tarefas e tags

Ative em **Perfil → Carreira na navegação**.

---

### Projetos

Objetivos de vida pessoal de médio e longo prazo.

*Diferente de Carreira (foco profissional), Projetos é sobre quem você quer se tornar como pessoa.*

- Status clicável (Planejando → Em andamento → Pausado → Concluído)
- Marcos de progresso com barra visual
- Log de atividade automático
- Filtros: Ativos / Planejando / Feitos / Vencidos

Ative em **Perfil → Projetos na navegação**.

---

### Diário

Reflexão pessoal offline com prompts rotativos.

- Registro de humor com 5 estados (ícones Phosphor)
- Tags livres por entrada
- Busca no histórico de reflexões
- Exclusão individual de entradas

---

### Progresso

Tela unificada de evolução pessoal com estatísticas, conquistas e desafios semanais.

**Estatísticas** — gráficos surgem progressivamente por `daysActive`:

| Dias de uso | Gráfico |
|---|---|
| Imediato | Recordes pessoais (6 cards clicáveis com análise) |
| 3 dias | Tendência 30 dias |
| 7 dias | Taxa por dia da semana + Consistência |
| 14 dias | Streaks por hábito + Distribuição de prioridade |

**Conquistas** — 8 badges com lógica real e barra de progresso individual

**Desafios semanais** — 10 desafios que renovam toda segunda-feira

> Use o **Modo Demonstração** (Perfil → Desenvolvedor) para ver todos os gráficos com 120 dias simulados.

Ative em **Perfil → Conquistas na navegação**.

---

### Perfil

- Avatar (emoji) e nome editáveis
- Gráfico de evolução 30 dias
- **Temas:** Padrão · Escuro (gratuitos) + Midnight · Forest · Sakura · Desert · Dracula · Nord (loja)
- Configurações de navegação, sons e dados
- Exportar/importar backup JSON
- Termos, Privacidade e Cookies (dentro do app)

---

## Inteligência Artificial

A integração com IA está **em desenvolvimento**. Quando disponível:

- Requer sua chave de API própria (console.anthropic.com)
- Consentimento explícito antes de qualquer envio de dados
- Você controla quais dados são analisados — nunca envio automático

**5 funcionalidades planejadas:**

| Funcionalidade | Pilar |
|---|---|
| Análise de Hábitos | Hábitos |
| Insight Financeiro | Finanças |
| Mentor de Projetos | Projetos |
| Curador de Carreira | Carreira |
| Reflexão Guiada | Bem-estar |

> Você pode usar o ioversoroot completamente offline e sem IA — todas as funcionalidades principais funcionam sem internet.

---

## Privacidade e Dados

- Dados ficam **exclusivamente no seu dispositivo** (localStorage)
- **Nenhum servidor** recebe seus dados
- **Nenhum analytics** ou rastreamento
- **Nenhum cookie** de terceiros
- IA só ativa com **ação explícita** sua
- Conformidade com a **LGPD** (Lei nº 13.709/2018)

**Backup:** Perfil → Seus Dados → Exportar backup (JSON)

**Excluir dados:** Perfil → Seus Dados → ou limpe os dados do site no navegador

Documentação legal completa dentro do app em **Perfil → Termos / Privacidade / Cookies**.

---

## PWA — Instalar no Celular

### iOS (Safari)
1. Abra no Safari → toque em **Compartilhar** (□↑)
2. Role até **Adicionar à Tela de Início**
3. Confirme o nome → **Adicionar**

### Android (Chrome)
1. Abra no Chrome → menu **⋮** → **Adicionar à tela inicial**

Após instalar, o ioversoroot abre em tela cheia como app nativo e **funciona offline**.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + Vite 5 |
| Roteamento | React Router v6 |
| Estado global | Context API + useState |
| Persistência | localStorage (offline-first) |
| Ícones | Phosphor Icons (react-icons/pi) |
| Fontes | Space Grotesk + Inter |
| Estilo | CSS Modules + variáveis CSS |
| PWA | Service Worker Stale-While-Revalidate |
| IA (planejado) | Claude API — Anthropic |
| Deploy | Vercel |

---

## Desenvolvimento

### Estrutura do projeto

```
ioversoroot-app/
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service Worker
│   ├── offline.html          # Fallback offline
│   └── icons/                # Ícones SVG e PNG
├── src/
│   ├── App.jsx               # Rotas + SplashScreen
│   ├── main.jsx              # Entry point + tema inicial
│   ├── context/AppContext.jsx # Estado global + persistência
│   ├── hooks/                # useHabits, useStats, useSound
│   ├── services/             # themes, storage, claudeAPI
│   ├── components/           # Header, BottomNav, Toast, LegalModal, AITeaser, SplashScreen
│   ├── pages/                # Home, Habits, Finance, Progress, Mentor, Career, Projects, Profile
│   └── styles/global.css     # Variáveis CSS, reset, utilitários
├── package.json
├── vite.config.js
└── index.html
```

### Variáveis CSS de tema

```css
--bg, --surface, --white      /* fundos */
--ink, --ink2, --ink3         /* textos */
--gold, --gold-dk             /* âmbar primário */
--border, --shadow            /* bordas e sombras */
--font-body                   /* Inter */
--font-display                /* Space Grotesk */
```

---

## Roadmap

| Status | Item |
|---|---|
| Concluído | 5 Pilares completos |
| Concluído | PWA offline-first |
| Concluído | 8 temas visuais |
| Concluído | Sistema de pontos e loja |
| Concluído | Documentação legal dentro do app |
| Concluído | UI sem emojis — 100% Phosphor Icons |
| Concluído | Finanças: MonthTabBar + Reserva/Metas redesenhados |
| Em andamento | Integração IA (estrutura pronta) |
| Planejado | Deploy + domínio |
| Planejado | Notificações push |
| Planejado | Login e autenticação |
| Planejado | Sincronização entre dispositivos |

---

## Licença

© 2025–2026 ioversoroot · Todos os direitos reservados.

Desenvolvido como produto Ioversodevlab. Uso pessoal autorizado. Reprodução ou uso comercial sem autorização prévia é proibido.

---

*ioversoroot v0.1.0 · feito com dedicação*

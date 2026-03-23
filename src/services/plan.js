// ══════════════════════════════════════
// SERVIÇO: plan.js
//
// Mapa de features e lógica de permissão.
// Esta camada é PURA — sem side-effects,
// sem imports de React ou contexto.
//
// Supabase-ready: quando migrar, só o
// usePlan.js muda (de onde vem o `plan`).
// Esta camada não precisa ser tocada.
//
// HIERARQUIA DE PLANOS:
//   free → acesso básico
//   pro  → acesso completo
// ══════════════════════════════════════

// ── Nível mínimo exigido por feature ──
//
// Para adicionar uma nova feature:
//   1. Defina o id aqui
//   2. Use can('id') nos componentes
//   3. O gate se aplica automaticamente
//
export const FEATURES = {

  // ─── Livre para todos ───────────────────────────────────
  habits:           'free',  // CRUD de hábitos
  finance_basic:    'free',  // receitas, despesas, metas simples
  history_basic:    'free',  // histórico e gráficos básicos
  rewards:          'free',  // conquistas, badges, desafios semanais

  // ─── Plano Pro ──────────────────────────────────────────
  insights_home:    'pro',   // card de análises avançadas no dashboard
  finance_sixmonth: 'pro',   // gráfico histórico de 6 meses
  export_json:      'pro',   // exportar / importar backup JSON
  ai_suggestions:   'pro',   // sugestões de hábitos geradas por IA
  ai_badge:         'pro',   // badge personalizado gerado por IA
  ai_daily_summary: 'pro',   // resumo diário personalizado via IA
  themes_exclusive: 'pro',   // temas Midnight, Forest, Sakura, Desert,
                             //         Dracula, Nord, Glass

  // ─── Pro OU item da loja ────────────────────────────────
  // Verificação especial: ver canAccess()
  habits_calendar:  'pro',   // visão calendário em hábitos
}

// IDs dos temas base (disponíveis no plano free)
export const THEMES_FREE = ['light', 'dark']

// ══════════════════════════════════════
// FUNÇÃO: canAccess
//
// Verifica se um `plan` tem acesso a
// uma `feature`, com suporte a exceções
// via `shopOwned` (itens da loja).
//
// Parâmetros:
//   plan      — 'free' | 'pro'
//   feature   — chave de FEATURES
//   shopOwned — array de IDs comprados
//               (padrão: [])
//
// Retorna: boolean
//
// Supabase: quando migrar, só o chamador
// (usePlan.js) muda — esta função não.
// ══════════════════════════════════════
export function canAccess(plan, feature, shopOwned = []) {
  const required = FEATURES[feature]

  // Feature desconhecida → liberada por padrão (fail open)
  if (!required) return true

  // Free features → sempre liberadas
  if (required === 'free') return true

  // Pro features → requer plano Pro...
  if (plan === 'pro') return true

  // ...ou item específico na loja (exceções)
  if (feature === 'habits_calendar') return shopOwned.includes('util_calendar')

  return false
}

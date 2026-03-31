// ══════════════════════════════════════
// SERVIÇO DE ANALYTICS — PostHog
//
// Rastreia eventos de uso para entender
// como os usuários interagem com o app.
//
// Configuração:
//   • VITE_POSTHOG_KEY — chave do projeto PostHog
//   • VITE_POSTHOG_HOST — host do PostHog (opcional)
//
// Uso:
//   import { analytics } from '../services/analytics'
//   analytics.track('event_name', { prop: 'value' })
//   analytics.identify(userId, { email, username })
// ══════════════════════════════════════

import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

// ── Inicialização ──
export function initAnalytics() {
  if (!POSTHOG_KEY) {
    console.warn('[Analytics] PostHog não configurado — analytics desativado.')
    return
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true,           // Captura cliques automaticamente
    capture_pageview: true,      // Captura navegação entre páginas
    capture_pageleave: true,     // Captura quando usuário sai da página
    persistence: 'localStorage', // Usa localStorage em vez de cookies
    disable_session_recording: true, // Desabilita gravação de sessão por padrão
    opt_out_capturing_by_default: false,
  })

  console.log('[Analytics] PostHog inicializado')
}

// ── Identificar usuário ──
export function identifyUser(userId, traits = {}) {
  if (!POSTHOG_KEY) return
  posthog.identify(userId, traits)
}

// ── Rastrear evento ──
export function trackEvent(eventName, properties = {}) {
  if (!POSTHOG_KEY) return
  posthog.capture(eventName, properties)
}

// ── Rastrear página ──
export function trackPageView(pageName, properties = {}) {
  if (!POSTHOG_KEY) return
  posthog.capture('$pageview', {
    $current_url: window.location.href,
    page_name: pageName,
    ...properties,
  })
}

// ── Resetar identificação (logout) ──
export function resetUser() {
  if (!POSTHOG_KEY) return
  posthog.reset()
}

// ── Objeto de conveniência ──
export const analytics = {
  init: initAnalytics,
  identify: identifyUser,
  track: trackEvent,
  page: trackPageView,
  reset: resetUser,
}

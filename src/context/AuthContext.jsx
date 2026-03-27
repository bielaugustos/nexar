// src/context/AuthContext.jsx
// ══════════════════════════════════════════════════════
// IOROOT — Contexto de Autenticação
//
// Offline-first: todas as chamadas de rede usam try/catch
// com timeout de 5s. Nunca bloqueia o app por falta de
// conexão — o estado local é suficiente para funcionar.
//
// Quando a conexão é restaurada:
//   • Recarrega o perfil do usuário autenticado
//   • Os contextos (AppContext, Finance…) re-sincronizam
//     via seus próprios useEffects ao mudar isLoggedIn/userId
// ══════════════════════════════════════════════════════
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, getSession, getProfile, onAuthChange } from '../services/supabase'
import { loadFromSupabase, hasLocalData, applyRemoteData } from '../services/syncService'

const AuthContext = createContext(null)

// ── Timeout para chamadas de rede — evita hang offline ──
function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ])
}

export function AuthProvider({ children }) {
  const [session,  setSession]  = useState(null)
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  // ── Carrega perfil com tolerância a falha offline ──
  const loadProfile = useCallback(async (userId) => {
    try {
      const { data } = await withTimeout(getProfile(userId))
      if (data) setProfile(data)
    } catch {
      // Offline ou timeout — continua sem perfil (dados locais são suficientes)
    }
  }, [])

  // ── Inicialização ──
  useEffect(() => {
    // Não carrega sessão se estamos na página de reset de senha
    // Isso permite que o token de recuperação seja processado pela página ResetPassword
    if (window.location.hash.includes('access_token') && window.location.hash.includes('type=recovery')) {
      setLoading(false)
      return
    }

    // Lê sessão do cache local (não faz request de rede)
    getSession()
      .then(async (s) => {
        setSession(s)
        if (s?.user) await loadProfile(s.user.id)
        setLoading(false)
      })
      .catch(() => {
        // Supabase não configurado ou falha inesperada
        setLoading(false)
      })

    // Escuta mudanças de auth (login, logout, token refresh)
    const { data: { subscription } } = onAuthChange(async (event, s) => {
      if (s?.user) {
        // ── Sync inicial: só em INITIAL_SESSION sem dados locais (ex: novo dispositivo) ──
        // SIGNED_IN ignorado para evitar loop: reload → sync → reload
        const shouldSync = event === 'INITIAL_SESSION' && !hasLocalData()

        if (shouldSync) {
          try {
            const remoteData = await withTimeout(loadFromSupabase(s.user.id), 8000)
            const hasRemote  = [
              remoteData.habits, remoteData.transactions, remoteData.journal,
              remoteData.career_readings, remoteData.life_projects,
            ].some(arr => arr?.length > 0)

            if (hasRemote) {
              applyRemoteData(remoteData)
              window.location.reload()
              return
            }
          } catch {
            // Offline — pula sync inicial, segue com dados locais
          }
        }

        setSession(s)
        await loadProfile(s.user.id)
      } else {
        setSession(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  // ── Retry ao reconectar: recarrega perfil se estava offline ──
  useEffect(() => {
    function handleOnline() {
      const userId = session?.user?.id
      if (userId && !profile) loadProfile(userId)
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [session, profile, loadProfile])

  const plan      = profile?.plan ?? 'free'
  const isLoggedIn = !!session?.user

  const value = {
    session,
    user:       session?.user ?? null,
    profile,
    plan,
    isPro:      plan === 'pro',
    isLoggedIn,
    loading,
    reloadProfile: () => session?.user && loadProfile(session.user.id),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

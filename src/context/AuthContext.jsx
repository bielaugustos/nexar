// src/context/AuthContext.jsx
// ══════════════════════════════════════════════════════
// IOROOT — Contexto de Autenticação
// Gerencia sessão, usuário e plan (free/pro).
// Disponível em toda a árvore de componentes.
// ══════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, getSession, getProfile, onAuthChange } from '../services/supabase'
import { loadFromSupabase, hasLocalData, applyRemoteData } from '../services/syncService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session,  setSession]  = useState(null)   // sessão Supabase
  const [profile,  setProfile]  = useState(null)   // dados do perfil
  const [loading,  setLoading]  = useState(true)   // carregando sessão inicial

  // Carrega sessão salva ao iniciar o app
  useEffect(() => {
    getSession().then(async (s) => {
      setSession(s)
      if (s?.user) await loadProfile(s.user.id)
      setLoading(false)
    })

    // Escuta mudanças de auth (login, logout, token refresh)
    const { data: { subscription } } = onAuthChange(async (event, s) => {
      if (s?.user) {
        // ── Checagem de sync ANTES de qualquer update de state React ──
        // Evita race condition: se recarregarmos a página, não devemos ter
        // re-renders pendentes que tentariam acessar contextos já desmontados.
        // Só sincroniza em INITIAL_SESSION sem dados locais (ex: segundo dispositivo)
        // SIGNED_IN é ignorado pois o SDK Supabase pode dispará-lo a cada carregamento,
        // causando loop infinito de reload → sync → reload
        const shouldSync = event === 'INITIAL_SESSION' && !hasLocalData()

        if (shouldSync) {
          const remoteData = await loadFromSupabase(s.user.id)
          const hasRemote  = [
            remoteData.habits, remoteData.transactions, remoteData.journal,
            remoteData.career_readings, remoteData.life_projects,
          ].some(arr => arr?.length > 0)

          if (hasRemote) {
            applyRemoteData(remoteData)
            window.location.reload()
            return  // interrompe sem tocar em state — a página vai reiniciar
          }
        }

        // Sem reload: atualiza state normalmente
        setSession(s)
        await loadProfile(s.user.id)
      } else {
        setSession(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    const { data } = await getProfile(userId)
    if (data) setProfile(data)
  }

  // Plano ativo — free por padrão, pro se autenticado e configurado
  const plan = profile?.plan ?? 'free'
  const isPro = plan === 'pro'

  // Usuário autenticado?
  const isLoggedIn = !!session?.user

  const value = {
    session,
    user:       session?.user ?? null,
    profile,
    plan,
    isPro,
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

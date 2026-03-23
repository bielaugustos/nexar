// ══════════════════════════════════════
// HOOK: usePlan
//
// Ponto de acesso único para permissões
// de plano em toda a aplicação.
//
// Retorna:
//   plan     — 'free' | 'pro'
//   isPro    — boolean
//   can(f)   — boolean: usuário tem acesso à feature f?
//   setPlan  — atualiza o plano (hoje: localStorage;
//              futuro: Supabase subscription)
//
// ── Migração para Supabase ─────────────
// Quando auth estiver pronto, substituir:
//
//   const { plan, setPlan } = useApp()
//
// por:
//
//   const { user } = useSupabaseAuth()
//   const plan = user?.user_metadata?.plan ?? 'free'
//   const setPlan = async (p) => {
//     await supabase.auth.updateUser({ data: { plan: p } })
//   }
//
// O restante do hook (can, isPro, shopOwned)
// NÃO precisa mudar.
// ══════════════════════════════════════
import { useState, useEffect, useMemo } from 'react'
import { useApp }      from '../context/AppContext'
import { canAccess }   from '../services/plan'

// ── Lê itens comprados do localStorage ──
function readShopOwned() {
  try {
    return JSON.parse(localStorage.getItem('nex_shop_owned') || '[]')
  } catch {
    return []
  }
}

// ══════════════════════════════════════
// HOOK PRINCIPAL
// ══════════════════════════════════════
export function usePlan() {
  const { plan, setPlan } = useApp()

  // shopOwned: sincronizado via evento customizado
  // (disparado ao comprar na loja ou mudar plano)
  const [shopOwned, setShopOwned] = useState(readShopOwned)

  useEffect(() => {
    function sync() { setShopOwned(readShopOwned()) }
    window.addEventListener('nex_shop_changed', sync)
    window.addEventListener('nex_plan_changed', sync)
    return () => {
      window.removeEventListener('nex_shop_changed', sync)
      window.removeEventListener('nex_plan_changed', sync)
    }
  }, [])

  // can() é memoizado por plan + shopOwned para evitar
  // re-renders em cascata quando os valores não mudaram
  const can = useMemo(
    () => (feature) => canAccess(plan, feature, shopOwned),
    [plan, shopOwned],
  )

  return {
    plan,
    isPro: plan === 'pro',
    can,
    setPlan,
  }
}

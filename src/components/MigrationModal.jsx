// src/components/MigrationModal.jsx
// Modal de migração de dados (logged-in) ou paywall de conta (guest com 60% de uso)

import { useState } from 'react'
import {
  PiArrowUpBold, PiSpinnerBold, PiUserCircleBold,
} from 'react-icons/pi'
import { migrateLocalToSupabase, clearLocalData, loadFromSupabase, applyRemoteData } from '../services/syncService'
import { supabase } from '../services/supabase'
import { toast } from './Toast'
import styles from './MigrationModal.module.css'

// ── Modo migrate: sobe dados locais para conta logada ──
// ── Modo paywall: convida usuário sem conta a se cadastrar ──
export function MigrationModal({ userId, onDone, mode = 'migrate' }) {
  const [loading, setLoading] = useState(false)
  const isPaywall = mode === 'paywall'

  async function handlePrimary() {
    if (isPaywall) {
      localStorage.removeItem('ior_auth_skipped')
      window.location.reload()
      return
    }
    setLoading(true)
    const { success, errors } = await migrateLocalToSupabase(userId)
    if (success) {
      clearLocalData()
      // Popula localStorage com dados da nuvem antes de recarregar
      const remoteData = await loadFromSupabase(userId)
      applyRemoteData(remoteData)
      // Flag duplo: Supabase (cross-device) + localStorage (fallback offline)
      if (userId) {
        await supabase.from('profiles').update({ migration_done: true }).eq('id', userId)
        localStorage.setItem(`ior_migration_offered_${userId}`, 'true')
      }
      toast('Dados migrados com sucesso!')
      setLoading(false)
      setTimeout(() => window.location.reload(), 1500)
      return
    }
    console.error('Erros na migração:', errors)
    toast('Migração parcial — alguns dados podem não ter subido.')
    setLoading(false)
    onDone()
  }

  async function handleSecondary() {
    if (!isPaywall && userId) {
      await supabase.from('profiles').update({ migration_done: true }).eq('id', userId)
      localStorage.setItem(`ior_migration_offered_${userId}`, 'true')
    }
    onDone()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}>
          {isPaywall ? (
            <svg width="40" height="40" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="36" fill="#111"/>
              <circle cx="36" cy="28" r="9" stroke="#fff" strokeWidth="2.8" fill="none"/>
              <path d="M20 56 C20 46 52 46 52 56" stroke="#F0C020" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="36" fill="#111"/>
              <path d="M36 50 C25 50 19 41 21 31 C23 21 33 16 42 19 C50 22 53 32 50 39 C48 44 43 47 38 46"
                stroke="#fff" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
              <path d="M38 46 C34 45 32 42 34 39"
                stroke="#F0C020" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
              <circle cx="34" cy="39" r="3" fill="#F0C020"/>
            </svg>
          )}
        </div>

        <h2 className={styles.title}>
          {isPaywall ? 'Seus dados merecem proteção' : 'Dados locais encontrados'}
        </h2>

        <p className={styles.desc}>
          {isPaywall
            ? 'Você está usando bem o Rootio! Crie uma conta gratuita para salvar seus dados na nuvem e acessá-los de qualquer dispositivo.'
            : 'Você tem hábitos, finanças e outros dados salvos neste dispositivo. Deseja subir tudo para sua conta?'
          }
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={`btn btn-primary ${styles.migrateBtn}`}
            onClick={handlePrimary}
            disabled={loading}>
            {isPaywall ? (
              <><PiUserCircleBold size={14}/> Criar conta gratuita</>
            ) : loading ? (
              <><PiSpinnerBold size={14} className={styles.spin}/> Migrando...</>
            ) : (
              <><PiArrowUpBold size={14}/> Sim, subir dados</>
            )}
          </button>
          <button
            type="button"
            className={`btn ${styles.skipBtn}`}
            onClick={handleSecondary}
            disabled={loading}>
            {isPaywall ? 'Continuar sem conta' : 'Agora não'}
          </button>
        </div>

        <p className={styles.note}>
          {isPaywall
            ? 'Conta gratuita — nenhum cartão necessário. Seus dados ficam seguros e acessíveis em qualquer dispositivo.'
            : 'Seus dados ficam seguros e acessíveis em qualquer dispositivo após a migração.'
          }
        </p>
      </div>
    </div>
  )
}

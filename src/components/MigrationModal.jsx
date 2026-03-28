// src/components/MigrationModal.jsx
// Modal de migração de dados (logged-in) ou paywall de conta (guest com 60% de uso)
// Inclui consentimento LGPD antes da migração

import { useState, useMemo } from 'react'
import {
  PiArrowUpBold, PiSpinnerBold, PiUserCircleBold,
} from 'react-icons/pi'
import { 
  migrateLocalToSupabase, clearLocalData, loadFromSupabase, 
  applyRemoteData, getDataSummary 
} from '../services/syncService'
import { supabase } from '../services/supabase'
import { toast } from './Toast'
import { ConsentModal } from './ConsentModal'
import styles from './MigrationModal.module.css'

// ── Modo migrate: sobe dados locais para conta logada ──
// ── Modo paywall: convida usuário sem conta a se cadastrar ──
export function MigrationModal({ userId, onDone, mode = 'migrate' }) {
  const [loading, setLoading] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const isPaywall = mode === 'paywall'

  // Memoiza o resumo dos dados (só calcula uma vez)
  const dataSummary = useMemo(() => getDataSummary(), [])

  // Abre o modal de consentimento (LGPD)
  function handlePrimary() {
    if (isPaywall) {
      // Flag para indicar que o usuário iniciou a criação de conta
      // Isso evita que o paywall reapareça após o reload
      localStorage.setItem('ior_creating_account', 'true')
      localStorage.removeItem('ior_auth_skipped')
      window.location.href = '/login'
      return
    }
    // Em vez de migrar direto, mostra o consentimento
    setShowConsent(true)
  }

  // Executa a migração após consentimento confirmado
  async function handleConfirmedMigration() {
    setShowConsent(false)
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

  // Cancela o consentimento e volta para o modal anterior
  function handleCancelConsent() {
    setShowConsent(false)
  }

  // Botão secundário: pular migração
  async function handleSecondary() {
    if (!isPaywall && userId) {
      await supabase.from('profiles').update({ migration_done: true }).eq('id', userId)
      localStorage.setItem(`ior_migration_offered_${userId}`, 'true')
    }
    onDone()
  }

  return (
    <>
      {/* Modal principal de migração/paywall */}
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.icon}>
            <img src="/icons/icon.svg" width="48" height="48" alt="Rootio" style={{ borderRadius: '50%' }}/>
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

      {/* Modal de consentimento LGPD (sobreposto) */}
      {showConsent && (
        <ConsentModal
          dataSummary={dataSummary}
          onConfirm={handleConfirmedMigration}
          onCancel={handleCancelConsent}
        />
      )}
    </>
  )
}

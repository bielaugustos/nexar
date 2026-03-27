// src/pages/ResetPassword.jsx
// ══════════════════════════════════════════════════════
// IOROOT — Redefinição de Senha
// Recebe o token de recuperação via hash da URL
// e permite ao usuário definir uma nova senha.
// ══════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PiEyeBold, PiEyeSlashBold, PiCheckBold } from 'react-icons/pi'
import { supabase } from '../services/supabase'

import styles from './ResetPassword.module.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validToken, setValidToken] = useState(false)

  // Extrair token do hash da URL
  useEffect(() => {
    async function checkRecoveryToken() {
      try {
        // A URL do Supabase vem como: #access_token=...&refresh_token=...&type=recovery
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')

        if (!accessToken || type !== 'recovery') {
          setError('Link de recuperação inválido ou expirado.')
          setLoading(false)
          return
        }

        // Validar o token trocando por uma sessão
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token'),
        })

        if (sessionError) {
          setError('Link de recuperação inválido ou expirado.')
          setLoading(false)
          return
        }

        setValidToken(true)
        setLoading(false)
      } catch (err) {
        setError('Erro ao validar link de recuperação. Tente solicitar um novo link.')
        setLoading(false)
      }
    }

    checkRecoveryToken()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validações
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setSubmitting(true)
    try {
      // Atualizar a senha do usuário atual
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        setError('Erro ao atualizar senha. Tente novamente.')
        return
      }

      setSuccess(true)

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <img src="/icons/icon.svg" alt="Rootio" width={90} height={90} className={styles.brandLogo} />
            <div className={styles.brandText}>
              <span className={styles.brandName}>Rootio</span>
              <span className={styles.brandSub}>Sua evolução pessoal</span>
            </div>
          </div>
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Validando link de recuperação...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!validToken) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <img src="/icons/icon.svg" alt="Rootio" width={90} height={90} className={styles.brandLogo} />
            <div className={styles.brandText}>
              <span className={styles.brandName}>Rootio</span>
              <span className={styles.brandSub}>Sua evolução pessoal</span>
            </div>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => navigate('/login')}>
            Voltar para login
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <img src="/icons/icon.svg" alt="Rootio" width={90} height={90} className={styles.brandLogo} />
            <div className={styles.brandText}>
              <span className={styles.brandName}>Rootio</span>
              <span className={styles.brandSub}>Sua evolução pessoal</span>
            </div>
          </div>
          <div className={styles.successState}>
            <PiCheckBold size={48} className={styles.successIcon} />
            <h2>Senha redefinida com sucesso!</h2>
            <p>Você será redirecionado para o login em instantes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Header da marca */}
        <div className={styles.brand}>
          <img src="/icons/icon.svg" alt="Rootio" width={90} height={90} className={styles.brandLogo} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>Rootio</span>
            <span className={styles.brandSub}>Sua evolução pessoal</span>
          </div>
        </div>

        {/* Título */}
        <div className={styles.header}>
          <h1>Redefinir senha</h1>
          <p>Digite sua nova senha abaixo</p>
        </div>

        {/* Formulário */}
        <form className={styles.form} onSubmit={handleSubmit}>

          <div className={styles.field}>
            <label className={styles.label}>Nova senha</label>
            <div className={styles.passwordWrap}>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? <PiEyeSlashBold size={16}/> : <PiEyeBold size={16}/>}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Confirmar senha</label>
            <div className={styles.passwordWrap}>
              <input
                className="input"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirmPassword(v => !v)}
                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showConfirmPassword ? <PiEyeSlashBold size={16}/> : <PiEyeBold size={16}/>}
              </button>
            </div>
          </div>

          {/* Requisitos da senha */}
          <div className={styles.requirements}>
            <p className={styles.requirementTitle}>A senha deve conter:</p>
            <ul>
              <li className={password.length >= 6 ? styles.valid : ''}>
                <PiCheckBold size={12} /> Pelo menos 6 caracteres
              </li>
              <li className={password === confirmPassword && confirmPassword.length > 0 ? styles.valid : ''}>
                <PiCheckBold size={12} /> Senhas coincidem
              </li>
            </ul>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={submitting}>
            {submitting ? 'Atualizando...' : 'Redefinir senha'}
          </button>

        </form>

        {/* Cancelar */}
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => navigate('/login')}>
          Cancelar
        </button>

      </div>
    </div>
  )
}

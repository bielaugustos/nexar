// src/pages/Login.jsx
// ══════════════════════════════════════════════════════
// IOROOT — Tela de Login / Cadastro
// Estilo visual alinhado com o brandbook.
// "Continuar sem conta" mantém o fluxo offline.
// ══════════════════════════════════════════════════════

import { useState } from 'react'
import { PiEyeBold, PiEyeSlashBold, PiArrowLeftBold } from 'react-icons/pi'
import { signIn, signUp, resetPassword } from '../services/supabase'

import styles from './Login.module.css'


export default function Login({ onSkip }) {
  const [mode,        setMode]        = useState('login')   // 'login' | 'signup' | 'reset'
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [username,    setUsername]    = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [showPass,    setShowPass]    = useState(false)

  const isSignup = mode === 'signup'
  const isReset = mode === 'reset'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (isReset) {
      // Modo de recuperação de senha
      if (!email.trim()) {
        setError('Digite seu e-mail para recuperar a senha.')
        return
      }

      setLoading(true)
      try {
        const { error: err } = await resetPassword(email)
        if (err) {
          const msg = err.message ?? ''
          if (msg.toLowerCase().includes('user not found') || msg.toLowerCase().includes('email not registered'))
            setError('E-mail não encontrado. Verifique se digitou corretamente ou crie uma conta.')
          else if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many requests'))
            setError('Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.')
          else
            setError(msg)
          return
        }
        setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada e spam.')
      } finally {
        setLoading(false)
      }
      return
    }

    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.')
      return
    }
    if (isSignup && !username.trim()) {
      setError('Digite um nome para o perfil.')
      return
    }
    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      if (isSignup) {
        const { error: err } = await signUp({ email, password, username })
        if (err) {
          const msg = err.message ?? ''
          const low = msg.toLowerCase()
          if (msg.includes('User already registered'))
            setError('Este e-mail já tem uma conta. Tente entrar.')
          else if (low.includes('rate limit') || low.includes('too many requests'))
            setError('Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.')
          else
            setError(msg)
          return
        }
        setSuccess('Conta criada! Verifique seu e-mail para confirmar o acesso.')
      } else {
        const { error: err } = await signIn({ email, password })
        if (err) {
          const msg = err.message ?? ''
          if (msg.includes('Email not confirmed'))
            setError('Confirme seu e-mail antes de entrar — verifique sua caixa de entrada.')
          else if (msg.includes('Invalid login credentials'))
            setError('E-mail ou senha incorretos.')
          else
            setError(msg)
          return
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Header da marca */}
        <div className={styles.brand}>
          <img src="/icons/icon.svg" alt="Rootio" width={90} height={90} className={styles.brandLogo} />
          <div className={styles.brandText}>
            <span className={styles.brandName} color='green'>Rootio</span>
            <span className={styles.brandSub}>Sua evolução pessoal</span>
          </div>
        </div>

        {/* Toggle login / cadastro (não mostra no modo reset) */}
        {!isReset && (
          <div className={styles.toggle}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${!isSignup ? styles.toggleActive : ''}`}
              onClick={() => { setMode('login'); setError('') }}>
              Entrar
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${isSignup ? styles.toggleActive : ''}`}
              onClick={() => { setMode('signup'); setError('') }}>
              Criar conta
            </button>
          </div>
        )}

        {/* Formulário */}
        <form className={styles.form} onSubmit={handleSubmit}>

          {isReset && (
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}>
              <PiArrowLeftBold size={16} />
              Voltar para login
            </button>
          )}

          {isSignup && (
            <div className={styles.field}>
              <label className={styles.label}>Nome</label>
              <input
                className="input"
                type="text"
                placeholder="Como quer ser chamado"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="name"
                maxLength={40}
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>{isReset ? 'E-mail da conta' : 'E-mail'}</label>
            <input
              className="input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {!isReset && (
            <div className={styles.field}>
              <label className={styles.label}>Senha</label>
              <div className={styles.passwordWrap}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder={isSignup ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}>
                  {showPass ? <PiEyeSlashBold size={16}/> : <PiEyeBold size={16}/>}
                </button>
              </div>
            </div>
          )}

          {success && <p className={styles.success}>{success}</p>}
          {error   && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}>
            {loading ? 'Aguarde...' : isReset ? 'Enviar e-mail de recuperação' : isSignup ? 'Criar conta' : 'Entrar'}
          </button>

        </form>

        {/* Link esqueceu senha (só mostra no modo login) */}
        {mode === 'login' && (
          <button
            type="button"
            className={styles.forgotBtn}
            onClick={() => { setMode('reset'); setError(''); setSuccess('') }}>
            Esqueceu a senha?
          </button>
        )}

        {/* Divider */}
        <div className={styles.divider}>
          <span>ou</span>
        </div>

        {/* Continuar sem conta */}
        <button
          type="button"
          className={`btn ${styles.skipBtn}`}
          onClick={onSkip}>
          Usar sem conta (modo local)
        </button>

      </div>
    </div>
  )
}

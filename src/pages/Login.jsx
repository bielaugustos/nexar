// src/pages/Login.jsx
// ══════════════════════════════════════════════════════
// IOROOT — Tela de Login / Cadastro
// Estilo visual alinhado com o brandbook.
// "Continuar sem conta" mantém o fluxo offline.
// ══════════════════════════════════════════════════════

import { useState } from 'react'
import { PiEyeBold, PiEyeSlashBold } from 'react-icons/pi'
import { signIn, signUp } from '../services/supabase'

import styles from './Login.module.css'


export default function Login({ onSkip }) {
  const [mode,        setMode]        = useState('login')   // 'login' | 'signup'
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [username,    setUsername]    = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [showPass,    setShowPass]    = useState(false)

  const isSignup = mode === 'signup'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
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
          <img src="/icons/icon.png" alt="Rootio" width={44} height={44} className={styles.brandLogo} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>Rootio</span>
            <span className={styles.brandSub}>Sua evolução pessoal</span>
          </div>
        </div>

        {/* Toggle login / cadastro */}
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

        {/* Formulário */}
        <form className={styles.form} onSubmit={handleSubmit}>

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
            <label className={styles.label}>E-mail</label>
            <input
              className="input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

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

          {success && <p className={styles.success}>{success}</p>}
          {error   && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}>
            {loading ? 'Aguarde...' : isSignup ? 'Criar conta' : 'Entrar'}
          </button>

        </form>

        {/* Divider */}
        <div className={styles.divider}>
          <span>ou</span>
        </div>

        {/* Continuar sem conta */}
        <button
          type="button"
          className={`btn ${styles.skipBtn}`}
          onClick={onSkip}>
          Continuar sem conta
        </button>

      </div>
    </div>
  )
}

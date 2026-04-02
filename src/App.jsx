// src/App.jsx
import { useState, useLayoutEffect, useRef, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AppProvider }   from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Header }        from './components/Header'
import { BottomNav }     from './components/BottomNav'
import { SideNav }       from './components/SideNav'
import { Toast }         from './components/Toast'
import { SplashScreen }  from './components/SplashScreen'
import { OfflineBanner } from './components/OfflineBanner'
import { MigrationModal } from './components/MigrationModal'
import { hasLocalData }   from './services/syncService'
import { Desktop }       from './components/Desktop'
import { useIsDesktop }  from './hooks/useIsDesktop'
import Login          from './pages/Login'
import ResetPassword  from './pages/ResetPassword'
import Home           from './pages/Home'
import Habits         from './pages/Habits'
import Finance        from './pages/Finance'
import Progress       from './pages/Progress'
import Mentor         from './pages/Mentor'
import Profile        from './pages/Profile'
import Career         from './pages/Career'
import Projects       from './pages/Projects'
import Calculator     from './pages/Calculator'
import Rewards        from './pages/Rewards'
import './styles/global.css'

// ── Verifica se o usuário atingiu 60% de qualquer limite free ──
function check60Percent() {
  try {
    const habits = JSON.parse(localStorage.getItem('nex_habits') || '[]')
    if (habits.length >= 6) return true

    const readings = JSON.parse(localStorage.getItem('nex_career_readings') || '[]')
    if (readings.length >= 6) return true

    const projects = JSON.parse(localStorage.getItem('nex_projects') || '[]')
    if (projects.filter(p => p.status === 'andamento' || p.status === 'planejando').length >= 2) return true

    const today = new Date()
    const m = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const txs = JSON.parse(localStorage.getItem('nex_fin_transactions') || '[]')
    if (txs.filter(t => t.date?.startsWith(m)).length >= 30) return true

    return false
  } catch { return false }
}

function ProfileWrapper() {
  const navigate = useNavigate()
  return <Profile onNavigate={path => navigate(path)} />
}

function Layout() {
  const isDesktop = useIsDesktop()

  // Modo Desktop: usar Desktop component
  if (isDesktop) {
    return <Desktop />
  }

  // Modo Mobile: usar layout atual
  return (
    <div className="nex-app">
      <Toast />
      <SideNav />
      <div className="nex-content">
        <Header />
        <OfflineBanner />
        <main>
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route path="/habits"    element={<Habits />} />
            <Route path="/finance"   element={<Finance />} />
            <Route path="/progress"  element={<Progress />} />
            <Route path="/mentor"     element={<Mentor />} />
            <Route path="/career"    element={<Career />} />
            <Route path="/projects"  element={<Projects />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/rewards"   element={<Rewards />} />
            <Route path="/profile"   element={<ProfileWrapper />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}

// Controla se mostra Login ou o app
function AppShell() {
  const { loading, isLoggedIn, user, profile } = useAuth()
  const [skipped, setSkipped] = useState(
    () => localStorage.getItem('ior_auth_skipped') === 'true'
  )
  const [loginTransition,  setLoginTransition]  = useState(false)
  const [showPaywall,      setShowPaywall]       = useState(false)
  const [showMigration,    setShowMigration]     = useState(false)
  const [migrationChecked, setMigrationChecked]  = useState(false)
  const prevLoggedIn = useRef(null)

  // useLayoutEffect roda antes da pintura — evita flash do Layout antes do splash
  useLayoutEffect(() => {
    if (!loading) {
      if (prevLoggedIn.current === false && isLoggedIn) {
        setLoginTransition(true)
      }
      prevLoggedIn.current = isLoggedIn
    }
  }, [isLoggedIn, loading])

  // Paywall para usuários sem conta: exibe quando ≥60% de qualquer limite free atingido
  useEffect(() => {
    if (loading || isLoggedIn) return
    // Se o usuário está no processo de criar conta, não mostra o paywall
    const creatingAccount = localStorage.getItem('ior_creating_account')
    if (creatingAccount) {
      localStorage.removeItem('ior_creating_account')
      return
    }
    const dismissed = localStorage.getItem('nex_paywall_at')
    if (dismissed && (Date.now() - Number(dismissed)) / 86_400_000 < 7) return
    if (check60Percent()) setShowPaywall(true)
  }, [loading, isLoggedIn])

  // Oferta única de migração: dual-flag (Supabase + localStorage) previne reexibição no mobile
  // Apenas para usuários Pro (data_migration é feature Pro)
  useEffect(() => {
    if (isLoggedIn && !migrationChecked && profile) {
      setMigrationChecked(true)
      const localFlag = user ? localStorage.getItem(`ior_migration_offered_${user.id}`) : null
      // Verifica se o usuário tem plano Pro (armazenado em localStorage ou profile)
      const userPlan = localStorage.getItem('nex_plan') || 'free'
      const isPro = userPlan === 'pro'
      if (isPro && !profile.migration_done && !localFlag && hasLocalData()) {
        setShowMigration(true)
      }
    }
    if (!isLoggedIn) setMigrationChecked(false)
  }, [isLoggedIn, migrationChecked, profile, user])

  if (loading) return null

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider>
        {!isLoggedIn && showPaywall && (
          <MigrationModal
            mode="paywall"
            onDone={() => {
              localStorage.setItem('nex_paywall_at', String(Date.now()))
              setShowPaywall(false)
            }}
          />
        )}
        {isLoggedIn && showMigration && (
          <MigrationModal
            userId={user.id}
            mode="migrate"
            onDone={() => setShowMigration(false)}
          />
        )}
        {loginTransition && (
          <>
            <Navigate to="/" replace />
            <SplashScreen onDone={() => setLoginTransition(false)} />
          </>
        )}
        <Routes>
          {/* Páginas autônomas (sem Layout) - sempre acessíveis */}
          <Route path="/login" element={<Login onSkip={() => {
            localStorage.setItem('ior_auth_skipped', 'true')
            setSkipped(true)
          }}/>} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* App principal com Layout - requer autenticação ou skip */}
          {isLoggedIn || skipped ? (
            <Route path="/*" element={<Layout />} />
          ) : (
            <Route path="/*" element={<Login onSkip={() => {
              localStorage.setItem('ior_auth_skipped', 'true')
              setSkipped(true)
            }}/>} />
          )}
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </>
  )
}

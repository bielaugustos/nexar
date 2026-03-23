import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AppProvider }  from './context/AppContext'
import { useApp }       from './context/AppContext'
import { Header }       from './components/Header'
import { BottomNav }    from './components/BottomNav'
import { SideNav }      from './components/SideNav'
import { Toast }         from './components/Toast'
import { SplashScreen }  from './components/SplashScreen'
import { OfflineBanner } from './components/OfflineBanner'
import { setSoundEnabled } from './hooks/useSound'
import Home     from './pages/Home'
import Habits   from './pages/Habits'
import Finance  from './pages/Finance'
import Progress from './pages/Progress'
import Mentor   from './pages/Mentor'
import Profile  from './pages/Profile'
import Career   from './pages/Career'
import Projects from './pages/Projects'
import './styles/global.css'

// Wrapper necessário para Profile ter acesso ao useNavigate do React Router
function ProfileWrapper() {
  const navigate = useNavigate()
  return <Profile onNavigate={path => navigate(path)} />
}

// Mantém a flag global do useSound sincronizada com a preferência do usuário
function SoundSync() {
  const { soundOn } = useApp()
  useEffect(() => { setSoundEnabled(soundOn) }, [soundOn])
  return null
}

// Layout principal:
//   Mobile  — Header fixo + área de scroll + BottomNav fixo
//   Tablet+ — SideNav lateral + área de conteúdo com scroll
function Layout() {
  return (
    <div className="nex-app">
      <SoundSync />
      <Toast />

      {/* Sidebar — só visível em tablet/desktop (≥ 768px) */}
      <SideNav />

      {/* Coluna de conteúdo — ocupa o espaço restante */}
      <div className="nex-content">
        <Header />
        <OfflineBanner />
        <main>
          <Routes>
            <Route path="/"         element={<Home     />} />
            <Route path="/habits"   element={<Habits   />} />
            <Route path="/finance"  element={<Finance  />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/mentor"   element={<Mentor   />} />
            <Route path="/career"   element={<Career   />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/profile"  element={<ProfileWrapper />} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Bottom nav — só visível no mobile (< 768px) */}
      <BottomNav />
    </div>
  )
}

export default function App() {
  // Pula o SplashScreen em recarregamentos da mesma sessão (ex: DevCard reload).
  // sessionStorage persiste entre reloads mas é limpo ao fechar a aba.
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem('nex_splash') === '1'
  )

  return (
    <>
      {!splashDone && (
        <SplashScreen onDone={() => {
          sessionStorage.setItem('nex_splash', '1')
          setSplashDone(true)
        }} />
      )}
      {/* Flags de compatibilidade com React Router v7 — silenciam avisos do v6 */}
      <BrowserRouter
        future={{
          v7_startTransition:   true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppProvider>
          <Layout />
        </AppProvider>
      </BrowserRouter>
    </>
  )
}

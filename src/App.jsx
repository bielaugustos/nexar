import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AppProvider }  from './context/AppContext'
import { Header }       from './components/Header'
import { BottomNav }    from './components/BottomNav'
import { Toast }         from './components/Toast'
import { SplashScreen }  from './components/SplashScreen'
import { OfflineBanner } from './components/OfflineBanner'
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

// Layout principal: Header fixo + área de scroll + BottomNav fixo
function Layout() {
  return (
    <div className="nex-app">
      <Toast />
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
      <BottomNav />
    </div>
  )
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
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

import { useState, useEffect, useCallback } from 'react'
import { WindowManager } from './WindowManager'
import { Taskbar } from './Taskbar'
import { StartMenu } from './StartMenu'
import { DesktopIcon } from './DesktopIcon'
import { Widget } from './Widget'
import { PiHouseBold, PiCheckCircleBold, PiCurrencyDollarBold, PiBriefcaseBold, PiRocketLaunchBold, PiRobotBold, PiChartLineUpBold, PiUserBold, PiCalculatorBold } from 'react-icons/pi'
import { useUnlockableItem } from '../../hooks/useNav'
import Home from '../../pages/Home'
import Habits from '../../pages/Habits'
import Finance from '../../pages/Finance'
import Progress from '../../pages/Progress'
import Mentor from '../../pages/Mentor'
import Profile from '../../pages/Profile'
import Career from '../../pages/Career'
import Projects from '../../pages/Projects'
import Calculator from '../../pages/Calculator'
import styles from './Desktop.module.css'

// ══════════════════════════════════════
// MAPA DE COMPONENTES
// ══════════════════════════════════════
const PAGE_COMPONENTS = {
  Home: Home,
  Habits: Habits,
  Finance: Finance,
  Progress: Progress,
  Mentor: Mentor,
  Profile: Profile,
  Career: Career,
  Projects: Projects,
  Calculator: Calculator,
}

// ══════════════════════════════════════
// APPS DISPONÍVEIS
// ══════════════════════════════════════
const APPS = [
  { id: 'home', name: 'Início', icon: PiHouseBold, component: 'Home' },
  { id: 'habits', name: 'Hábitos', icon: PiCheckCircleBold, component: 'Habits' },
  { id: 'finance', name: 'Finanças', icon: PiCurrencyDollarBold, component: 'Finance' },
  { id: 'career', name: 'Carreira', icon: PiBriefcaseBold, component: 'Career' },
  { id: 'projects', name: 'Projetos', icon: PiRocketLaunchBold, component: 'Projects' },
  { id: 'mentor', name: 'Mentor IA', icon: PiRobotBold, component: 'Mentor' },
  { id: 'progress', name: 'Progresso', icon: PiChartLineUpBold, component: 'Progress' },
  { id: 'calculator', name: 'Calculadora', icon: PiCalculatorBold, component: 'Calculator' },
  { id: 'profile', name: 'Perfil', icon: PiUserBold, component: 'Profile' },
]

// ══════════════════════════════════════
// DESKTOP COMPONENT
// ══════════════════════════════════════
export function Desktop() {
  const [windows, setWindows] = useState([])
  const [activeWindowId, setActiveWindowId] = useState(null)
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState(null)

  // Abrir janela
  const openWindow = useCallback((appId) => {
    const app = APPS.find(a => a.id === appId)
    if (!app) return

    // Verificar se já está aberta
    const existing = windows.find(w => w.id === appId)
    if (existing) {
      // Focar janela existente
      focusWindow(appId)
      return
    }

    // Calcular posição inicial (offset para não sobrepor)
    const offset = windows.length * 30
    const x = 100 + offset
    const y = 80 + offset

    const newWindow = {
      id: appId,
      title: app.name,
      icon: app.icon,
      component: app.component,
      position: { x, y },
      size: { width: 400, height: 600 },
      isMinimized: false,
      isMaximized: false,
      zIndex: windows.length + 10
    }

    setWindows(prev => [...prev, newWindow])
    setActiveWindowId(appId)
    setStartMenuOpen(false)
  }, [windows])

  // Fechar janela
  const closeWindow = useCallback((windowId) => {
    setWindows(prev => prev.filter(w => w.id !== windowId))
    if (activeWindowId === windowId) {
      const remaining = windows.filter(w => w.id !== windowId)
      setActiveWindowId(remaining.length > 0 ? remaining[remaining.length - 1].id : null)
    }
  }, [windows, activeWindowId])

  // Minimizar janela
  const minimizeWindow = useCallback((windowId) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, isMinimized: true } : w
    ))
    if (activeWindowId === windowId) {
      const visible = windows.filter(w => w.id !== windowId && !w.isMinimized)
      setActiveWindowId(visible.length > 0 ? visible[visible.length - 1].id : null)
    }
  }, [windows, activeWindowId])

  // Maximizar/Restaurar janela
  const maximizeWindow = useCallback((windowId) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, isMaximized: !w.isMaximized } : w
    ))
  }, [])

  // Focar janela (trazer para frente)
  const focusWindow = useCallback((windowId) => {
    setActiveWindowId(windowId)
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, zIndex: Math.max(...prev.map(w => w.zIndex)) + 1 } : w
    ))
  }, [])

  // Mover janela
  const moveWindow = useCallback((windowId, position) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, position } : w
    ))
  }, [])

  // Redimensionar janela
  const resizeWindow = useCallback((windowId, size) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, size } : w
    ))
  }, [])

  // Restaurar janela minimizada
  const restoreWindow = useCallback((windowId) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, isMinimized: false } : w
    ))
    focusWindow(windowId)
  }, [focusWindow])

  // Clique em ícone
  const handleIconClick = useCallback((appId) => {
    // Clique único abre janela
    openWindow(appId)
    setSelectedIcon(null)
  }, [openWindow])

  // Clique na área de trabalho (desselecionar ícone)
  const handleDesktopClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      setSelectedIcon(null)
      setStartMenuOpen(false)
    }
  }, [])

  // Fechar StartMenu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (startMenuOpen && !e.target.closest(`.${styles.startMenu}`) && !e.target.closest(`.${styles.taskbar}`)) {
        setStartMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [startMenuOpen])

  return (
    <div className={styles.desktop} onClick={handleDesktopClick}>
      {/* Wallpaper */}
      <div className={styles.wallpaper} />

      {/* Widgets na área de trabalho */}
      <div className={styles.widgets}>
        <Widget type="clock" />
        <Widget type="stats" />
      </div>

      {/* Ícones na área de trabalho */}
      <div className={styles.icons}>
        {APPS.map(app => {
          // Verificar se é um item desbloqueável
          const isUnlockable = ['progress', 'career', 'projects', 'mentor', 'calculator'].includes(app.id)
          const { visible, animCls } = isUnlockable ? useUnlockableItem(`util_${app.id}`) : { visible: true, animCls: 'visible' }
          
          // Se não estiver visível, não renderizar
          if (!visible) return null
          
          return (
            <DesktopIcon
              key={app.id}
              app={app}
              isSelected={selectedIcon === app.id}
              onClick={() => handleIconClick(app.id)}
              onDoubleClick={() => openWindow(app.id)}
              animCls={animCls}
            />
          )
        })}
      </div>

      {/* Gerenciador de janelas */}
      <WindowManager
        windows={windows}
        activeWindowId={activeWindowId}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
        onMove={moveWindow}
        onResize={resizeWindow}
      />

      {/* Menu de início */}
      {startMenuOpen && (
        <StartMenu
          apps={APPS}
          onAppClick={openWindow}
          onClose={() => setStartMenuOpen(false)}
        />
      )}

      {/* Barra de tarefas */}
      <Taskbar
        windows={windows}
        activeWindowId={activeWindowId}
        onStartClick={() => setStartMenuOpen(prev => !prev)}
        onWindowClick={(windowId) => {
          const win = windows.find(w => w.id === windowId)
          if (win?.isMinimized) {
            restoreWindow(windowId)
          } else if (activeWindowId === windowId) {
            minimizeWindow(windowId)
          } else {
            focusWindow(windowId)
          }
        }}
      />
    </div>
  )
}

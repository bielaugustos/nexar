import { useState, useEffect, useCallback, useRef } from 'react'
import { WindowManager } from './WindowManager'
import { Taskbar } from './Taskbar'
import { StartMenu } from './StartMenu'
import { DesktopIcon } from './DesktopIcon'
import { Widget } from './Widget'
import { PiHouseBold, PiCheckCircleBold, PiCurrencyDollarBold, PiBriefcaseBold, PiRocketLaunchBold, PiRobotBold, PiChartLineUpBold, PiUserBold, PiCalculatorBold, PiGearBold, PiXBold, PiClockBold, PiChartBarBold } from 'react-icons/pi'
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

// WIDGETS DISPONÍVEIS
const WIDGETS = [
  { id: 'clock', name: 'Relógio', icon: PiClockBold },
  { id: 'stats', name: 'Estatísticas', icon: PiChartBarBold },
]

// CORES DE FUNDO DO DESKTOP
const DESKTOP_BG_COLORS = [
  { id: 'default', color: 'linear-gradient(135deg, var(--bg) 0%, var(--surface) 100%)', name: 'Padrão' },
  { id: 'blue', color: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', name: 'Azul Escuro' },
  { id: 'purple', color: 'linear-gradient(135deg, #2d1b4e 0%, #1a1a2e 100%)', name: 'Roxo' },
  { id: 'green', color: 'linear-gradient(135deg, #1a3a2e 0%, #0d2818 100%)', name: 'Verde Escuro' },
  { id: 'sunset', color: 'linear-gradient(135deg, #4a1942 0%, #1a0a1a 100%)', name: 'Pôr do Sol' },
  { id: 'ocean', color: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)', name: 'Oceano' },
  { id: 'warm', color: 'linear-gradient(135deg, #2c1810 0%, #1a0f0a 100%)', name: 'Quente' },
]

// LEITURA/ESCRITA DE CONFIGURAÇÃO DO DESKTOP
function getDesktopConfig() {
  try {
    return JSON.parse(localStorage.getItem('nex_desktop_config') || '{}')
  } catch { return {} }
}

function saveDesktopConfig(config) {
  localStorage.setItem('nex_desktop_config', JSON.stringify(config))
}

// ══════════════════════════════════════
// DESKTOP COMPONENT
// ══════════════════════════════════════
export function Desktop() {
  const [windows, setWindows] = useState([])
  const [activeWindowId, setActiveWindowId] = useState(null)
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState(null)

  // Configuração do desktop
  const [desktopConfig, setDesktopConfig] = useState(() => {
    const saved = getDesktopConfig()
    // Posições padrão para ícones organizados em grid
    const defaultIconPositions = {
      home: { x: 16, y: 16 },
      habits: { x: 104, y: 16 },
      finance: { x: 192, y: 16 },
      career: { x: 280, y: 16 },
      projects: { x: 368, y: 16 },
      mentor: { x: 16, y: 104 },
      progress: { x: 104, y: 104 },
      calculator: { x: 192, y: 104 },
      profile: { x: 280, y: 104 },
    }
    return {
      iconPositions: saved.iconPositions || defaultIconPositions,
      widgetPositions: saved.widgetPositions || { clock: { x: 800, y: 16 }, stats: { x: 800, y: 100 } },
      hiddenIcons: saved.hiddenIcons || [],
      hiddenWidgets: saved.hiddenWidgets || [],
      bgColor: saved.bgColor || 'default',
    }
  })

  // Estado de customização
  const [showCustomize, setShowCustomize] = useState(false)

  // Estado de drag
  const [draggingItem, setDraggingItem] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null)

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

  // Clique em ícone - apenas seleciona
  const handleIconClick = useCallback((appId) => {
    setSelectedIcon(appId)
  }, [])

  // Clique na área de trabalho (desselecionar ícone)
  const handleDesktopClick = useCallback((e) => {
    if (e.target === e.currentTarget || e.target.classList.contains(styles.wallpaper)) {
      setSelectedIcon(null)
      setStartMenuOpen(false)
    }
  }, [])

  // ===== DRAG & DROP =====
  const handleDragStart = useCallback((e, item, type) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setDraggingItem({ id: item.id, type })
  }, [])

  const handleDragMove = useCallback((e) => {
    if (!draggingItem) return
    const x = e.clientX - dragOffset.x
    const y = e.clientY - dragOffset.y
    if (draggingItem.type === 'icon') {
      setDesktopConfig(prev => ({
        ...prev,
        iconPositions: { ...prev.iconPositions, [draggingItem.id]: { x, y } }
      }))
    } else if (draggingItem.type === 'widget') {
      setDesktopConfig(prev => ({
        ...prev,
        widgetPositions: { ...prev.widgetPositions, [draggingItem.id]: { x, y } }
      }))
    }
  }, [draggingItem, dragOffset])

  const handleDragEnd = useCallback(() => {
    if (draggingItem) {
      const config = draggingItem.type === 'icon'
        ? { iconPositions: desktopConfig.iconPositions }
        : { widgetPositions: desktopConfig.widgetPositions }
      saveDesktopConfig({ ...desktopConfig, ...config })
    }
    setDraggingItem(null)
  }, [draggingItem, desktopConfig])

  // Listeners de drag
  useEffect(() => {
    if (draggingItem) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
      return () => {
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [draggingItem, handleDragMove, handleDragEnd])

  // ===== CUSTOMIZAÇÃO =====
  const toggleIconVisibility = useCallback((appId) => {
    setDesktopConfig(prev => {
      const hidden = prev.hiddenIcons.includes(appId)
        ? prev.hiddenIcons.filter(id => id !== appId)
        : [...prev.hiddenIcons, appId]
      const newConfig = { ...prev, hiddenIcons: hidden }
      saveDesktopConfig(newConfig)
      return newConfig
    })
  }, [])

  const toggleWidgetVisibility = useCallback((widgetId) => {
    setDesktopConfig(prev => {
      const hidden = prev.hiddenWidgets.includes(widgetId)
        ? prev.hiddenWidgets.filter(id => id !== widgetId)
        : [...prev.hiddenWidgets, widgetId]
      const newConfig = { ...prev, hiddenWidgets: hidden }
      saveDesktopConfig(newConfig)
      return newConfig
    })
  }, [])

  // Mudar cor de fundo
  const setBackgroundColor = useCallback((colorId) => {
    setDesktopConfig(prev => {
      const newConfig = { ...prev, bgColor: colorId }
      saveDesktopConfig(newConfig)
      return newConfig
    })
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

  // Fechar painel de customização ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCustomize && !e.target.closest(`.${styles.customizePanel}`) && !e.target.closest(`.${styles.customizeIcon}`)) {
        setShowCustomize(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showCustomize])

  return (
    <div className={styles.desktop} onClick={handleDesktopClick}>
      {/* Wallpaper */}
      <div
        className={styles.wallpaper}
        style={{ background: DESKTOP_BG_COLORS.find(c => c.id === desktopConfig.bgColor)?.color }}
      />

      {/* Widgets na área de trabalho */}
      {WIDGETS.map(widget => {
        if (desktopConfig.hiddenWidgets.includes(widget.id)) return null
        const pos = desktopConfig.widgetPositions[widget.id] || { x: 16, y: 16 }
        return (
          <div
            key={widget.id}
            className={styles.widget}
            style={{ position: 'absolute', top: pos.y, left: pos.x }}
            onMouseDown={(e) => handleDragStart(e, widget, 'widget')}
          >
            <Widget type={widget.id} />
          </div>
        )
      })}

      {/* Ícones na área de trabalho */}
      {APPS.map((app) => {
        // Verificar se é um item desbloqueável
        const isUnlockable = ['progress', 'career', 'projects', 'mentor', 'calculator'].includes(app.id)
        const { visible, animCls } = isUnlockable ? useUnlockableItem(`util_${app.id}`) : { visible: true, animCls: 'visible' }

        // Verificar se está oculto pelo usuário
        if (desktopConfig.hiddenIcons.includes(app.id)) return null
        if (!visible) return null

        const pos = desktopConfig.iconPositions[app.id]

        return (
          <div
            key={app.id}
            className={`${styles.desktopIcon} ${draggingItem?.id === app.id ? styles.dragging : ''}`}
            style={{ position: 'absolute', top: pos?.y || 0, left: pos?.x || 0 }}
            onMouseDown={(e) => handleDragStart(e, app, 'icon')}
          >
            <DesktopIcon
              app={app}
              isSelected={selectedIcon === app.id}
              onClick={() => handleIconClick(app.id)}
              onDoubleClick={() => openWindow(app.id)}
              animCls={animCls}
            />
          </div>
        )
      })}

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

      {/* Botão de customização (ícone fixo) */}
      <div
        className={styles.customizeIcon}
        style={{ position: 'absolute', top: 8, right: 8 }}
        onClick={() => setShowCustomize(prev => !prev)}
      >
        <PiGearBold size={20} />
      </div>

      {/* Painel de customização */}
      {showCustomize && (
        <div className={styles.customizePanel}>
          <h4>
            <PiGearBold size={12} style={{ marginRight: 4 }} />
            Personalizar Área de Trabalho
          </h4>

          <h4 style={{ marginTop: 12 }}>Cor de Fundo</h4>
          <div className={styles.colorPicker}>
            {DESKTOP_BG_COLORS.map(color => (
              <button
                key={color.id}
                type="button"
                className={`${styles.colorOption} ${desktopConfig.bgColor === color.id ? styles.colorSelected : ''}`}
                style={{ background: color.color }}
                onClick={() => setBackgroundColor(color.id)}
                title={color.name}
              />
            ))}
          </div>

          <h4 style={{ marginTop: 12 }}>Ícones</h4>
          <div className={styles.customizeList}>
            {APPS.map(app => {
              const IconComponent = app.icon
              const isHidden = desktopConfig.hiddenIcons.includes(app.id)
              return (
                <div
                  key={app.id}
                  className={`${styles.customizeItem} ${isHidden ? styles.hidden : ''}`}
                  onClick={() => toggleIconVisibility(app.id)}
                >
                  <IconComponent size={18} />
                  <span>{app.name}</span>
                </div>
              )
            })}
          </div>

          <h4>Widgets</h4>
          <div className={styles.customizeList}>
            {WIDGETS.map(widget => {
              const IconComponent = widget.icon
              const isHidden = desktopConfig.hiddenWidgets.includes(widget.id)
              return (
                <div
                  key={widget.id}
                  className={`${styles.customizeItem} ${isHidden ? styles.hidden : ''}`}
                  onClick={() => toggleWidgetVisibility(widget.id)}
                >
                  <IconComponent size={18} />
                  <span>{widget.name}</span>
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: 10, color: 'var(--ink2)', margin: 0, textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}>
            Clique nos itens para mostrar/ocultar.<br/>
            Arraste para repositionar.
          </p>
        </div>
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

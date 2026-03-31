import { useState, useRef, useCallback, useEffect } from 'react'
import styles from './Desktop.module.css'

// ══════════════════════════════════════
// MAPA DE COMPONENTES DE PÁGINA
// ══════════════════════════════════════
const PAGE_COMPONENTS = {
  Home: () => import('../../pages/Home'),
  Habits: () => import('../../pages/Habits'),
  Finance: () => import('../../pages/Finance'),
  Progress: () => import('../../pages/Progress'),
  Mentor: () => import('../../pages/Mentor'),
  Profile: () => import('../../pages/Profile'),
  Career: () => import('../../pages/Career'),
  Projects: () => import('../../pages/Projects'),
  Calculator: () => import('../../pages/Calculator'),
}

// ══════════════════════════════════════
// WINDOW MANAGER
// ══════════════════════════════════════
export function WindowManager({
  windows,
  activeWindowId,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize
}) {
  return (
    <>
      {windows.map(window => (
        <Window
          key={window.id}
          window={window}
          isActive={activeWindowId === window.id}
          onClose={() => onClose(window.id)}
          onMinimize={() => onMinimize(window.id)}
          onMaximize={() => onMaximize(window.id)}
          onFocus={() => onFocus(window.id)}
          onMove={(position) => onMove(window.id, position)}
          onResize={(size) => onResize(window.id, size)}
        />
      ))}
    </>
  )
}

// ══════════════════════════════════════
// WINDOW - Janela Individual
// ══════════════════════════════════════
function Window({
  window,
  isActive,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize
}) {
  const windowRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  // Iniciar arraste
  const handleDragStart = useCallback((e) => {
    if (e.target.closest(`.${styles.windowControls}`)) return
    if (window.isMaximized) return

    setIsDragging(true)
    setDragOffset({
      x: e.clientX - window.position.x,
      y: e.clientY - window.position.y
    })
    onFocus()
  }, [window.position, window.isMaximized, onFocus])

  // Arrastar janela
  const handleDrag = useCallback((e) => {
    if (!isDragging) return

    const newX = Math.max(0, e.clientX - dragOffset.x)
    const newY = Math.max(0, e.clientY - dragOffset.y)

    onMove({ x: newX, y: newY })
  }, [isDragging, dragOffset, onMove])

  // Finalizar arraste
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Iniciar redimensionamento
  const handleResizeStart = useCallback((e, direction) => {
    e.stopPropagation()
    if (window.isMaximized) return

    setIsResizing(true)
    setResizeDirection(direction)
    setStartSize({ ...window.size })
    setStartPos({ x: e.clientX, y: e.clientY })
    onFocus()
  }, [window.size, window.isMaximized, onFocus])

  // Redimensionar janela
  const handleResize = useCallback((e) => {
    if (!isResizing) return

    const deltaX = e.clientX - startPos.x
    const deltaY = e.clientY - startPos.y

    let newWidth = startSize.width
    let newHeight = startSize.height

    if (resizeDirection.includes('e')) {
      newWidth = Math.max(300, startSize.width + deltaX)
    }
    if (resizeDirection.includes('w')) {
      newWidth = Math.max(300, startSize.width - deltaX)
    }
    if (resizeDirection.includes('s')) {
      newHeight = Math.max(200, startSize.height + deltaY)
    }
    if (resizeDirection.includes('n')) {
      newHeight = Math.max(200, startSize.height - deltaY)
    }

    onResize({ width: newWidth, height: newHeight })
  }, [isResizing, resizeDirection, startPos, startSize, onResize])

  // Finalizar redimensionamento
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setResizeDirection(null)
  }, [])

  // Event listeners globais
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag)
      document.addEventListener('mouseup', handleDragEnd)
    }
    if (isResizing) {
      document.addEventListener('mousemove', handleResize)
      document.addEventListener('mouseup', handleResizeEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [isDragging, isResizing, handleDrag, handleDragEnd, handleResize, handleResizeEnd])

  // Não renderizar se minimizada
  if (window.isMinimized) return null

  // Estilo da janela
  const windowStyle = window.isMaximized
    ? {}
    : {
        left: window.position.x,
        top: window.position.y,
        width: window.size.width,
        height: window.size.height,
        zIndex: window.zIndex
      }

  return (
    <div
      ref={windowRef}
      className={`${styles.window} ${isActive ? styles.focused : ''} ${window.isMaximized ? styles.maximized : ''}`}
      style={windowStyle}
      onClick={onFocus}
    >
      {/* Barra de título */}
      <div
        className={styles.windowHeader}
        onMouseDown={handleDragStart}
        onDoubleClick={onMaximize}
      >
        <span className={styles.windowIcon}>{window.icon}</span>
        <span className={styles.windowTitle}>{window.title}</span>
        <div className={styles.windowControls}>
          <button
            className={`${styles.windowControl} ${styles.minimize}`}
            onClick={(e) => { e.stopPropagation(); onMinimize() }}
            aria-label="Minimizar"
          />
          <button
            className={`${styles.windowControl} ${styles.maximize}`}
            onClick={(e) => { e.stopPropagation(); onMaximize() }}
            aria-label="Maximizar"
          />
          <button
            className={`${styles.windowControl} ${styles.close}`}
            onClick={(e) => { e.stopPropagation(); onClose() }}
            aria-label="Fechar"
          />
        </div>
      </div>

      {/* Conteúdo */}
      <div className={styles.windowContent}>
        <PageContent component={window.component} />
      </div>

      {/* Handles de redimensionamento */}
      {!window.isMaximized && (
        <>
          <div className={`${styles.resizeHandle} ${styles.n}`} onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className={`${styles.resizeHandle} ${styles.s}`} onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div className={`${styles.resizeHandle} ${styles.e}`} onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className={`${styles.resizeHandle} ${styles.w}`} onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className={`${styles.resizeHandle} ${styles.ne}`} onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className={`${styles.resizeHandle} ${styles.nw}`} onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className={`${styles.resizeHandle} ${styles.se}`} onMouseDown={(e) => handleResizeStart(e, 'se')} />
          <div className={`${styles.resizeHandle} ${styles.sw}`} onMouseDown={(e) => handleResizeStart(e, 'sw')} />
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// PAGE CONTENT - Renderiza página dentro da janela
// ══════════════════════════════════════
function PageContent({ component }) {
  const [PageComponent, setPageComponent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const loadComponent = PAGE_COMPONENTS[component]
    if (loadComponent) {
      loadComponent().then(module => {
        setPageComponent(() => module.default)
        setLoading(false)
      }).catch(err => {
        console.error(`Erro ao carregar componente ${component}:`, err)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [component])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--ink2)',
        fontSize: 14,
        textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
      }}>
        Carregando...
      </div>
    )
  }

  if (!PageComponent) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--ink2)',
        fontSize: 14,
        textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
      }}>
        Componente não encontrado
      </div>
    )
  }

  return <PageComponent />
}

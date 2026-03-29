import React, { useState, useEffect } from 'react'
import styles from './Desktop.module.css'

// ══════════════════════════════════════
// TASKBAR - Barra de Tarefas
// ══════════════════════════════════════
export function Taskbar({
  windows,
  activeWindowId,
  onStartClick,
  onWindowClick
}) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Formatar hora
  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Formatar data
  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className={styles.taskbar}>
      {/* Botão Início */}
      <button
        className={styles.startButton}
        onClick={onStartClick}
        aria-label="Menu Início"
      >
        ../
      </button>

      {/* Apps abertos */}
      <div className={styles.taskbarApps}>
        {windows.map(window => (
          <button
            key={window.id}
            className={`${styles.taskbarApp} ${activeWindowId === window.id ? styles.active : ''}`}
            onClick={() => onWindowClick(window.id)}
            title={window.title}
          >
            <span>{React.createElement(window.icon, { size: 16 })}</span>
            <span className={styles.taskbarAppName}>{window.title}</span>
          </button>
        ))}
      </div>

      {/* System Tray */}
      <div className={styles.systemTray}>
        <span className={styles.systemTrayClock}>
          {formatTime(currentTime)}
        </span>
        <span>{formatDate(currentTime)}</span>
      </div>
    </div>
  )
}

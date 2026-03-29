import React, { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { calcLevel } from '../../services/levels'
import { useHabits } from '../../hooks/useHabits'
import styles from './Desktop.module.css'

// ══════════════════════════════════════
// START MENU - Menu de Início
// ══════════════════════════════════════
export function StartMenu({ apps, onAppClick, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const { user, profile } = useAuth()
  const { allPoints } = useHabits()

  // Calcular nível do usuário
  const level = calcLevel(allPoints)

  // Filtrar apps pela busca
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return apps
    const query = searchQuery.toLowerCase()
    return apps.filter(app =>
      app.name.toLowerCase().includes(query) ||
      app.id.toLowerCase().includes(query)
    )
  }, [apps, searchQuery])

  // Nome do usuário
  const userName = profile?.username || user?.email?.split('@')[0] || 'Usuário'
  const userAvatar = profile?.avatar_emoji || '🧑'

  return (
    <div className={styles.startMenu}>
      {/* Header com informações do usuário */}
      <div className={styles.startMenuHeader}>
        <div className={styles.startMenuAvatar}>
          {userAvatar}
        </div>
        <div className={styles.startMenuUserInfo}>
          <div className={styles.startMenuUserName}>{userName}</div>
          <div className={styles.startMenuUserLevel}>
            <level.Icon size={12} /> {level.name}
          </div>
        </div>
      </div>

      {/* Campo de busca */}
      <div className={styles.startMenuSearch}>
        <input
          type="text"
          className={styles.startMenuSearchInput}
          placeholder="Buscar aplicativos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Lista de apps */}
      <div className={styles.startMenuApps}>
        {filteredApps.length > 0 ? (
          filteredApps.map(app => (
            <button
              key={app.id}
              className={styles.startMenuApp}
              onClick={() => {
                onAppClick(app.id)
                onClose()
              }}
            >
              <span className={styles.startMenuAppIcon}>{React.createElement(app.icon, { size: 20 })}</span>
              <span className={styles.startMenuAppName}>{app.name}</span>
            </button>
          ))
        ) : (
          <div style={{
            padding: 16,
            textAlign: 'center',
            color: 'var(--ink3)',
            fontSize: 12
          }}>
            Nenhum aplicativo encontrado
          </div>
        )}
      </div>
    </div>
  )
}

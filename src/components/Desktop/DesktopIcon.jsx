import styles from './Desktop.module.css'

// ══════════════════════════════════════
// DESKTOP ICON - Ícone na Área de Trabalho
// ════════════════════════════════════
export function DesktopIcon({ app, isSelected, onClick, onDoubleClick, animCls = '' }) {
  const IconComponent = app.icon
  return (
    <div
      className={`${styles.desktopIcon} ${isSelected ? styles.selected : ''} ${animCls}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={app.name}
    >
      <div className={styles.desktopIconImage}>
        <IconComponent size={24} />
      </div>
      <span className={styles.desktopIconName}>{app.name}</span>
    </div>
  )
}

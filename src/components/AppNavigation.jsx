import { useState } from 'react'
import {
  PiChartBarBold,
  PiBriefcaseBold,
  PiRocketLaunchBold,
  PiRobotBold,
  PiCalculatorBold,
  PiStorefrontBold,
} from 'react-icons/pi'
import styles from './AppNavigation.module.css'

// ══════════════════════════════════════════
// NAVEGAÇÃO DE APLICATIVOS — Loja de Recompensas
// Design inspirado nos grupos de configurações do Profile
// ════════════════════════════════════════════════
export default function AppNavigation({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Lista de aplicativos disponíveis
  const apps = [
    {
      id: 'progress',
      title: 'Experiência',
      icon: PiChartBarBold,
      color: '#E6F1FB',
      textColor: '#185FA5',
      path: '/progress'
    },
    {
      id: 'career',
      title: 'Carreira',
      icon: PiBriefcaseBold,
      color: '#FFF4E6',
      textColor: '#D68910',
      path: '/career'
    },
    {
      id: 'projects',
      title: 'Projetos',
      icon: PiRocketLaunchBold,
      color: '#F0F9FF',
      textColor: '#0369A1',
      path: '/projects'
    },
    {
      id: 'mentor',
      title: 'Mentor IA',
      icon: PiRobotBold,
      color: '#F3E8FF',
      textColor: '#7C3AED',
      path: '/mentor'
    },
    {
      id: 'calculator',
      title: 'Calculadora',
      icon: PiCalculatorBold,
      color: '#F0FDF4',
      textColor: '#16A34A',
      path: '/calculator'
    }
  ]
  
  return (
    <div className={styles.settingsGroupReformed}>
      <div className={styles.settingsGroupHeader} onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        <PiStorefrontBold size={16} style={{ color: '#D68910' }} />
        <div>
          <div className={styles.settingsGroupTitle}>Loja de aplicativos</div>
          <div className={styles.settingsGroupSubtitle}>Acesse todos os aplicativos</div>
        </div>
      </div>
      
      {isOpen && (
        <div className={styles.settingsGroupContent}>
          {apps.map((app, index) => (
            <div key={app.id} className={styles.settingsRow} onClick={() => {
              onNavigate(app.path)
              setIsOpen(false)
            }} style={{ 
              animation: `fadeIn 0.3s ease ${index * 0.05}s both`
            }}>
              <span className={styles.settingsIcon} style={{ background: app.color, color: app.textColor }}>
                <app.icon size={16} />
              </span>
              <div style={{ flex: 1 }}>
                <span className={styles.settingLabel}>{app.title}</span>
              </div>
              <span className={styles.settingsChevron} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

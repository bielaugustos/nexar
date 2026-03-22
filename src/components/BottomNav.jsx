import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import {
  PiHouseBold,          PiHouseFill,
  PiCheckSquareBold,    PiCheckSquareFill,
  PiCurrencyDollarBold, PiCurrencyDollarFill,
  PiUserCircleBold,     PiUserCircleFill,
  PiChartBarBold,       PiChartBarFill,
  PiMedalBold,          PiMedalFill,
  PiBriefcaseBold,
  PiRocketLaunchBold,
} from 'react-icons/pi'
import styles from './BottomNav.module.css'

// Nav base — sempre visível
const BASE_NAV = [
  { to: '/',        label: 'Início',    Icon: PiHouseBold,          IconA: PiHouseFill          },
  { to: '/habits',  label: 'Hábitos',  Icon: PiCheckSquareBold,    IconA: PiCheckSquareFill    },
  { to: '/finance', label: 'Finanças', Icon: PiCurrencyDollarBold, IconA: PiCurrencyDollarFill },
  { to: '/profile', label: 'Perfil',  Icon: PiUserCircleBold,     IconA: PiUserCircleFill     },
]

// Itens desbloqueáveis — aparecem/somem com animação
const UNLOCKABLE = [
  { id: 'util_progress', to: '/progress', label: 'Experiência', Icon: PiChartBarBold,     IconA: PiChartBarFill,     insertAt: 3 },
  { id: 'util_career',   to: '/career',   label: 'Carreira',  Icon: PiBriefcaseBold,    IconA: PiBriefcaseBold,    insertAt: 3 },
  { id: 'util_projects', to: '/projects', label: 'Projetos',  Icon: PiRocketLaunchBold, IconA: PiRocketLaunchBold, insertAt: 3 },
]

function getOwned() {
  try { return new Set(JSON.parse(localStorage.getItem('nex_shop_owned') || '[]')) }
  catch { return new Set() }
}

// Estado de animação por item
function useUnlockableItem(id) {
  const [visible,  setVisible]  = useState(() => getOwned().has(id))
  const [animCls,  setAnimCls]  = useState(() => getOwned().has(id) ? 'visible' : 'hidden')
  const prevRef = useRef(visible)

  useEffect(() => {
    function handle() {
      const owned = getOwned()
      const next  = owned.has(id)
      if (next === prevRef.current) return
      prevRef.current = next
      if (next) {
        setVisible(true)
        setAnimCls('entering')
        setTimeout(() => setAnimCls('visible'), 550)
      } else {
        setAnimCls('leaving')
        setTimeout(() => { setAnimCls('hidden'); setVisible(false) }, 420)
      }
    }
    window.addEventListener('nex_shop_changed', handle)
    window.addEventListener('storage', e => { if (e.key === 'nex_shop_owned') handle() })
    return () => window.removeEventListener('nex_shop_changed', handle)
  }, [id])

  return { visible, animCls }
}

// Botão de item desbloqueável individual
function UnlockableNavBtn({ item }) {
  const { visible, animCls } = useUnlockableItem(item.id)
  if (!visible && animCls === 'hidden') return null

  const cls = [
    styles.btn,
    animCls === 'entering' ? styles.unlockEnter : '',
    animCls === 'leaving'  ? styles.unlockLeave  : '',
    animCls === 'visible'  ? styles.unlockVisible : '',
  ].filter(Boolean).join(' ')

  return (
    <NavLink to={item.to} className={({ isActive }) => `${cls} ${isActive ? styles.active : ''}`}>
      {({ isActive }) => (
        <>
          {isActive ? <item.IconA size={21} /> : <item.Icon size={21} />}
          <span>{item.label}</span>
          {animCls === 'entering' && <span className={styles.newDot} aria-hidden="true" />}
        </>
      )}
    </NavLink>
  )
}

export function BottomNav() {
  // Reordenação: Stats e Rewards entram antes de Perfil (insertAt=3)
  return (
    <nav className={styles.nav}>
      {BASE_NAV.slice(0, 3).map(({ to, label, Icon, IconA }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) => `${styles.btn} ${isActive ? styles.active : ''}`}>
          {({ isActive }) => (<>{isActive ? <IconA size={21}/> : <Icon size={21}/>}<span>{label}</span></>)}
        </NavLink>
      ))}

      {/* Itens desbloqueáveis — aparecem entre Finance e Perfil */}
      {UNLOCKABLE.map(item => <UnlockableNavBtn key={item.id} item={item} />)}

      {/* Perfil — sempre último */}
      {[BASE_NAV[3]].map(({ to, label, Icon, IconA }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) => `${styles.btn} ${isActive ? styles.active : ''}`}>
          {({ isActive }) => (<>{isActive ? <IconA size={21}/> : <Icon size={21}/>}<span>{label}</span></>)}
        </NavLink>
      ))}
    </nav>
  )
}

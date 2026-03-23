import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import {
  PiFlameFill,
  PiHouseBold,          PiHouseFill,
  PiCheckSquareBold,    PiCheckSquareFill,
  PiCurrencyDollarBold, PiCurrencyDollarFill,
  PiUserCircleBold,     PiUserCircleFill,
  PiChartBarBold,       PiChartBarFill,
  PiBriefcaseBold,
  PiRocketLaunchBold,
  PiRobotBold,
} from 'react-icons/pi'
import { useApp }   from '../context/AppContext'
import { useStats } from '../hooks/useStats'
import styles from './SideNav.module.css'

// ── Mesma estrutura de nav do BottomNav ──
const BASE_NAV = [
  { to: '/',        label: 'Início',   Icon: PiHouseBold,          IconA: PiHouseFill          },
  { to: '/habits',  label: 'Hábitos',  Icon: PiCheckSquareBold,    IconA: PiCheckSquareFill    },
  { to: '/finance', label: 'Finanças', Icon: PiCurrencyDollarBold, IconA: PiCurrencyDollarFill },
]

const PROFILE_ITEM = { to: '/profile', label: 'Perfil', Icon: PiUserCircleBold, IconA: PiUserCircleFill }

const UNLOCKABLE = [
  { id: 'util_progress', to: '/progress', label: 'Experiência', Icon: PiChartBarBold,     IconA: PiChartBarFill     },
  { id: 'util_career',   to: '/career',   label: 'Carreira',    Icon: PiBriefcaseBold,    IconA: PiBriefcaseBold    },
  { id: 'util_projects', to: '/projects', label: 'Projetos',    Icon: PiRocketLaunchBold, IconA: PiRocketLaunchBold },
  { id: 'util_mentor',   to: '/mentor',   label: 'Mentor',      Icon: PiRobotBold,        IconA: PiRobotBold        },
]

function getOwned() {
  try { return new Set(JSON.parse(localStorage.getItem('nex_shop_owned') || '[]')) }
  catch { return new Set() }
}

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

// ── Link individual da sidebar ──
function SideLink({ to, label, Icon, IconA, extraClass }) {
  return (
    <NavLink
      to={to}
      data-label={label}
      className={({ isActive }) =>
        [styles.link, isActive && styles.active, extraClass].filter(Boolean).join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span className={styles.icon}>
            {isActive ? <IconA size={20} /> : <Icon size={20} />}
          </span>
          <span className={styles.label}>{label}</span>
        </>
      )}
    </NavLink>
  )
}

// ── Item desbloqueável com animação de entrada/saída ──
function UnlockableItem({ item }) {
  const { visible, animCls } = useUnlockableItem(item.id)
  if (!visible && animCls === 'hidden') return null

  const extraClass = [
    animCls === 'entering' ? styles.unlockEnter   : '',
    animCls === 'leaving'  ? styles.unlockLeave   : '',
    animCls === 'visible'  ? styles.unlockVisible : '',
  ].filter(Boolean).join(' ')

  return (
    <SideLink
      to={item.to}
      label={item.label}
      Icon={item.Icon}
      IconA={item.IconA}
      extraClass={extraClass}
    />
  )
}

export function SideNav() {
  const { history } = useApp()
  const { streak }  = useStats(history)

  return (
    <aside className={styles.side} aria-label="Navegação principal">

      {/* ── Logo + streak ── */}
      <div className={styles.brand}>
        <span className={styles.logo}>../</span>
        {streak > 0 && (
          <span className={styles.streak}>
            <PiFlameFill size={11} color="#b08000" />
            {streak}d
          </span>
        )}
      </div>

      {/* ── Itens de navegação ── */}
      <nav className={styles.nav}>
        {BASE_NAV.map(({ to, label, Icon, IconA }) => (
          <SideLink key={to} to={to} label={label} Icon={Icon} IconA={IconA} />
        ))}

        {/* Seção desbloqueável */}
        <div className={styles.divider} />
        {UNLOCKABLE.map(item => (
          <UnlockableItem key={item.id} item={item} />
        ))}

        {/* Perfil sempre ao fundo */}
        <div className={styles.spacer} />
        <SideLink
          to={PROFILE_ITEM.to}
          label={PROFILE_ITEM.label}
          Icon={PROFILE_ITEM.Icon}
          IconA={PROFILE_ITEM.IconA}
        />
      </nav>
    </aside>
  )
}

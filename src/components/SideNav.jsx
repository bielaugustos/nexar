// src/components/SideNav.jsx
// ══════════════════════════════════════
// Barra lateral de navegação — visível
// apenas em tablet/desktop (≥ 768px via CSS).
// Em mobile o BottomNav assume essa função.
//
// ACESSIBILIDADE:
//   • <aside aria-label="Navegação principal">
//   • aria-current="page" no link ativo
//   • Ícones com aria-hidden
// ══════════════════════════════════════
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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
import { useApp }              from '../context/AppContext'
import { useStats }            from '../hooks/useStats'
import { useUnlockableItem }   from '../hooks/useNav'
import styles from './SideNav.module.css'

// ── Itens de navegação ──

const BASE_NAV = [
  { to: '/',        label: 'Hoje',     Icon: PiHouseBold,          IconA: PiHouseFill          },
  { to: '/habits',  label: 'Hábitos',  Icon: PiCheckSquareBold,    IconA: PiCheckSquareFill    },
  { to: '/finance', label: 'Finanças', Icon: PiCurrencyDollarBold, IconA: PiCurrencyDollarFill },
]

const PROFILE_ITEM = {
  to: '/profile', label: 'Perfil',
  Icon: PiUserCircleBold, IconA: PiUserCircleFill,
}

const UNLOCKABLE = [
  { id: 'util_progress', to: '/progress', label: 'Experiência', Icon: PiChartBarBold,     IconA: PiChartBarFill     },
  { id: 'util_career',   to: '/career',   label: 'Carreira',    Icon: PiBriefcaseBold,    IconA: PiBriefcaseBold    },
  { id: 'util_projects', to: '/projects', label: 'Projetos',    Icon: PiRocketLaunchBold, IconA: PiRocketLaunchBold },
  { id: 'util_mentor',   to: '/mentor',   label: 'Mentor',      Icon: PiRobotBold,        IconA: PiRobotBold        },
]

// ── SideLink — link com ícone + rótulo ──
function SideLink({ to, label, Icon, IconA, extraClass }) {
  const { pathname } = useLocation()
  const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)

  return (
    <NavLink
      to={to}
      className={[styles.link, isActive && styles.active, extraClass].filter(Boolean).join(' ')}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={styles.icon} aria-hidden="true">
        {isActive ? <IconA size={20} /> : <Icon size={20} />}
      </span>
      <span className={styles.label}>{label}</span>
    </NavLink>
  )
}

// ── UnlockableItem — item com animação de entrada/saída ──
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

// ── Componente principal ──
export function SideNav() {
  const { history } = useApp()
  const { streak }  = useStats(history)
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('nex_sidenav_collapsed') === 'true'
  )

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('nex_sidenav_collapsed', String(next))
  }

  const sideClass = [styles.side, collapsed ? styles.collapsed : ''].filter(Boolean).join(' ')

  return (
    <aside className={sideClass} aria-label="Navegação principal">

      <div className={styles.brand}>
        <span className={styles.logo} aria-label="Rootio">../</span>
        {streak > 0 && (
          <span
            className={styles.streak}
            aria-label={`Sequência de ${streak} ${streak === 1 ? 'dia' : 'dias'}`}
          >
            <PiFlameFill size={11} color="var(--gold-dk)" aria-hidden="true" />
            <span aria-hidden="true">{streak}d</span>
          </span>
        )}
      </div>

      <nav className={styles.nav}>

        <button
          type="button"
          className={styles.link}
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <span className={styles.icon} aria-hidden="true">
            <span className={`${styles.collapseIcon} ${collapsed ? styles.collapseIconExpand : ''}`}>
              <span />
            </span>
          </span>
          <span className={styles.label}>Recolher</span>
        </button>

        <div className={styles.divider} aria-hidden="true" />

        {BASE_NAV.map(({ to, label, Icon, IconA }) => (
          <SideLink key={to} to={to} label={label} Icon={Icon} IconA={IconA} />
        ))}

        <div className={styles.divider} aria-hidden="true" />

        {UNLOCKABLE.map(item => (
          <UnlockableItem key={item.id} item={item} />
        ))}

        {/* Perfil — fixado ao fundo */}
        <SideLink
          to={PROFILE_ITEM.to}
          label={PROFILE_ITEM.label}
          Icon={PROFILE_ITEM.Icon}
          IconA={PROFILE_ITEM.IconA}
          extraClass={styles.profileBottom}
        />
      </nav>
    </aside>
  )
}

// ══════════════════════════════════════
// COMPONENTE: ProGate
//
// Wrapper declarativo para features Pro.
// Renderiza os filhos se o usuário tiver
// acesso; caso contrário, exibe um teaser.
//
// Uso básico:
//   <ProGate feature="insights_home">
//     <InsightsCard />
//   </ProGate>
//
// Uso com teaser customizado:
//   <ProGate feature="export_json" teaser={<MeuTeaser />}>
//     <ExportButton />
//   </ProGate>
//
// Uso imperativo (sem wrapper):
//   const { can } = usePlan()
//   if (!can('finance_sixmonth')) return <ProTeaser ... />
// ══════════════════════════════════════
import { PiLockBold, PiCrownBold } from 'react-icons/pi'
import { usePlan } from '../hooks/usePlan'
import styles from './ProGate.module.css'

// ══════════════════════════════════════
// SUBCOMPONENTE: ProTeaser
//
// Teaser padrão exibido quando o acesso
// é bloqueado. Pode ser substituído via
// prop `teaser` no ProGate.
// ══════════════════════════════════════
export function ProTeaser({ title = 'Recurso Pro', description, compact = false }) {
  if (compact) {
    return (
      <span className={styles.badge}>
        <PiLockBold size={9} /> Pro
      </span>
    )
  }

  return (
    <div className={styles.teaser}>
      <div className={styles.teaserIcon}>
        <PiCrownBold size={18} />
      </div>
      <p className={styles.teaserTitle}>{title}</p>
      {description && (
        <p className={styles.teaserDesc}>{description}</p>
      )}
      <span className={styles.teaserBadge}>Plano Pro</span>
    </div>
  )
}

// ══════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════
export function ProGate({ feature, children, teaser }) {
  const { can } = usePlan()

  if (can(feature)) return children

  return teaser ?? (
    <ProTeaser
      title="Recurso Pro"
      description="Faça upgrade para desbloquear este recurso."
    />
  )
}

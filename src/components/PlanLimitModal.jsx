// ══════════════════════════════════════
// COMPONENTE: PlanLimitModal
//
// Modal reutilizável de limite de plano.
// Usado em Habits, Finance, Career, Projects.
// ══════════════════════════════════════
import { PiCrownBold, PiCheckCircleBold } from 'react-icons/pi'

export function PlanLimitModal({ description, freeItems, proItems, stayFreeLabel, onUpgrade, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 360, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PiCrownBold size={18} color="var(--gold-dk)" />
          <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)' }}>Limite atingido</span>
        </div>

        <p style={{ fontSize: 12, color: 'var(--ink2)', margin: 0, lineHeight: 1.5 }}>{description}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Gratuito */}
          <div style={{ background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 6, padding: '10px 12px' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink3)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Gratuito</p>
            {freeItems.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 5 }}>
                <PiCheckCircleBold size={12} color="var(--ink3)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--ink2)', lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
          {/* Pro */}
          <div style={{ background: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 6, padding: '10px 12px' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Pro</p>
            {proItems.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 5 }}>
                <PiCheckCircleBold size={12} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--bg)', lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <button type="button" className="btn btn-primary" style={{ justifyContent: 'center', gap: 6, fontSize: 13 }} onClick={onUpgrade}>
          <PiCrownBold size={14} /> Ver plano Pro
        </button>
        <button type="button" className="btn" style={{ justifyContent: 'center', fontSize: 12, color: 'var(--ink3)', border: '1.5px solid var(--border)' }} onClick={onClose}>
          {stayFreeLabel}
        </button>
      </div>
    </div>
  )
}

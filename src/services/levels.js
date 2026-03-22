import {
  PiLightningBold,
  PiPencilSimpleBold,
  PiArrowCounterClockwiseBold,
  PiFireBold,
  PiTrophyBold,
  PiLeafBold,
} from 'react-icons/pi'

// ══════════════════════════════════════
// SISTEMA DE NÍVEIS — Ioversoroot
// Baseado em io acumulado (pontos ganhos).
//
// Limiares calibrados para uso global
// (ex: 5 hábitos × 20pts × 70% taxa ≈ 70 io/dia):
//
//   Rastro   →  ~1 semana
//   Ritmo    →  ~2 meses
//   Forma    →  ~7 meses
//   Essência →  ~2 anos
//   Raiz     →  ~8 anos
//
// Para uso por hábito (20pts × 70% ≈ 14 io/dia),
// os mesmos limiares representam marcos maiores —
// Raiz num único hábito é genuinamente raro.
// ══════════════════════════════════════

const LEVELS = [
  {
    min: 200_000,
    name: 'Raiz',
    color: '#1b5e20',
    Icon: PiLeafBold,
    mantra: 'Impossível arrancar.',
  },
  {
    min: 50_000,
    name: 'Essência',
    color: '#b71c1c',
    Icon: PiTrophyBold,
    mantra: 'Difícil separar da pessoa.',
  },
  {
    min: 15_000,
    name: 'Forma',
    color: '#6a1b9a',
    Icon: PiFireBold,
    mantra: 'Isso é parte de você.',
  },
  {
    min: 4_000,
    name: 'Ritmo',
    color: '#1565c0',
    Icon: PiArrowCounterClockwiseBold,
    mantra: 'Previsível. Confiável.',
  },
  {
    min: 500,
    name: 'Rastro',
    color: '#2e7d32',
    Icon: PiPencilSimpleBold,
    mantra: 'Você está deixando marca.',
  },
  {
    min: 0,
    name: 'Impulso',
    color: '#a0522d',
    Icon: PiLightningBold,
    mantra: 'Algo começou.',
  },
]

export function calcLevel(earnedIo) {
  const io      = earnedIo ?? 0
  const current = LEVELS.find(l => io >= l.min) ?? LEVELS[LEVELS.length - 1]
  const idx     = LEVELS.indexOf(current)
  const next    = idx > 0 ? LEVELS[idx - 1] : null

  const prog = next
    ? Math.min(99, Math.round((io - current.min) / (next.min - current.min) * 100))
    : 100

  return {
    name:     current.name,
    color:    current.color,
    Icon:     current.Icon,
    mantra:   current.mantra,
    nextName: next?.name  ?? null,
    next:     next?.min   ?? null,   // compatibilidade com Profile.jsx
    prog,
  }
}

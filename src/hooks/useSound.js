// ══════════════════════════════════════
// HOOK: useSound
// Sons via Web Audio API — sem arquivos.
// AudioContext é criado na primeira
// interação do usuário (exigência Safari/Chrome mobile).
// ══════════════════════════════════════

let audioCtx = null

function getCtx() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return audioCtx
  } catch { return null }
}

// Inicializa o contexto na primeira interação real
if (typeof window !== 'undefined') {
  const init = () => {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)() } catch {}
    }
    if (audioCtx?.state === 'suspended') audioCtx.resume()
  }
  window.addEventListener('click',      init, { once: true, passive: true })
  window.addEventListener('touchstart', init, { once: true, passive: true })
  window.addEventListener('keydown',    init, { once: true, passive: true })
}

function tone(ctx, freq, vol, startOffset, dur, type = 'sine') {
  try {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = type
    const t = ctx.currentTime + startOffset
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(vol, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.start(t)
    osc.stop(t + dur + 0.01)
  } catch {}
}

export function useSound(enabled = true) {
  function playCheck() {
    if (!enabled) return
    const ctx = getCtx(); if (!ctx) return
    // Acorde ascendente: Dó-Mi-Sol
    [[523, 0.08, 0.00], [659, 0.08, 0.07], [784, 0.10, 0.14]]
      .forEach(([f, v, t]) => tone(ctx, f, v, t, 0.20, 'sine'))
  }

  function playUncheck() {
    if (!enabled) return
    const ctx = getCtx(); if (!ctx) return
    tone(ctx, 330, 0.06, 0,    0.12, 'sine')
    tone(ctx, 220, 0.04, 0.09, 0.10, 'sine')
  }

  function playBadge() {
    if (!enabled) return
    const ctx = getCtx(); if (!ctx) return
    // Fanfarra curta: Dó-Mi-Sol-Dó oitava
    [[523,0.10,0.00],[659,0.10,0.10],[784,0.12,0.20],[1047,0.13,0.32]]
      .forEach(([f,v,t]) => tone(ctx, f, v, t, 0.20, 'triangle'))
  }

  function playSuccess() {
    if (!enabled) return
    const ctx = getCtx(); if (!ctx) return
    [[784,0.09,0.00],[880,0.09,0.08],[1047,0.11,0.16]]
      .forEach(([f,v,t]) => tone(ctx, f, v, t, 0.22, 'sine'))
  }

  return { playCheck, playUncheck, playBadge, playSuccess }
}

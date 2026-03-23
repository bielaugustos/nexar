// ══════════════════════════════════════
// HOOK: useSound
// Sons via Web Audio API — sem arquivos.
// AudioContext é criado na primeira
// interação do usuário (exigência Safari/Chrome mobile).
// ══════════════════════════════════════

let audioCtx = null
let _soundEnabled = true  // flag global — sincronizada via setSoundEnabled()

export function setSoundEnabled(val) { _soundEnabled = val }

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

// ══════════════════════════════════════
// FUNÇÕES STANDALONE — não precisam do hook,
// respeitam a flag _soundEnabled global.
// Úteis em componentes que não têm acesso
// fácil ao soundOn do contexto.
// ══════════════════════════════════════
function _direct(fn) {
  if (!_soundEnabled) return
  const ctx = getCtx(); if (!ctx) return
  fn(ctx)
}

export function playClickDirect() {
  _direct(ctx => tone(ctx, 1047, 0.035, 0, 0.07, 'sine'))
}

export function playSaveDirect() {
  _direct(ctx => {
    tone(ctx, 659, 0.07, 0.00, 0.14, 'sine')
    tone(ctx, 880, 0.09, 0.10, 0.18, 'sine')
  })
}

export function playErrorDirect() {
  _direct(ctx => {
    tone(ctx, 330, 0.07, 0.00, 0.13, 'sine')
    tone(ctx, 220, 0.05, 0.11, 0.12, 'sine')
  })
}

export function playPurchaseDirect() {
  _direct(ctx => {
    [[523,0.07,0.00],[659,0.09,0.07],[784,0.11,0.14],[1047,0.13,0.23]]
      .forEach(([f,v,t]) => tone(ctx, f, v, t, 0.20, 'triangle'))
  })
}

export function playPinKeyDirect() {
  _direct(ctx => tone(ctx, 880, 0.04, 0, 0.06, 'sine'))
}

export function playNotifyDirect() {
  _direct(ctx => tone(ctx, 880, 0.05, 0, 0.14, 'sine'))
}

// ══════════════════════════════════════
// HOOK — para componentes com acesso ao soundOn
// ══════════════════════════════════════
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

  function playClick() {
    if (!enabled) return
    const ctx = getCtx(); if (!ctx) return
    tone(ctx, 1047, 0.035, 0, 0.07, 'sine')
  }

  function playSave() {
    if (!enabled) return
    const ctx = getCtx(); if (!ctx) return
    tone(ctx, 659, 0.07, 0.00, 0.14, 'sine')
    tone(ctx, 880, 0.09, 0.10, 0.18, 'sine')
  }

  function playError() {
    if (!enabled) return
    const ctx = getCtx(); if (!ctx) return
    tone(ctx, 330, 0.07, 0.00, 0.13, 'sine')
    tone(ctx, 220, 0.05, 0.11, 0.12, 'sine')
  }

  function playPurchase() {
    if (!enabled) return
    const ctx = getCtx(); if (!ctx) return
    [[523,0.07,0.00],[659,0.09,0.07],[784,0.11,0.14],[1047,0.13,0.23]]
      .forEach(([f,v,t]) => tone(ctx, f, v, t, 0.20, 'triangle'))
  }

  function playPinKey() {
    if (!enabled) return
    const ctx = getCtx(); if (!ctx) return
    tone(ctx, 880, 0.04, 0, 0.06, 'sine')
  }

  return { playCheck, playUncheck, playBadge, playSuccess, playClick, playSave, playError, playPurchase, playPinKey }
}

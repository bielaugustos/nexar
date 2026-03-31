// ══════════════════════════════════════
// AVATARES - CONSTANTES
// ══════════════════════════════════════

export const BASE_AVATARS = ['🧑','👩','👨','🧒','👴','👵','🦸','🧙','🚀','🌟','🔥','⚡']

export const SHOP_AVATAR_MAP = { 
  avatar_eagle:'🦅', 
  avatar_monk:'🧘', 
  avatar_lightning:'⚡', 
  avatar_cosmos:'🪐' 
}

export function getAvailableAvatars() {
  try {
    const owned = new Set(JSON.parse(localStorage.getItem('nex_shop_owned') || '[]'))
    const extra = Object.entries(SHOP_AVATAR_MAP).filter(([id]) => owned.has(id)).map(([,e]) => e)
    return [...new Set([...BASE_AVATARS, ...extra])]
  } catch { return BASE_AVATARS }
}

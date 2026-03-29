import { useState, useEffect } from 'react'

// ══════════════════════════════════════
// USE IS DESKTOP - Detectar modo desktop
// ══════════════════════════════════════
export function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(() => {
    // Verificar se está no browser
    if (typeof window === 'undefined') return false
    return window.innerWidth >= breakpoint
  })

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= breakpoint)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isDesktop
}

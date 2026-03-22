import { useState, useEffect, useRef } from 'react'
import { PiWifiSlashBold, PiWifiHighBold } from 'react-icons/pi'
import styles from './OfflineBanner.module.css'

// null = oculto | 'offline' | 'online'
export function OfflineBanner() {
  const [state, setState] = useState(!navigator.onLine ? 'offline' : null)
  const hideTimer = useRef(null)

  function showFor(type, ms) {
    clearTimeout(hideTimer.current)
    setState(type)
    hideTimer.current = setTimeout(() => setState(null), ms)
  }

  useEffect(() => {
    const goOffline = () => showFor('offline', 4000)
    const goOnline  = () => showFor('online',  2500)

    window.addEventListener('offline', goOffline)
    window.addEventListener('online',  goOnline)

    // Se já começou offline, mostra o aviso inicial
    if (!navigator.onLine) showFor('offline', 4000)

    return () => {
      clearTimeout(hideTimer.current)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online',  goOnline)
    }
  }, [])

  if (!state) return null

  return (
    <div className={`${styles.banner} ${state === 'online' ? styles.online : ''}`}>
      {state === 'offline'
        ? <><PiWifiSlashBold size={13}/><span>Sem conexão · dados salvos localmente</span></>
        : <><PiWifiHighBold  size={13}/><span>Conexão restabelecida</span></>
      }
    </div>
  )
}

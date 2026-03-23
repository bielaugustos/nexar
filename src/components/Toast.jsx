import { useEffect, useRef } from 'react'
import { playNotifyDirect } from '../hooks/useSound'

// Singleton: referência global para o toast
let _show = null

export function toast(msg) {
  playNotifyDirect()
  if (_show) _show(msg)
}

export function Toast() {
  const ref    = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    _show = (msg) => {
      if (!ref.current) return
      ref.current.textContent = msg
      ref.current.classList.add('show')
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        ref.current?.classList.remove('show')
      }, 2000)
    }
    return () => { _show = null }
  }, [])

  return <div className="toast" ref={ref} />
}

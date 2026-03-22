import { useState, useEffect } from 'react'
import styles from './SplashScreen.module.css'

export function SplashScreen({ onDone }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 1000)
    const t2 = setTimeout(() => onDone(),          1350)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className={`${styles.overlay} ${exiting ? styles.exit : ''}`}>
      <div className={styles.dots}>
        <span className={styles.dot}/>
        <span className={`${styles.dot} ${styles.dot2}`}/>
        <span className={`${styles.dot} ${styles.dot3}`}/>
      </div>
    </div>
  )
}

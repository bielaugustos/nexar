import { useMemo } from 'react'

// ══════════════════════════════════════
// HOOK: useStats
// Cálculos de progresso derivados do
// histórico. Separado para reuso em
// Home, Profile e Rewards.
// ══════════════════════════════════════

export function useStats(history) {
  const today = new Date().toISOString().slice(0, 10)

  const streak = useMemo(() => {
    let s = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const k = d.toISOString().slice(0, 10)
      if (history[k]?.done > 0) s++
      else break
    }
    return s
  }, [history])

  const daysActive = useMemo(
    () => Object.keys(history).filter(k => history[k]?.done > 0).length,
    [history]
  )

  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 6 + i)
      const k = d.toISOString().slice(0, 10)
      const rec = history[k]
      const done  = rec?.done  || 0
      const total = rec?.total || 5
      return {
        date: k,
        done,
        total,
        rate: total > 0 ? Math.round(done / total * 100) : 0,
        isToday: k === today,
        label: k === today
          ? 'hoje'
          : new Date(k + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      }
    })
  }, [history, today])

  const avgRate7 = useMemo(
    () => Math.round(last7.reduce((a, d) => a + d.rate, 0) / 7),
    [last7]
  )

  const bestDay = useMemo(
    () => last7.reduce((a, b) => b.done > a.done ? b : a, last7[0]),
    [last7]
  )

  // Gera 52 semanas para o heatmap anual
  const heatmapWeeks = useMemo(() => {
    const todayDate = new Date()
    const weeks = []
    const monthLabels = []
    let lastMonth = -1
    let cur = new Date(todayDate)
    cur.setDate(cur.getDate() - 363)
    cur.setDate(cur.getDate() - cur.getDay()) // começa no domingo

    while (cur <= todayDate) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const k = cur.toISOString().slice(0, 10)
        const rec  = history[k]
        const rate = rec?.total > 0 ? Math.round(rec.done / rec.total * 100) : 0
        const intensity = !rec || rec.done === 0 ? 0
          : rate >= 80 ? 4
          : rate >= 50 ? 3
          : rate >= 25 ? 2 : 1
        const isFuture = cur > todayDate

        const m = cur.getMonth()
        if (m !== lastMonth && d === 0) {
          monthLabels.push({
            weekIndex: weeks.length,
            label: cur.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          })
          lastMonth = m
        }

        week.push({
          key: k,
          intensity: isFuture ? -1 : intensity,
          done:  rec?.done  || 0,
          total: rec?.total || 0,
          label: cur.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
        })
        cur.setDate(cur.getDate() + 1)
      }
      weeks.push(week)
    }
    return { weeks, monthLabels }
  }, [history])

  return { streak, daysActive, last7, avgRate7, bestDay, heatmapWeeks }
}

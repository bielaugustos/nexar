import { useMemo } from 'react'
import { useApp } from '../context/AppContext'

// ══════════════════════════════════════
// HOOK: useHabits
// ══════════════════════════════════════
export function useHabits() {
  const { habits, history, toggleHabit, saveHabit, addHabit, deleteHabit } = useApp()

  const todayDow = new Date().getDay()

  // Hábitos do dia — usa optional chaining para safety total
  const todayHabits = useMemo(
    () => habits.filter(h => Array.isArray(h.days) && h.days.includes(todayDow)),
    [habits, todayDow]
  )

  const completed   = todayHabits.filter(h => h.done).length
  const total       = todayHabits.length
  const rate        = total > 0 ? Math.round(completed / total * 100) : 0
  const totalPoints = habits.filter(h => h.done).reduce((acc, h) => acc + (h.pts ?? 0), 0)

  // allPoints = soma real dos pontos de todos os dias no histórico
  // Cada dia guarda quantos hábitos foram feitos.
  // Como não guardamos pts/hábito no histórico, usamos a média atual dos hábitos
  // + pontos de hoje (totalPoints) para uma estimativa consistente.
  const avgPtsPerHabit = useMemo(() => {
    if (!habits.length) return 15
    const total = habits.reduce((a, h) => a + (h.pts ?? 15), 0)
    return Math.round(total / habits.length)
  }, [habits])

  const allPoints = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    // Exclui hoje do histórico — totalPoints já cobre o dia atual com pts reais
    const historyPts = Object.entries(history)
      .filter(([date]) => date !== today)
      .reduce((a, [, d]) => a + ((d?.done ?? 0) * avgPtsPerHabit), 0)
    return historyPts + totalPoints
  }, [history, totalPoints, avgPtsPerHabit])

  return { habits, todayHabits, completed, total, rate, totalPoints, allPoints, avgPtsPerHabit,
           toggleHabit, saveHabit, addHabit, deleteHabit }
}

// ── Stats individuais por hábito ──
export function useHabitStats(habitId, history) {
  return useMemo(() => {
    let done7 = 0, total7 = 0, streak = 0

    for (let i = 1; i <= 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const k = d.toISOString().slice(0, 10)
      if (history[k]) {
        total7++
        if (history[k].habits?.[habitId]) done7++
      }
    }

    for (let i = 1; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const k = d.toISOString().slice(0, 10)
      if (history[k]?.habits?.[habitId]) streak++
      else break
    }

    const totalDone = Object.values(history).filter(r => r?.habits?.[habitId]).length
    const rate7     = total7 > 0 ? Math.round(done7 / total7 * 100) : 0

    return { totalDone, rate7, streak }
  }, [habitId, history])
}

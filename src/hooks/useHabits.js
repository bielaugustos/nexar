// ══════════════════════════════════════
// HOOK: useHabits
//
// Combina o estado central do AppContext
// com cálculos derivados do dia atual:
//   • todayHabits — hábitos programados para hoje
//   • completed / total / rate — progresso do dia
//   • totalPoints — pontos ganhos hoje
//   • allPoints   — pontos acumulados (histórico + hoje)
//
// Exporta também as ações de mutação para
// que componentes não precisem importar
// useApp diretamente.
// ══════════════════════════════════════
import { useMemo, useState } from 'react'
import { useApp }  from '../context/AppContext'

export function useHabits() {
  const {
    habits, history,
    toggleHabit, saveHabit, addHabit, deleteHabit,
  } = useApp()


  // Dia da semana atual (0 = Dom … 6 = Sáb)
  const todayDow = new Date().getDay()

  // ── Hábitos agendados para hoje ──
  // Filtra pelo array `days` de cada hábito.
  // Optional chaining garante segurança com dados antigos.
  const todayHabits = useMemo(
    () => habits.filter(h => Array.isArray(h.days) && h.days.includes(todayDow)),
    [habits, todayDow]
  )

  // ── Progresso do dia ──
  const completed = todayHabits.filter(h => h.done).length
  const total     = todayHabits.length
  const rate      = total > 0 ? Math.round(completed / total * 100) : 0

  // ── Pontos ganhos hoje ──
  // Soma os pts apenas dos hábitos concluídos hoje.
  const totalPoints = todayHabits
    .filter(h => h.done)
    .reduce((acc, h) => acc + (h.pts ?? 0), 0)

  // ── Média de pontos por hábito ──
  // Usada para estimar pontos em dias do histórico
  // onde o valor real não foi armazenado.
  // Calcula a média APENAS dos hábitos concluídos hoje
  const avgPtsPerHabit = useMemo(() => {
    const doneHabits = habits.filter(h => h.done)
    if (!doneHabits.length) return 15
    return Math.round(doneHabits.reduce((a, h) => a + (h.pts ?? 15), 0) / doneHabits.length)
  }, [habits])

  // ── Pontos acumulados (histórico + hoje) ──
  // O histórico armazena quantos hábitos foram feitos (not pts),
  // então estimamos com a média atual. Hoje usa totalPoints real.
  const allPoints = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
  
    const pontosPasados = Object.entries(history)
      .filter(([date]) => date !== todayKey)
      .reduce((acc, [, registro]) => {
        return acc + ((registro?.done ?? 0) * avgPtsPerHabit)
      }, 0)
  
    return pontosPasados + totalPoints
  }, [history, totalPoints, avgPtsPerHabit])

  return {
    habits, todayHabits,
    completed, total, rate,
    totalPoints, allPoints, avgPtsPerHabit,
    toggleHabit, saveHabit, addHabit, deleteHabit,
  }
}

// ══════════════════════════════════════
// useHabitStats — métricas individuais
//
// Calcula, para um hábito específico:
//   totalDone — total de dias concluídos no histórico
//   rate7     — taxa de conclusão nos últimos 7 dias (%)
//   streak    — sequência atual de dias consecutivos
//
// Memoizado por habitId + history para
// evitar recalcular a cada re-render.
// ══════════════════════════════════════
export function useHabitStats(habitId, history) {
  return useMemo(() => {
    let concluidos7 = 0
    let registrados7 = 0
    let streak = 0

    // ── Taxa dos últimos 7 dias (ontem até -7) ──
    for (let i = 1; i <= 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const chave = d.toISOString().slice(0, 10)

      if (history[chave]) {
        registrados7++
        if (history[chave].habits?.[habitId]) concluidos7++
      }
    }

    // ── Sequência atual (streak) ──
    // Para ao encontrar o primeiro dia sem conclusão.
    // Limita a 365 dias para não processar históricos imensos.
    for (let i = 1; i < 365; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const chave = d.toISOString().slice(0, 10)

      if (history[chave]?.habits?.[habitId]) streak++
      else break
    }

    // ── Total de dias concluídos em todo o histórico ──
    const totalDone = Object.values(history)
      .filter(r => r?.habits?.[habitId])
      .length

    const rate7 = registrados7 > 0
      ? Math.round(concluidos7 / registrados7 * 100)
      : 0

    return { totalDone, rate7, streak }
  }, [habitId, history])
}
// ══════════════════════════════════════
// HOOK: useStats
//
// Derivações estatísticas do histórico
// de hábitos. Reutilizado em:
//   Home, Profile, Progress, SideNav, Header
//
// Todos os valores são memoizados —
// só recalculam quando `history` muda.
// ══════════════════════════════════════
import { useMemo } from 'react'

export function useStats(history) {
  // Data de hoje em formato ISO local (YYYY-MM-DD)
  const today = useMemo(() => {
    const d = new Date()
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-')
  }, [])

  // ══════════════════════════════════════
  // STREAK — sequência de dias ativos
  //
  // Se hoje ainda não tem atividade registrada
  // (ex: app abrindo de manhã), começa a contar
  // a partir de ontem — evita "quebrar" a sequência
  // antes que o usuário conclua algum hábito.
  // ══════════════════════════════════════
  const streak = useMemo(() => {
    const temAtividadeHoje = (history[today]?.done || 0) > 0
    let s = 0

    for (let i = temAtividadeHoje ? 0 : 1; i < 365; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const chave = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-')

      if (history[chave]?.done > 0) s++
      else break
    }

    return s
  }, [history, today])

  // ══════════════════════════════════════
  // DIAS ATIVOS — total de dias com ≥ 1 hábito concluído
  // ══════════════════════════════════════
  const daysActive = useMemo(
    () => Object.keys(history).filter(k => history[k]?.done > 0).length,
    [history]
  )

  // ══════════════════════════════════════
  // ÚLTIMOS 7 DIAS — array com dados de cada dia
  //
  // Cada entrada:
  //   date    — ISO string (YYYY-MM-DD)
  //   done    — hábitos concluídos
  //   total   — total de hábitos (5 como fallback quando não há registro)
  //   rate    — % de conclusão
  //   isToday — flag para destaque visual
  //   label   — nome abreviado do dia (ex: "seg", "hoje")
  // ══════════════════════════════════════
  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - 6 + i)
      const chave   = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-')
      const reg     = history[chave]
      const done    = reg?.done  || 0
      const total   = reg?.total || 5   // fallback quando não há histórico
      const isToday = chave === today

      return {
        date: chave,
        done,
        total,
        rate:    total > 0 ? Math.round(done / total * 100) : 0,
        isToday,
        label:   isToday
          ? 'hoje'
          : new Date(chave + 'T12:00:00')
              .toLocaleDateString('pt-BR', { weekday: 'short' })
              .replace('.', ''),
      }
    })
  }, [history, today])

  // ══════════════════════════════════════
  // TAXA MÉDIA DOS 7 DIAS
  // ══════════════════════════════════════
  const avgRate7 = useMemo(
    () => Math.round(last7.reduce((acc, d) => acc + d.rate, 0) / 7),
    [last7]
  )

  // ══════════════════════════════════════
  // MELHOR DIA — maior número de hábitos concluídos
  // nos últimos 7 dias
  // ══════════════════════════════════════
  const bestDay = useMemo(
    () => last7.reduce((melhor, d) => d.done > melhor.done ? d : melhor, last7[0]),
    [last7]
  )

  // ══════════════════════════════════════
  // HEATMAP ANUAL — 52 semanas
  //
  // Começa no domingo mais próximo de
  // 363 dias atrás e avança até hoje.
  //
  // Intensidade por taxa de conclusão:
  //   0 — sem atividade
  //   1 — < 25%
  //   2 — 25–49%
  //   3 — 50–79%
  //   4 — ≥ 80%
  //  -1 — dia futuro (não renderizado)
  //
  // monthLabels — array com { weekIndex, label }
  // para exibir o nome do mês sobre o heatmap.
  // ══════════════════════════════════════
  const heatmapWeeks = useMemo(() => {
    const hoje      = new Date()
    const weeks     = []
    const meses     = []
    let ultimoMes   = -1

    // Ponto de início: domingo mais próximo de ~52 semanas atrás
    const inicio = new Date(hoje)
    inicio.setDate(inicio.getDate() - 363)
    inicio.setDate(inicio.getDate() - inicio.getDay())

    const atual = new Date(inicio)

    while (atual <= hoje) {
      const semana = []

      for (let diaDaSemana = 0; diaDaSemana < 7; diaDaSemana++) {
        const chave    = [
          atual.getFullYear(),
          String(atual.getMonth() + 1).padStart(2, '0'),
          String(atual.getDate()).padStart(2, '0'),
        ].join('-')
        const reg      = history[chave]
        const taxa     = reg?.total > 0 ? Math.round(reg.done / reg.total * 100) : 0
        const futuro   = atual > hoje

        // Rótulo do mês: adicionado uma vez por mês, no início da semana
        const mes = atual.getMonth()
        if (mes !== ultimoMes && diaDaSemana === 0) {
          meses.push({
            weekIndex: weeks.length,
            label: atual
              .toLocaleDateString('pt-BR', { month: 'short' })
              .replace('.', ''),
          })
          ultimoMes = mes
        }

        semana.push({
          key: chave,
          intensity: futuro ? -1
            : !reg || reg.done === 0 ? 0
            : taxa >= 80 ? 4
            : taxa >= 50 ? 3
            : taxa >= 25 ? 2
            : 1,
          done:  reg?.done  || 0,
          total: reg?.total || 0,
          label: atual.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
        })

        atual.setDate(atual.getDate() + 1)
      }

      weeks.push(semana)
    }

    return { weeks, monthLabels: meses }
  }, [history])

  return { streak, daysActive, last7, avgRate7, bestDay, heatmapWeeks }
}

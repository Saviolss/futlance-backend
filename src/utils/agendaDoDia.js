import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { obterAgendaCache } from "./cacheAgenda.js"

// Retorna todas as partidas do dia atual (horário BR)
export function obterPartidasDoDia() {
  const hoje = hojeBR()
  const partidasHoje = []

  for (const campeonatoId of Object.values(CAMPEONATOS)) {
    const agenda = obterAgendaCache(campeonatoId)

    // agenda agora JÁ É um array
    if (!Array.isArray(agenda)) continue

    agenda.forEach(partida => {
      if (partida.data === hoje) {
        partidasHoje.push(partida)
      }
    })
  }

  return partidasHoje
}

function hojeBR() {
  const agora = new Date()
  agora.setHours(agora.getHours() - 3)
  return agora.toISOString().slice(0, 10)
}

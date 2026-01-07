import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { obterAgendaCache } from "./cacheAgenda.js"

// Retorna todas as partidas do dia atual
export function obterPartidasDoDia() {
  const hoje = new Date().toISOString().slice(0, 10)
  const partidasHoje = []

  for (const campeonatoId of Object.values(CAMPEONATOS)) {
    const agenda = obterAgendaCache(campeonatoId)

    if (!agenda || !Array.isArray(agenda.partidas)) continue

    agenda.partidas.forEach(partida => {
      if (partida.data_realizacao?.startsWith(hoje)) {
        partidasHoje.push(partida)
      }
    })
  }

  return partidasHoje
}

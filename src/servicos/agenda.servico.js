import { buscarAgendaApi } from "./apiFutebol.servico.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"
import { CAMPEONATOS } from "../constantes/campeonatos.js"

export async function buscarAgendaCampeonato(idCampeonato) {
  const chaveCache = `agenda:${idCampeonato}`

  const cache = getCache(chaveCache)
  if (cache) return cache

  const agenda = await buscarAgendaApi(idCampeonato)

  setCache(chaveCache, agenda, CACHE_TTL.AGENDA)
  

  return agenda
}

export async function buscarAgendaGeral() {
  const [brasileirao, paulista, carioca] = await Promise.all([
    buscarAgendaCampeonato(CAMPEONATOS.BRASILEIRAO),
    buscarAgendaCampeonato(CAMPEONATOS.PAULISTA),
    buscarAgendaCampeonato(CAMPEONATOS.CARIOCA),
  ])

  return {
    brasileirao: brasileirao.partidas,
    paulista: paulista.partidas,
    carioca: carioca.partidas,
  }
}

export async function buscarAgendaBrasileirao() {
  const agenda = await buscarAgendaApi(CAMPEONATOS.BRASILEIRAO)
  return agenda.partidas
}
export async function buscarAgendaPaulista() {
  const agenda = await buscarAgendaApi(CAMPEONATOS.PAULISTA)
  return agenda.partidas
}
export async function buscarAgendaCarioca() {
  const agenda = await buscarAgendaApi(CAMPEONATOS.CARIOCA)
  return agenda.partidas
}
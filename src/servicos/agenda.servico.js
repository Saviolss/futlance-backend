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

export function buscarAgendaBrasileirao() {
  return buscarAgendaCampeonato(CAMPEONATOS.BRASILEIRAO)
}

export function buscarAgendaPaulista() {
  return buscarAgendaCampeonato(CAMPEONATOS.PAULISTA)
}

export function buscarAgendaCarioca() {
  return buscarAgendaCampeonato(CAMPEONATOS.CARIOCA)
}
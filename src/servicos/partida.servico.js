import { buscarPartidaApi } from "./apiFutebol.servico.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"
import { PARTIDAS } from "../constantes/partidas.js"

export async function buscarPartida(idPartida) {
  const chaveCache = `partida:${idPartida}`

  const cache = getCache(chaveCache)
  if (cache) return cache

  const partida = await buscarPartidaApi(idPartida)

  setCache(chaveCache, partida, CACHE_TTL.PARTIDA)

  return partida
}

export function buscarPartidaBrasileirao() {
  return buscarPartida(PARTIDAS.BRASILEIRAO)
}

export function buscarPartidaPaulista() {
  return buscarPartida(PARTIDAS.PAULISTA)
}

export function buscarPartidaCarioca() {
  return buscarPartida(PARTIDAS.CARIOCA)
}
import { buscarTabelaApi } from "./apiFutebol.servico.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"
import { CAMPEONATOS } from "../constantes/campeonatos.js"

async function buscarTabelaCampeonato(idCampeonato) {
  const chaveCache = `tabela:${idCampeonato}`

  const cache = getCache(chaveCache)
  if (cache) return cache

  const tabela = await buscarTabelaApi(idCampeonato)

  setCache(chaveCache, tabela, CACHE_TTL.TABELA)

  return tabela
}

export function buscarTabelaBrasileirao() {
  return buscarTabelaCampeonato(CAMPEONATOS.BRASILEIRAO)
}

export function buscarTabelaPaulista() {
  return buscarTabelaCampeonato(CAMPEONATOS.PAULISTA)
}

export function buscarTabelaCarioca() {
  return buscarTabelaCampeonato(CAMPEONATOS.CARIOCA)
}

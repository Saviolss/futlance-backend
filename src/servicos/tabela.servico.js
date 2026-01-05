import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarTabelaApi } from "./apiFutebol.servico.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"

/* 🔹 função base */
async function buscarTabelaCampeonato(idCampeonato) {
  const chave = `tabela:${idCampeonato}`

  const cache = getCache(chave)
  if (cache) return cache

  const tabela = await buscarTabelaApi(idCampeonato)

  setCache(chave, tabela, CACHE_TTL.TABELA)

  return tabela
}

/* 🔹 exports públicos */
export function buscarTabelaBrasileirao() {
  return buscarTabelaCampeonato(CAMPEONATOS.BRASILEIRAO)
}

export function buscarTabelaPaulista() {
  return buscarTabelaCampeonato(CAMPEONATOS.PAULISTA)
}

export function buscarTabelaCarioca() {
  return buscarTabelaCampeonato(CAMPEONATOS.CARIOCA)
}

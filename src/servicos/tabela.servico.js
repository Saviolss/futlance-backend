import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarTabelaApi, artilheirosCampeonatoApi } from "./apiFutebol.servico.js"
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

async function buscarArtilheirosCampeonato(idCampeonato) {
  const chave = `artilheiros:${idCampeonato}`

  const cache = getCache(chave)
  if (cache) return cache

  const artilheiros = await artilheirosCampeonatoApi(idCampeonato)

  setCache(chave, artilheiros, CACHE_TTL.ARTILHEIROS)

  return artilheiros
}

export function buscarArtilheirosBrasileirao() {
  return buscarArtilheirosCampeonato(CAMPEONATOS.BRASILEIRAO)
}

export function buscarArtilheirosPaulista() {
  return buscarArtilheirosCampeonato(CAMPEONATOS.PAULISTA)
}

export function buscarArtilheirosCarioca() {
  return buscarArtilheirosCampeonato(CAMPEONATOS.CARIOCA)
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

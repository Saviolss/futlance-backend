import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarTabelaApi, artilheirosCampeonatoApi } from "./apiFutebol.servico.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"

/* 🔹 função base */
async function buscarTabelaCampeonato(idCampeonato) {
  const chave = `tabela:${idCampeonato}`

  const cache = getCache(chave)
  if (cache) return cache

  const tabelaApi = await buscarTabelaApi(idCampeonato)

  // 🔥 CASO ESPECIAL: CARIOCA (GRUPOS)
  if (idCampeonato === CAMPEONATOS.CARIOCA) {
    const guanabara = tabelaApi?.["taca-guanabara"]

    if (!guanabara) return {}

    const resultado = {}

    for (const [grupo, times] of Object.entries(guanabara)) {
      resultado[grupo] = times
        .map(normalizarTimeTabela)
        .filter(Boolean)
    }

    setCache(chave, resultado, CACHE_TTL.TABELA)
    return resultado
  }

  // 🔹 FLUXO NORMAL (BR / PAULISTA)
  if (!Array.isArray(tabelaApi)) return []

  const tabelaNormalizada = tabelaApi
    .map(normalizarTimeTabela)
    .filter(Boolean)

  setCache(chave, tabelaNormalizada, CACHE_TTL.TABELA)

  return tabelaNormalizada
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
export async function atualizarTabelaCampeonato(idCampeonato) {
  return buscarTabelaCampeonato(idCampeonato)
}

/* 🔹 artilheiros */
async function buscarArtilheirosCampeonato(idCampeonato) {
  const chave = `artilheiros:${idCampeonato}`

  const cache = getCache(chave)
  if (cache) return cache

  const artilheirosApi = await artilheirosCampeonatoApi(idCampeonato)
  if (!Array.isArray(artilheirosApi)) return []

  const artilheirosNormalizados = artilheirosApi
    .map(normalizarArtilheiro)
    .filter(Boolean)

  setCache(chave, artilheirosNormalizados, CACHE_TTL.ARTILHEIROS)

  return artilheirosNormalizados
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

/* 🔹 normalização */
function normalizarTimeTabela(item) {
  if (!item?.time) return null

  return {
    id: item.time.time_id,
    posicao: item.posicao,
    nome: item.time.nome_popular,
    escudo: item.time.escudo,

    pontos: item.pontos,
    jogos: item.jogos,
    vitorias: item.vitorias,
    empates: item.empates,
    derrotas: item.derrotas,

    golsPro: item.gols_pro,
    golsContra: item.gols_contra,
    saldoGols: item.saldo_gols,
  }
}

function normalizarArtilheiro(item) {
  if (!item?.atleta || !item?.time) return null

  return {
    id: item.atleta.atleta_id,
    nome: item.atleta.nome_popular,

    clube: {
      id: item.time.time_id,
      nome: item.time.nome_popular,
      escudo: item.time.escudo,
    },

    gols: item.gols,
  }
}


function extrairTimesTabela(node) {
  if (Array.isArray(node)) return node

  if (node && typeof node === "object") {
    return Object.values(node).flatMap(extrairTimesTabela)
  }

  return []
}

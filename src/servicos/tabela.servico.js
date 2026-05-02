import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarTabelaApi } from "./apiFutebol.servico.js"

import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"

/* =========================================================
   FUNÇÃO BASE
========================================================= */

async function buscarTabelaCampeonato(idCampeonato) {

  const chaveCache = `tabela:${idCampeonato}`

  const cache = getCache(chaveCache)
  if (cache) return cache


  /* Copa do Brasil não possui endpoint tabela */
  if (idCampeonato === CAMPEONATOS.COPABRASIL) {

    return {
      tipo: "campeonatos",
      fase: null,
      dados: []
    }
  }

  const tabela = await buscarTabelaApi(idCampeonato)

  const resposta = {
    tipo: "campeonatos",
    ...normalizarTabela(tabela)
  }

  setCache(
    chaveCache,
    resposta,
    CACHE_TTL.TABELA
  )

  return resposta
}


/* =========================================================
   NORMALIZA TABELA
========================================================= */

function normalizarTabela(tabela) {

  /* pontos corridos */
  if (Array.isArray(tabela)) {
    return {
      fase: "tabela",
      dados: tabela.map(normalizarTime)
    }
  }

  /* grupos */
  if (tabela?.grupos) {
    return {
      fase: "grupos",
      dados: Object.entries(tabela.grupos).map(
        ([nomeGrupo, times]) => ({
          grupo: nomeGrupo,
          times: times.map(normalizarTime)
        })
      )
    }
  }

  /* se paulista/carioca mudarem para mata-mata */
  if (tabela?.fases) {
    return {
      fase: "mata-mata",
      dados: []
    }
  }

  return {
    fase: null,
    dados: []
  }
}


/* =========================================================
   NORMALIZA TIME
========================================================= */

function normalizarTime(time) {

  const dadosTime = time.time || {}

  return {
    time_id: dadosTime.time_id,
    nome: dadosTime.nome_popular || "",
    escudo: dadosTime.escudo || "",

    posicao: time.posicao,
    pontos: time.pontos,
    jogos: time.jogos,

    vitorias: time.vitorias,
    empates: time.empates,
    derrotas: time.derrotas,

    gols_pro: time.gols_pro,
    gols_contra: time.gols_contra,
    saldo_gols: time.saldo_gols,

    aproveitamento: time.aproveitamento
  }
}


/* =========================================================
   EXPORTS
========================================================= */

export function buscarTabelaBrasileirao() {
  return buscarTabelaCampeonato(
    CAMPEONATOS.BRASILEIRAO
  )
}

export function buscarTabelaPaulista() {
  return buscarTabelaCampeonato(
    CAMPEONATOS.PAULISTA
  )
}

export function buscarTabelaCarioca() {
  return buscarTabelaCampeonato(
    CAMPEONATOS.CARIOCA
  )
}

export function buscarTabelaCopaBrasil() {
  return buscarTabelaCampeonato(
    CAMPEONATOS.COPABRASIL
  )
}

export function atualizarTabelaCampeonato(idCampeonato) {

  const chaveCache = `tabela:${idCampeonato}`

  getCache(chaveCache) &&
    setCache(chaveCache, null, 0)

  return buscarTabelaCampeonato(idCampeonato)
}
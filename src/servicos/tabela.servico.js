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

  /* ============================
     PONTOS CORRIDOS
  ============================ */

  if (Array.isArray(tabela)) {

    return {
      fase: "tabela",

      dados: tabela.map(
        normalizarTime
      )
    }
  }

  /* ============================
     FASE DE GRUPOS
  ============================ */

  // 🔥 Copa do Mundo
  const faseGrupos =
    tabela?.["fase-de-grupos"]

  if (faseGrupos) {

    return {

      fase: "grupos",

      dados: Object.entries(faseGrupos)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([nomeGrupo, times]) => ({

        grupo:
          nomeGrupo
            .replace("grupo-", "")
            .toUpperCase(),

        times:
          (times || [])
            .map(normalizarTime)
      }))
    }
  }

  /* ============================
     MATA-MATA
  ============================ */

  if (tabela?.fases) {

    return {
      fase: "mata-mata",
      dados: []
    }
  }

  /* ============================
     FALLBACK
  ============================ */

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

export function buscarTabelaCopaMundo() {
  return buscarTabelaCampeonato(
    CAMPEONATOS.COPAMUNDO
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
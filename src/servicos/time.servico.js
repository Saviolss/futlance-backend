import {
  buscarTabelaApi,
  buscarTimeApi,
  buscarProximasPartidasTimeApi
} from "../servicos/apiFutebol.servico.js"

import {
  getCache,
  setCache
} from "../cache/cacheMemoria.js"

import { CACHE_TTL } from "../constantes/cacheTTL.js"

import { CAMPEONATOS } from "../constantes/campeonatos.js"

/* ======================================================
   SLUG
====================================================== */

function gerarSlug(nome = "") {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/* ======================================================
   EXTRAI TIMES DA COPA
====================================================== */

function extrairTimesCopa(tabela) {

  const times = []

  Object.values(tabela || {}).forEach(fase => {

    if (!fase || typeof fase !== "object") {
      return
    }

    Object.values(fase).forEach(grupo => {

      if (!Array.isArray(grupo)) {
        return
      }

      grupo.forEach(item => {

        if (!item?.time) {
          return
        }

        times.push({
          time_id: item.time.time_id,
          nome: item.time.nome_popular,
          escudo: item.time.escudo
        })
      })
    })
  })

  return times
}

/* ======================================================
   LISTA DE TIMES DA COPA
====================================================== */

export async function buscarTimesCopa() {

  const chave = "copa:times"

  const cache = getCache(chave)

  if (cache) {
    return cache
  }

  const tabela = await buscarTabelaApi(
    CAMPEONATOS.CHAMPIONS
  )

  const times = extrairTimesCopa(tabela)

  const unicos = [
    ...new Map(
      times.map(t => [t.time_id, t])
    ).values()
  ]

  const resultado = unicos.map(time => ({
    ...time,
    slug: gerarSlug(time.nome)
  }))

  setCache(
    chave,
    resultado,
    CACHE_TTL.TABELA
  )

  return resultado
}

/* ======================================================
   PRÓXIMAS PARTIDAS
====================================================== */

function normalizarProximasPartidas(partidas = {}) {

  const lista = []

  Object.values(partidas).forEach(campeonato => {

    if (!Array.isArray(campeonato)) return

    campeonato.forEach(partida => {

      lista.push({
        partida_id: partida.partida_id,

        campeonato:
          partida.campeonato?.nome,

        status:
          partida.status,

        data:
          partida.data_realizacao,

        hora:
          partida.hora_realizacao,

        estadio:
          partida.estadio?.nome_popular,

        mandante: {
          nome:
            partida.time_mandante?.nome_popular,

          escudo:
            partida.time_mandante?.escudo
        },

        visitante: {
          nome:
            partida.time_visitante?.nome_popular,

          escudo:
            partida.time_visitante?.escudo
        }
      })
    })
  })

  return lista
}

/* ======================================================
   DETALHES DO TIME
====================================================== */

export async function buscarTimePorSlug(slug) {

  const chave = `time:${slug}`

  const cache = getCache(chave)

  if (cache) {
    return cache
  }

  const times = await buscarTimesCopa()

  const encontrado = times.find(
    t => t.slug === slug
  )

  if (!encontrado) {
    return null
  }

  const [
    time,
    proximas
  ] = await Promise.all([
    buscarTimeApi(
      encontrado.time_id
    ),

    buscarProximasPartidasTimeApi(
      encontrado.time_id
    )
  ])

  const resultado = {

    time_id:
      time.time_id,

    nome:
      time.nome,

    nome_popular:
      time.nome_popular,

    sigla:
      time.sigla,

    escudo:
      time.escudo,

    slug,

    proximasPartidas:
      normalizarProximasPartidas(
        proximas
      )
  }

  setCache(
    chave,
    resultado,
    CACHE_TTL.TABELA
  )

  return resultado
}
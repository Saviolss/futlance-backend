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

  function adicionarTimes(valor) {

    if (Array.isArray(valor)) {

      valor.forEach(item => {

        const time = item?.time || item

        if (!time?.time_id) {
          return
        }

        times.push({
          time_id: time.time_id,
          nome: time.nome_popular || time.nome,
          escudo: time.escudo
        })

      })

      return
    }

    if (valor && typeof valor === "object") {
      Object.values(valor).forEach(adicionarTimes)
    }

  }

  adicionarTimes(tabela)

  return times
}

/* ======================================================
   LISTA DE TIMES DA COPA
====================================================== */

export async function buscarTimesCampeonatos(
  campeonatos = [
    CAMPEONATOS.BRASILEIRAO,
    CAMPEONATOS.CHAMPIONS
  ]
) {

  const chave = "campeonatos:times"

  const cache = getCache(chave)

  if (cache) {
    return cache
  }

  const resultados = await Promise.allSettled(
    [...new Set(campeonatos)]
      .map(idCampeonato => buscarTabelaApi(idCampeonato))
  )

  const times = resultados
    .filter(resultado => resultado.status === "fulfilled")
    .flatMap(resultado => extrairTimesCopa(resultado.value))

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


export async function buscarTimesCopa() {
  return buscarTimesCampeonatos()
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

  const times = await buscarTimesCampeonatos()

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
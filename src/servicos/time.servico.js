
import {
  buscarTabelaApi,
  buscarTimeApi,
  buscarProximasPartidasTimeApi
} from "../servicos/apiFutebol.servico.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"
import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { prisma } from "../lib/prisma.js"

function gerarSlug(nome = "") {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function extrairTimesCopa(tabela) {
  const times = []

  function adicionarTimes(valor) {
    if (Array.isArray(valor)) {
      valor.forEach(item => {
        const time = item?.time || item
        if (!time?.time_id) return

        times.push({
          time_id: time.time_id,
          nome: time.nome_popular || time.nome,
          escudo: time.escudo,
          apelido: time.apelido
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

export async function buscarTimesCampeonatos(
  campeonatos = [CAMPEONATOS.BRASILEIRAO],
  { ignorarCache = false } = {}
) {
  const chave = `campeonatos:times:${[...new Set(campeonatos)].sort().join("-")}`

  if (!ignorarCache) {
    const cache = getCache(chave)
    if (cache) return cache
  }

  const idsCampeonato = [...new Set(campeonatos)]
  const resultados = await Promise.allSettled(
    idsCampeonato.map(idCampeonato => buscarTabelaApi(idCampeonato))
  )

  const resultadosComErro = resultados
    .map((resultado, indice) => ({
      resultado,
      idCampeonato: idsCampeonato[indice]
    }))
    .filter(({ resultado }) => resultado.status === "rejected")

  for (const { resultado, idCampeonato } of resultadosComErro) {
    console.error(
      `❌ Erro ao buscar times do campeonato ${idCampeonato}:`,
      resultado.reason?.message || resultado.reason
    )
  }

  const resultadosValidos = resultados.filter(
    resultado => resultado.status === "fulfilled"
  )

  // Não aceita resultado parcial para evitar desativar times incorretamente.
  if (resultadosValidos.length !== idsCampeonato.length) {
    throw new Error("Falha ao buscar todos os campeonatos. Lista de times não atualizada.")
  }

  const times = resultadosValidos.flatMap(
    resultado => extrairTimesCopa(resultado.value)
  )

  const unicos = [
    ...new Map(times.map(time => [Number(time.time_id), time])).values()
  ]

  const resultado = unicos.map(time => ({
    ...time,
    slug: gerarSlug(time.nome)
  }))

  if (resultado.length > 0) {
    setCache(chave, resultado, CACHE_TTL.TABELA)
  }

  return resultado
}

export async function buscarTimesCopa() {
  return buscarTimesCampeonatos()
}

function normalizarProximasPartidas(partidas = {}) {
  const lista = []

  Object.values(partidas).forEach(campeonato => {
    if (!Array.isArray(campeonato)) return

    campeonato.forEach(partida => {
      lista.push({
        partida_id: partida.partida_id,
        campeonato: partida.campeonato?.nome,
        status: partida.status,
        data: partida.data_realizacao,
        hora: partida.hora_realizacao,
        estadio: partida.estadio?.nome_popular,
        mandante: {
          nome: partida.time_mandante?.nome_popular,
          escudo: partida.time_mandante?.escudo
        },
        visitante: {
          nome: partida.time_visitante?.nome_popular,
          escudo: partida.time_visitante?.escudo
        }
      })
    })
  })

  return lista
}

export async function buscarTimePorSlug(slug) {
  const chave = `time:${slug}`
  const cache = getCache(chave)

  if (cache) return cache

  const times = await buscarTimesCampeonatos()
  const encontrado = times.find(time => time.slug === slug)

  if (!encontrado) return null

  const [time, proximas, registro] = await Promise.all([
    buscarTimeApi(encontrado.time_id),
    buscarProximasPartidasTimeApi(encontrado.time_id),
    prisma.time.findUnique({
      where: { timeId: encontrado.time_id },
      select: { disponivelAssinatura: true }
    })
  ])

  const resultado = {
    time_id: time.time_id,
    nome: time.nome,
    nome_popular: time.nome_popular,
    apelido: time.apelido,
    sigla: time.sigla,
    disponivelAssinatura: registro?.disponivelAssinatura === true,
    escudo: time.escudo,
    slug,
    proximasPartidas: normalizarProximasPartidas(proximas)
  }

  setCache(chave, resultado, CACHE_TTL.TABELA)
  return resultado
}

import { buscarAgendaApi } from "./apiFutebol.servico.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"
import { CAMPEONATOS } from "../constantes/campeonatos.js"

/* =========================================================
   🔹 NORMALIZA PARTIDA
========================================================= */
function normalizarPartida(partida, campeonato) {
  if (!partida?.time_mandante || !partida?.time_visitante) return null

  return {
    partida_id: partida.partida_id,
    campeonato,

    mandante: {
      nome: partida.time_mandante.nome_popular,
      escudo: partida.time_mandante.escudo
    },

    visitante: {
      nome: partida.time_visitante.nome_popular,
      escudo: partida.time_visitante.escudo
    },

    data: partida.data_realizacao,
    hora: partida.hora_realizacao || "--:--",
    status: partida.status,

    // uso interno
    data_iso: partida.data_realizacao_iso
  }
}

/* =========================================================
   🔹 EXTRAI PARTIDAS (OBJETO PROFUNDO)
========================================================= */
function extrairTodasPartidas(node) {

  if (!node) return []

  // se já é uma partida, retorna ela
  if (
    node.partida_id &&
    node.time_mandante &&
    node.time_visitante
  ) {
    return [node]
  }

  if (Array.isArray(node)) {
    return node.flatMap(extrairTodasPartidas)
  }

  if (typeof node === "object") {
    return Object.values(node).flatMap(extrairTodasPartidas)
  }

  return []
}

/* =========================================================
   🔹 SELECIONA HOJE OU PRÓXIMO DIA
========================================================= */
function selecionarPartidasDoDiaOuProxima(partidas) {
  if (!partidas.length) return []

  const agora = new Date()
  const hoje = new Date()
    .toLocaleDateString("sv-SE")

  // 1️⃣ jogos de hoje
  const hojeJogos = partidas.filter(p =>
    p.data_iso?.startsWith(hoje)
  )

  if (hojeJogos.length) return hojeJogos

  // 2️⃣ próximos jogos
  const futuros = partidas
    .filter(p => p.data_iso)
    .map(p => ({ ...p, _data: new Date(p.data_iso) }))
    .filter(p => p._data > agora)

  if (!futuros.length) return []

  const grupos = {}
  futuros.forEach(p => {
    const dia = p.data_iso.split("T")[0]
    if (!grupos[dia]) grupos[dia] = []
    grupos[dia].push(p)
  })

  const proximoDia = Object.keys(grupos).sort()[0]

  return grupos[proximoDia].map(({ _data, ...rest }) => rest)
}

/* =========================================================
   🔹 PROCESSA AGENDA
========================================================= */
function processarAgenda(agenda, campeonato) {
  if (!agenda?.partidas) return []

  const todas = extrairTodasPartidas(agenda.partidas)
    .map(p => normalizarPartida(p, campeonato))
    .filter(Boolean)

  return selecionarPartidasDoDiaOuProxima(todas)
}

/* =========================================================
   🔹 FUNÇÃO BASE COM CACHE
========================================================= */
async function buscarAgendaCampeonato(idCampeonato, nomeCampeonato) {
  const chaveCache = `agenda:${idCampeonato}`

  const cache = getCache(chaveCache)
  if (cache) return cache

  try {
    const agenda = await buscarAgendaApi(idCampeonato)


    const processada = processarAgenda(agenda, nomeCampeonato)


    setCache(chaveCache, processada, CACHE_TTL.AGENDA)

    return processada
  } catch (erro) {
    console.error(
      `❌ Erro ao buscar agenda do campeonato ${idCampeonato}:`,
      erro.message
    )

    return []
  }
}

/* =========================================================
   🔹 EXPORTS
========================================================= */
export function buscarAgendaBrasileirao() {
  return buscarAgendaCampeonato(
    CAMPEONATOS.BRASILEIRAO,
    "Brasileirão"
  )
}

export function buscarAgendaPaulista() {
  return buscarAgendaCampeonato(
    CAMPEONATOS.PAULISTA,
    "Paulista"
  )
}

export function buscarAgendaCarioca() {
  return buscarAgendaCampeonato(
    CAMPEONATOS.CARIOCA,
    "Carioca"
  )
}

export function buscarAgendaCopaBrasil() {
  return buscarAgendaCampeonato(
    CAMPEONATOS.COPABRASIL,
    "Copa do Brasil"
  )
}

export function buscarAgendaGeral() {
  return Promise.allSettled([
    buscarAgendaBrasileirao(),
    buscarAgendaPaulista(),
    buscarAgendaCarioca(),
    buscarAgendaCopaBrasil()
  ]).then(([brasileirao, paulista, carioca, copaBrasil]) => {
    const jogosAgenda = [
      ...(brasileirao.status === "fulfilled"
        ? brasileiro.value
        : []),

      ...(paulista.status === "fulfilled"
        ? paulista.value
        : []),

      ...(carioca.status === "fulfilled"
        ? carioca.value
        : []),

      ...(copaBrasil.status === "fulfilled"
        ? copaBrasil.value
        : [])
    ]

    return jogosAgenda
  })  .catch(erro => {
    console.error("❌ Erro ao buscar agenda geral:", erro.message)
    return []
  })
}
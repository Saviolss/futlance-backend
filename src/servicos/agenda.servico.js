import { buscarAgendaApi } from "./apiFutebol.servico.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"
import { CAMPEONATOS } from "../constantes/campeonatos.js"

/* =========================================================
   🔹 NORMALIZA PARTIDA
========================================================= */

function normalizarPartida(partida, campeonato) {

  if (
    !partida?.time_mandante ||
    !partida?.time_visitante
  ) {
    return null
  }

  return {

    partida_id:
      partida.partida_id,

    campeonato,

    mandante: {
      nome:
        partida.time_mandante.nome_popular,

      escudo:
        partida.time_mandante.escudo
    },

    visitante: {
      nome:
        partida.time_visitante.nome_popular,

      escudo:
        partida.time_visitante.escudo
    },

    data:
      partida.data_realizacao,

    hora:
      partida.hora_realizacao || "--:--",

    status:
      partida.status,

    // uso interno
    data_iso:
      partida.data_realizacao_iso
  }
}

/* =========================================================
   🔹 REMOVE DUPLICADOS
========================================================= */

function removerDuplicados(partidas = []) {

  const mapa = new Map()

  partidas.forEach(partida => {

    mapa.set(
      partida.partida_id,
      partida
    )
  })

  return [...mapa.values()]
}

/* =========================================================
   🔹 EXTRAI PARTIDAS (OBJETO PROFUNDO)
========================================================= */

function extrairTodasPartidas(node) {

  if (!node) {
    return []
  }

  // já é uma partida
  if (
    node.partida_id &&
    node.time_mandante &&
    node.time_visitante
  ) {
    return [node]
  }

  // array
  if (Array.isArray(node)) {

    return node.flatMap(
      extrairTodasPartidas
    )
  }

  // objeto
  if (typeof node === "object") {

    return Object
      .values(node)
      .flatMap(extrairTodasPartidas)
  }

  return []
}

/* =========================================================
   🔹 SELECIONA HOJE OU PRÓXIMO DIA
========================================================= */

function selecionarPartidasDoDiaOuProxima(partidas) {

  if (!partidas.length) {
    return []
  }

  const agora = new Date()

  const hoje =
    new Date()
      .toLocaleDateString("sv-SE")

  /* ============================
     1️⃣ JOGOS DE HOJE
  ============================ */

  const hojeJogos =
    partidas.filter(p =>

      p.data_iso?.startsWith(hoje)
    )

  if (hojeJogos.length) {

    return hojeJogos
  }

  /* ============================
     2️⃣ PRÓXIMOS JOGOS
  ============================ */

  const futuros = partidas

    .filter(p => p.data_iso)

    .map(p => ({
      ...p,
      _data: new Date(p.data_iso)
    }))

    .filter(p => p._data > agora)

  if (!futuros.length) {

    return []
  }

  const grupos = {}

  futuros.forEach(p => {

    const dia =
      p.data_iso.split("T")[0]

    if (!grupos[dia]) {

      grupos[dia] = []
    }

    grupos[dia].push(p)
  })

  const proximoDia =
    Object.keys(grupos)
      .sort()[0]

  return grupos[proximoDia]
    .map(({ _data, ...rest }) => rest)
}

/* =========================================================
   🔹 PROCESSA AGENDA
========================================================= */

function processarAgenda(
  agenda,
  campeonato
) {

  if (!agenda?.partidas) {

    return []
  }

  const todas = extrairTodasPartidas(
    agenda.partidas
  )

    .map(p =>
      normalizarPartida(
        p,
        campeonato
      )
    )

    .filter(Boolean)

  const semDuplicados =
    removerDuplicados(todas)

  return selecionarPartidasDoDiaOuProxima(
    semDuplicados
  )
}

/* =========================================================
   🔹 FUNÇÃO BASE COM CACHE
========================================================= */

async function buscarAgendaCampeonato(
  idCampeonato,
  nomeCampeonato
) {

  const chaveCache =
    `agenda:${idCampeonato}`

  const cache =
    getCache(chaveCache)

  if (cache) {

    return cache
  }

  try {

    const agenda =
      await buscarAgendaApi(
        idCampeonato
      )

    const processada =
      processarAgenda(
        agenda,
        nomeCampeonato
      )

    setCache(
      chaveCache,
      processada,
      CACHE_TTL.AGENDA
    )

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
   🔹 BRASILEIRÃO
========================================================= */

export function buscarAgendaBrasileirao() {

  return buscarAgendaCampeonato(

    CAMPEONATOS.BRASILEIRAO,

    "Brasileirão"
  )
}

/* =========================================================
   🔹 COPA DO MUNDO
========================================================= */

export function buscarAgendaCopaMundo() {

  return buscarAgendaCampeonato(

    CAMPEONATOS.COPAMUNDO,

    "Copa do Mundo"
  )
}

/* =========================================================
   🔹 COPA DO BRASIL
========================================================= */

export function buscarAgendaCopaBrasil() {

  return buscarAgendaCampeonato(

    CAMPEONATOS.COPABRASIL,

    "Copa do Brasil"
  )
}

/* =========================================================
   🔹 AGENDA GERAL
========================================================= */

export function buscarAgendaGeral() {

  return Promise.allSettled([

    buscarAgendaBrasileirao(),

    buscarAgendaCopaBrasil(),

    buscarAgendaCopaMundo()

  ]).then(([

    brasileirao,
    copaBrasil,
    copaMundo

  ]) => {

    const jogosAgenda = [

      ...(brasileirao.status === "fulfilled"
        ? brasileirao.value
        : []),

      ...(copaBrasil.status === "fulfilled"
        ? copaBrasil.value
        : []),

      ...(copaMundo.status === "fulfilled"
        ? copaMundo.value
        : [])
    ]

    return removerDuplicados(
      jogosAgenda
    )

  }).catch(erro => {

    console.error(
      "❌ Erro ao buscar agenda geral:",
      erro.message
    )

    return []
  })
}
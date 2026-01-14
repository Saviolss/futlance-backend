import { buscarAgendaApi } from "./apiFutebol.servico.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"
import { CAMPEONATOS } from "../constantes/campeonatos.js"

/* =========================================================
   CACHE
========================================================= */
export async function buscarAgendaCampeonato(idCampeonato) {
  const chaveCache = `agenda:${idCampeonato}`

  const cache = getCache(chaveCache)
  if (cache) return cache

  try {
    const agenda = await buscarAgendaApi(idCampeonato)

    if (!agenda || typeof agenda !== "object") {
      return { partidas: [] }
    }

    setCache(chaveCache, agenda, CACHE_TTL.AGENDA)
    return agenda
  } catch (erro) {
    console.error(
      `❌ Erro ao buscar agenda do campeonato ${idCampeonato}:`,
      erro.message
    )

    // 🔥 nunca quebra o fluxo
    return { partidas: [] }
  }
}

/* =========================================================
   NORMALIZA PARTIDA
========================================================= */
function normalizarPartida(partida, campeonato) {
  if (!partida?.time_mandante || !partida?.time_visitante) return null

  return {
    partida_id: partida.partida_id,
    campeonato,

    mandante: {
      nome: partida.time_mandante.nome_popular,
      escudo: partida.time_mandante.escudo,
    },

    visitante: {
      nome: partida.time_visitante.nome_popular,
      escudo: partida.time_visitante.escudo,
    },

    data: partida.data_realizacao,
    hora: partida.hora_realizacao || "--:--",
    status: partida.status,

    // interno
    data_iso: partida.data_realizacao_iso,
  }
}

/* =========================================================
   EXTRAI PARTIDAS (OBJETO PROFUNDO)
========================================================= */
function extrairTodasPartidas(node) {
  if (Array.isArray(node)) return node

  if (node && typeof node === "object") {
    return Object.values(node).flatMap(extrairTodasPartidas)
  }

  return []
}

/* =========================================================
   SELECIONA RODADA MAIS PRÓXIMA
========================================================= */

function selecionarPartidasDoDiaOuProxima(partidas) {
  if (!partidas.length) return []

  const agora = new Date()
  const hoje = agora.toISOString().slice(0, 10)

  // 1️⃣ Jogos de hoje
  const hojeJogos = partidas.filter(p =>
    p.data_iso?.startsWith(hoje)
  )

  if (hojeJogos.length) {
    return hojeJogos
  }

  // 2️⃣ Próximo dia com jogos
  const futuros = partidas
    .filter(p => p.data_iso)
    .map(p => ({
      ...p,
      _data: new Date(p.data_iso)
    }))
    .filter(p => p._data > agora)

  if (!futuros.length) return []

  // agrupa por dia
  const grupos = {}
  futuros.forEach(p => {
    const dia = p.data_iso.split("T")[0]
    if (!grupos[dia]) grupos[dia] = []
    grupos[dia].push(p)
  })

  // escolhe o dia mais próximo
  const proximoDia = Object.keys(grupos).sort()[0]

  return grupos[proximoDia].map(({ _data, ...rest }) => rest)
}



/* =========================================================
   🔥 PROCESSAR AGENDA (FALTAVA ISSO)
========================================================= */
function processarAgenda(agenda, campeonato) {
  if (!agenda?.partidas) return []

  const todas = extrairTodasPartidas(agenda.partidas)
    .map(p => normalizarPartida(p, campeonato))
    .filter(Boolean)

    return selecionarPartidasDoDiaOuProxima(todas)

}


/* =========================================================
   EXPORTS
========================================================= */
export async function buscarAgendaBrasileirao() {
  const agenda = await buscarAgendaCampeonato(CAMPEONATOS.BRASILEIRAO)
  return processarAgenda(agenda, "Brasileirão")
}

export async function buscarAgendaPaulista() {
  const agenda = await buscarAgendaCampeonato(CAMPEONATOS.PAULISTA)
  return processarAgenda(agenda, "Paulista")
}

export async function buscarAgendaCarioca() {
  const agenda = await buscarAgendaCampeonato(CAMPEONATOS.CARIOCA)
  return processarAgenda(agenda, "Carioca")
}

import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarAoVivoApi } from "./apiFutebol.servico.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"

/* 🔹 função base */
async function buscarPartidasAoVivoCampeonato(idCampeonato = null) {
  const chave = idCampeonato
    ? `ao-vivo:${idCampeonato}`
    : `ao-vivo:todas`

  const cache = getCache(chave)
  if (cache) return cache

  const partidas = await buscarAoVivoApi()

  if (!Array.isArray(partidas)) return []

  const partidasAoVivo = partidas.filter(p => {
    const aoVivo =
      p.status === "andamento" ||
      p.status === "intervalo"

    if (!aoVivo) return false
    if (!idCampeonato) return true

    return p.campeonato?.campeonato_id === idCampeonato
  })

  const partidasNormalizadas = partidasAoVivo
    .map(normalizarPartida)
    .filter(Boolean)

  setCache(chave, partidasNormalizadas, CACHE_TTL.PARTIDAS_AO_VIVO)

  return partidasNormalizadas
}

/* 🔹 exports públicos */
export function buscarTodasAoVivo() {
  return buscarPartidasAoVivoCampeonato()
}

export function buscarBrasileiraoAoVivo() {
  return buscarPartidasAoVivoCampeonato(CAMPEONATOS.BRASILEIRAO)
}

export function buscarPaulistaAoVivo() {
  return buscarPartidasAoVivoCampeonato(CAMPEONATOS.PAULISTA)
}

export function buscarCariocaAoVivo() {
  return buscarPartidasAoVivoCampeonato(CAMPEONATOS.CARIOCA)
}

export function buscarCopaBrasilAoVivo() {
  return buscarPartidasAoVivoCampeonato(CAMPEONATOS.COPABRASIL)
}

function normalizarPartida(p) {
  return {
    partida_id: p.partida_id,
    status: p.status,
    tempo: p.tempo || null,

    campeonato: {
      nome: p.campeonato?.nome
    },

    placar_mandante: p.placar_mandante,
    placar_visitante: p.placar_visitante,

    // 👇 NOVO: penalti
    penalti: p.disputa_penalti
      ? {
        mandante: p.disputa_penalti.placar_penalti_mandante,
        visitante: p.disputa_penalti.placar_penalti_visitante,
        cobrancas: p.disputa_penalti.cobrancas || []
      }
      : null,

    mandante: {
      nome: p.time_mandante?.nome_popular,
      escudo: p.time_mandante?.escudo
    },

    visitante: {
      nome: p.time_visitante?.nome_popular,
      escudo: p.time_visitante?.escudo
    },

    estadio: {
      nome_popular: p.estadio?.nome_popular
    }
  }
}

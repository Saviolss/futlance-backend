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

  const partidasNormalizadas = partidasAoVivo.map(normalizarPartida)

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

function normalizarPartida(p) {
  return {
    partida_id: p.partida_id,
    status: p.status,

    placar_mandante: p.placar_mandante,
    placar_visitante: p.placar_visitante,

    time_mandante: p.time_mandante,
    time_visitante: p.time_visitante
  }
}


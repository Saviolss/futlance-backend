import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarRodadasApi } from "./apiFutebol.servico.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"

const LIMITE_HORAS = 48

/* =========================================================
   🔹 BUSCA POR CAMPEONATO (SEGURA)
========================================================= */
async function buscarFinalizadasCampeonato(idCampeonato) {
  if (!idCampeonato) {
    console.warn("⚠️ Campeonato inválido:", idCampeonato)
    return []
  }

  const chave = `finalizadas:${idCampeonato}`

  const cache = getCache(chave)
  if (cache) return cache

  try {
    const rodadas = await buscarRodadasApi(idCampeonato)
    if (!Array.isArray(rodadas)) return []

    const agora = Date.now()
    const limite = LIMITE_HORAS * 60 * 60 * 1000

    const partidas = rodadas
      .flatMap(r => r.partidas || [])
      .filter(p => {
        if (p.status !== "finalizado") return false

        const data = new Date(p.data_realizacao_iso).getTime()
        return data >= agora - limite
      })
      .map(normalizarPartidaFinalizada)

    setCache(chave, partidas, CACHE_TTL.PARTIDAS_FINALIZADAS)

    return partidas
  } catch (erro) {
    console.error(
      `❌ Erro ao buscar partidas encerradas do campeonato ${idCampeonato}:`,
      erro.message
    )
    return []
  }
}

/* =========================================================
   🔹 NORMALIZA PARTIDA
========================================================= */
function normalizarPartidaFinalizada(p) {
  return {
    partida_id: p.partida_id,
    status: "finalizado",

    campeonato: {
      nome: p.campeonato?.nome
    },

    mandante: {
      nome: p.time_mandante?.nome_popular,
      escudo: p.time_mandante?.escudo
    },

    visitante: {
      nome: p.time_visitante?.nome_popular,
      escudo: p.time_visitante?.escudo
    },

    placar_mandante: p.placar_mandante,
    placar_visitante: p.placar_visitante,

    data: p.data_realizacao,
    hora: p.hora_realizacao
  }
}

/* =========================================================
   🔹 TODAS FINALIZADAS (CORRIGIDO)
========================================================= */
export async function buscarTodasFinalizadas() {
  const [
    brasileirao,
    paulista,
    carioca,
    copaBrasil
  ] = await Promise.allSettled([
    buscarBrasileiraoFinalizadas(),
    buscarPaulistaFinalizadas(),
    buscarCariocaFinalizadas(),
    buscarCopaBrasilFinalizadas()
  ])

  return [
    ...(brasileirao.status === "fulfilled" ? brasileirao.value : []),
    ...(paulista.status === "fulfilled" ? paulista.value : []),
    ...(carioca.status === "fulfilled" ? carioca.value : []),
    ...(copaBrasil.status === "fulfilled" ? copaBrasil.value : [])
  ]
}

/* =========================================================
   🔹 EXPORTS POR CAMPEONATO
========================================================= */
export function buscarBrasileiraoFinalizadas() {
  return buscarFinalizadasCampeonato(CAMPEONATOS.BRASILEIRAO)
}

export function buscarPaulistaFinalizadas() {
  return buscarFinalizadasCampeonato(CAMPEONATOS.PAULISTA)
}

export function buscarCariocaFinalizadas() {
  return buscarFinalizadasCampeonato(CAMPEONATOS.CARIOCA)
}

export function buscarCopaBrasilFinalizadas() {
  return buscarFinalizadasCampeonato(CAMPEONATOS.COPABRASIL)
}
import cron from "node-cron"
import {
  buscarAgendaBrasileirao,
  buscarAgendaPaulista,
  buscarAgendaCarioca,
  buscarAgendaCopaBrasil
} from "../servicos/agenda.servico.js"

import { adicionarPartidaAoVivo } from "../utils/partidasAoVivo.js"
import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"

export function iniciarJobAgenda() {
  // ❌ NÃO EXECUTA IMEDIATAMENTE
  cron.schedule("0 */12 * * *", executarJobAgenda)
}

async function executarJobAgenda() {
  const chave = "agenda:atualizada"

  // 🛑 Trava de cache
  if (getCache(chave)) {
    console.log("📅 Agenda já atualizada (cache)")
    return
  }

  try {
    console.log("📅 Atualizando agenda...")

    const agendaBrasileirao = await buscarAgendaBrasileirao()
    processarAgenda(CAMPEONATOS.BRASILEIRAO, agendaBrasileirao)

    const agendaPaulista = await buscarAgendaPaulista()
    processarAgenda(CAMPEONATOS.PAULISTA, agendaPaulista)

    const agendaCarioca = await buscarAgendaCarioca()
    processarAgenda(CAMPEONATOS.CARIOCA, agendaCarioca)

    const agendaCopaBrasil = await buscarAgendaCopaBrasil()
    processarAgenda(CAMPEONATOS.COPABRASIL, agendaCopaBrasil)

    // ✅ Marca como atualizada
    setCache(chave, true, CACHE_TTL.AGENDA)

    console.log("✅ Agenda processada")
  } catch (erro) {
    console.error("❌ Erro ao atualizar agenda", erro.message)
  }
}

function processarAgenda(agenda, campeonato) {
  if (!agenda) return []

  // tenta extrair partidas de qualquer estrutura
  const raiz = agenda.partidas || agenda.fases || agenda

  const todas = extrairTodasPartidas(raiz)
    .map(p => normalizarPartida(p, campeonato))
    .filter(Boolean)

  if (!todas.length) {
    console.log(`ℹ️ [${campeonato}] sem partidas`)
    return []
  }

  return selecionarRodadaPorData(todas)
}

import cron from "node-cron"
import { buscarAgendaGeral } from "../servicos/agenda.servico.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"

export function iniciarJobAgenda() {
  cron.schedule("0 */12 * * *", executarJobAgenda)
}

async function executarJobAgenda() {
  const chave = "agenda:atualizada"

  if (getCache(chave)) {
    console.log("📅 Agenda já atualizada (cache)")
    return
  }

  try {
    console.log("📅 Atualizando agenda...")

    const agenda = await buscarAgendaGeral()

    console.log("📦 Agenda carregada:", agenda.length)

    setCache(chave, true, CACHE_TTL.AGENDA)

    console.log("✅ Agenda processada")
  } catch (erro) {
    console.error("❌ ERRO CRÍTICO AGENDA:", erro)
  }
}
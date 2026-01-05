import cron from "node-cron"
import {
  buscarAgendaBrasileirao,
  buscarAgendaPaulista,
  buscarAgendaCarioca,
} from "../servicos/agenda.servico.js"

import { adicionarPartidaAoVivo } from "../utils/partidasAoVivo.js"
import { CAMPEONATOS } from "../constantes/campeonatos.js"

export function iniciarJobAgenda() {
  executarJobAgenda()
  cron.schedule("0 */12 * * *", executarJobAgenda)
}

async function executarJobAgenda() {
  try {
    console.log("📅 Atualizando agenda...")

    const agendaBrasileirao = await buscarAgendaBrasileirao()
    processarAgenda(CAMPEONATOS.BRASILEIRAO, agendaBrasileirao)

    const agendaPaulista = await buscarAgendaPaulista()
    processarAgenda(CAMPEONATOS.PAULISTA, agendaPaulista)

    const agendaCarioca = await buscarAgendaCarioca()
    processarAgenda(CAMPEONATOS.CARIOCA, agendaCarioca)

    console.log("✅ Agenda processada")
  } catch (erro) {
    console.error("❌ Erro ao atualizar agenda", erro.message)
  }
}

function processarAgenda(idCampeonato, partidas) {
  if (!Array.isArray(partidas)) return

  partidas.forEach(partida => {
    if (
      partida.status === "agendado" ||
      partida.status === "andamento"
    ) {
      adicionarPartidaAoVivo(idCampeonato, partida)
    }
  })
}

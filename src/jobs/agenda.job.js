import cron from "node-cron"

import { CAMPEONATOS } from "../constantes/campeonatos.js"

import {
  atualizarAgendaCampeonato
} from "../servicos/agenda.servico.js"

export function iniciarJobAgenda() {

  // Executa ao iniciar o servidor
  executarJobAgenda()

  // Executa a cada 6 horas
  cron.schedule("0 */6 * * *", executarJobAgenda)
}

async function executarJobAgenda() {

  try {

    console.log("📅 Atualizando agenda...")

    await Promise.all([

      atualizarAgendaCampeonato(
        CAMPEONATOS.BRASILEIRAO,
        "Brasileirão"
      ),

      atualizarAgendaCampeonato(
        CAMPEONATOS.COPABRASIL,
        "Copa do Brasil"
      ),

      atualizarAgendaCampeonato(
        CAMPEONATOS.CHAMPIONS,
        "Champions League"
      )

    ])

    console.log("✅ Agenda atualizada com sucesso.")

  } catch (erro) {

    console.error(
      "❌ Erro ao atualizar agenda:",
      erro
    )

  }

}
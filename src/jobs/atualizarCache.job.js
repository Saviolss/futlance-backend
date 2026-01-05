import cron from "node-cron"

import {
  buscarTabelaBrasileirao,
  buscarTabelaPaulista,
  buscarTabelaCarioca,
} from "../servicos/tabela.servico.js"

import {
  buscarAgendaBrasileirao,
  buscarAgendaPaulista,
  buscarAgendaCarioca,
} from "../servicos/agenda.servico.js"

export function iniciarJobs() {
  // ======================
  // TABELAS – a cada 10 min
  // ======================
  cron.schedule("*/10 * * * *", async () => {
    try {
      console.log("🔄 Atualizando cache das tabelas...")

      await Promise.all([
        buscarTabelaBrasileirao(),
        buscarTabelaPaulista(),
        buscarTabelaCarioca(),
      ])

      console.log("✅ Tabelas atualizadas")
    } catch (erro) {
      console.error("❌ Erro ao atualizar tabelas", erro.message)
    }
  })

  // ======================
  // AGENDAS – a cada 15 min
  // ======================
  cron.schedule("*/15 * * * *", async () => {
    try {
      console.log("📅 Atualizando cache das agendas...")

      await Promise.all([
        buscarAgendaBrasileirao(),
        buscarAgendaPaulista(),
        buscarAgendaCarioca(),
      ])

      console.log("✅ Agendas atualizadas")
    } catch (erro) {
      console.error("❌ Erro ao atualizar agendas", erro.message)
    }
  })
}

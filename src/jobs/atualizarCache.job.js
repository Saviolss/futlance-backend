import cron from "node-cron"

import {
  atualizarTabelaCampeonato
} from "../servicos/tabela.servico.js"

import {
  CAMPEONATOS 
} from "../constantes/campeonatos.js"

import {
  buscarAgendaBrasileirao,
  buscarAgendaCopaMundo,
  buscarAgendaCopaBrasil
} from "../servicos/agenda.servico.js"

import {
  buscarArtilheirosBrasileirao,
  buscarArtilheirosCopaMundo,
  buscarArtilheirosCopaBrasil,
  atualizarArtilhariaCampeonato
} from "../servicos/artilheiro.servico.js"

export function iniciarJobs() {
  // ======================
  // TABELAS – a cada 45 min
  // ======================
  cron.schedule("*/45 * * * *", async () => {

    try {

      console.log("🔄 Atualizando tabelas...")

      await Promise.all([

        atualizarTabelaCampeonato(
          CAMPEONATOS.BRASILEIRAO
        ),

        atualizarTabelaCampeonato(
          CAMPEONATOS.COPAMUNDO
        )

      ])

      console.log("✅ Tabelas atualizadas")

    } catch (erro) {

      console.error(
        "❌ Erro ao atualizar tabelas",
        erro.message
      )

    }

  })

  // ======================
  // AGENDAS – a cada 12 horas
  // ======================
  cron.schedule("0 */12 * * *", async () => {
    try {
      console.log("📅 Atualizando cache das agendas...")

      await Promise.all([
        buscarAgendaBrasileirao(),
        buscarAgendaCopaMundo(),
        buscarAgendaCopaBrasil(),
      ])

      console.log("✅ Agendas atualizadas")
    } catch (erro) {
      console.error("❌ Erro ao atualizar agendas", erro.message)
    }
  })

  // ======================
  // ARTILHEIROS – a cada 40 min
  // ======================
  cron.schedule("*/40 * * * *", async () => {
    try {
      console.log("🔄 Atualizando cache dos artilheiros...");

      await Promise.all([
        atualizarArtilhariaCampeonato(CAMPEONATOS.BRASILEIRAO),
        atualizarArtilhariaCampeonato(CAMPEONATOS.COPAMUNDO),
        atualizarArtilhariaCampeonato(CAMPEONATOS.COPABRASIL),
      ]);

      console.log("✅ Artilheiros atualizados");
    } catch (erro) {
      console.error("❌ Erro ao atualizar artilheiros", erro.message);
    }
  })
}

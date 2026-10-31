
import cron from "node-cron"
import { atualizarTabelaCampeonato } from "../servicos/tabela.servico.js"
import { CAMPEONATOS } from "../constantes/campeonatos.js"
import {
  buscarAgendaBrasileirao,
  buscarAgendaChampions,
  buscarAgendaCopaBrasil
} from "../servicos/agenda.servico.js"

import {
  buscarArtilheirosBrasileirao,
  buscarArtilheirosChampions,
  buscarArtilheirosCopaBrasil,
  atualizarArtilhariaCampeonato
} from "../servicos/artilheiro.servico.js"
import { atualizarNoticiasTimesAtivos } from "../assistenteTorcedor/notificacao/noticia.service.js"
import { enviarNoticiasAssinantes } from "../assistenteTorcedor/notificacao/noticia.notificacao.service.js"
import { enviarLembretesJogos } from "../assistenteTorcedor/notificacao/lembrete.notificacao.service.js"

export function iniciarJobs() {
  cron.schedule("*/45 * * * *", async () => {
    try {
      console.log("🔄 Atualizando tabelas...")
      await Promise.all([
        atualizarTabelaCampeonato(CAMPEONATOS.BRASILEIRAO),
        atualizarTabelaCampeonato(CAMPEONATOS.CHAMPIONS)
      ])
      console.log("✅ Tabelas atualizadas")
    } catch (erro) {
      console.error("❌ Erro ao atualizar tabelas:", erro.message)
    }
  })

  cron.schedule("0 */12 * * *", async () => {
    try {
      console.log("📅 Atualizando agendas...")
      await Promise.all([
        buscarAgendaBrasileirao(),
        buscarAgendaChampions(),
        buscarAgendaCopaBrasil()
      ])
      console.log("✅ Agendas atualizadas")
    } catch (erro) {
      console.error("❌ Erro ao atualizar agendas:", erro.message)
    }
  })

  cron.schedule("*/45 * * * *", async () => {
    try {
      console.log("🔄 Atualizando artilheiros...")
      await Promise.all([
        atualizarArtilhariaCampeonato(CAMPEONATOS.BRASILEIRAO),
        atualizarArtilhariaCampeonato(CAMPEONATOS.CHAMPIONS),
        atualizarArtilhariaCampeonato(CAMPEONATOS.COPABRASIL)
      ])
      console.log("✅ Artilheiros atualizados")
    } catch (erro) {
      console.error("❌ Erro ao atualizar artilheiros:", erro.message)
    }
  })

  cron.schedule("0 6 * * *", async () => {
    try {
      console.log("📰 Atualizando notícias do Assistente...")
      const total = await atualizarNoticiasTimesAtivos()
      console.log(`✅ Notícias atualizadas: ${total}`)
    } catch (erro) {
      console.error("❌ Erro ao atualizar notícias:", erro.message)
    }
  })

  cron.schedule("15 6 * * *", async () => {
    try {
      console.log("📲 Enfileirando notícias para os assinantes...")
      const resultado = await enviarNoticiasAssinantes()
      console.log(
        `✅ Notícias enfileiradas: ${resultado.enfileiradas}, ignoradas: ${resultado.ignoradas}, erros: ${resultado.erros}`
      )
    } catch (erro) {
      console.error("❌ Erro ao enfileirar notícias:", erro.message)
    }
  })

  cron.schedule("* * * * *", async () => {
    try {
      await enviarLembretesJogos()
    } catch (erro) {
      console.error("❌ Erro ao verificar lembretes:", erro.message)
    }
  })

  console.log("✅ Agendamentos do Futlance iniciados.")
}

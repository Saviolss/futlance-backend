
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
import { executarJobNoticiasTimes } from "../assistenteTorcedor/noticia/noticiaTime.job.js"
import { enviarNoticiasAssinantes } from "../assistenteTorcedor/notificacao/noticia.notificacao.service.js"
import { enviarLembretesJogos } from "../assistenteTorcedor/notificacao/lembrete.notificacao.service.js"
import { removerPartidasFinalizadasAntigas } from "../servicos/partidaFinalizada.servico.js"

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

  // Coleta automática de notícias: a cada 30 minutos
  cron.schedule("*/30 * * * *", async () => {
    try {
      console.log("📰 Iniciando robôs de notícias...")
      const total = await executarJobNoticiasTimes()
      console.log(`✅ Coleta concluída: ${total} notícias processadas.`)
    } catch (erro) {
      console.error("❌ Erro na coleta de notícias:", erro.message)
    }
  }, { timezone: "America/Sao_Paulo" })

  // Distribuição diária de notícias aos assinantes
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
  }, { timezone: "America/Sao_Paulo" })

  cron.schedule("* * * * *", async () => {
    try {
      await enviarLembretesJogos()
    } catch (erro) {
      console.error("❌ Erro ao verificar lembretes:", erro.message)
    }
  })

  cron.schedule("0 3 * * *", async () => {
    try {
      const removidas = await removerPartidasFinalizadasAntigas()
      console.log(`🧹 Partidas finalizadas removidas (mais de 60 dias): ${removidas}`)
    } catch (erro) {
      console.error("❌ Erro ao remover partidas finalizadas antigas:", erro.message)
    }
  }, { timezone: "America/Sao_Paulo" })

  console.log("✅ Agendamentos do Futlance iniciados.")
}


import cron from "node-cron"
import { processarFilaNotificacoes } from "../assistenteTorcedor/notificacao/fila.notificacao.worker.js"

let executando = false

async function executarFila() {
  if (executando) return

  executando = true
  try {
    await processarFilaNotificacoes()
  } catch (erro) {
    console.error("❌ Erro ao processar fila de notificações:", erro.message)
  } finally {
    executando = false
  }
}

export function iniciarJobFilaNotificacoes() {
  cron.schedule("* * * * *", executarFila)
  console.log("✅ Job da fila de notificações iniciado.")
}

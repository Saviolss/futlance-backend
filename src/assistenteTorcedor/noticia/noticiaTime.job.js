
import { atualizarNoticiasTimesAtivos } from "./noticia.service.js"

let executando = false

export async function executarJobNoticiasTimes() {
  if (executando) {
    console.log("⏳ Coleta de notícias já está em execução.")
    return 0
  }

  executando = true

  try {
    console.log("🚀 Iniciando coleta automática de notícias...")
    return await atualizarNoticiasTimesAtivos()
  } catch (erro) {
    console.error("❌ Erro no Job de notícias:", erro.message)
    throw erro
  } finally {
    executando = false
  }
}

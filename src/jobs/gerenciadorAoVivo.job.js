import { iniciarJobPartidasAoVivo } from "./partidasAoVivo.job.js"
import { obterPartidasDoDia } from "../utils/agendaDoDia.js"

let jobAtivo = false

export async function gerenciarAoVivo() {
  try {
    const partidasHoje = await obterPartidasDoDia()

    if (partidasHoje.length > 0 && !jobAtivo) {
      iniciarJobPartidasAoVivo()
      jobAtivo = true
      console.log("🔥 Job de partidas ao vivo ATIVADO")
    }

    if (partidasHoje.length === 0 && jobAtivo) {
      jobAtivo = false
      console.log("🛑 Nenhuma partida hoje, job ao vivo DESATIVADO")
    }
  } catch (erro) {
    console.error("❌ Erro no gerenciador ao vivo:", erro.message)
  }
}

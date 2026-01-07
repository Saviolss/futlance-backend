import { iniciarJobPartidasAoVivo } from "./partidasAoVivo.job.js"
import { obterPartidasDoDia } from "../utils/agendaDoDia.js"

let jobAtivo = false

export async function gerenciarAoVivo() {
  const partidasHoje = await obterPartidasDoDia()

  if (partidasHoje.length > 0 && !jobAtivo) {
    iniciarJobPartidasAoVivo()
    jobAtivo = true
    console.log("🔥 Job ao-vivo ativado")
  }

  if (partidasHoje.length === 0 && jobAtivo) {
    jobAtivo = false
    console.log("🛑 Job ao-vivo desativado")
  }
}

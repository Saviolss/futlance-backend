import dotenv from "dotenv"
import app from "./app.js"

import { iniciarJobs } from "./jobs/atualizarCache.job.js"
import { iniciarJobAgenda } from "./jobs/agenda.job.js"
import { iniciarJobPartidasAoVivo } from "./jobs/partidasAoVivo.job.js"

iniciarJobs()
iniciarJobAgenda()
iniciarJobPartidasAoVivo()

dotenv.config()

const PORTA = process.env.PORT || 3333

app.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`)
})

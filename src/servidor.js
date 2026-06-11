import dotenv from "dotenv"
import app from "./app.js"

import { iniciarJobs } from "./jobs/atualizarCache.job.js"
import { iniciarJobAgenda } from "./jobs/agenda.job.js"
import { iniciarJobPartidas } from "./jobs/atualizarPartida.job.js"
import { iniciarJobPartidasAoVivo } from "./jobs/partidasAoVivo.job.js"
import { gerenciarAoVivo } from "./jobs/gerenciadorAoVivo.job.js"
import { iniciarJobNoticias } from "./noticias/noticia.job.js"
import { iniciarWebSocket } from "./websocket/websocket.js"
import { iniciarJobTimes } from "./jobs/time.job.js"
import cron from "node-cron"
import http from "http"

cron.schedule("*/5 * * * *", gerenciarAoVivo)
const server = http.createServer(app)
iniciarWebSocket(server)

iniciarJobs()
iniciarJobAgenda()
iniciarJobPartidasAoVivo()
iniciarJobPartidas()
iniciarJobNoticias() 
iniciarJobTimes() 

dotenv.config()

const PORTA = process.env.PORT || 3333

server.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`)
})

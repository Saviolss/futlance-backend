import dotenv from "dotenv"
import app from "./app.js"

dotenv.config()

import { iniciarJobs } from "./jobs/atualizarCache.job.js"
import { iniciarJobAgenda } from "./jobs/agenda.job.js"
import { iniciarJobPartidas } from "./jobs/atualizarPartida.job.js"
import { gerenciarAoVivo } from "./jobs/gerenciadorAoVivo.job.js"
import { iniciarJobNoticias } from "./noticias/noticia.job.js"
import { iniciarWebSocket } from "./websocket/websocket.js"
import { iniciarJobTimes } from "./jobs/time.job.js"
import { iniciarJobFilaNotificacoes } from "./jobs/notificacaoFila.job.js"
import cron from "node-cron"
import http from "http"

cron.schedule("*/5 * * * *", gerenciarAoVivo)
gerenciarAoVivo()
const server = http.createServer(app)
iniciarWebSocket(server)

iniciarJobs()
iniciarJobAgenda()
iniciarJobPartidas()
iniciarJobNoticias() 
iniciarJobTimes() 
iniciarJobFilaNotificacoes()

const PORTA = process.env.PORT || 3333

server.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`)
})

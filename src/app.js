import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"

// Rotas
import tabelaRotas from "./rotas/tabela.rotas.js"
import agendaRotas from "./rotas/agenda.rotas.js"
import partidaRotas from "./rotas/partida.rotas.js" 
import statusRotas from "./rotas/status.rotas.js"
import aoVivoRotas from "./rotas/aoVivo.rotas.js"
import agendaGeral from "./rotas/agendaGeral.rotas.js"

// Carrega variáveis de ambiente
dotenv.config()

const app = express()

/* ============================
   SEGURANÇA BÁSICA
============================ */

// Headers de segurança
app.use(helmet())

// CORS (ajuste o domínio depois)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET"],
  })
)

// Limite de requisições (protege custos e ataques)
const limitador = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 req por IP
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limitador)

// Parser JSON
app.use(express.json())

/* ============================
   ROTAS
============================ */

app.use("/status", statusRotas)
app.use("/tabela", tabelaRotas)
app.use("/agenda", agendaRotas)
app.use("/partida", partidaRotas)
app.use("/api", aoVivoRotas)
app.use("/agenda-geral", agendaGeral)

/* ============================
   TRATAMENTO DE ERROS
============================ */

app.use((err, req, res, next) => {
  console.error("Erro interno:", err)

  res.status(500).json({
    erro: "Erro interno do servidor",
  })
})

export default app

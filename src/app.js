import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"

// Rotas
import home from "./rotas/home.rotas.js"
import tabelaRotas from "./rotas/tabela.rotas.js"
import agendaRotas from "./rotas/agenda.rotas.js"
import statusRotas from "./rotas/status.rotas.js"
import agendaGeral from "./rotas/agendaGeral.rotas.js"
import aoVivoRotas from "./rotas/partidaLive.rota.js"
import encerradasRotas from "./rotas/finalizada.rotas.js"
import campeonatosRotas from "./rotas/campeonatos.rotas.js"
import artilheiroRotas from "./rotas/artilheiro.rota.js"
import noticia from "./noticias/noticia.rotas.js"
import time from "./rotas/time.rotas.js"

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
    origin: process.env.FRONTEND_URL,
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
app.use("/", home)
app.use("/status", statusRotas)
app.use("/tabela", tabelaRotas)
app.use("/agenda", agendaRotas)
app.use("/api", aoVivoRotas)
app.use("/api", agendaGeral)
app.use("/api", encerradasRotas)
app.use("/campeonatos", campeonatosRotas)
app.use("/artilheiros", artilheiroRotas)
app.use("/home", noticia) 
app.use("/api", time)
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

import "dotenv/config"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import cookieParser from "cookie-parser"

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
import autenticacaoRotas from "./assistenteTorcedor/autenticacao/autenticacao.routes.js"
import assinaturaRotas from "./assistenteTorcedor/assinatura/assinatura.router.js"
import pagamentoRotas from "./assistenteTorcedor/pagamento/pagamento.router.js"
import stripeWebhookRotas from "./assistenteTorcedor/pagamento/stripe.webhook.routes.js"
import whatsappWebhookRotas from "./assistenteTorcedor/whatsapp/whatsapp.webhook.rotas.js"

const app = express()

// SEGURANÇA
app.use(helmet())

// CORS
const origensPermitidas = [
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || origensPermitidas.includes(origin)) return callback(null, true)
    return callback(new Error("Origem não autorizada pelo CORS."))
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}))



// RATE LIMIT
const limitador = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas requisições. Tente novamente em alguns instantes." }
})
app.use(limitador)

// WEBHOOK STRIPE
app.use("/pagamento/stripe", stripeWebhookRotas)

// WEBHOOK WHATSAPP
// O corpo precisa permanecer em formato Buffer para validar a assinatura da Meta.
app.use(
  "/webhook/whatsapp",
  express.raw({ type: "application/json", limit: "1mb" }),
  whatsappWebhookRotas
)

// PARSER JSON PARA AS DEMAIS ROTAS
app.use(express.json({ limit: "1mb" }))
app.use(cookieParser())

// ROTAS EXISTENTES
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

// ASSISTENTE DO TORCEDOR
app.use("/auth", autenticacaoRotas)
app.use("/assinatura", assinaturaRotas)
app.use("/pagamento", pagamentoRotas)

// ROTA NÃO ENCONTRADA
app.use((req, res) => {
  return res.status(404).json({ erro: "Rota não encontrada." })
})

// TRATAMENTO DE ERROS
app.use((err, req, res, next) => {
  console.error("Erro interno:", err)

  if (err.message === "Origem não autorizada pelo CORS.") {
    return res.status(403).json({ erro: "Origem não autorizada." })
  }

  return res.status(500).json({ erro: "Erro interno do servidor." })
})

export default app

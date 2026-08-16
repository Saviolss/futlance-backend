import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"

// ============================================================
// ROTAS EXISTENTES
// ============================================================

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

// ============================================================
// VARIÁVEIS DE AMBIENTE
// ============================================================

dotenv.config()

const app = express()


/* ============================================================
   SEGURANÇA
============================================================ */

// ------------------------------------------------------------
// HEADERS DE SEGURANÇA
// ------------------------------------------------------------

app.use(
  helmet()
)


// ------------------------------------------------------------
// CORS
// ------------------------------------------------------------

const origensPermitidas = [
  "https://futlance.com",
  "https://www.futlance.com"
]

if (process.env.NODE_ENV !== "production") {

  origensPermitidas.push(
    "http://localhost:3000"
  )

}

app.use(
  cors({
    origin: function (origin, callback) {

      // Permite requisições sem Origin
      // como algumas chamadas internas,
      // ferramentas e monitoramento.

      if (!origin) {

        return callback(null, true)

      }

      if (
        origensPermitidas.includes(origin)
      ) {

        return callback(null, true)

      }

      return callback(
        new Error(
          "Origem não autorizada pelo CORS."
        )
      )

    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]

  })
)


// ------------------------------------------------------------
// RATE LIMIT
// ------------------------------------------------------------

const limitador = rateLimit({

  windowMs:
    1 * 60 * 1000,

  max:
    100,

  standardHeaders:
    true,

  legacyHeaders:
    false,

  message: {

    erro:
      "Muitas requisições. Tente novamente em alguns instantes."

  }

})

app.use(
  limitador
)


// ------------------------------------------------------------
// PARSER JSON
// ------------------------------------------------------------

app.use(
  express.json({
    limit: "1mb"
  })
)


// ------------------------------------------------------------
// COOKIE PARSER
// ------------------------------------------------------------

app.use(
  cookieParser()
)


/* ============================================================
   ROTAS
============================================================ */

// ------------------------------------------------------------
// ROTAS EXISTENTES
// ------------------------------------------------------------

app.use(
  "/",
  home
)

app.use(
  "/status",
  statusRotas
)

app.use(
  "/tabela",
  tabelaRotas
)

app.use(
  "/agenda",
  agendaRotas
)

app.use(
  "/api",
  aoVivoRotas
)

app.use(
  "/api",
  agendaGeral
)

app.use(
  "/api",
  encerradasRotas
)

app.use(
  "/campeonatos",
  campeonatosRotas
)

app.use(
  "/artilheiros",
  artilheiroRotas
)

app.use(
  "/home",
  noticia
)

app.use(
  "/api",
  time
)


// ------------------------------------------------------------
// ASSISTENTE DO TORCEDOR
// ------------------------------------------------------------

app.use(
  "/auth",
  autenticacaoRotas
)


/* ============================================================
   ROTA NÃO ENCONTRADA
============================================================ */

app.use(
  (req, res) => {

    return res.status(404).json({

      erro:
        "Rota não encontrada."

    })

  }
)


/* ============================================================
   TRATAMENTO DE ERROS
============================================================ */

app.use(
  (err, req, res, next) => {

    console.error(
      "Erro interno:",
      err
    )

    // --------------------------------------------------------
    // Erro de CORS
    // --------------------------------------------------------

    if (
      err.message ===
      "Origem não autorizada pelo CORS."
    ) {

      return res.status(403).json({

        erro:
          "Origem não autorizada."

      })

    }

    // --------------------------------------------------------
    // Erro genérico
    // --------------------------------------------------------

    return res.status(500).json({

      erro:
        "Erro interno do servidor."

    })

  }
)

export default app
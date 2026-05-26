import { emitirEvento } from "../websocket/websocket.js"

import {
  buscarTodasAoVivo
} from "../servicos/partidaLive.servico.js"

import {
  buscarTodasFinalizadas
} from "../servicos/partidaFinalizada.servico.js"

/* ======================================================
   CACHE LOCAL
====================================================== */

let ultimoHashAoVivo = ""
let ultimoHashFinalizadas = ""

/* ======================================================
   GERA HASH
====================================================== */

function gerarHash(partidas = []) {

  return JSON.stringify(

    partidas.map(p => ({

      id:
        p.partida_id,

      mandante:
        p.placar_mandante,

      visitante:
        p.placar_visitante,

      status:
        p.status,

      penalti_mandante:
        p.penalti?.mandante || 0,

      penalti_visitante:
        p.penalti?.visitante || 0
    }))
  )
}

/* ======================================================
   DETECTA PÊNALTIS
====================================================== */

function temJogoEmPenaltis(partidas = []) {

  return partidas.some(p => {

    const status =
      p.status?.toLowerCase() || ""

    return (

      status.includes("pênalti") ||

      status.includes("penalti")
    )
  })
}

/* ======================================================
   ⚙️ JOB PRINCIPAL
====================================================== */

export function iniciarJobPartidas() {

  console.log(
    "⚙️ Job de partidas inicializado"
  )

  async function atualizar() {

    let aoVivo = []

    try {

      /* ============================
         🔴 AO VIVO
      ============================ */

      aoVivo =
        await buscarTodasAoVivo()

      const novoHashAoVivo =
        gerarHash(aoVivo)

      // 🔥 envia websocket apenas se mudou
      if (
        novoHashAoVivo !==
        ultimoHashAoVivo
      ) {

        ultimoHashAoVivo =
          novoHashAoVivo

        emitirEvento({

          tipo: "ao-vivo",

          dados: aoVivo
        })

        console.log(
          "📡 WebSocket AO VIVO enviado"
        )
      }

      console.log(
        `🔴 Jogos ao vivo: ${aoVivo.length}`
      )

      /* ============================
         🏁 FINALIZADAS
      ============================ */

      // 🔥 só verifica finalizadas
      // se havia jogos ao vivo
      if (
        ultimoHashAoVivo !== "[]"
      ) {

        const finalizadas =
          await buscarTodasFinalizadas()

        const novoHashFinalizadas =
          gerarHash(finalizadas)

        // 🔥 envia apenas se mudou
        if (
          novoHashFinalizadas !==
          ultimoHashFinalizadas
        ) {

          ultimoHashFinalizadas =
            novoHashFinalizadas

          emitirEvento({

            tipo: "encerrados",

            dados: finalizadas
          })

          console.log(
            "📡 WebSocket FINALIZADAS enviado"
          )
        }
      }

    } catch (e) {

      console.error(
        "❌ Erro job partidas:",
        e.message
      )
    }

    /* ============================
       ⏱ TEMPO DINÂMICO
    ============================ */

    const penaltis =
      temJogoEmPenaltis(aoVivo)

    const proximoTempo =

      // 😴 sem jogos
      aoVivo.length === 0

        ? 45 * 60 * 1000

        // ⚡ pênaltis
        : penaltis

          ? 1 * 60 * 1000

          // 🔴 jogos normais
          : 3 * 60 * 1000

    /* ============================
       LOG
    ============================ */

    if (aoVivo.length === 0) {

      console.log(
        "😴 Nenhum jogo ao vivo — modo economia"
      )

    } else if (penaltis) {

      console.log(
        "⚡ Jogos em pênaltis — atualização 1 min"
      )

    } else {

      console.log(
        "🔴 Jogos ao vivo — atualização 3 min"
      )
    }

    /* ============================
       PRÓXIMA EXECUÇÃO
    ============================ */

    setTimeout(
      atualizar,
      proximoTempo
    )
  }

  atualizar()
}
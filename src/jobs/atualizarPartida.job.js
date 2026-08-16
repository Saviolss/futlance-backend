import { emitirEvento } from "../websocket/websocket.js"

import {
  buscarTodasAoVivo
} from "../servicos/partidaLive.servico.js"


import {
  verificarPartidasAoVivo
} from "./partidasAoVivo.job.js"

/* ======================================================
   CACHE LOCAL
====================================================== */

let ultimoHashAoVivo = ""

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

      tempo:
        p.tempo,

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
   JOB PRINCIPAL
====================================================== */

export function iniciarJobPartidas() {

  console.log(
    "⚙️ Job de partidas inicializado"
  )

  async function atualizar() {

    let aoVivo = []

    try {

      /* ============================
         🔄 ATUALIZA AO VIVO
      ============================ */

      await verificarPartidasAoVivo()

      /* ============================
         🔴 BUSCA AO VIVO
      ============================ */

      aoVivo =
        await buscarTodasAoVivo()

      const novoHashAoVivo =
        gerarHash(aoVivo)

      console.log(
        "Hash antigo:",
        ultimoHashAoVivo
      )

      console.log(
        "Hash novo :",
        novoHashAoVivo
      )

      /* ============================
         📡 WEBSOCKET AO VIVO
      ============================ */

      if (
        novoHashAoVivo !==
        ultimoHashAoVivo
      ) {

        console.log(
          "📡 Enviando websocket ao-vivo"
        )

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

      aoVivo.length === 0

        ? 45 * 60 * 1000

        : penaltis

          ? 60 * 1000

          : 90 * 1000

    /* ============================
       LOG
    ============================ */

    if (
      aoVivo.length === 0
    ) {

      console.log(
        "😴 Nenhum jogo ao vivo — modo economia"
      )

    } else if (
      penaltis
    ) {

      console.log(
        "⚡ Jogos em disputa de pênaltis — atualização 1 min"
      )

    } else {

      console.log(
        "🔴 Jogos ao vivo — atualização 90 s"
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
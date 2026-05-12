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
      id: p.partida_id,
      mandante: p.placar_mandante,
      visitante: p.placar_visitante,
      status: p.status,

      penalti_mandante: p.penalti?.mandante || 0,
      penalti_visitante: p.penalti?.visitante || 0
    }))
  )
}

/* ======================================================
   ⚙️ JOB PRINCIPAL
====================================================== */

export function iniciarJobPartidas() {

  console.log("⚙️ Job de partidas inicializado")

  async function atualizar() {

    let aoVivo = []

    try {

      /* ============================
         🔴 AO VIVO
      ============================ */

      aoVivo = await buscarTodasAoVivo()

      const novoHashAoVivo = gerarHash(aoVivo)

      // 🔥 só envia websocket se mudou
      if (novoHashAoVivo !== ultimoHashAoVivo) {

        ultimoHashAoVivo = novoHashAoVivo

        emitirEvento({
          tipo: "ao-vivo",
          dados: aoVivo
        })

        console.log("📡 WebSocket AO VIVO enviado")
      }

      console.log(`🔴 Jogos ao vivo: ${aoVivo.length}`)

      /* ============================
         🏁 FINALIZADAS
      ============================ */

      // 🔥 só verifica finalizadas se havia jogo antes
      if (ultimoHashAoVivo !== "[]") {

        const finalizadas = await buscarTodasFinalizadas()

        const novoHashFinalizadas = gerarHash(finalizadas)

        // 🔥 envia apenas se mudou
        if (novoHashFinalizadas !== ultimoHashFinalizadas) {

          ultimoHashFinalizadas = novoHashFinalizadas

          emitirEvento({
            tipo: "encerrados",
            dados: finalizadas
          })

          console.log("📡 WebSocket FINALIZADAS enviado")
        }
      }

    } catch (e) {

      console.error("❌ Erro job partidas:", e.message)
    }

    /* ============================
       ⏱ TEMPO DINÂMICO
    ============================ */

    const proximoTempo =
      aoVivo.length === 0
        ? 45 * 60 * 1000 // 😴 sem jogos
        : 3 * 60 * 1000 // 🔴 com jogos

    console.log(
      `⏱ Próxima atualização em ${proximoTempo / 60000} min`
    )

    setTimeout(atualizar, proximoTempo)
  }

  atualizar()
}
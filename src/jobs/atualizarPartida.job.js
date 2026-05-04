import { emitirEvento } from "../websocket/websocket.js"

import {
  buscarTodasAoVivo,
  buscarBrasileiraoAoVivo,
  buscarPaulistaAoVivo,
  buscarCariocaAoVivo,
  buscarCopaBrasilAoVivo
} from "../servicos/partidaLive.servico.js"

import {
  buscarTodasFinalizadas,
  buscarBrasileiraoFinalizadas,
  buscarPaulistaFinalizadas,
  buscarCariocaFinalizadas,
  buscarCopaBrasilFinalizadas
} from "../servicos/partidaFinalizada.servico.js"

/* ======================================================
   ⚙️ JOB DE ATUALIZAÇÃO DE PARTIDAS
====================================================== */

export function iniciarJobPartidas() {
  console.log("⚙️ Job de partidas inicializado")

  setInterval(async () => {
    console.log("🔄 Atualizando cache de partidas...")

    /* ============================
       🔴 AO VIVO
    ============================ */
    try {
      const aoVivo = await buscarTodasAoVivo()

      // atualiza cache dos outros (opcional)
      await Promise.all([
        buscarBrasileiraoAoVivo(),
        buscarPaulistaAoVivo(),
        buscarCariocaAoVivo(),
        buscarCopaBrasilAoVivo()
      ])

      emitirEvento({
        tipo: "ao-vivo",
        dados: aoVivo
      })

      console.log("🔴 Cache ao vivo atualizado")
    } catch (e) {
      console.error("❌ Erro ao vivo:", e.message)
    }

    /* ============================
       🏁 FINALIZADAS
    ============================ */
    try {
      await Promise.all([
        buscarTodasFinalizadas(),
        buscarBrasileiraoFinalizadas(),
        buscarPaulistaFinalizadas(),
        buscarCariocaFinalizadas(),
        buscarCopaBrasilFinalizadas()
      ])

      console.log("🏁 Cache finalizadas atualizado")
    } catch (e) {
      console.error("❌ Erro finalizadas:", e.message)
    }

  }, 60 * 1000)
}
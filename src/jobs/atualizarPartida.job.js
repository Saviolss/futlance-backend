import { emitirEvento } from "../websocket/websocket.js"
import { temJogosHoje } from "./temJogo.job.js"
import { buscarTodasAoVivo } from "../servicos/partidaLive.servico.js"

/* ======================================================
   ⚙️ JOB INTELIGENTE (INTERVALO DINÂMICO)
====================================================== */

export function iniciarJobPartidas() {
  console.log("⚙️ Job de partidas inicializado")

  let ultimoHash = null
  let intervaloAtual = 2 * 60 * 1000 // começa com 2 min

  async function executar() {
    try {
      // 🛑 1. SEM JOGO HOJE → SUPER ECONOMIA
      if (!temJogosHoje()) {
        console.log("😴 Nenhum jogo hoje — modo economia")

        intervaloAtual = 10 * 60 * 1000 // 10 min
        agendar()
        return
      }

      console.log("🔄 Verificando jogos ao vivo...")

      const aoVivo = await buscarTodasAoVivo()

      // 🛑 2. SEM JOGO AO VIVO → MODO MÉDIO
      if (!aoVivo.length) {
        console.log("⏸️ Sem jogos ao vivo — modo leve")

        intervaloAtual = 5 * 60 * 1000 // 5 min
        agendar()
        return
      }

      // 🔴 3. TEM JOGO AO VIVO → MODO RÁPIDO
      intervaloAtual = 60 * 1000 // 1 min

      // 🧠 HASH INTELIGENTE
      const hashAtual = JSON.stringify(
        aoVivo.map(j => ({
          id: j.partida_id,
          m: j.placar_mandante,
          v: j.placar_visitante,
          p: j.penalti?.mandante,
          pv: j.penalti?.visitante,
          s: j.status
        }))
      )

      if (hashAtual !== ultimoHash) {
        emitirEvento({
          tipo: "ao-vivo",
          dados: aoVivo
        })

        ultimoHash = hashAtual
        console.log("📡 Atualização enviada (mudança detectada)")
      } else {
        console.log("⏳ Sem mudanças")
      }

    } catch (e) {
      console.error("❌ Erro no job:", e.message)
    }

    agendar()
  }

  function agendar() {
    setTimeout(executar, intervaloAtual)
  }

  executar()
}
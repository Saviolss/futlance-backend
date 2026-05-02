import { temJogosHoje } from "./temJogo.job.js"
export function iniciarJobPartidas() {
  console.log("⚙️ Job de partidas inicializado")

  // Check leve a cada 2 minutos
  setInterval(async () => {
    if (!temJogosHoje()) {
      console.log("😴 Nenhum jogo hoje — job pausado")
      return
    }

    // 🔴 AO VIVO
    try {
      await Promise.all([
        buscarTodasAoVivo(),
        buscarBrasileiraoAoVivo(),
        buscarPaulistaAoVivo(),
        buscarCariocaAoVivo(),
      ])
      console.log("🔴 Cache ao vivo atualizado")
    } catch (e) {
      console.error("❌ Erro ao vivo", e.message)
    }

    // 🏁 FINALIZADAS
    try {
      await Promise.all([
        buscarTodasFinalizadas(),
        buscarBrasileiraoFinalizadas(),
        buscarPaulistaFinalizadas(),
        buscarCariocaFinalizadas(),
      ])
      console.log("🏁 Cache finalizadas atualizado")
    } catch (e) {
      console.error("❌ Erro finalizadas", e.message)
    }

  }, 60 * 1000) // 1 min
}

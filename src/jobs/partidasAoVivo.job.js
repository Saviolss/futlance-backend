import cron from "node-cron"
import { obterPartidasAoVivo, removerPartidaAoVivo } from "../utils/partidasAoVivo.js"
import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarPartidaApi } from "../servicos/apiFutebol.servico.js"
import { getCache, setCache, deleteCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"
import { detectarEventosPartida } from "./detectarEventosPartida.js"

export function iniciarJobPartidasAoVivo() {
  cron.schedule("*/20 * * * * *", async () => {
    try {
      for (const idCampeonato of Object.values(CAMPEONATOS)) {
        const partidasAoVivo = obterPartidasAoVivo(idCampeonato)
        if (partidasAoVivo.length === 0) continue

        for (const partidaAgenda of partidasAoVivo) {
          const chave = `partida:${partidaAgenda.partida_id}`

          const anterior = getCache(chave)
          const atual = await buscarPartidaApi(partidaAgenda.partida_id)

          const { gol, fimDeJogo } =
            detectarEventosPartida(atual, anterior)

          // Atualiza cache SEMPRE
          setCache(chave, atual, CACHE_TTL.PARTIDA)

          if (gol || fimDeJogo) {
            console.log(
              `⚽ Evento na partida ${partidaAgenda.partida_id}`,
              { gol, fimDeJogo }
            )

            await atualizarTabelaCampeonato(idCampeonato)
          }

          if (fimDeJogo) {
            removerPartidaAoVivo(
              idCampeonato,
              partidaAgenda.partida_id
            )
            deleteCache(chave)
          }
        }
      }
    } catch (erro) {
      console.error("❌ Job partidas ao vivo:", erro.message)
    }
  })
}

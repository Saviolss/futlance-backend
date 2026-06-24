import cron from "node-cron"
import { emitirEvento } from "../websocket/websocket.js"

import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarPartidaApi } from "../servicos/apiFutebol.servico.js"
import { atualizarTabelaCampeonato } from "../servicos/tabela.servico.js"

import {
  obterPartidasAoVivo,
  removerPartidaAoVivo
} from "../utils/partidasAoVivo.js"

import { getCache, setCache, deleteCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"
import { detectarEventosPartida } from "./detectarEventosPartida.js"

const STATUS_VALIDO = ["andamento", "disputa_penaltis"]
let jobAoVivoAtivo = false

export function iniciarJobPartidasAoVivo() {
  if (jobAoVivoAtivo) return
  jobAoVivoAtivo = true

  cron.schedule("0 */2 * * * *", async () => {
    try {
      for (const idCampeonato of Object.values(CAMPEONATOS)) {
        const partidasAoVivo = obterPartidasAoVivo(idCampeonato)

        if (!Array.isArray(partidasAoVivo) || partidasAoVivo.length === 0) {
          continue
        }

        for (const partida of partidasAoVivo) {

          // ❌ Remove partidas que não estão mais ativas
          if (!STATUS_VALIDO.includes(partida.status)) {
            removerPartidaAoVivo(idCampeonato, partida.partida_id)
            deleteCache(`partida:${partida.partida_id}`)
            continue
          }

          const chave = `partida:${partida.partida_id}`
          const anterior = getCache(chave)

          // ⏱️ Respeita TTL antes de chamar API
          const atual = await buscarPartidaApi(partida.partida_id)
          if (!atual) continue

          const {
            gol,
            golMandante,
            golVisitante,
            fimDeJogo
          } = detectarEventosPartida(atual, anterior)

          // 🔄 Atualiza cache SEMPRE após consulta
          setCache(chave, atual, CACHE_TTL.PARTIDA)

          // ⚽ Eventos de gol
          if (golMandante) {
            emitirEvento({
              tipo: "GOL_MANDANTE",
              campeonato: idCampeonato,
              partidaId: partida.partida_id,
              dados: {
                time: atual.time_mandante,
                placar: atual.placar
              }
            })
          }

          if (golVisitante) {
            emitirEvento({
              tipo: "GOL_VISITANTE",
              campeonato: idCampeonato,
              partidaId: partida.partida_id,
              dados: {
                time: atual.time_visitante,
                placar: atual.placar
              }
            })
          }

          // 🏁 Fim de jogo
          if (fimDeJogo) {
            emitirEvento({
              tipo: "finalizado",
              campeonato: idCampeonato,
              partidaId: partida.partida_id
            })

            removerPartidaAoVivo(idCampeonato, partida.partida_id)
            deleteCache(chave)
          }

          // 🔄 Atualiza tabela apenas se houve evento
          if (gol || fimDeJogo) {
            await atualizarTabelaCampeonato(idCampeonato)
            deleteCache(`ao-vivo:${idCampeonato}`)
            deleteCache("ao-vivo:todas")
          }
        }
      }
    } catch (erro) {
      console.error("❌ Job partidas ao vivo:", erro.message)
    }
  })
}

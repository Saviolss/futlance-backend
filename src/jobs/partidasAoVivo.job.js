
import { emitirEvento } from "../websocket/websocket.js"
import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarPartidaApi } from "../servicos/apiFutebol.servico.js"
import { enviarResultadoPartida } from "../assistenteTorcedor/notificacao/resultado.notificacao.service.js"
import { atualizarTabelaCampeonato } from "../servicos/tabela.servico.js"
import {
  salvarPartidaFinalizada,
  atualizarFinalizadasCampeonato
} from "../servicos/partidaFinalizada.servico.js"
import {
  atualizarPartidasAoVivo,
  buscarPartidasAoVivoCampeonato,
  atualizarPartidaAoVivo,
  removerPartidaAoVivoBanco
} from "../servicos/partidaLive.servico.js"
import { getCache, setCache, deleteCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"
import { detectarEventosPartida } from "./detectarEventosPartida.js"

const STATUS_VALIDO = [
  "andamento",
  "intervalo",
  "disputa_penalti",
  "disputa_penaltis",
  "finalizado"
]

let verificacaoEmAndamento = false

export async function iniciarJobPartidasAoVivo() {
  console.log("⚽ Job partidas ao vivo inicializado")
  await verificarPartidasAoVivo()
}

export function pararJobPartidasAoVivo() { }

export async function verificarPartidasAoVivo() {
  if (verificacaoEmAndamento) return

  verificacaoEmAndamento = true

  try {
    await atualizarPartidasAoVivo()

    for (const idCampeonato of Object.values(CAMPEONATOS)) {
      const partidasAoVivo = await buscarPartidasAoVivoCampeonato(idCampeonato)

      if (!Array.isArray(partidasAoVivo) || partidasAoVivo.length === 0) {
        continue
      }

      for (const partida of partidasAoVivo) {
        const partidaId = partida.partida_id
        const chave = `partida:${partidaId}`
        const statusAtual = String(partida.status || "").trim().toLowerCase()

        if (!STATUS_VALIDO.includes(statusAtual)) {
          await removerPartidaAoVivoBanco(partidaId)
          deleteCache(chave)
          continue
        }

        const anterior = getCache(chave)
        let atual

        try {
          atual = await buscarPartidaApi(partidaId)
        } catch (erro) {
          console.error(`❌ Erro ao consultar partida ${partidaId}:`, erro.message)
          continue
        }

        if (!atual) continue

        await atualizarPartidaAoVivo(atual)

        const { gol, golMandante, golVisitante, fimDeJogo } =
          detectarEventosPartida(atual, anterior)

        const statusAtualApi = String(atual?.status || "").trim().toLowerCase()
        const finalizadoAgora =
          fimDeJogo ||
          ["finalizado", "encerrado", "concluido", "finished", "complete"].includes(statusAtualApi)

        setCache(chave, atual, CACHE_TTL.PARTIDA)

        if (golMandante) {
          console.log(`⚽ GOL DO MANDANTE: ${partidaId}`)
          emitirEvento({
            tipo: "GOL_MANDANTE",
            campeonato: idCampeonato,
            partidaId,
            dados: {
              time: atual.time_mandante,
              placar: atual.placar
            }
          })
        }

        if (golVisitante) {
          console.log(`⚽ GOL DO VISITANTE: ${partidaId}`)
          emitirEvento({
            tipo: "GOL_VISITANTE",
            campeonato: idCampeonato,
            partidaId,
            dados: {
              time: atual.time_visitante,
              placar: atual.placar
            }
          })
        }

        if (finalizadoAgora) {
          const partidaSalva = await salvarPartidaFinalizada(atual)

          if (partidaSalva) {
            await enviarResultadoPartida(partidaSalva)
          }

          emitirEvento({
            tipo: "finalizado",
            campeonato: idCampeonato,
            partidaId,
            dados: atual
          })

          await atualizarFinalizadasCampeonato(idCampeonato)
          await removerPartidaAoVivoBanco(partidaId)
          deleteCache(chave)
        }

        if (gol || finalizadoAgora) {
          await atualizarTabelaCampeonato(idCampeonato)
          deleteCache(`ao-vivo:${idCampeonato}`)
          deleteCache("ao-vivo:todas")
        }
      }
    }
  } catch (erro) {
    console.error("❌ Job partidas ao vivo:", erro.message)
  } finally {
    verificacaoEmAndamento = false
  }
}

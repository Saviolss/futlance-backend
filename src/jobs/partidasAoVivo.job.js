import { emitirEvento } from "../websocket/websocket.js"

import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarPartidaApi } from "../servicos/apiFutebol.servico.js"

import {
  atualizarTabelaCampeonato
} from "../servicos/tabela.servico.js"

import {
  atualizarFinalizadasCampeonato
} from "../servicos/partidaFinalizada.servico.js"

import {
  atualizarPartidasAoVivo,
  buscarPartidasAoVivoCampeonato,
  atualizarPartidaAoVivo,
  removerPartidaAoVivoBanco
} from "../servicos/partidaLive.servico.js"

import {
  getCache,
  setCache,
  deleteCache
} from "../cache/cacheMemoria.js"

import { CACHE_TTL } from "../constantes/cacheTTL.js"

import {
  detectarEventosPartida
} from "./detectarEventosPartida.js"

const STATUS_VALIDO = [
  "andamento",
  "intervalo",
  "disputa_penalti",
  "finalizado"
]

export async function iniciarJobPartidasAoVivo() {

  console.log("⚽ Job partidas ao vivo inicializado");

  await verificarPartidasAoVivo();

}

export function pararJobPartidasAoVivo() {
  // Não faz nada.
}

export async function verificarPartidasAoVivo() {
  console.log("🚀 Entrou em verificarPartidasAoVivo");
  try {
    await atualizarPartidasAoVivo()
    console.log("✅ Passou de atualizarPartidasAoVivo");

    for (const idCampeonato of Object.values(CAMPEONATOS)) {
      console.log("Campeonato:", idCampeonato);
      const partidasAoVivo =
        await buscarPartidasAoVivoCampeonato(idCampeonato)
      console.log("Encontradas:", partidasAoVivo.length);
      if (!Array.isArray(partidasAoVivo) || partidasAoVivo.length === 0) {
        continue
      }

      for (const partida of partidasAoVivo) {

        const chave = `partida:${partida.partida_id}`

        const statusAtual =
          String(partida.status || "")
            .trim()
            .toLowerCase()

        // Remove partidas inválidas
        if (!STATUS_VALIDO.includes(statusAtual)) {

          await removerPartidaAoVivoBanco(
            partida.partida_id
          )

          deleteCache(chave)

          continue
        }

        const anterior = getCache(chave)
        console.log("🔄 Atualizando partida", partida.partida_id);
        const atual = await buscarPartidaApi(partida.partida_id)
        console.log("Resposta API:", atual?.partida_id);


        if (!atual) {
          continue
        }

        await atualizarPartidaAoVivo(atual)

        const {
          gol,
          golMandante,
          golVisitante,
          fimDeJogo
        } = detectarEventosPartida(
          atual,
          anterior
        )

        const statusAtualApi =
          String(atual?.status || "")
            .trim()
            .toLowerCase()

        const finalizadoAgora =
          fimDeJogo ||
          [
            "finalizado",
            "encerrado",
            "concluido",
            "finished",
            "complete"
          ].includes(statusAtualApi)

        setCache(
          chave,
          atual,
          CACHE_TTL.PARTIDA
        )

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

        if (finalizadoAgora) {

          emitirEvento({

            tipo: "finalizado",

            campeonato: idCampeonato,

            partidaId: partida.partida_id,

            dados: atual

          })

          await atualizarFinalizadasCampeonato(
            idCampeonato
          )

          await removerPartidaAoVivoBanco(
            partida.partida_id
          )

          deleteCache(chave)

        }

        if (gol || finalizadoAgora) {

          await atualizarTabelaCampeonato(
            idCampeonato
          )

          deleteCache(`ao-vivo:${idCampeonato}`)

          deleteCache("ao-vivo:todas")

        }

      }

    }

  } catch (erro) {

    console.error(
      "❌ Job partidas ao vivo:",
      erro.message
    )

  }

}
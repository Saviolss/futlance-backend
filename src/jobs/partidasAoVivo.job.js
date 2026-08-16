import { emitirEvento } from "../websocket/websocket.js"

import {
  buscarPartidaApi
} from "../servicos/apiFutebol.servico.js"

import {
  CAMPEONATOS
} from "../constantes/campeonatos.js"

import {
  atualizarTabelaCampeonato
} from "../servicos/tabela.servico.js"

import {
  salvarPartidaFinalizada
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

import {
  CACHE_TTL
} from "../constantes/cacheTTL.js"

import {
  detectarEventosPartida
} from "./detectarEventosPartida.js"

/* =========================================================
   STATUS FINALIZADO
========================================================= */

function statusEhFinalizado(status) {

  const valor =
    String(status || "")
      .trim()
      .toLowerCase()

  return [
    "finalizado",
    "encerrado",
    "concluido",
    "finished",
    "complete"
  ].includes(valor)

}

/* =========================================================
   INICIAR
========================================================= */

export async function iniciarJobPartidasAoVivo() {

  console.log(
    "⚽ Job partidas ao vivo inicializado"
  )

  await verificarPartidasAoVivo()

}

/* =========================================================
   PARAR
========================================================= */

export function pararJobPartidasAoVivo() {

  // Não faz nada.

}

/* =========================================================
   VERIFICAR PARTIDAS
========================================================= */

export async function verificarPartidasAoVivo() {

  console.log(
    "🚀 Entrou em verificarPartidasAoVivo"
  )

  try {

    /*
     * Atualiza os jogos que a API ainda considera
     * ao vivo.
     *
     * IMPORTANTE:
     * Essa função não remove mais partidas
     * indiscriminadamente.
     */

    await atualizarPartidasAoVivo()

    console.log(
      "✅ Passou de atualizarPartidasAoVivo"
    )

    /*
     * Agora percorremos o que está efetivamente
     * salvo no banco como ao vivo.
     */

    for (
      const idCampeonato
      of Object.values(CAMPEONATOS)
    ) {

      console.log(
        "Campeonato:",
        idCampeonato
      )

      const partidasAoVivo =
        await buscarPartidasAoVivoCampeonato(
          idCampeonato
        )

      console.log(
        "Encontradas:",
        partidasAoVivo.length
      )

      if (
        !Array.isArray(partidasAoVivo) ||
        partidasAoVivo.length === 0
      ) {

        continue

      }

      /*
       * Processa cada partida individualmente.
       */

      for (
        const partida
        of partidasAoVivo
      ) {

        const partidaId =
          partida.partida_id

        const chave =
          `partida:${partidaId}`

        /*
         * Histórico anterior.
         */

        const anterior =
          getCache(chave)

        console.log(
          "🔄 Atualizando partida",
          partidaId
        )

        /*
         * Consulta individual.
         *
         * É ESSA chamada que vai detectar
         * quando o jogo virou finalizado.
         */

        const atual =
          await buscarPartidaApi(
            partidaId
          )

        if (!atual) {

          console.log(
            `⚠️ API não retornou partida ${partidaId}`
          )

          continue

        }

        console.log(
          "Resposta API:",
          atual.partida_id,
          atual.status
        )

        /*
         * Normaliza status para comparação.
         */

        const statusAtual =
          String(atual.status || "")
            .trim()
            .toLowerCase()

        /*
         * =================================================
         * 🏁 PARTIDA FINALIZADA
         * =================================================
         *
         * IMPORTANTE:
         * fazemos essa verificação ANTES de atualizar
         * normalmente o jogo ao vivo.
         */

        if (
          statusEhFinalizado(statusAtual)
        ) {

          console.log(
            `🏁 JOGO FINALIZADO: ${partidaId}`
          )

          /*
           * 1. Salva imediatamente em
           * partidaFinalizada.
           */

          const partidaSalva =
            await salvarPartidaFinalizada(
              atual
            )

          if (!partidaSalva) {

            console.error(
              `❌ Não foi possível salvar finalizada ${partidaId}`
            )

            /*
             * Não removemos do ao vivo se o salvamento
             * falhou.
             */

            continue

          }

          /*
           * 2. Atualiza tabela.
           */

          await atualizarTabelaCampeonato(
            idCampeonato
          )

          /*
           * 3. Envia evento para o frontend.
           */

          emitirEvento({

            tipo: "encerrados",

            campeonato:
              idCampeonato,

            partidaId:
              partidaId,

            dados:
              atual

          })

          console.log(
            `📡 WebSocket ENCERRADOS enviado: ${partidaId}`
          )

          /*
           * 4. Remove do banco de partidas ao vivo.
           */

          await removerPartidaAoVivoBanco(
            partidaId
          )

          /*
           * 5. Remove cache.
           */

          deleteCache(
            chave
          )

          deleteCache(
            `ao-vivo:${idCampeonato}`
          )

          deleteCache(
            "ao-vivo:todas"
          )

          console.log(
            `✅ Partida ${partidaId} movida para finalizadas`
          )

          /*
           * Não continua processando como jogo ao vivo.
           */

          continue

        }

        /*
         * =================================================
         * ATUALIZA PARTIDA AO VIVO
         * =================================================
         */

        await atualizarPartidaAoVivo(
          atual
        )

        /*
         * =================================================
         * DETECTAR EVENTOS
         * =================================================
         */

        const {

          gol,
          golMandante,
          golVisitante,
          fimDeJogo

        } =
          detectarEventosPartida(
            atual,
            anterior
          )

        /*
         * =================================================
         * CACHE
         * =================================================
         */

        setCache(
          chave,
          atual,
          CACHE_TTL.PARTIDA
        )

        /*
         * =================================================
         * ⚽ GOL MANDANTE
         * =================================================
         */

        if (golMandante) {

          emitirEvento({

            tipo:
              "GOL_MANDANTE",

            campeonato:
              idCampeonato,

            partidaId:
              partidaId,

            dados: {

              time:
                atual.time_mandante,

              placar: {

                mandante:
                  atual.placar_mandante,

                visitante:
                  atual.placar_visitante

              }

            }

          })

        }

        /*
         * =================================================
         * ⚽ GOL VISITANTE
         * =================================================
         */

        if (golVisitante) {

          emitirEvento({

            tipo:
              "GOL_VISITANTE",

            campeonato:
              idCampeonato,

            partidaId:
              partidaId,

            dados: {

              time:
                atual.time_visitante,

              placar: {

                mandante:
                  atual.placar_mandante,

                visitante:
                  atual.placar_visitante

              }

            }

          })

        }

        /*
         * =================================================
         * TABELA
         * =================================================
         */

        if (gol || fimDeJogo) {

          await atualizarTabelaCampeonato(
            idCampeonato
          )

          deleteCache(
            `ao-vivo:${idCampeonato}`
          )

          deleteCache(
            "ao-vivo:todas"
          )

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
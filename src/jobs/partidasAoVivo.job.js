import { emitirEvento } from "../websocket/websocket.js"

import { CAMPEONATOS } from "../constantes/campeonatos.js"

import {
  buscarPartidaApi
} from "../servicos/apiFutebol.servico.js"

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

import { CACHE_TTL } from "../constantes/cacheTTL.js"

import {
  detectarEventosPartida
} from "./detectarEventosPartida.js"


/* ======================================================
   STATUS VÁLIDOS
====================================================== */

const STATUS_VALIDO = [
  "andamento",
  "intervalo",
  "disputa_penalti",
  "finalizado",
  "encerrado",
  "concluido",
  "finished",
  "complete"
]


/* ======================================================
   VERIFICA SE ESTÁ FINALIZADO
====================================================== */

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


/* ======================================================
   INICIAR JOB
====================================================== */

export async function iniciarJobPartidasAoVivo() {

  console.log(
    "⚽ Job partidas ao vivo inicializado"
  )

  await verificarPartidasAoVivo()

}


/* ======================================================
   PARAR JOB
====================================================== */

export function pararJobPartidasAoVivo() {

  // Não faz nada.

}


/* ======================================================
   VERIFICAR PARTIDAS AO VIVO
====================================================== */

export async function verificarPartidasAoVivo() {

  console.log(
    "🚀 Entrou em verificarPartidasAoVivo"
  )

  try {

    /* ==================================================
       ATUALIZA LISTA DO BANCO COM A API
    ================================================== */

    await atualizarPartidasAoVivo()

    console.log(
      "✅ Passou de atualizarPartidasAoVivo"
    )


    /* ==================================================
       PERCORRE OS CAMPEONATOS
    ================================================== */

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


      /* ==================================================
         PERCORRE CADA PARTIDA
      ================================================== */

      for (
        const partida
        of partidasAoVivo
      ) {

        const partidaId =
          partida.partida_id

        const chave =
          `partida:${ partidaId } `


        /* ==================================================
           STATUS QUE ESTÁ NO BANCO
        ================================================== */

        const statusBanco =
          String(partida.status || "")
            .trim()
            .toLowerCase()


        /* ==================================================
           BUSCA DADOS ATUALIZADOS DA PARTIDA
        ================================================== */

        console.log(
          "🔄 Atualizando partida",
          partidaId
        )


        const atual =
          await buscarPartidaApi(
            partidaId
          )


        console.log(
          "Resposta API:",
          atual?.partida_id
        )


        /* ==================================================
           API NÃO RETORNOU
        ================================================== */

        if (!atual) {

          console.log(
            `⚠️ API não retornou partida ${ partidaId } `
          )

          continue

        }


        /* ==================================================
           STATUS ATUAL DA API
        ================================================== */

        const statusAtualApi =
          String(atual.status || "")
            .trim()
            .toLowerCase()


        console.log(
          `📌 Partida ${ partidaId }: ${ statusBanco } → ${ statusAtualApi } `
        )


        /* ==================================================
           HISTÓRICO ANTERIOR
        ================================================== */

        const anterior =
          getCache(chave)


        /* ==================================================
           DETECTA EVENTOS
        ================================================== */

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


        /* ==================================================
           VERIFICA FINALIZAÇÃO
           
           Aqui está o ponto principal:
           
           Se a API retornar finalizado,
           salvamos imediatamente no banco.
        ================================================== */

        const finalizadoAgora =
          fimDeJogo ||
          statusEhFinalizado(
            statusAtualApi
          )


        /* ==================================================
           SE FINALIZOU
        ================================================== */

        if (finalizadoAgora) {

          console.log(
            `🏁 PARTIDA FINALIZADA: ${ partidaId } `
          )


          /* ================================================
             SALVA NA TABELA PARTIDA FINALIZADA
          ================================================= */

          const partidaSalva =
            await salvarPartidaFinalizada(
              atual
            )


          if (partidaSalva) {

            console.log(
              `✅ Partida ${ partidaId } salva em partidaFinalizada`
            )

          } else {

            console.error(
              `❌ Não foi possível salvar partida ${ partidaId } como finalizada`
            )

          }


          /* ================================================
             ATUALIZA TABELA
          ================================================= */

          await atualizarTabelaCampeonato(
            idCampeonato
          )


          /* ================================================
             WEBSOCKET
          ================================================= */

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
            `📡 WebSocket encerrados enviado: ${ partidaId } `
          )


          /* ================================================
             REMOVE DO PARTIDA AO VIVO
          ================================================= */

          await removerPartidaAoVivoBanco(
            partidaId
          )


          console.log(
            `🗑️ Partida ${ partidaId } removida de partidaAoVivo`
          )


          /* ================================================
             REMOVE CACHE DA PARTIDA
          ================================================= */

          deleteCache(
            chave
          )


          /* ================================================
             LIMPA CACHE DO AO VIVO
          ================================================= */

          deleteCache(
            `ao - vivo:${ idCampeonato } `
          )

          deleteCache(
            "ao-vivo:todas"
          )


          /* ================================================
             NÃO CONTINUA PROCESSANDO COMO AO VIVO
          ================================================= */

          continue

        }


        /* ==================================================
           STATUS NÃO É MAIS VÁLIDO
        ================================================== */

        if (
          !STATUS_VALIDO.includes(
            statusAtualApi
          )
        ) {

          console.log(
            `⚠️ Status inválido ${ statusAtualApi } — removendo ${ partidaId } `
          )


          await removerPartidaAoVivoBanco(
            partidaId
          )


          deleteCache(
            chave
          )


          continue

        }


        /* ==================================================
           ATUALIZA PARTIDA AO VIVO
        ================================================== */

        await atualizarPartidaAoVivo(
          atual
        )


        /* ==================================================
           ATUALIZA CACHE
        ================================================== */

        setCache(
          chave,
          atual,
          CACHE_TTL.PARTIDA
        )


        /* ==================================================
           GOL DO MANDANTE
        ================================================== */

        if (golMandante) {

          console.log(
            `⚽ GOL DO MANDANTE: ${ partidaId } `
          )


          emitirEvento({

            tipo: "GOL_MANDANTE",

            campeonato:
              idCampeonato,

            partidaId:
              partidaId,

            dados: {

              time:
                atual.time_mandante,

              placar:
                atual.placar

            }

          })

        }


        /* ==================================================
           GOL DO VISITANTE
        ================================================== */

        if (golVisitante) {

          console.log(
            `⚽ GOL DO VISITANTE: ${ partidaId } `
          )


          emitirEvento({

            tipo: "GOL_VISITANTE",

            campeonato:
              idCampeonato,

            partidaId:
              partidaId,

            dados: {

              time:
                atual.time_visitante,

              placar:
                atual.placar

            }

          })

        }


        /* ==================================================
           ATUALIZA TABELA SE HOUVE GOL
        ================================================== */

        if (gol) {

          console.log(
            `📊 Gol detectado — atualizando tabela ${ idCampeonato } `
          )


          await atualizarTabelaCampeonato(
            idCampeonato
          )


          deleteCache(
            `ao - vivo:${ idCampeonato } `
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
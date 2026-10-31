import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarAoVivoApi } from "./apiFutebol.servico.js"

import { prisma } from "../lib/prisma.js"

/* =========================================================
   STATUS FINALIZADOS
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
   BUSCAR PARTIDAS AO VIVO
========================================================= */

export async function buscarPartidasAoVivoCampeonato(
  idCampeonato = null
) {

  try {

    const where = {}

    if (idCampeonato) {

      where.campeonato_id = idCampeonato

    }

    const partidas =
      await prisma.partidaAoVivo.findMany({

        where,

        orderBy: {
          partida_id: "asc"
        }

      })

    return partidas.map(partida => ({

      partida_id:
        partida.partida_id,

      status:
        partida.status,

      tempo:
        partida.tempo,

      campeonato: {

        campeonato_id:
          partida.campeonato_id,

        nome:
          partida.campeonato_nome

      },

      placar_mandante:
        partida.placar_mandante,

      placar_visitante:
        partida.placar_visitante,

      penalti:

        partida.penalti_mandante !== null ||
          partida.penalti_visitante !== null

          ? {

            mandante:
              partida.penalti_mandante,

            visitante:
              partida.penalti_visitante,

            cobrancas:
              partida.penalti_cobrancas || []

          }

          : null,

      mandante: {

        nome:
          partida.mandante_nome,

        escudo:
          partida.mandante_escudo

      },

      visitante: {

        nome:
          partida.visitante_nome,

        escudo:
          partida.visitante_escudo

      },

      estadio: {

        nome_popular:
          partida.estadio_nome

      }

    }))

  } catch (erro) {

    console.error(
      "❌ Erro ao buscar partidas ao vivo:",
      erro.message
    )

    return []

  }

}

/* =========================================================
   ATUALIZAR PARTIDAS AO VIVO
========================================================= */

export async function atualizarPartidasAoVivo() {

  try {

    const partidas =
      await buscarAoVivoApi()

    if (!Array.isArray(partidas)) {

      return

    }

    /*
     * IMPORTANTE:
     *
     * Aqui NÃO tratamos finalização.
     *
     * O job partidasAoVivo faz isso através de
     * buscarPartidaApi(partida_id).
     *
     * Portanto aqui só atualizamos partidas que
     * a API considera ao vivo.
     */

    const partidasNormalizadas =
      partidas

        .filter(p => {

          const status =
            String(p?.status || "")
              .trim()
              .toLowerCase()

          return (
            status === "andamento" ||
            status === "intervalo" ||
            status === "disputa_penalti"
          )

        })

        .map(normalizarPartida)

        .filter(Boolean)

    await prisma.$transaction(
      async tx => {

        for (
          const partida
          of partidasNormalizadas
        ) {

          await tx.partidaAoVivo.upsert({

            where: {

              partida_id:
                partida.partida_id

            },

            update: {

              campeonato_id:
                partida.campeonato.campeonato_id,

              campeonato_nome:
                partida.campeonato.nome,

              status:
                partida.status,

              tempo:
                partida.tempo,

              placar_mandante:
                partida.placar_mandante,

              placar_visitante:
                partida.placar_visitante,

              penalti_mandante:
                partida.penalti?.mandante ?? null,

              penalti_visitante:
                partida.penalti?.visitante ?? null,

              penalti_cobrancas:
                partida.penalti?.cobrancas ?? [],

              mandante_nome:
                partida.mandante.nome,

              mandante_escudo:
                partida.mandante.escudo,

              visitante_nome:
                partida.visitante.nome,

              visitante_escudo:
                partida.visitante.escudo,

              estadio_nome:
                partida.estadio.nome_popular

            },

            create: {

              partida_id:
                partida.partida_id,

              campeonato_id:
                partida.campeonato.campeonato_id,

              campeonato_nome:
                partida.campeonato.nome,

              status:
                partida.status,

              tempo:
                partida.tempo,

              placar_mandante:
                partida.placar_mandante,

              placar_visitante:
                partida.placar_visitante,

              penalti_mandante:
                partida.penalti?.mandante ?? null,

              penalti_visitante:
                partida.penalti?.visitante ?? null,

              penalti_cobrancas:
                partida.penalti?.cobrancas ?? [],

              mandante_nome:
                partida.mandante.nome,

              mandante_escudo:
                partida.mandante.escudo,

              visitante_nome:
                partida.visitante.nome,

              visitante_escudo:
                partida.visitante.escudo,

              estadio_nome:
                partida.estadio.nome_popular

            }

          })

        }

      }
    )

    console.log(
      `✅ ${partidasNormalizadas.length} partidas ao vivo atualizadas.`
    )

  } catch (erro) {

    console.error(
      "❌ Erro ao atualizar partidas ao vivo:",
      erro.message
    )

  }

}

/* =========================================================
   ATUALIZAR UMA PARTIDA ESPECÍFICA
========================================================= */

export async function atualizarPartidaAoVivo(
  partidaApi
) {

  try {

    const partida =
      normalizarPartida(partidaApi)

    if (!partida) {

      console.error(
        "❌ Não foi possível normalizar partida"
      )

      return null

    }

    /*
     * Se a API retornou finalizado, ainda permitimos
     * atualizar o registro temporariamente.
     *
     * O partidasAoVivo.job imediatamente depois irá
     * salvar em partidaFinalizada e remover daqui.
     */

    const partidaSalva =
      await prisma.partidaAoVivo.upsert({

        where: {

          partida_id:
            partida.partida_id

        },

        update: {

          campeonato_id:
            partida.campeonato.campeonato_id,

          campeonato_nome:
            partida.campeonato.nome,

          status:
            partida.status,

          tempo:
            partida.tempo,

          placar_mandante:
            partida.placar_mandante,

          placar_visitante:
            partida.placar_visitante,

          penalti_mandante:
            partida.penalti?.mandante ?? null,

          penalti_visitante:
            partida.penalti?.visitante ?? null,

          penalti_cobrancas:
            partida.penalti?.cobrancas ?? [],

          mandante_nome:
            partida.mandante.nome,

          mandante_escudo:
            partida.mandante.escudo,

          visitante_nome:
            partida.visitante.nome,

          visitante_escudo:
            partida.visitante.escudo,

          estadio_nome:
            partida.estadio.nome_popular

        },

        create: {

          partida_id:
            partida.partida_id,

          campeonato_id:
            partida.campeonato.campeonato_id,

          campeonato_nome:
            partida.campeonato.nome,

          status:
            partida.status,

          tempo:
            partida.tempo,

          placar_mandante:
            partida.placar_mandante,

          placar_visitante:
            partida.placar_visitante,

          penalti_mandante:
            partida.penalti?.mandante ?? null,

          penalti_visitante:
            partida.penalti?.visitante ?? null,

          penalti_cobrancas:
            partida.penalti?.cobrancas ?? [],

          mandante_nome:
            partida.mandante.nome,

          mandante_escudo:
            partida.mandante.escudo,

          visitante_nome:
            partida.visitante.nome,

          visitante_escudo:
            partida.visitante.escudo,

          estadio_nome:
            partida.estadio.nome_popular

        }

      })

    console.log(
      `⚽ Partida ${partida.partida_id} atualizada: ${partida.status}`
    )

    return partidaSalva

  } catch (erro) {

    console.error(
      `❌ Erro ao atualizar partida ${partidaApi?.partida_id}:`,
      erro.message
    )

    return null

  }

}

/* =========================================================
   REMOVER PARTIDA DO AO VIVO
========================================================= */

export async function removerPartidaAoVivoBanco(
  partidaId
) {

  if (!partidaId) {

    return

  }

  try {

    await prisma.partidaAoVivo.deleteMany({

      where: {

        partida_id:
          partidaId

      }

    })

    console.log(
      `🗑️ Partida ${partidaId} removida do ao vivo`
    )

  } catch (erro) {

    console.error(
      `❌ Erro ao remover partida ${partidaId}:`,
      erro.message
    )

  }

}

/* =========================================================
   EXPORTS PÚBLICOS
========================================================= */

export function buscarTodasAoVivo() {

  return buscarPartidasAoVivoCampeonato()

}

export function buscarBrasileiraoAoVivo() {

  return buscarPartidasAoVivoCampeonato(
    CAMPEONATOS.BRASILEIRAO
  )

}

export function buscarCopaBrasilAoVivo() {

  return buscarPartidasAoVivoCampeonato(
    CAMPEONATOS.COPABRASIL
  )

}

export function buscarChampionsAoVivo() {

  return buscarPartidasAoVivoCampeonato(
    CAMPEONATOS.CHAMPIONS
  )

}

/* =========================================================
   NORMALIZAR PARTIDA
========================================================= */

function normalizarPartida(p) {

  if (
    !p ||
    !p.time_mandante ||
    !p.time_visitante
  ) {

    return null

  }

  return {

    partida_id:
      p.partida_id,

    status:
      String(p.status || "")
        .trim()
        .toLowerCase(),

    tempo:
      p.cronometro ?? null,

    campeonato: {

      campeonato_id:
        p.campeonato?.campeonato_id,

      nome:
        p.campeonato?.nome

    },

    placar_mandante:
      Number(p.placar_mandante ?? 0),

    placar_visitante:
      Number(p.placar_visitante ?? 0),

    penalti:
      p.disputa_penalti

        ? {

          mandante:
            p.disputa_penalti
              .placar_penalti_mandante,

          visitante:
            p.disputa_penalti
              .placar_penalti_visitante,

          cobrancas:
            p.disputa_penalti.cobrancas || []

        }

        : null,

    mandante: {

      nome:
        p.time_mandante?.nome_popular,

      escudo:
        p.time_mandante?.escudo

    },

    visitante: {

      nome:
        p.time_visitante?.nome_popular,

      escudo:
        p.time_visitante?.escudo

    },

    estadio: {

      nome_popular:
        p.estadio?.nome_popular

    }

  }

}
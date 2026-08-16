import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarAoVivoApi } from "./apiFutebol.servico.js"
import { PrismaClient } from "@prisma/client"
import { salvarPartidaFinalizada } from "./partidaFinalizada.servico.js"

const prisma = new PrismaClient()

/* =========================================================
   STATUS DE PARTIDA AO VIVO
========================================================= */

const STATUS_AO_VIVO = [
  "andamento",
  "intervalo",
  "disputa_penalti"
]

/* =========================================================
   STATUS FINALIZADO
========================================================= */

const STATUS_FINALIZADO = [
  "finalizado",
  "encerrado",
  "concluido",
  "finished",
  "complete"
]

function statusEhFinalizado(status) {

  const valor =
    String(status || "")
      .trim()
      .toLowerCase()

  return STATUS_FINALIZADO.includes(valor)
}

/* =========================================================
   BUSCAR PARTIDAS AO VIVO POR CAMPEONATO
========================================================= */

export async function buscarPartidasAoVivoCampeonato(
  idCampeonato = null
) {

  console.log(
    "⚽ Buscando partidas ao vivo no banco..."
  )

  try {

    const where = {}

    if (idCampeonato) {

      where.campeonato_id =
        idCampeonato

    }

    /*
     * IMPORTANTE:
     * Aqui buscamos somente partidas que
     * realmente continuam ao vivo.
     *
     * Uma partida finalizada não pode
     * aparecer no frontend ao vivo.
     */

    where.status = {
      in: STATUS_AO_VIVO
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
   ATUALIZAR TODAS AS PARTIDAS AO VIVO
========================================================= */

export async function atualizarPartidasAoVivo() {

  try {

    const partidas =
      await buscarAoVivoApi()

    if (!Array.isArray(partidas)) {

      console.log(
        "⚠️ API não retornou lista de partidas."
      )

      return

    }

    console.log(
      `⚽ Partidas recebidas da API: ${ partidas.length } `
    )

    /*
     * NÃO filtramos finalizados aqui.
     *
     * Precisamos receber:
     *
     * andamento
     * intervalo
     * disputa_penalti
     * finalizado
     *
     * para conseguir detectar a mudança
     * e salvar no banco de finalizadas.
     */

    const partidasValidas =
      partidas
        .map(normalizarPartida)
        .filter(Boolean)

    await prisma.$transaction(async tx => {

      /*
       * IDs que continuam realmente ao vivo.
       *
       * Finalizadas NÃO entram nessa lista.
       */

      const idsAoVivo = []

      for (
        const partida
        of partidasValidas
      ) {

        const status =
          String(partida.status || "")
            .trim()
            .toLowerCase()

        /* =========================================
           🏁 PARTIDA FINALIZADA
        ========================================= */

        if (
          statusEhFinalizado(status)
        ) {

          console.log(
            `🏁 Partida ${ partida.partida_id } finalizada`
          )

          console.log(
            `⚽ ${ partida.mandante.nome } ${ partida.placar_mandante } x ${ partida.placar_visitante } ${ partida.visitante.nome } `
          )

          /*
           * Salva em partidaFinalizada.
           *
           * A função usa upsert, então não haverá
           * duplicação caso a API envie a partida
           * novamente.
           */

          await salvarPartidaFinalizada(
            partida
          )

          /*
           * Remove imediatamente da tabela
           * partidaAoVivo.
           */

          await tx.partidaAoVivo.deleteMany({

            where: {

              partida_id:
                partida.partida_id

            }

          })

          console.log(
            `🗑️ Partida ${ partida.partida_id } removida do ao vivo`
          )

          continue
        }

        /* =========================================
           🔴 PARTIDA AINDA AO VIVO
        ========================================= */

        if (
          !STATUS_AO_VIVO.includes(status)
        ) {

          /*
           * Status desconhecido.
           * Não deixa lixo na tabela ao vivo.
           */

          await tx.partidaAoVivo.deleteMany({

            where: {

              partida_id:
                partida.partida_id

            }

          })

          continue
        }

        /*
         * Continua ao vivo.
         */

        idsAoVivo.push(
          partida.partida_id
        )

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

      /*
       * Remove partidas que estavam no banco
       * como ao vivo, mas que não vieram mais
       * da API.
       *
       * IMPORTANTE:
       * somente remove se houver partidas
       * ao vivo válidas na resposta.
       */

      if (idsAoVivo.length > 0) {

        await tx.partidaAoVivo.deleteMany({

          where: {

            partida_id: {

              notIn:
                idsAoVivo

            },

            status: {

              in: STATUS_AO_VIVO

            }

          }

        })

      }

    })

    console.log(
      "✅ Partidas ao vivo atualizadas."
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
      normalizarPartida(
        partidaApi
      )

    if (!partida) {

      console.error(
        "❌ Partida inválida."
      )

      return null

    }

    const status =
      String(partida.status || "")
        .trim()
        .toLowerCase()

    /* =========================================
       🏁 FINALIZOU
    ========================================= */

    if (
      statusEhFinalizado(status)
    ) {

      console.log(
        `🏁 Partida ${ partida.partida_id } virou FINALIZADO`
      )

      /*
       * PRIMEIRO salva em finalizadas.
       */

      const salva =
        await salvarPartidaFinalizada(
          partida
        )

      /*
       * DEPOIS remove do ao vivo.
       */

      await prisma.partidaAoVivo.deleteMany({

        where: {

          partida_id:
            partida.partida_id

        }

      })

      console.log(
        `🗑️ Partida ${ partida.partida_id } removida de partidaAoVivo`
      )

      return salva

    }

    /* =========================================
       🔴 CONTINUA AO VIVO
    ========================================= */

    if (
      !STATUS_AO_VIVO.includes(status)
    ) {

      console.log(
        `⚠️ Status ${ status } não é ao vivo`
      )

      return null

    }

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
      `✅ Partida ${ partida.partida_id } atualizada no ao vivo`
    )

    return partidaSalva

  } catch (erro) {

    console.error(
      `❌ Erro ao atualizar partida ao vivo ${ partidaApi?.partida_id }: `,
      erro.message
    )

    return null

  }

}

/* =========================================================
   REMOVER PARTIDA AO VIVO
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
      `🗑️ Partida ${ partidaId } removida do banco ao vivo`
    )

  } catch (erro) {

    console.error(
      `❌ Erro ao remover partida ${ partidaId }: `,
      erro.message
    )

  }

}

/* =========================================================
   BUSCAR TODAS AO VIVO
========================================================= */

export function buscarTodasAoVivo() {

  return buscarPartidasAoVivoCampeonato()

}

/* =========================================================
   BRASILEIRÃO
========================================================= */

export function buscarBrasileiraoAoVivo() {

  return buscarPartidasAoVivoCampeonato(
    CAMPEONATOS.BRASILEIRAO
  )

}

/* =========================================================
   COPA DO BRASIL
========================================================= */

export function buscarCopaBrasilAoVivo() {

  return buscarPartidasAoVivoCampeonato(
    CAMPEONATOS.COPABRASIL
  )

}

/* =========================================================
   COPA DO MUNDO
========================================================= */

export function buscarCopaMundoAoVivo() {

  return buscarPartidasAoVivoCampeonato(
    CAMPEONATOS.COPAMUNDO
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
      p.status,

    tempo:
      p.cronometro ?? null,

    campeonato: {

      campeonato_id:
        p.campeonato?.campeonato_id,

      nome:
        p.campeonato?.nome

    },

    placar_mandante:
      p.placar_mandante ?? 0,

    placar_visitante:
      p.placar_visitante ?? 0,

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
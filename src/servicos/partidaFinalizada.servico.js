
import { CAMPEONATOS } from "../constantes/campeonatos.js"

import { prisma } from "../lib/prisma.js"

/* =========================================================
   🔹 STATUS FINALIZADO
========================================================= */

export function statusEhFinalizado(status) {

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
   🔹 NORMALIZA PARTIDA FINALIZADA
========================================================= */

function normalizarPartidaFinalizada(p) {

  if (!p?.partida_id) {
    return null
  }

  return {

    partida_id:
      p.partida_id,

    status:
      p.status || "finalizado",

    campeonato: {

      campeonato_id:
        p.campeonato?.campeonato_id ??
        p.campeonato_id ??
        null,

      nome:
        p.campeonato?.nome ??
        p.campeonato_nome ??
        null

    },

    mandante: {

      nome:
        p.time_mandante?.nome_popular ??
        p.mandante?.nome ??
        p.mandante_nome ??
        null,

      escudo:
        p.time_mandante?.escudo ??
        p.mandante?.escudo ??
        p.mandante_escudo ??
        null

    },

    visitante: {

      nome:
        p.time_visitante?.nome_popular ??
        p.visitante?.nome ??
        p.visitante_nome ??
        null,

      escudo:
        p.time_visitante?.escudo ??
        p.visitante?.escudo ??
        p.visitante_escudo ??
        null

    },

    placar_mandante:
      Number(p.placar_mandante ?? 0),

    placar_visitante:
      Number(p.placar_visitante ?? 0),

    data:
      p.data_realizacao ??
      p.data ??
      null,

    hora:
      p.hora_realizacao ??
      p.hora ??
      null,

    data_iso:
      p.data_realizacao_iso ??
      p.data_iso ??
      null

  }

}

/* =========================================================
   🔹 SALVAR PARTIDA FINALIZADA
========================================================= */

export async function salvarPartidaFinalizada(partida) {

  if (!partida?.partida_id) {

    console.error(
      "❌ Não foi possível salvar partida finalizada: partida_id ausente"
    )

    return null

  }

  try {

    const normalizada =
      normalizarPartidaFinalizada(partida)

    if (!normalizada) {

      console.error(
        "❌ Não foi possível normalizar partida finalizada"
      )

      return null

    }

    if (!normalizada.campeonato.campeonato_id) {

      console.error(
        `❌ Partida ${normalizada.partida_id} sem campeonato_id`
      )

      return null

    }

    if (!statusEhFinalizado(normalizada.status)) {

      console.log(
        `⚠️ Partida ${normalizada.partida_id} ainda não está finalizada.Status: ${normalizada.status} `
      )

      return null

    }

    const dataIso =
      normalizada.data_iso
        ? new Date(normalizada.data_iso)
        : null

    const partidaSalva =
      await prisma.partidaFinalizada.upsert({

        where: {

          partida_id:
            normalizada.partida_id

        },

        update: {

          campeonato_id:
            normalizada.campeonato.campeonato_id,

          campeonato_nome:
            normalizada.campeonato.nome,

          status:
            normalizada.status,

          mandante_nome:
            normalizada.mandante.nome,

          mandante_escudo:
            normalizada.mandante.escudo,

          visitante_nome:
            normalizada.visitante.nome,

          visitante_escudo:
            normalizada.visitante.escudo,

          placar_mandante:
            normalizada.placar_mandante,

          placar_visitante:
            normalizada.placar_visitante,

          data:
            normalizada.data,

          hora:
            normalizada.hora,

          data_iso:
            dataIso

        },

        create: {

          partida_id:
            normalizada.partida_id,

          campeonato_id:
            normalizada.campeonato.campeonato_id,

          campeonato_nome:
            normalizada.campeonato.nome,

          status:
            normalizada.status,

          mandante_nome:
            normalizada.mandante.nome,

          mandante_escudo:
            normalizada.mandante.escudo,

          visitante_nome:
            normalizada.visitante.nome,

          visitante_escudo:
            normalizada.visitante.escudo,

          placar_mandante:
            normalizada.placar_mandante,

          placar_visitante:
            normalizada.placar_visitante,

          data:
            normalizada.data,

          hora:
            normalizada.hora,

          data_iso:
            dataIso

        }

      })

    console.log(
      `🏁 Partida ${normalizada.partida_id} salva em partidaFinalizada`
    )

    console.log(
      `⚽ ${normalizada.mandante.nome} ${normalizada.placar_mandante} x ${normalizada.placar_visitante} ${normalizada.visitante.nome} `
    )

    return partidaSalva

  } catch (erro) {

    console.error(
      `❌ Erro ao salvar partida finalizada ${partida.partida_id}: `,
      erro.message
    )

    return null

  }

}

/* =========================================================
   🔹 ATUALIZAR FINALIZADAS POR CAMPEONATO

   IMPORTANTE:
   A partida é salva no momento em que o
   partidasAoVivo.job detectar que ela terminou.

   Esta função fica mantida para compatibilidade
   com outros jobs/arquivos que ainda possam chamar.
========================================================= */

export async function atualizarFinalizadasCampeonato(
  idCampeonato
) {

  if (!idCampeonato) {
    return []
  }

  try {

    const partidas =
      await buscarFinalizadasCampeonato(
        idCampeonato
      )

    console.log(
      `🏁 Finalizadas encontradas no banco campeonato ${idCampeonato}: ${partidas.length} `
    )

    return partidas

  } catch (erro) {

    console.error(
      `❌ Erro ao atualizar finalizadas campeonato ${idCampeonato}: `,
      erro.message
    )

    return []

  }

}

/* =========================================================
   🔹 BUSCAR FINALIZADAS POR CAMPEONATO
========================================================= */

export async function buscarFinalizadasCampeonato(
  idCampeonato
) {

  if (!idCampeonato) {
    return []
  }

  try {

    const partidas =
      await prisma.partidaFinalizada.findMany({

        where: {

          campeonato_id:
            idCampeonato

        },

        orderBy: [

          {
            data_iso: "desc"
          },

          {
            partida_id: "desc"
          }

        ]

      })

    return partidas.map(partida => ({

      partida_id:
        partida.partida_id,

      status:
        partida.status,

      campeonato: {

        campeonato_id:
          partida.campeonato_id,

        nome:
          partida.campeonato_nome

      },

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

      placar_mandante:
        partida.placar_mandante,

      placar_visitante:
        partida.placar_visitante,

      data:
        partida.data,

      hora:
        partida.hora,

      data_iso:
        partida.data_iso

    }))

  } catch (erro) {

    console.error(

      `❌ Erro ao buscar partidas finalizadas ${idCampeonato}: `,

      erro.message

    )

    return []

  }

}

/* =========================================================
   🔹 TODAS FINALIZADAS
========================================================= */

export async function buscarTodasFinalizadas() {

  try {

    const [

      brasileirao,

      copaBrasil,

      champions

    ] = await Promise.all([

      buscarBrasileiraoFinalizadas(),

      buscarCopaBrasilFinalizadas(),

      buscarChampionsFinalizadas()

    ])

    return [

      ...brasileirao,

      ...copaBrasil,

      ...champions

    ]

  } catch (erro) {

    console.error(
      "❌ Erro ao buscar todas as partidas finalizadas:",
      erro.message
    )

    return []

  }

}

/* =========================================================
   🔹 FINALIZADAS — BRASILEIRÃO
========================================================= */

export function buscarBrasileiraoFinalizadas() {

  return buscarFinalizadasCampeonato(
    CAMPEONATOS.BRASILEIRAO
  )

}

/* =========================================================
   🔹 FINALIZADAS — COPA DO BRASIL
========================================================= */

export function buscarCopaBrasilFinalizadas() {

  return buscarFinalizadasCampeonato(
    CAMPEONATOS.COPABRASIL
  )

}

/* =========================================================
   🔹 FINALIZADAS — CHAMPIONS
========================================================= */

export function buscarChampionsFinalizadas() {

  return buscarFinalizadasCampeonato(
    CAMPEONATOS.CHAMPIONS
  )

}
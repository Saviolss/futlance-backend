import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarAoVivoApi } from "./apiFutebol.servico.js" 
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/* 🔹 função base */
export async function buscarPartidasAoVivoCampeonato(idCampeonato = null) {
  console.log("⚽ Atualizando partidas ao vivo...");

  try {

    const where = {}

    if (idCampeonato) {

      where.campeonato_id = idCampeonato

    }

    const partidas = await prisma.partidaAoVivo.findMany({

      where,

      orderBy: {
        partida_id: "asc"
      }

    })

    return partidas.map(partida => ({

      partida_id: partida.partida_id,

      status: partida.status,

      tempo: partida.tempo,

      campeonato: {
        campeonato_id: partida.campeonato_id,
        nome: partida.campeonato_nome
      },

      placar_mandante: partida.placar_mandante,

      placar_visitante: partida.placar_visitante,

      penalti:

        partida.penalti_mandante !== null ||
          partida.penalti_visitante !== null

          ? {

            mandante: partida.penalti_mandante,

            visitante: partida.penalti_visitante,

            cobrancas: partida.penalti_cobrancas || []

          }

          : null,

      mandante: {

        nome: partida.mandante_nome,

        escudo: partida.mandante_escudo

      },

      visitante: {

        nome: partida.visitante_nome,

        escudo: partida.visitante_escudo

      },

      estadio: {

        nome_popular: partida.estadio_nome

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

export async function atualizarPartidasAoVivo() {
  try {

    const partidas = await buscarAoVivoApi()

    if (!Array.isArray(partidas)) {
      return
    }

    const partidasNormalizadas = partidas
      .filter(p =>
        p.status === "andamento" ||
        p.status === "intervalo"
      )
      .map(normalizarPartida)
      .filter(Boolean)


    await prisma.$transaction(async (tx) => {

      for (const partida of partidasNormalizadas) {


        await tx.partidaAoVivo.upsert({

          where: {
            partida_id: partida.partida_id
            
          },

          update: {

            campeonato_id: partida.campeonato.campeonato_id,

            campeonato_nome: partida.campeonato.nome,

            status: partida.status,

            tempo: partida.tempo,

            placar_mandante: partida.placar_mandante,

            placar_visitante: partida.placar_visitante,

            penalti_mandante: partida.penalti?.mandante,

            penalti_visitante: partida.penalti?.visitante,

            penalti_cobrancas: partida.penalti?.cobrancas ?? [],

            mandante_nome: partida.mandante.nome,

            mandante_escudo: partida.mandante.escudo,

            visitante_nome: partida.visitante.nome,

            visitante_escudo: partida.visitante.escudo,

            estadio_nome: partida.estadio.nome_popular

          },

          create: {

            partida_id: partida.partida_id,

            campeonato_id: partida.campeonato.campeonato_id,

            campeonato_nome: partida.campeonato.nome,

            status: partida.status,

            tempo: partida.tempo,

            placar_mandante: partida.placar_mandante,

            placar_visitante: partida.placar_visitante,

            penalti_mandante: partida.penalti?.mandante,

            penalti_visitante: partida.penalti?.visitante,

            penalti_cobrancas: partida.penalti?.cobrancas ?? [],

            mandante_nome: partida.mandante.nome,

            mandante_escudo: partida.mandante.escudo,

            visitante_nome: partida.visitante.nome,

            visitante_escudo: partida.visitante.escudo,

            estadio_nome: partida.estadio.nome_popular

          }

        })

      }

      const ids = partidasNormalizadas.map(
        partida => partida.partida_id
      )

      await tx.partidaAoVivo.deleteMany({

        where: {

          partida_id: {
            notIn: ids
          }

        }

      })

    })

    console.log("✅ Partidas ao vivo atualizadas.")

  } catch (erro) {

    console.error(
      "❌ Erro ao atualizar partidas ao vivo:",
      erro.message
    )

  }

}

export async function atualizarPartidaAoVivo(partidaApi) {
 
  try {

    const partida = normalizarPartida(partidaApi)
    
    if (!partida) {
      return
    }
    
    await prisma.partidaAoVivo.upsert({
      
      where: {
        partida_id: partida.partida_id
      },

      update: {

        campeonato_id: partida.campeonato.campeonato_id,

        campeonato_nome: partida.campeonato.nome,

        status: partida.status,

        tempo: partida.tempo,

        placar_mandante: partida.placar_mandante,

        placar_visitante: partida.placar_visitante,

        penalti_mandante: partida.penalti?.mandante,

        penalti_visitante: partida.penalti?.visitante,

        penalti_cobrancas: partida.penalti?.cobrancas ?? [],

        mandante_nome: partida.mandante.nome,

        mandante_escudo: partida.mandante.escudo,

        visitante_nome: partida.visitante.nome,

        visitante_escudo: partida.visitante.escudo,

        estadio_nome: partida.estadio.nome_popular

      },

      create: {

        partida_id: partida.partida_id,

        campeonato_id: partida.campeonato.campeonato_id,

        campeonato_nome: partida.campeonato.nome,

        status: partida.status,

        tempo: partida.tempo,

        placar_mandante: partida.placar_mandante,

        placar_visitante: partida.placar_visitante,

        penalti_mandante: partida.penalti?.mandante,

        penalti_visitante: partida.penalti?.visitante,

        penalti_cobrancas: partida.penalti?.cobrancas ?? [],

        mandante_nome: partida.mandante.nome,

        mandante_escudo: partida.mandante.escudo,

        visitante_nome: partida.visitante.nome,

        visitante_escudo: partida.visitante.escudo,

        estadio_nome: partida.estadio.nome_popular

      }

    })
    console.log(partida);


  } catch (erro) {

    console.error(
      "❌ Erro ao atualizar partida ao vivo:",
      erro.message
    )

  }

}

/* 🔹 exports públicos */
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

export function buscarCopaMundoAoVivo() {
  return buscarPartidasAoVivoCampeonato(
    CAMPEONATOS.COPAMUNDO
  )
}

export async function removerPartidaAoVivoBanco(partidaId) {

  await prisma.partidaAoVivo.deleteMany({
    where: {
      partida_id: partidaId
    }
  })

}

function normalizarPartida(p) {
  if (
    !p ||
    !p.time_mandante ||
    !p.time_visitante
  ) {
    return null
  }
  

  return {

    partida_id: p.partida_id,

    status: p.status,

    tempo: p.cronometro ?? null,

    campeonato: {
      campeonato_id: p.campeonato?.campeonato_id,
      nome: p.campeonato?.nome
    },

    placar_mandante: p.placar_mandante,

    placar_visitante: p.placar_visitante,

    penalti: p.disputa_penalti
      ? {
        mandante: p.disputa_penalti.placar_penalti_mandante,
        visitante: p.disputa_penalti.placar_penalti_visitante,
        cobrancas: p.disputa_penalti.cobrancas || []
      }
      : null,

    mandante: {
      nome: p.time_mandante?.nome_popular,
      escudo: p.time_mandante?.escudo
    },

    visitante: {
      nome: p.time_visitante?.nome_popular,
      escudo: p.time_visitante?.escudo
    },

    estadio: {
      nome_popular: p.estadio?.nome_popular
    }

  }

}

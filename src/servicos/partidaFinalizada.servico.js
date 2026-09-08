import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarRodadasApi } from "./apiFutebol.servico.js"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const LIMITE_HORAS = 48

function extrairPartidasDaResposta(resposta) {
  if (!resposta) return []

  if (Array.isArray(resposta)) {
    return resposta.flatMap(extrairPartidasDaResposta)
  }

  if (Array.isArray(resposta.partidas)) {
    return resposta.partidas.flatMap(extrairPartidasDaResposta)
  }

  if (Array.isArray(resposta.rodadas)) {
    return resposta.rodadas.flatMap(extrairPartidasDaResposta)
  }

  if (typeof resposta === "object") {
    if (resposta.partida_id && resposta.time_mandante && resposta.time_visitante) {
      return [resposta]
    }

    return Object.values(resposta).flatMap(extrairPartidasDaResposta)
  }

  return []
}

function partidaEhFinalizada(p) {
  const status = String(p?.status || "").trim().toLowerCase()
  const statusFinalizado = [
    "finalizado",
    "encerrado",
    "concluido",
    "finished",
    "complete"
  ].includes(status)

  const temPlacar =
    p?.placar_mandante != null && p?.placar_visitante != null

  if (!statusFinalizado && !temPlacar) return false

  if (!p?.data_realizacao_iso && !p?.data_realizacao) {
    return true
  }

  const data = new Date(p.data_realizacao_iso || p.data_realizacao).getTime()
  if (Number.isNaN(data)) return true

  const agora = Date.now()
  const limite = LIMITE_HORAS * 60 * 60 * 1000

  return data >= agora - limite
}

/* =========================================================
   🔹 BUSCA POR CAMPEONATO (SEGURA)
========================================================= */
async function buscarFinalizadasCampeonato(idCampeonato) {

  if (!idCampeonato) {

    return []

  }

  try {

    const partidas = await prisma.partidaFinalizada.findMany({

      where: {

        campeonato_id: idCampeonato

      },

      orderBy: [ 

       { data_iso: "desc" },

      { partida_id: "desc" }

      ]
    })

    return partidas.map(partida => ({

      partida_id: partida.partida_id,

      status: partida.status,

      campeonato: {

        nome: partida.campeonato_nome

      },

      mandante: {

        nome: partida.mandante_nome,

        escudo: partida.mandante_escudo

      },

      visitante: {

        nome: partida.visitante_nome,

        escudo: partida.visitante_escudo

      },

      placar_mandante: partida.placar_mandante,

      placar_visitante: partida.placar_visitante,

      data: partida.data,

      hora: partida.hora,

      data_iso: partida.data_iso

    }))

  } catch (erro) {

    console.error(

      `❌ Erro ao buscar partidas finalizadas ${idCampeonato}:`,

      erro.message

    )

    return []

  }

}

export async function atualizarFinalizadasCampeonato(
  idCampeonato
) {

  try {

    const resposta =
      await buscarRodadasApi(idCampeonato)

    const partidas = extrairPartidasDaResposta(resposta)
      .filter(partidaEhFinalizada)
      .map(normalizarPartidaFinalizada)

    for (const partida of partidas) {

      await prisma.partidaFinalizada.upsert({

        where: {

          partida_id: partida.partida_id

        },

        update: {

          campeonato_id: idCampeonato,

          campeonato_nome: partida.campeonato.nome,

          status: partida.status,

          mandante_nome: partida.mandante.nome,

          mandante_escudo: partida.mandante.escudo,

          visitante_nome: partida.visitante.nome,

          visitante_escudo: partida.visitante.escudo,

          placar_mandante: partida.placar_mandante,

          placar_visitante: partida.placar_visitante,

          data: partida.data,

          hora: partida.hora,

          data_iso: partida.data_iso
            ? new Date(partida.data_iso)
            : null

        },

        create: {

          partida_id: partida.partida_id,

          campeonato_id: idCampeonato,

          campeonato_nome: partida.campeonato.nome,

          status: partida.status,

          mandante_nome: partida.mandante.nome,

          mandante_escudo: partida.mandante.escudo,

          visitante_nome: partida.visitante.nome,

          visitante_escudo: partida.visitante.escudo,

          placar_mandante: partida.placar_mandante,

          placar_visitante: partida.placar_visitante,

          data: partida.data,

          hora: partida.hora,

          data_iso: partida.data_iso
            ? new Date(partida.data_iso)
            : null

        }

      })

    }

    const ids = partidas.map(
      partida => partida.partida_id
    )

    await prisma.partidaFinalizada.deleteMany({

      where: {

        campeonato_id: idCampeonato,

        partida_id: {

          notIn: ids

        }

      }

    })

    console.log(
      `✅ Partidas finalizadas ${idCampeonato} atualizadas`
    )

  } catch (erro) {

    console.error(

      `❌ Erro ao atualizar partidas finalizadas ${idCampeonato}:`,

      erro.message

    )

  }

}

/* =========================================================
   🔹 NORMALIZA PARTIDA
========================================================= */
function normalizarPartidaFinalizada(p) {
  return {
    partida_id: p.partida_id,
    status: p.status || "finalizado",

    campeonato: {
      nome: p.campeonato?.nome
    },

    mandante: {
      nome: p.time_mandante?.nome_popular,
      escudo: p.time_mandante?.escudo
    },

    visitante: {
      nome: p.time_visitante?.nome_popular,
      escudo: p.time_visitante?.escudo
    },

    placar_mandante: p.placar_mandante,
    placar_visitante: p.placar_visitante,

    data: p.data_realizacao,
    hora: p.hora_realizacao,
    data_iso: p.data_realizacao_iso || p.data_realizacao || null
  }
}

export async function salvarPartidaFinalizada(partidaApi) {

  if (!partidaApi) {

    return null

  }

  try {

    const partida = normalizarPartidaFinalizada(partidaApi)

    if (!partida || !partida.partida_id) {

      return null

    }

    const partidaSalva = await prisma.partidaFinalizada.upsert({

      where: {

        partida_id: partida.partida_id

      },

      update: {

        campeonato_id: partidaApi.campeonato?.campeonato_id ?? null,

        campeonato_nome: partida.campeonato.nome,

        status: partida.status,

        mandante_nome: partida.mandante.nome,

        mandante_escudo: partida.mandante.escudo,

        visitante_nome: partida.visitante.nome,

        visitante_escudo: partida.visitante.escudo,

        placar_mandante: partida.placar_mandante,

        placar_visitante: partida.placar_visitante,

        data: partida.data,

        hora: partida.hora,

        data_iso: partida.data_iso
          ? new Date(partida.data_iso)
          : null

      },

      create: {

        partida_id: partida.partida_id,

        campeonato_id: partidaApi.campeonato?.campeonato_id ?? null,

        campeonato_nome: partida.campeonato.nome,

        status: partida.status,

        mandante_nome: partida.mandante.nome,

        mandante_escudo: partida.mandante.escudo,

        visitante_nome: partida.visitante.nome,

        visitante_escudo: partida.visitante.escudo,

        placar_mandante: partida.placar_mandante,

        placar_visitante: partida.placar_visitante,

        data: partida.data,

        hora: partida.hora,

        data_iso: partida.data_iso
          ? new Date(partida.data_iso)
          : null

      }

    })

    return partidaSalva

  } catch (erro) {

    console.error(

      `❌ Erro ao salvar partida finalizada ${partidaApi?.partida_id}:`,

      erro.message

    )

    return null

  }

}

/* =========================================================
   🔹 TODAS FINALIZADAS (CORRIGIDO)
========================================================= */
export async function buscarTodasFinalizadas() {
  const [
    brasileirao,
    copaBrasil,
    Champions
  ] = await Promise.allSettled([
    buscarBrasileiraoFinalizadas(),
    buscarCopaBrasilFinalizadas(),
    buscarChampionsFinalizadas()
  ])

  return [
    ...(brasileirao.status === "fulfilled" ? brasileirao.value : []),
    ...(copaBrasil.status === "fulfilled" ? copaBrasil.value : []),
    ...(Champions.status === "fulfilled" ? Champions.value : [])
  ]
}

/* =========================================================
   🔹 EXPORTS POR CAMPEONATO
========================================================= */
export function buscarBrasileiraoFinalizadas() {
  return buscarFinalizadasCampeonato(CAMPEONATOS.BRASILEIRAO)
}

export function buscarChampionsFinalizadas() {
  return buscarFinalizadasCampeonato(CAMPEONATOS.CHAMPIONS)
}

export function buscarCopaBrasilFinalizadas() {
  return buscarFinalizadasCampeonato(CAMPEONATOS.COPABRASIL)
}
import { buscarAgendaApi } from "./apiFutebol.servico.js"
import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/* =========================================================
   🔹 NORMALIZA PARTIDA
========================================================= */

function normalizarPartida(partida, campeonato) {

  if (
    !partida?.time_mandante ||
    !partida?.time_visitante || 
    !partida?.data_realizacao 
  ) {
    return null
  }

  return {

    partida_id:
      partida.partida_id,

    campeonato,

    mandante: {
      nome:
        partida.time_mandante.nome_popular,

      escudo:
        partida.time_mandante.escudo
    },

    visitante: {
      nome:
        partida.time_visitante.nome_popular,

      escudo:
        partida.time_visitante.escudo
    },

    data:
      partida.data_realizacao,

    hora:
      partida.hora_realizacao || "--:--",

    status:
      partida.status,

    // uso interno
    data_iso:
      partida.data_realizacao_iso
  }
}

/* =========================================================
   🔹 REMOVE DUPLICADOS
========================================================= */

function removerDuplicados(partidas = []) {

  const mapa = new Map()

  partidas.forEach(partida => {

    mapa.set(
      partida.partida_id,
      partida
    )
  })

  return [...mapa.values()]
}

/* =========================================================
   🔹 EXTRAI PARTIDAS (OBJETO PROFUNDO)
========================================================= */

function extrairTodasPartidas(node) {

  if (!node) {
    return []
  }

  // já é uma partida
  if (
    node.partida_id &&
    node.time_mandante &&
    node.time_visitante
  ) {
    return [node]
  }

  // array
  if (Array.isArray(node)) {

    return node.flatMap(
      extrairTodasPartidas
    )
  }

  // objeto
  if (typeof node === "object") {

    return Object
      .values(node)
      .flatMap(extrairTodasPartidas)
  }

  return []
}

/* =========================================================
   🔹 SELECIONA HOJE OU PRÓXIMO DIA
========================================================= */

function selecionarPartidasDoDiaOuProxima(partidas) {

  if (!partidas.length) {
    return []
  }

  const agora = new Date()

  const hoje =
    new Date()
      .toLocaleDateString("sv-SE")

  /* ============================
     1️⃣ JOGOS DE HOJE
  ============================ */

  const hojeJogos =
    partidas.filter(p =>

      p.data_iso?.startsWith(hoje)
    )

  if (hojeJogos.length) {

    return hojeJogos
  }

  /* ============================
     2️⃣ PRÓXIMOS JOGOS
  ============================ */

  const futuros = partidas

    .filter(p => p.data_iso)

    .map(p => ({
      ...p,
      _data: new Date(p.data_iso)
    }))

    .filter(p => p._data > agora)

  if (!futuros.length) {

    return []
  }

  const grupos = {}

  futuros.forEach(p => {

    const dia =
      p.data_iso.split("T")[0]

    if (!grupos[dia]) {

      grupos[dia] = []
    }

    grupos[dia].push(p)
  })

  const proximoDia =
    Object.keys(grupos)
      .sort()[0]

  return grupos[proximoDia]
    .map(({ _data, ...rest }) => rest)
}

/* =========================================================
   🔹 PROCESSA AGENDA
========================================================= */

function processarAgenda(
  agenda,
  campeonato
) {

  if (!agenda?.partidas) {
    return []
  }

  const todas = extrairTodasPartidas(
    agenda.partidas
  )
    .map(partida =>
      normalizarPartida(
        partida,
        campeonato
      )
    )
    .filter(Boolean)

  return removerDuplicados(todas)
}

export async function atualizarAgendaCampeonato(
  idCampeonato,
  nomeCampeonato
) {
  try {

    const agenda = await buscarAgendaApi(idCampeonato)

    const partidas = processarAgenda(
      agenda,
      nomeCampeonato
    )

    await prisma.$transaction(async (tx) => {

      for (const partida of partidas) {

        await tx.agenda.upsert({

          where: {
            partida_id: partida.partida_id
          },

          update: {

            campeonato_id: idCampeonato,
            campeonato: partida.campeonato,

            mandante_nome: partida.mandante.nome,
            mandante_escudo: partida.mandante.escudo,

            visitante_nome: partida.visitante.nome,
            visitante_escudo: partida.visitante.escudo,

            data: partida.data,
            hora: partida.hora,
            status: partida.status,

            data_iso: new Date(partida.data_iso)

          },

          create: {

            partida_id: partida.partida_id,

            campeonato_id: idCampeonato,
            campeonato: partida.campeonato,

            mandante_nome: partida.mandante.nome,
            mandante_escudo: partida.mandante.escudo,

            visitante_nome: partida.visitante.nome,
            visitante_escudo: partida.visitante.escudo,

            data: partida.data,
            hora: partida.hora,
            status: partida.status,

            data_iso: new Date(partida.data_iso)

          }

        })

      }

      // Remove partidas que não fazem mais parte da agenda
      const partidasIds = partidas.map(
        partida => partida.partida_id
      )

      await tx.agenda.deleteMany({

        where: {

          campeonato_id: idCampeonato,

          partida_id: {
            notIn: partidasIds
          }

        }

      })

    })

    console.log(`✅ Agenda ${nomeCampeonato} atualizada.`)

  } catch (erro) {

    console.error(
      `❌ Erro ao atualizar agenda ${nomeCampeonato}:`,
      erro.message
    )

  }
}

/* =========================================================
    🔹 BUSCA AGENDA banco
  ========================================================= */
async function buscarAgendaBanco(idCampeonato) {

  try {

    const partidas = await prisma.agenda.findMany({

      where: {
        campeonato_id: idCampeonato
      },

      orderBy: [
        {
          data_iso: "asc"
        }
      ]

    })

    return partidas.map(partida => ({

      partida_id: partida.partida_id,

      campeonato: partida.campeonato,

      mandante: {
        nome: partida.mandante_nome,
        escudo: partida.mandante_escudo
      },

      visitante: {
        nome: partida.visitante_nome,
        escudo: partida.visitante_escudo
      },

      data: partida.data,

      hora: partida.hora,

      status: partida.status,

      data_iso: partida.data_iso

    }))

  } catch (erro) {

    console.error(
      "❌ Erro ao buscar agenda:",
      erro.message
    )

    return []

  }

}
/* =========================================================
   🔹 BRASILEIRÃO
========================================================= */

export function buscarAgendaBrasileirao() {

  return buscarAgendaBanco(
    CAMPEONATOS.BRASILEIRAO
  )

}

/* =========================================================
   🔹 COPA DO MUNDO
========================================================= */

export function buscarAgendaCopaMundo() {

  return buscarAgendaBanco(
    CAMPEONATOS.COPAMUNDO
  )

}

/* =========================================================
   🔹 COPA DO BRASIL
========================================================= */

export function buscarAgendaCopaBrasil() {

  return buscarAgendaBanco(
    CAMPEONATOS.COPABRASIL
  )
  
}

/* =========================================================
   🔹 AGENDA GERAL
========================================================= */

export function buscarAgendaGeral() {

  return Promise.allSettled([

    buscarAgendaBrasileirao(),

    buscarAgendaCopaBrasil(),

    buscarAgendaCopaMundo()

  ]).then(([

    brasileirao,
    copaBrasil,
    copaMundo

  ]) => {

    const jogosAgenda = [

      ...(brasileirao.status === "fulfilled"
        ? brasileirao.value
        : []),

      ...(copaBrasil.status === "fulfilled"
        ? copaBrasil.value
        : []),

      ...(copaMundo.status === "fulfilled"
        ? copaMundo.value
        : [])
    ]

    return removerDuplicados(
      jogosAgenda
    )

  }).catch(erro => {

    console.error(
      "❌ Erro ao buscar agenda geral:",
      erro.message
    )

    return []
  })
}
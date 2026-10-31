import { prisma } from "../lib/prisma.js"

/* ======================================================
   LISTA DE TIMES
====================================================== */

export async function buscarTimesBanco() {

  const times = await prisma.time.findMany({
    select: {
      id: true,
      timeId: true,
      nome: true,
      nomePopular: true,
      sigla: true,
      escudo: true,
      slug: true,
      tecnicoNome: true,
      tecnicoPais: true,
      idadeMedia: true,
      alturaMedia: true,
      camisa10: true,
      jogadoresNoPais: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      nomePopular: "asc"
    }
  })

  return times
}

/* ======================================================
   TIME POR SLUG
====================================================== */

export async function buscarTimePorSlugBanco(slug) {

  const time = await prisma.time.findUnique({
    where: {
      slug
    },
    select: {
      id: true,
      timeId: true,
      nome: true,
      nomePopular: true,
      sigla: true,
      escudo: true,
      slug: true,
      tecnicoNome: true,
      tecnicoPais: true,
      idadeMedia: true,
      alturaMedia: true,
      camisa10: true,
      jogadoresNoPais: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (!time) {
    return null
  }

  const elenco = await prisma.elenco.findMany({
    where: {
      timeId: time.timeId
    },
    orderBy: {
      numeroCamisa: "asc"
    }
  })

  const proximasPartidas = await prisma.partida.findMany({
    where: {
      timeId: time.timeId
    },
    orderBy: {
      data: "asc"
    }
  })

  return {
    ...time,
    proximasPartidas
  }
}
import { prisma } from "../lib/prisma.js"

/* ======================================================
   LISTA DE TIMES
====================================================== */

export async function buscarTimesBanco() {

  const times = await prisma.time.findMany({

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

  const proximasPartidas =
    await prisma.partida.findMany({

      where: {
        timeId: time.timeId
      },

      orderBy: {
        data: "asc"
      }
    })

  return {
    ...time,
    elenco,
    proximasPartidas
  }
}
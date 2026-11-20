
import { prisma } from "../lib/prisma.js"

export async function buscarTimesBanco() {
  return prisma.time.findMany({
    select: {
      id: true,
      timeId: true,
      nome: true,
      nomePopular: true,
      apelido: true,
      sigla: true,
      escudo: true,
      slug: true,
      tecnicoNome: true,
      tecnicoPais: true,
      idadeMedia: true,
      alturaMedia: true,
      camisa10: true,
      jogadoresNoPais: true,
      disponivelAssinatura: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      nomePopular: "asc"
    }
  })
}

export async function buscarTimePorSlugBanco(slug) {
  const time = await prisma.time.findUnique({
    where: { slug },
    select: {
      id: true,
      timeId: true,
      nome: true,
      nomePopular: true,
      apelido: true,
      sigla: true,
      escudo: true,
      slug: true,
      tecnicoNome: true,
      tecnicoPais: true,
      idadeMedia: true,
      alturaMedia: true,
      camisa10: true,
      jogadoresNoPais: true,
      disponivelAssinatura: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (!time) return null

  const [elenco, proximasPartidas] = await Promise.all([
    prisma.elenco.findMany({
      where: { timeId: time.timeId },
      orderBy: { numeroCamisa: "asc" }
    }),
    prisma.partida.findMany({
      where: { timeId: time.timeId },
      orderBy: { data: "asc" }
    })
  ])

  return {
    ...time,
    elenco,
    proximasPartidas
  }
}

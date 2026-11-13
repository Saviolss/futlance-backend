
import { prisma } from "../../lib/prisma.js"
import { coletarNoticiasTimes } from "./noticia.coletor.service.js"

export async function atualizarNoticiasTime(timeId) {
  if (!timeId) throw new Error("ID do time não informado.")

  const time = await prisma.time.findUnique({
    where: { timeId },
    select: {
      timeId: true,
      nome: true,
      nomePopular: true,
      slug: true
    }
  })

  if (!time) throw new Error("Time não encontrado.")

  console.log(`📰 Coletando notícias de ${time.nomePopular}...`)

  await coletarNoticiasTimes([time])

  return buscarNoticiasTime(timeId, 50)
}

export async function atualizarNoticiasTimesAtivos() {
  const times = await prisma.time.findMany({
    where: {
      assinaturas: {
        some: {
          status: "ATIVA"
        }
      }
    },
    select: {
      timeId: true,
      nome: true,
      nomePopular: true,
      slug: true
    }
  })

  if (!times.length) {
    console.log("📰 Nenhum time com assinatura ativa.")
    return 0
  }

  return coletarNoticiasTimes(times)
}

export async function buscarNoticiasTime(timeId, limite = 10) {
  if (!timeId) throw new Error("ID do time não informado.")

  const quantidade = Math.min(
    Math.max(Number(limite) || 10, 1),
    50
  )

  return prisma.noticiaTime.findMany({
    where: { timeId },
    orderBy: [
      { data: "desc" },
      { createdAt: "desc" }
    ],
    take: quantidade
  })
}

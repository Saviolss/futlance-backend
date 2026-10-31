import { buscarNoticiasApi } from "./noticiaApi.js"

import { prisma } from "../../lib/prisma.js"

function normalizarNoticia(noticia) {
  return {
    titulo: noticia.title || "",
    descricao: noticia.description || "",
    imagem: noticia.image_url || null,
    fonte: noticia.source || "Desconhecida",
    url: noticia.url || null,
    idioma: "pt",
    data: noticia.published_at ? new Date(noticia.published_at) : null,
    categoria: Array.isArray(noticia.categories) ? noticia.categories : [],
    autor: Array.isArray(noticia.authors) ? noticia.authors : []
  }
}

export async function atualizarNoticiasTime(timeId) {
  if (!timeId) {
    throw new Error("ID do time não informado.")
  }

  const time = await prisma.time.findUnique({
    where: { timeId },
    select: {
      timeId: true,
      nomePopular: true
    }
  })

  if (!time) {
    throw new Error("Time não encontrado.")
  }

  console.log(`📰 Buscando notícias de ${ time.nomePopular } em português...`)

  const resposta = await buscarNoticiasApi({
    nomeTime: time.nomePopular,
    limite: 3
  })

  const noticias = (resposta.data || [])
    .map(normalizarNoticia)
    .filter(noticia => noticia.titulo && noticia.url)

  for (const noticia of noticias) {
    await prisma.noticiaTime.upsert({
      where: {
        url: noticia.url
      },
      update: {
        titulo: noticia.titulo,
        descricao: noticia.descricao,
        imagem: noticia.imagem,
        fonte: noticia.fonte,
        idioma: noticia.idioma,
        data: noticia.data,
        categoria: noticia.categoria,
        autor: noticia.autor,
        timeId: time.timeId
      },
      create: {
        timeId: time.timeId,
        titulo: noticia.titulo,
        descricao: noticia.descricao,
        imagem: noticia.imagem,
        fonte: noticia.fonte,
        url: noticia.url,
        idioma: noticia.idioma,
        data: noticia.data,
        categoria: noticia.categoria,
        autor: noticia.autor
      }
    })
  }

  console.log(`✅ ${ noticias.length } notícias salvas para ${ time.nomePopular } `)

  return noticias
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
      nomePopular: true
    }
  })

  let total = 0

  for (const time of times) {
    try {
      const noticias = await atualizarNoticiasTime(time.timeId)
      total += noticias.length
    } catch (erro) {
      console.error(
        `❌ Erro nas notícias de ${ time.nomePopular }: `,
        erro.message
      )
    }
  }

  console.log(`📰 Atualização concluída.${ total } notícias processadas.`)

  return total
}

export async function buscarNoticiasTime(timeId, limite = 10) {
  if (!timeId) {
    throw new Error("ID do time não informado.")
  }

  const quantidade = Math.min(
    Math.max(Number(limite) || 10, 1),
    50
  )

  return prisma.noticiaTime.findMany({
    where: {
      timeId
    },
    orderBy: {
      data: "desc"
    },
    take: quantidade
  })
}

import { buscarNoticiasApi } from "./noticiaApi.js"

import { prisma } from "../lib/prisma.js"

/* ======================================================
   NORMALIZAÇÃO
====================================================== */

function normalizarNoticia(noticia) {

  return {

    titulo:
      noticia.title || "",

    descricao:
      noticia.description || "",

    imagem:
      noticia.image_url ||
      noticia.thumbnail ||
      null,

    fonte:
      noticia.source ||
      "Desconhecida",

    url:
      noticia.url || "#",

    data:
      noticia.published_at,

    categoria:
      noticia.categories || [],

    autor:
      noticia.authors || []
  }
}

/* ======================================================
   BUSCA API
====================================================== */

export async function atualizarNoticias() {

  try {

    console.log("🌍 Buscando notícias da API...")

    const resposta = await buscarNoticiasApi({

      search: "futebol",

      categories: "sports",

      sort: "published_at",

      limit: 3

    })

    const noticias = (resposta.data || [])
      .map(normalizarNoticia)

    for (const noticia of noticias) {

      await prisma.noticia.upsert({

        where: {

          url: noticia.url

        },

        update: {

          titulo: noticia.titulo,

          descricao: noticia.descricao,

          imagem: noticia.imagem,

          fonte: noticia.fonte,

          data: noticia.data
            ? new Date(noticia.data)
            : null,

          categoria: noticia.categoria,

          autor: noticia.autor

        },

        create: {

          titulo: noticia.titulo,

          descricao: noticia.descricao,

          imagem: noticia.imagem,

          fonte: noticia.fonte,

          url: noticia.url,

          data: noticia.data
            ? new Date(noticia.data)
            : null,

          categoria: noticia.categoria,

          autor: noticia.autor

        }

      })

    }

    const urls = noticias.map(n => n.url)

    await prisma.noticia.deleteMany({

      where: {

        url: {

          notIn: urls

        }

      }

    })

    console.log("✅ Notícias atualizadas")

  } catch (erro) {

    console.error(
      "❌ Erro ao atualizar notícias:",
      erro.message
    )

  }

}

/* ======================================================
   BUSCA DO BANCO
====================================================== */

export async function buscarNoticias() {

  try {

    const noticias = await prisma.noticia.findMany({

      orderBy: {

        data: "desc"

      }

    })

    return noticias.map(noticia => ({

      titulo: noticia.titulo,

      descricao: noticia.descricao,

      imagem: noticia.imagem,

      fonte: noticia.fonte,

      url: noticia.url,

      data: noticia.data,

      categoria: noticia.categoria,

      autor: noticia.autor

    }))

  } catch (erro) {

    console.error(

      "❌ Erro ao buscar notícias:",

      erro.message

    )

    return []

  }

}


import { buscarNoticiasApi } from "./noticiaApi.js"

import {
  getCache,
  setCache
} from "../cache/cacheMemoria.js"

const CACHE_TTL =
  60 * 60 * 1000 // 1h

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
      noticia.source || "Desconhecida",

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
   BUSCAR NOTÍCIAS
====================================================== */

export async function buscarNoticias() {

  const chave =
    "noticias:futebol"

  const cache =
    getCache(chave)

  if (cache) {

    console.log("📰 notícias cache")

    return cache
  }

  console.log("🌍 buscando notícias API")

  const resposta =
    await buscarNoticiasApi({

      locale: "br",

      search:
        "futebol",

      categories:
        "sports",

      sort:
        "published_at",

      limit: 3
    })


  const noticias =
    (resposta.data || [])
      .map(normalizarNoticia)


  setCache(
    chave,
    noticias,
    CACHE_TTL
  )

  return noticias
}
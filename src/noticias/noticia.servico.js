import { buscarNoticiasApi } from "./noticiaApi.js"

import {
  getCache,
  setCache
} from "../cache/cacheMemoria.js"

const CACHE_TTL =
  30 * 60 * 1000 // 30 min

const CACHE_KEY =
  "noticias:futebol"

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

async function buscarNoticiasDaApi() {

  console.log("🌍 buscando notícias API")

  const resposta =
    await buscarNoticiasApi({

      search: "futebol",

      categories: "sports",

      sort: "published_at",

      limit: 3
    })


  const noticias =
    (resposta.data || [])
      .map(normalizarNoticia)

  console.log(
    `📰 notícias encontradas: ${noticias.length}`
  )

  setCache(
    CACHE_KEY,
    noticias,
    CACHE_TTL
  )

  return noticias
}

/* ======================================================
   BUSCA NORMAL
====================================================== */

export async function buscarNoticias() {

  const cache =
    getCache(CACHE_KEY)

  if (cache) {

    console.log("📰 notícias cache")

    return cache
  }

  return buscarNoticiasDaApi()
}

/* ======================================================
   FORÇA ATUALIZAÇÃO
====================================================== */

export async function atualizarNoticias() {

  return buscarNoticiasDaApi()
}
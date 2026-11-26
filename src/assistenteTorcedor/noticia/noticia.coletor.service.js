
import axios from "axios"
import Parser from "rss-parser"
import * as cheerio from "cheerio"
import { prisma } from "../../lib/prisma.js"
import { FONTES_NOTICIAS } from "./noticia.fontes.js"
import { noticiaPertenceAoTime } from "./noticia.filtro.js"

const parser = new Parser({
  customFields: {
    item: ["media:content", "media:thumbnail", "content:encoded"]
  }
})

const USER_AGENT = "FutlanceNoticias/1.0 (https://futlance.com)"

function limparTexto(html = "") {
  return cheerio.load(html).text().trim()
}

function obterImagemRSS(item) {
  const media = item["media:content"]
  const thumbnail = item["media:thumbnail"]
  const conteudo = item["content:encoded"] || item.content || item.description || ""

  const imagemMedia = Array.isArray(media) ? media[0]?.$?.url : media?.$?.url
  const imagemThumbnail = Array.isArray(thumbnail) ? thumbnail[0]?.$?.url : thumbnail?.$?.url
  const imagemHtml = cheerio.load(conteudo)("img").first().attr("src")

  return item.enclosure?.url || imagemMedia || imagemThumbnail || imagemHtml || null
}

function validarUrl(url) {
  try {
    const endereco = new URL(url)
    return ["http:", "https:"].includes(endereco.protocol)
  } catch {
    return false
  }
}

function normalizarImagem(imagem, urlNoticia) {
  if (!imagem) return null

  try {
    const endereco = new URL(imagem, urlNoticia)
    return ["http:", "https:"].includes(endereco.protocol) ? endereco.href : null
  } catch {
    return null
  }
}

async function obterImagemPagina(url) {
  if (!validarUrl(url)) return null

  try {
    const { data } = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html"
      }
    })

    const $ = cheerio.load(data)
    const imagem =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[property="og:image:url"]').attr("content")

    return normalizarImagem(imagem, url)
  } catch (erro) {
    console.warn(`⚠️ Não foi possível extrair imagem: ${url} - ${erro.message}`)
    return null
  }
}

async function buscarFeed(fonte) {
  try {
    const { data } = await axios.get(fonte.url, {
      timeout: 15000,
      maxRedirects: 5,
      responseType: "text",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/rss+xml, application/xml, text/xml"
      }
    })

    const resultado = await parser.parseString(data)

    const noticias = (resultado.items || []).slice(0, 50).map(item => {
      const url = item.link || item.guid

      return {
        titulo: limparTexto(item.title || ""),
        descricao: limparTexto(
          item.contentSnippet || item.description || item.summary || ""
        ).slice(0, 1000),
        imagem: normalizarImagem(obterImagemRSS(item), url),
        url,
        data: item.isoDate || item.pubDate || null,
        autor: item.creator || item.author || "",
        categoria: Array.isArray(item.categories) ? item.categories : [],
        fonte: fonte.nome
      }
    }).filter(item => item.titulo && validarUrl(item.url))

    console.log(`📡 ${fonte.nome}: ${noticias.length} notícias encontradas.`)
    return noticias
  } catch (erro) {
    console.error(`❌ Erro ao consultar ${fonte.nome}:`, erro.message)
    return []
  }
}

function converterData(data) {
  if (!data) return null
  const resultado = new Date(data)
  return Number.isNaN(resultado.getTime()) ? null : resultado
}

async function salvarNoticia(time, noticia) {
  let imagem = noticia.imagem || await obterImagemPagina(noticia.url)

  if (!imagem) {
    console.log(`⚠️ Notícia sem imagem ignorada: ${noticia.titulo}`)
    return null
  }

  const dados = {
    titulo: noticia.titulo,
    descricao: noticia.descricao || null,
    imagem,
    fonte: noticia.fonte,
    idioma: "pt",
    data: converterData(noticia.data),
    categoria: (noticia.categoria || []).map(String),
    autor: noticia.autor ? [String(noticia.autor)] : []
  }

  return prisma.noticiaTime.upsert({
    where: {
      timeId_url: {
        timeId: time.timeId,
        url: noticia.url
      }
    },
    update: dados,
    create: {
      ...dados,
      timeId: time.timeId,
      url: noticia.url
    }
  })
}

export async function coletarNoticiasTimes(times) {
  if (!Array.isArray(times) || !times.length) return 0

  const fontesAtivas = FONTES_NOTICIAS.filter(fonte => fonte.ativo)
  if (!fontesAtivas.length) {
    console.warn("⚠️ Nenhuma fonte de notícias está ativa.")
    return 0
  }

  let totalSalvas = 0
  const urlsProcessadas = new Set()

  // Busca sequencial: se uma fonte não tiver notícia para o time,
  // tenta a próxima fonte ativa.
  for (const time of times) {
    let noticiaEncontrada = false

    for (const fonte of fontesAtivas) {
      const noticias = await buscarFeed(fonte)

      const noticiasDoTime = noticias.filter(noticia =>
        noticiaPertenceAoTime(noticia, time)
      )

      for (const noticia of noticiasDoTime) {
        if (urlsProcessadas.has(noticia.url)) continue
        urlsProcessadas.add(noticia.url)

        try {
          const salva = await salvarNoticia(time, noticia)
          if (!salva) continue

          totalSalvas++
          noticiaEncontrada = true

          console.log(
            `📰 ${time.nomePopular} | Fonte: ${noticia.fonte} | ${noticia.titulo}`
          )

          // Salva as notícias encontradas nesta fonte e depois
          // segue para o próximo time.
        } catch (erro) {
          console.error(
            `❌ Erro ao salvar notícia de ${time.nomePopular}:`,
            erro.message
          )
        }
      }

      if (noticiaEncontrada) {
        console.log(
          `✅ ${time.nomePopular}: notícia encontrada na fonte ${fonte.nome}.`
        )
        break
      }

      console.log(
        `↪️ ${time.nomePopular}: nenhuma notícia válida em ${fonte.nome}; tentando próxima fonte.`
      )
    }

    if (!noticiaEncontrada) {
      console.log(
        `⚠️ ${time.nomePopular}: nenhuma notícia válida encontrada nas fontes ativas.`
      )
    }
  }

  console.log(`✅ Coleta concluída: ${totalSalvas} notícias vinculadas aos times.`)
  return totalSalvas
}

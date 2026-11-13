import { enfileirarNotificacao } from "./fila.notificacao.service.js"
import {
  podeEnviarNoticia,
  TIPOS
} from "./notificacao.service.js"
import { buscarNoticiasTime } from "../noticia/noticia.service.js"
import { prisma } from "../../lib/prisma.js"
function criarReferenciaNoticia(noticiaId) {
  return String(noticiaId)
}

export async function enviarNoticiasAssinatura(assinatura) {
  if (!assinatura?.id) {
    throw new Error("Assinatura não informada.")
  }

  if (assinatura.status !== "ATIVA" || !assinatura.whatsapp || !assinatura.timeId) {
    return { enfileiradas: 0, ignoradas: 0, erros: 0 }
  }

  const podeEnviar = await podeEnviarNoticia(assinatura.id)
  if (!podeEnviar) {
    return { enfileiradas: 0, ignoradas: 0, erros: 0 }
  }

  const time = await prisma.time.findUnique({
    where: { timeId: assinatura.timeId },
    select: { nomePopular: true }
  })

  if (!time?.nomePopular) {
    throw new Error(`Time ${assinatura.timeId} não encontrado ou sem nome.`)
  }

  const noticias = await buscarNoticiasTime(assinatura.timeId, 10)
  let enfileiradas = 0
  let ignoradas = 0
  let erros = 0

  for (const noticia of noticias) {
    if (enfileiradas >= 1) break

    if (!noticia?.id || !noticia.titulo || !noticia.url || !noticia.imagem) {
      ignoradas++
      continue
    }

    try {
      const aindaPodeEnviar = await podeEnviarNoticia(assinatura.id)
      if (!aindaPodeEnviar) break

      const resultado = await enfileirarNotificacao({
        assinaturaId: assinatura.id,
        tipo: TIPOS.NOTICIA_TIME,
        referenciaId: criarReferenciaNoticia(noticia.id),
        dados: {
          nomeTime: time.nomePopular,
          titulo: String(noticia.titulo),
          descricao: String(noticia.descricao || ""),
          imagem: String(noticia.imagem),
          url: String(noticia.url)
        }
      })

      if (resultado.criada) {
        enfileiradas++
      } else {
        ignoradas++
      }
    } catch (erro) {
      erros++
      console.error(
        `❌ Erro ao enfileirar notícia ${noticia.id} para assinatura ${assinatura.id}:`,
        erro.message
      )
    }
  }

  return { enfileiradas, ignoradas, erros }
}

export async function enviarNoticiasAssinantes() {
  const assinaturas = await prisma.assinatura.findMany({
    where: {
      status: "ATIVA",
      whatsapp: { not: "" },
      timeId: { not: null }
    },
    select: {
      id: true,
      usuarioId: true,
      timeId: true,
      whatsapp: true,
      idioma: true,
      status: true
    }
  })

  let totalEnfileiradas = 0
  let totalIgnoradas = 0
  let totalErros = 0

  for (const assinatura of assinaturas) {
    try {
      const resultado = await enviarNoticiasAssinatura(assinatura)
      totalEnfileiradas += resultado.enfileiradas
      totalIgnoradas += resultado.ignoradas
      totalErros += resultado.erros
    } catch (erro) {
      totalErros++
      console.error(
        `❌ Erro ao processar assinatura ${assinatura.id}:`,
        erro.message
      )
    }
  }

  console.log(
    `📰 Notícias: ${totalEnfileiradas} enfileiradas, ${totalIgnoradas} ignoradas, ${totalErros} erros.`
  )

  return {
    enfileiradas: totalEnfileiradas,
    ignoradas: totalIgnoradas,
    erros: totalErros
  }
}

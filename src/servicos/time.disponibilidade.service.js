import { prisma } from "../lib/prisma.js"
import {
  enfileirarNotificacao,
  TIPO_TIME_INDISPONIVEL
} from "../assistenteTorcedor/notificacao/fila.notificacao.service.js"

const LINK_CONFIGURACOES = "https://futlance.com/configuracoes/assinatura"

export async function timeDisponivelParaNotificacao(timeId) {
  if (!timeId) return false

  const time = await prisma.time.findUnique({
    where: { timeId },
    select: { disponivelAssinatura: true }
  })

  return time?.disponivelAssinatura === true
}

export async function desativarTimeParaAssinaturas(timeId) {
  if (!timeId) {
    throw new Error("ID do time não informado.")
  }

  const time = await prisma.time.findUnique({
    where: { timeId },
    select: {
      timeId: true,
      nomePopular: true,
      disponivelAssinatura: true
    }
  })

  if (!time) {
    throw new Error(`Time ${timeId} não encontrado.`)
  }

  await prisma.time.update({
    where: { timeId },
    data: { disponivelAssinatura: false }
  })

  const assinaturas = await prisma.assinatura.findMany({
    where: {
      timeId,
      status: "ATIVA",
      whatsapp: { not: "" }
    },
    select: {
      id: true
    }
  })

  let enfileiradas = 0
  let ignoradas = 0
  let erros = 0

  for (const assinatura of assinaturas) {
    try {
      const resultado = await enfileirarNotificacao({
        assinaturaId: assinatura.id,
        tipo: TIPO_TIME_INDISPONIVEL,
        referenciaId: String(timeId),
        dados: {
          nomeTime: time.nomePopular,
          linkConfiguracoes: LINK_CONFIGURACOES
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
        `❌ Erro ao enfileirar aviso de indisponibilidade para assinatura ${assinatura.id}:`,
        erro.message
      )
    }
  }

  console.log(
    `📢 Time ${time.nomePopular} indisponível: ${enfileiradas} avisos enfileirados, ${ignoradas} ignorados, ${erros} erros.`
  )

  return {
    timeId,
    disponivelAssinatura: false,
    assinaturasEncontradas: assinaturas.length,
    enfileiradas,
    ignoradas,
    erros
  }
}

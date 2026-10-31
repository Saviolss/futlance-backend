import { prisma } from "../../lib/prisma.js"
import { enfileirarNotificacao } from "./fila.notificacao.service.js"
import { TIPOS } from "./notificacao.service.js"

function normalizarNome(nome) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function timeParticipaDaPartida(time, partida) {
  const nomeTime = normalizarNome(time?.nomePopular)
  return Boolean(nomeTime) && (
    nomeTime === normalizarNome(partida.mandante_nome) ||
    nomeTime === normalizarNome(partida.visitante_nome)
  )
}

export async function enviarResultadoPartida(partida) {
  if (!partida?.partida_id) {
    throw new Error("Partida finalizada não informada.")
  }

  if (
    partida.placar_mandante == null ||
    partida.placar_visitante == null
  ) {
    throw new Error("Placar da partida não informado.")
  }

  if (
    !partida.mandante_nome?.trim() ||
    !partida.visitante_nome?.trim()
  ) {
    throw new Error("Os nomes dos times não foram informados.")
  }

  const referenciaId = String(partida.partida_id)

  const assinaturas = await prisma.assinatura.findMany({
    where: {
      status: "ATIVA",
      whatsapp: { not: "" },
      timeId: { not: null }
    },
    include: {
      time: {
        select: {
          timeId: true,
          nomePopular: true
        }
      }
    }
  })

  let enfileiradas = 0
  let ignoradas = 0
  let erros = 0

  for (const assinatura of assinaturas) {
    if (!timeParticipaDaPartida(assinatura.time, partida)) continue

    try {
      const resultado = await enfileirarNotificacao({
        assinaturaId: assinatura.id,
        tipo: TIPOS.RESULTADO_JOGO,
        referenciaId,
        dados: {
          mandante_nome: partida.mandante_nome,
          visitante_nome: partida.visitante_nome,
          placar_mandante: Number(partida.placar_mandante),
          placar_visitante: Number(partida.placar_visitante)
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
        `❌ Erro ao enfileirar resultado da partida ${referenciaId} para assinatura ${assinatura.id}:`,
        erro.message
      )
    }
  }

  console.log(
    `⚽ Resultado ${referenciaId}: ${enfileiradas} enfileiradas, ${ignoradas} ignoradas, ${erros} erros.`
  )

  return { enfileiradas, ignoradas, erros }
}

import { enfileirarNotificacao } from "./fila.notificacao.service.js"
import { TIPOS } from "./notificacao.service.js"
import { prisma } from "../../lib/prisma.js"
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

function jogoJaComecou(status) {
  return [
    "andamento",
    "intervalo",
    "disputa_penaltis",
    "disputa_penalti",
    "finalizado"
  ].includes(normalizarNome(status))
}

export async function enviarLembretesJogos() {
  const agora = new Date()
  const inicioJanela = new Date(agora.getTime() + 4 * 60 * 1000)
  const fimJanela = new Date(agora.getTime() + 6 * 60 * 1000)

  const partidas = await prisma.agenda.findMany({
    where: {
      data_iso: {
        gte: inicioJanela,
        lte: fimJanela
      }
    },
    orderBy: { data_iso: "asc" }
  })

  if (partidas.length === 0) {
    console.log("⏰ Lembretes: 0 enfileirados, 0 ignorados, 0 erros.")
    return { enfileiradas: 0, ignoradas: 0, erros: 0 }
  }

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

  for (const partida of partidas) {
    const referenciaId = String(partida.partida_id)

    try {
      const jogoAoVivo = await prisma.partidaAoVivo.findUnique({
        where: { partida_id: partida.partida_id },
        select: {
          estadio_nome: true,
          status: true
        }
      })

      if (jogoAoVivo && jogoJaComecou(jogoAoVivo.status)) {
        ignoradas++
        continue
      }

      for (const assinatura of assinaturas) {
        if (!timeParticipaDaPartida(assinatura.time, partida)) {
          continue
        }

        try {
          const resultado = await enfileirarNotificacao({
            assinaturaId: assinatura.id,
            tipo: TIPOS.JOGO_5_MINUTOS,
            referenciaId,
            dados: {
              campeonato: String(partida.campeonato || ""),
              mandante: String(partida.mandante_nome || ""),
              visitante: String(partida.visitante_nome || ""),
              horario: String(partida.hora || ""),
              estadio: String(jogoAoVivo?.estadio_nome || "")
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
            `❌ Erro ao enfileirar lembrete da partida ${referenciaId} para assinatura ${assinatura.id}:`,
            erro.message
          )
        }
      }
    } catch (erro) {
      erros++
      console.error(
        `❌ Erro ao consultar a partida ${referenciaId}:`,
        erro.message
      )
    }
  }

  console.log(
    `⏰ Lembretes: ${enfileiradas} enfileirados, ${ignoradas} ignorados, ${erros} erros.`
  )

  return { enfileiradas, ignoradas, erros }
}

import {
  enviarResultadoJogo,
  enviarLembreteJogo,
  enviarNoticiaWhatsApp
} from "../whatsapp/whatsapp.service.js"
import { STATUS } from "./fila.notificacao.service.js"
import { prisma } from "../../lib/prisma.js"

const LIMITE_LOTE = 20
const TEMPO_RESERVA_MINUTOS = 10
const INTERVALO_MAXIMO_MINUTOS = 60

const TIPOS = {
  RESULTADO_JOGO: "RESULTADO_JOGO",
  JOGO_5_MINUTOS: "JOGO_5_MINUTOS",
  NOTICIA_TIME: "NOTICIA_TIME"
}

class ErroPermanente extends Error {
  constructor(mensagem) {
    super(mensagem)
    this.name = "ErroPermanente"
  }
}

function textoObrigatorio(valor, campo) {
  if (typeof valor !== "string" || !valor.trim()) {
    throw new ErroPermanente(`${campo} não informado.`)
  }
  return valor.trim()
}

function numeroValido(valor, campo) {
  if (valor == null || !Number.isInteger(Number(valor)) || Number(valor) < 0) {
    throw new ErroPermanente(`${campo} inválido.`)
  }
  return Number(valor)
}

function calcularProximaTentativa(tentativas) {
  const minutos = Math.min(
    2 ** Math.max(0, tentativas - 1),
    INTERVALO_MAXIMO_MINUTOS
  )
  return new Date(Date.now() + minutos * 60 * 1000)
}

async function recuperarTarefasAbandonadas(tx) {
  const limiteReserva = new Date(
    Date.now() - TEMPO_RESERVA_MINUTOS * 60 * 1000
  )

  await tx.$executeRaw`
    UPDATE "FilaNotificacao"
    SET "status" = 'FALHA',
        "processandoEm" = NULL,
        "ultimoErro" = 'Reserva expirada e limite de tentativas atingido.',
        "atualizadoEm" = NOW()
    WHERE "status" = 'PROCESSANDO'
      AND "processandoEm" < ${limiteReserva}
      AND "tentativas" >= "maxTentativas"
  `
}

async function reservarTarefas(limite = LIMITE_LOTE) {
  return prisma.$transaction(async tx => {
    await recuperarTarefasAbandonadas(tx)

    const ids = await tx.$queryRaw`
      SELECT "id"
      FROM "FilaNotificacao"
      WHERE (
        "status" = 'PENDENTE'
        AND "tentarNovamenteEm" <= NOW()
        AND "tentativas" < "maxTentativas"
      ) OR (
        "status" = 'PROCESSANDO'
        AND "processandoEm" < NOW() - (${TEMPO_RESERVA_MINUTOS} * INTERVAL '1 minute')
        AND "tentativas" < "maxTentativas"
      )
      ORDER BY "tentarNovamenteEm" ASC, "criadoEm" ASC
      LIMIT ${limite}
      FOR UPDATE SKIP LOCKED
    `

    if (!ids.length) return []

    const idTarefas = ids.map(item => item.id)

    await tx.filaNotificacao.updateMany({
      where: { id: { in: idTarefas } },
      data: {
        status: STATUS.PROCESSANDO,
        processandoEm: new Date(),
        tentativas: { increment: 1 }
      }
    })

    return tx.filaNotificacao.findMany({
      where: { id: { in: idTarefas } },
      include: {
        assinatura: {
          select: {
            id: true,
            whatsapp: true,
            status: true
          }
        }
      }
    })
  })
}

async function marcarFalhaDefinitiva(tarefa, mensagem) {
  await prisma.filaNotificacao.updateMany({
    where: { id: tarefa.id, status: STATUS.PROCESSANDO },
    data: {
      status: STATUS.FALHA,
      processandoEm: null,
      ultimoErro: String(mensagem).slice(0, 4000)
    }
  })
}

async function reagendarTarefa(tarefa, mensagem) {
  if (tarefa.tentativas >= tarefa.maxTentativas) {
    await marcarFalhaDefinitiva(tarefa, mensagem)
    console.error(`❌ Fila ${tarefa.id}: limite de tentativas atingido.`)
    return "FALHA"
  }

  await prisma.filaNotificacao.updateMany({
    where: { id: tarefa.id, status: STATUS.PROCESSANDO },
    data: {
      status: STATUS.PENDENTE,
      tentarNovamenteEm: calcularProximaTentativa(tarefa.tentativas),
      processandoEm: null,
      ultimoErro: String(mensagem).slice(0, 4000)
    }
  })

  return "REAGENDADA"
}

async function registrarSucesso(tarefa) {
  await prisma.$transaction(async tx => {
    await tx.notificacaoEnviada.upsert({
      where: {
        assinaturaId_tipo_referenciaId: {
          assinaturaId: tarefa.assinaturaId,
          tipo: tarefa.tipo,
          referenciaId: tarefa.referenciaId
        }
      },
      create: {
        assinaturaId: tarefa.assinaturaId,
        tipo: tarefa.tipo,
        referenciaId: tarefa.referenciaId
      },
      update: {}
    })

    await tx.filaNotificacao.updateMany({
      where: { id: tarefa.id, status: STATUS.PROCESSANDO },
      data: {
        status: STATUS.ENVIADA,
        enviadaEm: new Date(),
        processandoEm: null,
        ultimoErro: null
      }
    })
  })
}

async function verificarHistorico(tarefa) {
  const historico = await prisma.notificacaoEnviada.findUnique({
    where: {
      assinaturaId_tipo_referenciaId: {
        assinaturaId: tarefa.assinaturaId,
        tipo: tarefa.tipo,
        referenciaId: tarefa.referenciaId
      }
    }
  })

  if (!historico) return false

  await prisma.filaNotificacao.updateMany({
    where: { id: tarefa.id, status: STATUS.PROCESSANDO },
    data: {
      status: STATUS.ENVIADA,
      enviadaEm: historico.enviadaEm,
      processandoEm: null,
      ultimoErro: null
    }
  })

  return true
}

async function enviarResultado(tarefa) {
  const dados = tarefa.dados

  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    throw new ErroPermanente("Dados do resultado ausentes.")
  }

  await enviarResultadoJogo({
    numero: tarefa.assinatura.whatsapp,
    mandante: textoObrigatorio(dados.mandante_nome, "Time mandante"),
    golsMandante: numeroValido(dados.placar_mandante, "Placar mandante"),
    visitante: textoObrigatorio(dados.visitante_nome, "Time visitante"),
    golsVisitante: numeroValido(dados.placar_visitante, "Placar visitante")
  })
}

async function enviarLembrete(tarefa) {
  const dados = tarefa.dados

  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    throw new ErroPermanente("Dados do lembrete ausentes.")
  }

  await enviarLembreteJogo({
    numero: tarefa.assinatura.whatsapp,
    campeonato: textoObrigatorio(dados.campeonato, "Campeonato"),
    mandante: textoObrigatorio(dados.mandante, "Time mandante"),
    visitante: textoObrigatorio(dados.visitante, "Time visitante"),
    horario: textoObrigatorio(dados.horario, "Horário"),
    estadio: typeof dados.estadio === "string" ? dados.estadio : ""
  })
}

async function enviarNoticia(tarefa) {
  const dados = tarefa.dados

  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    throw new ErroPermanente("Dados da notícia ausentes.")
  }

  await enviarNoticiaWhatsApp({
    numero: tarefa.assinatura.whatsapp,
    nomeTime: textoObrigatorio(dados.nomeTime, "Nome do time"),
    titulo: textoObrigatorio(dados.titulo, "Título da notícia"),
    descricao: typeof dados.descricao === "string" ? dados.descricao : "",
    imagem: textoObrigatorio(dados.imagem, "Imagem da notícia"),
    url: textoObrigatorio(dados.url, "Link da notícia")
  })
}

async function processarTarefa(tarefa) {
  try {
    if (await verificarHistorico(tarefa)) return "JA_REGISTRADA"

    if (tarefa.assinatura?.status !== "ATIVA" || !tarefa.assinatura.whatsapp) {
      throw new ErroPermanente("Assinatura inativa ou sem WhatsApp.")
    }

    switch (tarefa.tipo) {
      case TIPOS.RESULTADO_JOGO:
        await enviarResultado(tarefa)
        break
      case TIPOS.JOGO_5_MINUTOS:
        await enviarLembrete(tarefa)
        break
      case TIPOS.NOTICIA_TIME:
        await enviarNoticia(tarefa)
        break
      default:
        throw new ErroPermanente(`Tipo de notificação não suportado: ${tarefa.tipo}`)
    }

    await registrarSucesso(tarefa)
    return "ENVIADA"
  } catch (erro) {
    const mensagem = erro?.message || "Erro desconhecido no envio."

    if (erro instanceof ErroPermanente) {
      await marcarFalhaDefinitiva(tarefa, mensagem)
      console.error(`❌ Fila ${tarefa.id}: falha definitiva.`, mensagem)
      return "FALHA"
    }

    return reagendarTarefa(tarefa, mensagem)
  }
}

export async function processarFilaNotificacoes() {
  const tarefas = await reservarTarefas()
  const total = {
    processadas: 0,
    enviadas: 0,
    reagendadas: 0,
    falhas: 0,
    jaRegistradas: 0
  }

  for (const tarefa of tarefas) {
    total.processadas++

    try {
      const resultado = await processarTarefa(tarefa)

      if (resultado === "ENVIADA") total.enviadas++
      else if (resultado === "REAGENDADA") total.reagendadas++
      else if (resultado === "FALHA") total.falhas++
      else if (resultado === "JA_REGISTRADA") total.jaRegistradas++
    } catch (erro) {
      total.falhas++
      console.error(`❌ Erro inesperado na fila ${tarefa.id}:`, erro.message)
    }
  }

  if (total.processadas) console.log("📬 Processamento da fila:", total)
  return total
}

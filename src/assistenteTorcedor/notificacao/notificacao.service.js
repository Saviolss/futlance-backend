import { prisma } from "../../lib/prisma.js"
const TIPOS = {
  JOGO_5_MINUTOS: "JOGO_5_MINUTOS",
  RESULTADO_JOGO: "RESULTADO_JOGO",
  NOTICIA_TIME: "NOTICIA_TIME"
}

function inicioDoDiaBrasilia(data = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(data)

  const valores = Object.fromEntries(partes.map(parte => [parte.type, parte.value]))
  const dataBrasilia = `${valores.year}-${valores.month}-${valores.day}T00:00:00-03:00`
  return new Date(dataBrasilia)
}

export async function notificacaoJaEnviada({ assinaturaId, tipo, referenciaId }) {
  if (!assinaturaId || !tipo) {
    throw new Error("Assinatura e tipo da notificação são obrigatórios.")
  }

  const notificacao = await prisma.notificacaoEnviada.findFirst({
    where: {
      assinaturaId,
      tipo,
      ...(referenciaId != null ? { referenciaId } : {})
    },
    select: { id: true }
  })

  return Boolean(notificacao)
}

export async function registrarNotificacao({ assinaturaId, tipo, referenciaId = null }) {
  if (!assinaturaId || !tipo) {
    throw new Error("Assinatura e tipo da notificação são obrigatórios.")
  }

  try {
    return await prisma.notificacaoEnviada.create({
      data: { assinaturaId, tipo, referenciaId }
    })
  } catch (erro) {
    if (erro?.code === "P2002") return null
    throw erro
  }
}


export async function contarNoticiasEnviadasHoje(assinaturaId) {
  if (!assinaturaId) {
    throw new Error("ID da assinatura não informado.")
  }

  return prisma.notificacaoEnviada.count({
    where: {
      assinaturaId,
      tipo: TIPOS.NOTICIA_TIME,
      enviadaEm: { gte: inicioDoDiaBrasilia() }
    }
  })
}

export async function podeEnviarNoticia(assinaturaId) {
  if (!assinaturaId) {
    throw new Error("ID da assinatura não informado.")
  }

  const inicioHoje = inicioDoDiaBrasilia()

  const [enviadas, naFila] = await Promise.all([
    prisma.notificacaoEnviada.count({
      where: {
        assinaturaId,
        tipo: TIPOS.NOTICIA_TIME,
        enviadaEm: { gte: inicioHoje }
      }
    }),
    prisma.filaNotificacao.count({
      where: {
        assinaturaId,
        tipo: TIPOS.NOTICIA_TIME,
        criadoEm: { gte: inicioHoje },
        status: { in: ["PENDENTE", "PROCESSANDO", "ENVIADA"] }
      }
    })
  ])

  return enviadas + naFila < 1
}


export async function buscarAssinaturasAtivasParaNotificacao() {
  return prisma.assinatura.findMany({
    where: {
      status: "ATIVA",
      whatsapp: { not: "" },
      timeId: { not: null }
    },
    include: {
      usuario: {
        select: { id: true, nome: true, email: true }
      },
      time: true
    }
  })
}

export { TIPOS }
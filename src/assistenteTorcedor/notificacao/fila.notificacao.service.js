import { prisma } from "../../lib/prisma.js"
const STATUS = {
  PENDENTE: "PENDENTE",
  PROCESSANDO: "PROCESSANDO",
  ENVIADA: "ENVIADA",
  FALHA: "FALHA"
}

const MAX_TENTATIVAS_PADRAO = 5

export async function enfileirarNotificacao({
  assinaturaId,
  tipo,
  referenciaId,
  dados,
  maxTentativas = MAX_TENTATIVAS_PADRAO
}) {
  if (!assinaturaId || !tipo || referenciaId == null) {
    throw new Error("Assinatura, tipo e referência são obrigatórios.")
  }

  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    throw new Error("Os dados da notificação são inválidos.")
  }

  if (!Number.isInteger(maxTentativas) || maxTentativas < 1) {
    throw new Error("O número máximo de tentativas deve ser positivo.")
  }

  const assinatura = await prisma.assinatura.findFirst({
    where: {
      id: assinaturaId,
      status: "ATIVA",
      whatsapp: { not: "" }
    },
    select: { id: true }
  })

  if (!assinatura) {
    return { criada: false, motivo: "ASSINATURA_INATIVA" }
  }

  try {
    const tarefa = await prisma.filaNotificacao.create({
      data: {
        assinaturaId,
        tipo,
        referenciaId: String(referenciaId),
        dados,
        maxTentativas,
        status: STATUS.PENDENTE
      }
    })

    return { criada: true, tarefa }
  } catch (erro) {
    if (erro?.code === "P2002") {
      return { criada: false, motivo: "JA_EXISTE" }
    }

    throw erro
  }
}

export async function buscarTarefasPendentes(limite = 20) {
  if (!Number.isInteger(limite) || limite < 1 || limite > 100) {
    throw new Error("O limite deve ser um número entre 1 e 100.")
  }

  return prisma.filaNotificacao.findMany({
    where: {
      status: STATUS.PENDENTE,
      tentarNovamenteEm: { lte: new Date() }
    },
    orderBy: [
      { tentarNovamenteEm: "asc" },
      { criadoEm: "asc" }
    ],
    take: limite
  }).then(tarefas => tarefas.filter(
    tarefa => tarefa.tentativas < tarefa.maxTentativas
  ))
}

export { STATUS }
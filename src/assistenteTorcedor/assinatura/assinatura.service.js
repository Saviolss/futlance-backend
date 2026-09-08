import { PrismaClient } from "@prisma/client"
import { criarCheckoutStripe } from "../pagamento/stripe.service.js"

const prisma = new PrismaClient()

const IDIOMAS_PERMITIDOS = ["pt", "es", "en", "it", "fr", "de"]
const PAGAMENTOS_PERMITIDOS = ["cartao", "pix"]

function erro(mensagem, codigo) {
  const error = new Error(mensagem)
  error.codigo = codigo
  return error
}

function normalizarIdioma(idioma) {
  if (typeof idioma !== "string") {
    return "pt"
  }

  const idiomaNormalizado = idioma
    .split("-")[0]
    .toLowerCase()
    .trim()

  if (!IDIOMAS_PERMITIDOS.includes(idiomaNormalizado)) {
    throw erro("Idioma não permitido.", "IDIOMA_INVALIDO")
  }

  return idiomaNormalizado
}

function normalizarTelefone(telefone) {
  if (typeof telefone !== "string") {
    throw erro("Número de WhatsApp inválido.", "WHATSAPP_INVALIDO")
  }

  const numeros = telefone.replace(/\D/g, "")

  if (numeros.length < 10 || numeros.length > 15) {
    throw erro(
      "Digite um número de WhatsApp válido com DDD e código do país.",
      "WHATSAPP_INVALIDO"
    )
  }

  return numeros
}

function normalizarPagamento(pagamento) {
  if (typeof pagamento !== "string") {
    throw erro(
      "Forma de pagamento não informada.",
      "PAGAMENTO_INVALIDO"
    )
  }

  const pagamentoNormalizado = pagamento
    .toLowerCase()
    .trim()

  if (!PAGAMENTOS_PERMITIDOS.includes(pagamentoNormalizado)) {
    throw erro(
      "Forma de pagamento inválida.",
      "PAGAMENTO_INVALIDO"
    )
  }

  return pagamentoNormalizado
}

function obterPlano(pagamento) {
  if (pagamento === "pix") {
    return "ANUAL"
  }

  if (pagamento === "cartao") {
    return "MENSAL"
  }

  throw erro(
    "Não foi possível definir o plano.",
    "PLANO_INVALIDO"
  )
}

export async function criarAssinatura({
  usuarioId,
  telefone,
  idioma,
  pagamento,
  time
}) {
  if (
    typeof usuarioId !== "string" ||
    !usuarioId.trim()
  ) {
    throw erro(
      "Usuário não autenticado.",
      "USUARIO_NAO_AUTENTICADO"
    )
  }

  const telefoneNormalizado =
    normalizarTelefone(telefone)

  const idiomaNormalizado =
    normalizarIdioma(idioma)

  const pagamentoNormalizado =
    normalizarPagamento(pagamento)

  if (!time || typeof time !== "object") {
    throw erro(
      "Time não informado.",
      "TIME_NAO_INFORMADO"
    )
  }

  const timeId = Number(time.id)

  if (!Number.isInteger(timeId) || timeId <= 0) {
    throw erro(
      "Time inválido.",
      "TIME_INVALIDO"
    )
  }

  const usuario = await prisma.usuario.findUnique({
    where: {
      id: usuarioId
    },
    select: {
      id: true,
      nome: true,
      email: true,
      ativo: true,
      timeId: true
    }
  })

  if (!usuario) {
    throw erro(
      "Usuário não encontrado.",
      "USUARIO_NAO_ENCONTRADO"
    )
  }

  if (!usuario.ativo) {
    throw erro(
      "Usuário bloqueado.",
      "USUARIO_BLOQUEADO"
    )
  }

  const timeExistente = await prisma.time.findUnique({
    where: {
      timeId
    },
    select: {
      timeId: true,
      nomePopular: true,
      nome: true,
      escudo: true,
      slug: true
    }
  })

  if (!timeExistente) {
    throw erro(
      "Time não encontrado.",
      "TIME_NAO_ENCONTRADO"
    )
  }

  const assinaturaAtiva =
    await prisma.assinatura.findFirst({
      where: {
        usuarioId: usuario.id,
        status: {
          in: ["ATIVA", "PENDENTE"]
        }
      },
      select: {
        id: true,
        status: true,
        plano: true,
        formaPagamento: true
      }
    })

  if (assinaturaAtiva) {
    throw erro(
      assinaturaAtiva.status === "ATIVA"
        ? "Você já possui uma assinatura ativa."
        : "Você já possui uma assinatura aguardando pagamento.",
      assinaturaAtiva.status === "ATIVA"
        ? "ASSINATURA_ATIVA"
        : "ASSINATURA_PENDENTE"
    )
  }

  const plano = obterPlano(
    pagamentoNormalizado
  )

  const resultado = await prisma.$transaction(
    async (tx) => {
      const usuarioAtualizado =
        await tx.usuario.update({
          where: {
            id: usuario.id
          },
          data: {
            whatsapp: telefoneNormalizado,
            idioma: idiomaNormalizado,
            timeId
          },
          select: {
            id: true,
            nome: true,
            email: true,
            idioma: true,
            whatsapp: true,
            timeId: true
          }
        })

      const assinatura =
        await tx.assinatura.create({
          data: {
            usuarioId: usuario.id,
            timeId,
            whatsapp: telefoneNormalizado,
            idioma: idiomaNormalizado,
            formaPagamento:
              pagamentoNormalizado,
            plano,
            status: "PENDENTE"
          },
          select: {
            id: true,
            usuarioId: true,
            timeId: true,
            whatsapp: true,
            idioma: true,
            formaPagamento: true,
            plano: true,
            status: true,
            inicioEm: true,
            fimEm: true,
            criadoEm: true
          }
        })

      return {
        usuario: usuarioAtualizado,
        assinatura
      }
    }
  )

  let checkoutStripe = null

  if (pagamentoNormalizado === "cartao") {
    try {
      checkoutStripe =
        await criarCheckoutStripe({
          assinaturaId:
            resultado.assinatura.id,
          usuarioId: usuario.id,
          email: usuario.email,
          timeId
        })
    } catch (error) {
      await prisma.assinatura.delete({
        where: {
          id: resultado.assinatura.id
        }
      })

      throw erro(
        "Não foi possível iniciar o pagamento com cartão. Tente novamente.",
        "ERRO_STRIPE"
      )
    }
  }

  return {
    sucesso: true,
    mensagem:
      pagamentoNormalizado === "cartao"
        ? "Assinatura criada. Redirecionando para o pagamento."
        : "Assinatura criada e aguardando pagamento.",
    usuario: resultado.usuario,
    assinatura: resultado.assinatura,
    checkoutUrl:
      checkoutStripe?.checkoutUrl || null,
    stripeSessionId:
      checkoutStripe?.sessionId || null,
    time: {
      id: timeExistente.timeId,
      nome:
        timeExistente.nomePopular ||
        timeExistente.nome ||
        time.nome ||
        "",
      escudo:
        timeExistente.escudo ||
        time.escudo ||
        null,
      slug:
        timeExistente.slug ||
        time.slug ||
        ""
    }
  }
}
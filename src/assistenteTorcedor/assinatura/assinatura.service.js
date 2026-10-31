
import { criarCheckoutStripe, cancelarAssinaturaStripe } from "../pagamento/stripe.service.js"
import { prisma } from "../../lib/prisma.js"

const IDIOMAS_PERMITIDOS = ["pt", "es", "en", "it", "fr", "de"]
const PAGAMENTOS_PERMITIDOS = ["cartao", "pix"]

function erro(mensagem, codigo) {
  const error = new Error(mensagem)
  error.codigo = codigo
  return error
}

function normalizarIdioma(idioma) {
  if (typeof idioma !== "string") return "pt"
  const normalizado = idioma.split("-")[0].toLowerCase().trim()
  if (!IDIOMAS_PERMITIDOS.includes(normalizado)) throw erro("Idioma não permitido.", "IDIOMA_INVALIDO")
  return normalizado
}

function normalizarTelefone(telefone) {
  if (typeof telefone !== "string") throw erro("Número de WhatsApp inválido.", "WHATSAPP_INVALIDO")
  const numeros = telefone.replace(/\D/g, "")
  if (numeros.length < 10 || numeros.length > 15) throw erro("Digite um número de WhatsApp válido com DDD e código do país.", "WHATSAPP_INVALIDO")
  return numeros
}

function normalizarPagamento(pagamento) {
  if (typeof pagamento !== "string") throw erro("Forma de pagamento não informada.", "PAGAMENTO_INVALIDO")
  const normalizado = pagamento.toLowerCase().trim()
  if (!PAGAMENTOS_PERMITIDOS.includes(normalizado)) throw erro("Forma de pagamento inválida.", "PAGAMENTO_INVALIDO")
  return normalizado
}

function obterPlano(pagamento) {
  return pagamento === "pix" ? "ANUAL" : "MENSAL"
}

export async function criarAssinatura({ usuarioId, telefone, idioma, pagamento, time }) {
  if (!usuarioId || typeof usuarioId !== "string") throw erro("Usuário não autenticado.", "USUARIO_NAO_AUTENTICADO")

  const whatsapp = normalizarTelefone(telefone)
  const idiomaNormalizado = normalizarIdioma(idioma)
  const formaPagamento = normalizarPagamento(pagamento)

  if (!time || !Number.isInteger(Number(time.id)) || Number(time.id) <= 0) throw erro("Time inválido.", "TIME_INVALIDO")

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, email: true, ativo: true }
  })

  if (!usuario) throw erro("Usuário não encontrado.", "USUARIO_NAO_ENCONTRADO")
  if (!usuario.ativo) throw erro("Usuário bloqueado.", "USUARIO_BLOQUEADO")
  if (!usuario.email) throw erro("O usuário não possui e-mail cadastrado.", "EMAIL_INVALIDO")

  const timeBanco = await prisma.time.findUnique({
    where: { timeId: Number(time.id) },
    select: { timeId: true, nomePopular: true, nome: true, escudo: true, slug: true }
  })

  if (!timeBanco) throw erro("Time não encontrado.", "TIME_INVALIDO")

  const existente = await prisma.assinatura.findFirst({
    where: { usuarioId, status: { in: ["ATIVA", "PENDENTE"] } },
    select: { id: true, status: true }
  })

  if (existente?.status === "ATIVA") throw erro("Você já possui uma assinatura ativa.", "ASSINATURA_ATIVA")
  if (existente?.status === "PENDENTE") throw erro("Você já possui uma assinatura aguardando pagamento. Retome o pagamento existente ou encerre essa tentativa antes de criar outra.", "ASSINATURA_PENDENTE")

  const plano = obterPlano(formaPagamento)

  const assinatura = await prisma.$transaction(async tx => {
    await tx.usuario.update({
      where: { id: usuarioId },
      data: { whatsapp, idioma: idiomaNormalizado, timeId: timeBanco.timeId }
    })

    return tx.assinatura.create({
      data: {
        usuarioId,
        timeId: timeBanco.timeId,
        whatsapp,
        idioma: idiomaNormalizado,
        formaPagamento,
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
        criadoEm: true
      }
    })
  })

  try {
    const checkout = await criarCheckoutStripe({
      assinaturaId: assinatura.id,
      usuarioId: usuario.id,
      email: usuario.email,
      timeId: timeBanco.timeId,
      pagamento: formaPagamento
    })

    return {
      sucesso: true,
      mensagem: formaPagamento === "pix"
        ? "Cobrança Pix criada. A assinatura será ativada após a confirmação do pagamento."
        : "Checkout criado. A assinatura será ativada após a confirmação do pagamento.",
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
      assinatura,
      clientSecret: checkout.clientSecret || null,
      sessionId: checkout.sessionId || null,
      paymentIntentId: checkout.paymentIntentId || null,
      pix: checkout.pix || null,
      statusPagamento: checkout.statusPagamento || null,
      pagamento: formaPagamento,
      plano,
      time: {
        id: timeBanco.timeId,
        nome: timeBanco.nomePopular || timeBanco.nome || "",
        escudo: timeBanco.escudo || null,
        slug: timeBanco.slug || ""
      }
    }
  } catch (error) {
    console.error("Erro ao criar pagamento Stripe:", error)
    await prisma.assinatura.deleteMany({
      where: { id: assinatura.id, status: "PENDENTE" }
    })
    throw erro(error?.message || "Não foi possível iniciar o pagamento. Tente novamente.", "ERRO_STRIPE")
  }
}

export async function listarAssinaturas(usuarioId) {
  if (!usuarioId) throw erro("Usuário não autenticado.", "USUARIO_NAO_AUTENTICADO")

  return prisma.assinatura.findMany({
    where: { usuarioId },
    orderBy: { criadoEm: "desc" },
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
      stripeSubscriptionId: true,
      canceladaEm: true,
      criadoEm: true,
      atualizadoEm: true,
      time: {
        select: { timeId: true, nomePopular: true, nome: true, escudo: true, slug: true }
      }
    }
  })
}

export async function cancelarAssinatura(usuarioId, assinaturaId) {
  if (!usuarioId) throw erro("Usuário não autenticado.", "USUARIO_NAO_AUTENTICADO")
  if (!assinaturaId) throw erro("ID da assinatura não informado.", "ASSINATURA_INVALIDA")

  const assinatura = await prisma.assinatura.findUnique({
    where: { id: assinaturaId },
    select: {
      id: true,
      usuarioId: true,
      formaPagamento: true,
      status: true,
      stripeSubscriptionId: true,
      canceladaEm: true
    }
  })

  if (!assinatura) throw erro("Assinatura não encontrada.", "ASSINATURA_NAO_ENCONTRADA")
  if (assinatura.usuarioId !== usuarioId) throw erro("Essa assinatura não pertence ao usuário.", "ACESSO_NEGADO")
  if (assinatura.formaPagamento !== "cartao") throw erro("O plano anual pago por Pix não possui renovação automática.", "CANCELAMENTO_NAO_APLICAVEL")
  if (assinatura.status !== "ATIVA") throw erro("A assinatura não está ativa.", "ASSINATURA_NAO_ATIVA")
  if (!assinatura.stripeSubscriptionId) throw erro("Assinatura Stripe não encontrada.", "STRIPE_SUBSCRIPTION_NAO_ENCONTRADA")

  const subscription = await cancelarAssinaturaStripe(assinatura.stripeSubscriptionId)

  return {
    sucesso: true,
    mensagem: "A renovação automática foi programada para ser cancelada ao fim do período atual.",
    assinaturaId: assinatura.id,
    cancelamentoNoFimDoPeriodo: subscription.cancel_at_period_end
  }
}

import Stripe from "stripe"
import { prisma } from "../../lib/prisma.js"

const stripe = new Stripe(process.env.STRIPE_KEY)

import {
  criarAssinatura,
  listarAssinaturas,
  cancelarAssinatura
} from "./assinatura.service.js"

export async function criarAssinaturaController(req, res) {
  try {
    const usuarioId = req.usuario?.id || req.usuarioId

    if (!usuarioId) {
      return res.status(401).json({
        sucesso: false,
        codigo: "USUARIO_NAO_AUTENTICADO",
        mensagem: "Usuário não autenticado."
      })
    }

    const {
      telefone,
      idioma,
      pagamento,
      time
    } = req.body

    const resultado = await criarAssinatura({
      usuarioId,
      telefone,
      idioma,
      pagamento,
      time
    })

    return res.status(201).json(resultado)
  } catch (error) {
    console.error(
      "Erro ao criar assinatura:",
      error
    )

    const errosConhecidos = {
      USUARIO_NAO_AUTENTICADO: 401,
      USUARIO_NAO_ENCONTRADO: 404,
      USUARIO_BLOQUEADO: 403,
      WHATSAPP_INVALIDO: 400,
      IDIOMA_INVALIDO: 400,
      PAGAMENTO_INVALIDO: 400,
      PLANO_INVALIDO: 400,
      TIME_NAO_INFORMADO: 400,
      TIME_INVALIDO: 400,
      TIME_NAO_ENCONTRADO: 404,
      ASSINATURA_ATIVA: 409,
      ASSINATURA_PENDENTE: 409,
      ERRO_STRIPE: 502
    }

    const status =
      errosConhecidos[error.codigo] || 500

    return res.status(status).json({
      sucesso: false,
      codigo: error.codigo || "ERRO_INTERNO",
      mensagem:
        error.message ||
        "Não foi possível criar a assinatura."
    })
  }
}

export async function listarAssinaturasController(req, res) {
  try {
    const usuarioId = req.usuario?.id || req.usuarioId

    if (!usuarioId) {
      return res.status(401).json({
        sucesso: false,
        codigo: "USUARIO_NAO_AUTENTICADO",
        mensagem: "Usuário não autenticado."
      })
    }

    const assinaturas =
      await listarAssinaturas(usuarioId)

    return res.status(200).json({
      sucesso: true,
      assinaturas
    })
  } catch (error) {
    console.error(
      "Erro ao listar assinaturas:",
      error
    )

    const errosConhecidos = {
      USUARIO_NAO_AUTENTICADO: 401,
      USUARIO_NAO_ENCONTRADO: 404,
      USUARIO_BLOQUEADO: 403
    }

    const status =
      errosConhecidos[error.codigo] || 500

    return res.status(status).json({
      sucesso: false,
      codigo: error.codigo || "ERRO_INTERNO",
      mensagem:
        error.message ||
        "Não foi possível carregar suas assinaturas."
    })
  }
}

export async function cancelarAssinaturaController(req, res) {
  try {
    const usuarioId = req.usuario?.id || req.usuarioId
    const { id } = req.params

    if (!usuarioId) {
      return res.status(401).json({
        sucesso: false,
        codigo: "USUARIO_NAO_AUTENTICADO",
        mensagem: "Usuário não autenticado."
      })
    }

    if (!id) {
      return res.status(400).json({
        sucesso: false,
        codigo: "ASSINATURA_INVALIDA",
        mensagem: "Assinatura não informada."
      })
    }

    const resultado =
      await cancelarAssinatura(
        usuarioId,
        id
      )

    return res.status(200).json(resultado)
  } catch (error) {
    console.error(
      "Erro ao cancelar assinatura:",
      error
    )

    const errosConhecidos = {
      USUARIO_NAO_AUTENTICADO: 401,
      USUARIO_NAO_ENCONTRADO: 404,
      USUARIO_BLOQUEADO: 403,
      ASSINATURA_INVALIDA: 400,
      ASSINATURA_NAO_ENCONTRADA: 404,
      ASSINATURA_NAO_ATIVA: 409,
      CANCELAMENTO_NAO_APLICAVEL: 400,
      STRIPE_ASSINATURA_NAO_VINCULADA: 409,
      ASSINATURA_JA_CANCELADA: 409,
      STRIPE_NAO_CONFIGURADO: 500,
      ERRO_STRIPE_CANCELAMENTO: 502
    }

    const status =
      errosConhecidos[error.codigo] || 500

    return res.status(status).json({
      sucesso: false,
      codigo: error.codigo || "ERRO_INTERNO",
      mensagem:
        error.message ||
        "Não foi possível cancelar a assinatura."
    })
  }
}

export async function consultarRetornoPagamentoController(req, res) {
  try {
    const usuarioId = req.usuario?.id || req.usuarioId
    const sessionId = req.query.session_id
    const paymentIntentId = req.query.payment_intent || req.query.payment_intent_id
    if (!usuarioId) return res.status(401).json({ sucesso: false, codigo: "USUARIO_NAO_AUTENTICADO", mensagem: "Faça login para consultar o pagamento." })
    const temSessionValida = typeof sessionId === "string" && sessionId.startsWith("cs_")
    const temPaymentIntentValido = typeof paymentIntentId === "string" && paymentIntentId.startsWith("pi_")
    if (temSessionValida === temPaymentIntentValido) return res.status(400).json({ sucesso: false, codigo: "PAGAMENTO_INVALIDO", mensagem: "Identificador de pagamento inválido." })
    if (!process.env.STRIPE_KEY) return res.status(500).json({ sucesso: false, codigo: "STRIPE_NAO_CONFIGURADO", mensagem: "O pagamento não pode ser consultado agora." })

    const session = temSessionValida
      ? await stripe.checkout.sessions.retrieve(sessionId)
      : null
    const paymentIntent = temPaymentIntentValido
      ? await stripe.paymentIntents.retrieve(paymentIntentId)
      : null
    const pagamentoStripe = session || paymentIntent
    const assinaturaId = pagamentoStripe.metadata?.assinaturaId
    if (!assinaturaId || pagamentoStripe.metadata?.usuarioId !== usuarioId) {
      return res.status(404).json({ sucesso: false, codigo: "ASSINATURA_NAO_ENCONTRADA", mensagem: "Não foi possível localizar essa assinatura." })
    }

    let assinatura = await prisma.assinatura.findFirst({
      where: { id: assinaturaId, usuarioId },
      select: { id: true, status: true, formaPagamento: true, plano: true, fimEm: true }
    })
    if (!assinatura) return res.status(404).json({ sucesso: false, codigo: "ASSINATURA_NAO_ENCONTRADA", mensagem: "Pagamento não encontrado para este usuário." })

    if (
      paymentIntent &&
      (
        assinatura.formaPagamento !== "pix" ||
        assinatura.plano !== "ANUAL" ||
        pagamentoStripe.metadata?.formaPagamento !== "pix" ||
        pagamentoStripe.metadata?.plano !== "ANUAL"
      )
    ) {
      return res.status(404).json({ sucesso: false, codigo: "ASSINATURA_NAO_ENCONTRADA", mensagem: "Não foi possível localizar essa assinatura." })
    }

    if (session?.status === "expired") {
      await prisma.assinatura.updateMany({
        where: { id: assinatura.id, usuarioId, status: "PENDENTE" },
        data: { status: "CANCELADA", canceladaEm: new Date() }
      })
      return res.status(200).json({ sucesso: true, estado: "erro", mensagem: "O checkout expirou. Volte ao Futlance para iniciar uma nova tentativa." })
    }

    if (paymentIntent?.status === "succeeded") {
      if (paymentIntent.amount_received !== 4788 || paymentIntent.currency !== "brl") {
        return res.status(200).json({ sucesso: true, estado: "erro", mensagem: "O pagamento recebido não corresponde ao valor esperado. Entre em contato com o suporte." })
      }

      if (assinatura.status === "PENDENTE") {
        const inicioEm = new Date()
        const fimEm = new Date(inicioEm)
        fimEm.setFullYear(fimEm.getFullYear() + 1)

        await prisma.assinatura.updateMany({
          where: { id: assinatura.id, usuarioId, status: "PENDENTE", formaPagamento: "pix", plano: "ANUAL" },
          data: { status: "ATIVA", inicioEm, fimEm }
        })

        assinatura = await prisma.assinatura.findFirst({
          where: { id: assinaturaId, usuarioId },
          select: { id: true, status: true, formaPagamento: true, plano: true, fimEm: true }
        })
      }
    }

    const subscriptionId = session
      ? typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id
      : null

    if (
      session &&
      assinatura.formaPagamento === "cartao" &&
      assinatura.status === "PENDENTE" &&
      session.status === "complete" &&
      ["paid", "no_payment_required"].includes(session.payment_status) &&
      subscriptionId
    ) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)

      if (
        subscription.metadata?.assinaturaId === assinatura.id &&
        subscription.metadata?.usuarioId === usuarioId &&
        ["active", "trialing"].includes(subscription.status)
      ) {
        const inicioEm = subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : new Date()
        const fimEm = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null

        await prisma.assinatura.updateMany({
          where: {
            id: assinatura.id,
            usuarioId,
            formaPagamento: "cartao",
            status: "PENDENTE"
          },
          data: {
            status: "ATIVA",
            inicioEm,
            fimEm,
            stripeSubscriptionId: subscription.id
          }
        })

        assinatura = await prisma.assinatura.findFirst({
          where: { id: assinaturaId, usuarioId },
          select: { id: true, status: true, formaPagamento: true, plano: true, fimEm: true }
        })
      }
    }

    if (assinatura.status === "ATIVA") {
      return res.status(200).json({ sucesso: true, estado: "sucesso", mensagem: "Pagamento confirmado! Sua assinatura está ativa.", assinatura: { id: assinatura.id, status: assinatura.status, plano: assinatura.plano, fimEm: assinatura.fimEm } })
    }

    if (
      (session?.status === "complete" && session.payment_status === "unpaid") ||
      ["processing", "requires_action"].includes(paymentIntent?.status)
    ) {
      return res.status(200).json({ sucesso: true, estado: "pendente", mensagem: "Seu pagamento está sendo confirmado. Aguarde um instante." })
    }

    if (["canceled", "requires_payment_method"].includes(paymentIntent?.status)) {
      return res.status(200).json({ sucesso: true, estado: "erro", mensagem: "O pagamento não foi concluído. Volte ao Futlance para iniciar uma nova tentativa." })
    }

    return res.status(200).json({ sucesso: true, estado: "pendente", mensagem: "Estamos aguardando a confirmação do pagamento. Isso pode levar alguns instantes." })
  } catch (error) {
    console.error("Erro ao consultar retorno do pagamento:", error.message)
    return res.status(502).json({ sucesso: false, codigo: "ERRO_CONSULTA_PAGAMENTO", mensagem: "Não foi possível verificar o pagamento agora. Tente novamente." })
  }
}

import Stripe from "stripe"
import { prisma } from "../../lib/prisma.js"

const stripe = new Stripe(process.env.STRIPE_KEY)

function obterDataStripe(timestamp) {
  return timestamp ? new Date(timestamp * 1000) : null
}

async function ativarAssinaturaCartao(subscription) {
  const assinaturaId = subscription.metadata?.assinaturaId
  if (!assinaturaId) {
    console.error("Webhook Stripe: assinaturaId ausente nos metadados da assinatura.")
    return
  }

  const assinatura = await prisma.assinatura.findUnique({
    where: { id: assinaturaId },
    select: { id: true, formaPagamento: true, status: true }
  })

  if (!assinatura) {
    console.error("Webhook Stripe: assinatura Futlance não encontrada:", assinaturaId)
    return
  }

  if (assinatura.formaPagamento !== "cartao") {
    console.error("Webhook Stripe: forma de pagamento incompatível:", assinaturaId)
    return
  }

  const inicioEm = obterDataStripe(subscription.current_period_start) || new Date()
  const fimEm = obterDataStripe(subscription.current_period_end)

  await prisma.assinatura.update({
    where: { id: assinaturaId },
    data: {
      status: "ATIVA",
      inicioEm,
      fimEm,
      stripeSubscriptionId: subscription.id
    }
  })
}

async function atualizarAssinaturaPorSubscription(subscription) {
  const assinaturaId = subscription.metadata?.assinaturaId
  if (!assinaturaId) return

  const assinatura = await prisma.assinatura.findUnique({
    where: { id: assinaturaId },
    select: { id: true, formaPagamento: true }
  })

  if (!assinatura || assinatura.formaPagamento !== "cartao") return

  const statusStripe = subscription.status
  let status

  if (["active", "trialing"].includes(statusStripe)) status = "ATIVA"
  else if (["past_due", "unpaid", "incomplete"].includes(statusStripe)) status = "PENDENTE"
  else if (["canceled", "incomplete_expired"].includes(statusStripe)) status = "CANCELADA"
  else return

  const dados = { status }

  if (status === "ATIVA") {
    dados.inicioEm = obterDataStripe(subscription.current_period_start) || new Date()
    dados.fimEm = obterDataStripe(subscription.current_period_end)
  }

  if (status === "CANCELADA") dados.canceladaEm = new Date()

  await prisma.assinatura.update({
    where: { id: assinaturaId },
    data: dados
  })
}

async function ativarAssinaturaPix(paymentIntent) {
  const assinaturaId = paymentIntent.metadata?.assinaturaId
  if (!assinaturaId) {
    console.error("Webhook Pix: assinaturaId ausente nos metadados.")
    return
  }

  if (paymentIntent.status !== "succeeded") return

  const assinatura = await prisma.assinatura.findUnique({
    where: { id: assinaturaId },
    select: {
      id: true,
      formaPagamento: true,
      plano: true,
      status: true,
      criadoEm: true
    }
  })

  if (!assinatura) {
    console.error("Webhook Pix: assinatura Futlance não encontrada:", assinaturaId)
    return
  }

  if (assinatura.formaPagamento !== "pix" || assinatura.plano !== "ANUAL") {
    console.error("Webhook Pix: plano ou forma de pagamento incompatível:", assinaturaId)
    return
  }

  if (assinatura.status === "ATIVA") return

  if (paymentIntent.amount_received !== 4788 || paymentIntent.currency !== "brl") {
    console.error("Webhook Pix: valor ou moeda incompatível:", assinaturaId)
    return
  }

  const inicioEm = new Date()
  const fimEm = new Date(inicioEm)
  fimEm.setFullYear(fimEm.getFullYear() + 1)

  await prisma.$transaction(async tx => {
    const atualizada = await tx.assinatura.updateMany({
      where: { id: assinaturaId, status: "PENDENTE", formaPagamento: "pix", plano: "ANUAL" },
      data: { status: "ATIVA", inicioEm, fimEm }
    })

    if (atualizada.count === 0) return
  })
}

export async function stripeWebhookController(req, res) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const assinaturaHeader = req.headers["stripe-signature"]

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET não configurada.")
    return res.status(500).json({ sucesso: false, mensagem: "Webhook não configurado." })
  }

  if (!assinaturaHeader) {
    return res.status(400).json({ sucesso: false, mensagem: "Assinatura Stripe ausente." })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, assinaturaHeader, webhookSecret)
  } catch (error) {
    console.error("Assinatura do webhook Stripe inválida:", error.message)
    return res.status(400).json({ sucesso: false, mensagem: "Webhook inválido." })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription)
          if (["active", "trialing"].includes(subscription.status)) {
            await ativarAssinaturaCartao(subscription)
          }
        }

        if (session.mode === "payment" && session.payment_status === "paid" && session.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent)
          await ativarAssinaturaPix(paymentIntent)
        }
        break
      }


      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object
        if (paymentIntent.metadata?.formaPagamento === "pix") {
          await ativarAssinaturaPix(paymentIntent)
        }
        break
      }


      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object

        if (session.mode === "payment" && session.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent)
          await ativarAssinaturaPix(paymentIntent)
        }
        break
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object
        const assinaturaId = session.metadata?.assinaturaId

        if (assinaturaId && session.mode === "payment") {
          await prisma.assinatura.updateMany({
            where: { id: assinaturaId, formaPagamento: "pix", status: "PENDENTE" },
            data: { status: "CANCELADA", canceladaEm: new Date() }
          })
        }
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object
        const subscriptionId = invoice.parent?.subscription_details?.subscription

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          if (["active", "trialing"].includes(subscription.status)) {
            await ativarAssinaturaCartao(subscription)
          }
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object
        const subscriptionId = invoice.parent?.subscription_details?.subscription

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await atualizarAssinaturaPorSubscription(subscription)
        }
        break
      }

      case "customer.subscription.updated": {
        await atualizarAssinaturaPorSubscription(event.data.object)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const assinaturaId = subscription.metadata?.assinaturaId

        if (assinaturaId) {
          await prisma.assinatura.updateMany({
            where: { id: assinaturaId, formaPagamento: "cartao" },
            data: { status: "CANCELADA", canceladaEm: new Date() }
          })
        }
        break
      }

      default:
        break
    }

    return res.status(200).json({ recebido: true })
  } catch (error) {
    console.error(`Erro ao processar webhook Stripe (${event.type}):`, error)
    return res.status(500).json({ sucesso: false, mensagem: "Erro ao processar evento Stripe." })
  }
}

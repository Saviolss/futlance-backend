import Stripe from "stripe"
import { PrismaClient } from "@prisma/client"

const stripe = new Stripe(process.env.STRIPE_KEY)
const prisma = new PrismaClient()

function obterDataStripe(timestamp) {
  if (!timestamp) {
    return null
  }

  return new Date(timestamp * 1000)
}

async function ativarAssinatura({
  assinaturaId,
  subscription
}) {
  if (!assinaturaId) {
    console.error(
      "Webhook Stripe: assinaturaId não informado."
    )
    return
  }

  const assinatura =
    await prisma.assinatura.findUnique({
      where: {
        id: assinaturaId
      }
    })

  if (!assinatura) {
    console.error(
      "Webhook Stripe: assinatura não encontrada:",
      assinaturaId
    )
    return
  }

  const inicioEm =
    obterDataStripe(
      subscription?.current_period_start
    ) || new Date()

  const fimEm =
    obterDataStripe(
      subscription?.current_period_end
    )

  await prisma.assinatura.update({
    where: {
      id: assinatura.id
    },
    data: {
      status: "ATIVA",
      inicioEm,
      fimEm
    }
  })

  console.log(
    `Assinatura ${assinatura.id} ativada com sucesso.`
  )
}

async function atualizarAssinaturaPorSubscription(
  subscription
) {
  const assinaturaId =
    subscription?.metadata?.assinaturaId

  if (!assinaturaId) {
    console.log(
      "Webhook Stripe: subscription sem assinaturaId."
    )
    return
  }

  const assinatura =
    await prisma.assinatura.findUnique({
      where: {
        id: assinaturaId
      }
    })

  if (!assinatura) {
    console.error(
      "Webhook Stripe: assinatura não encontrada:",
      assinaturaId
    )
    return
  }

  const statusStripe =
    subscription.status

  const fimEm =
    obterDataStripe(
      subscription.current_period_end
    )

  if (
    statusStripe === "active" ||
    statusStripe === "trialing"
  ) {
    await prisma.assinatura.update({
      where: {
        id: assinatura.id
      },
      data: {
        status: "ATIVA",
        fimEm
      }
    })

    console.log(
      `Assinatura ${assinatura.id} atualizada para ATIVA.`
    )

    return
  }

  if (
    statusStripe === "past_due" ||
    statusStripe === "unpaid"
  ) {
    await prisma.assinatura.update({
      where: {
        id: assinatura.id
      },
      data: {
        status: "PENDENTE"
      }
    })

    console.log(
      `Assinatura ${assinatura.id} está com pagamento pendente.`
    )

    return
  }

  if (
    statusStripe === "canceled" ||
    statusStripe === "incomplete_expired"
  ) {
    await prisma.assinatura.update({
      where: {
        id: assinatura.id
      },
      data: {
        status: "CANCELADA"
      }
    })

    console.log(
      `Assinatura ${assinatura.id} foi cancelada.`
    )
  }
}

export async function stripeWebhookController(
  req,
  res
) {
  const assinaturaWebhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET

  if (!assinaturaWebhookSecret) {
    console.error(
      "STRIPE_WEBHOOK_SECRET não configurado."
    )

    return res.status(500).json({
      sucesso: false,
      mensagem: "Webhook Stripe não configurado."
    })
  }

  const assinatura =
    req.headers["stripe-signature"]

  if (!assinatura) {
    return res.status(400).json({
      sucesso: false,
      mensagem:
        "Assinatura do webhook não informada."
    })
  }

  let evento

  try {
    evento =
      stripe.webhooks.constructEvent(
        req.body,
        assinatura,
        assinaturaWebhookSecret
      )
  } catch (error) {
    console.error(
      "Erro ao validar webhook Stripe:",
      error.message
    )

    return res.status(400).json({
      sucesso: false,
      mensagem: "Webhook Stripe inválido."
    })
  }

  try {
    console.log(
      `Webhook Stripe recebido: ${evento.type}`
    )

    switch (evento.type) {
      case "checkout.session.completed": {
        const session =
          evento.data.object

        const assinaturaId =
          session.metadata?.assinaturaId

        if (!assinaturaId) {
          console.error(
            "Checkout Stripe sem assinaturaId."
          )
          break
        }

        let subscription = null

        if (session.subscription) {
          subscription =
            await stripe.subscriptions.retrieve(
              session.subscription
            )
        }

        if (!subscription) {
          console.error(
            "Subscription não encontrada no Checkout:",
            session.id
          )
          break
        }

        await ativarAssinatura({
          assinaturaId,
          subscription
        })

        break
      }

      case "invoice.paid": {
        const invoice =
          evento.data.object

        if (!invoice.subscription) {
          console.log(
            "Invoice sem subscription. Ignorando."
          )
          break
        }

        const subscription =
          await stripe.subscriptions.retrieve(
            invoice.subscription
          )

        await atualizarAssinaturaPorSubscription(
          subscription
        )

        break
      }

      case "invoice.payment_failed": {
        const invoice =
          evento.data.object

        if (!invoice.subscription) {
          break
        }

        const subscription =
          await stripe.subscriptions.retrieve(
            invoice.subscription
          )

        await atualizarAssinaturaPorSubscription(
          subscription
        )

        break
      }

      case "customer.subscription.updated": {
        const subscription =
          evento.data.object

        await atualizarAssinaturaPorSubscription(
          subscription
        )

        break
      }

      case "customer.subscription.deleted": {
        const subscription =
          evento.data.object

        const assinaturaId =
          subscription.metadata?.assinaturaId

        if (!assinaturaId) {
          console.log(
            "Subscription cancelada sem assinaturaId."
          )
          break
        }

        const assinatura =
          await prisma.assinatura.findUnique({
            where: {
              id: assinaturaId
            }
          })

        if (!assinatura) {
          console.error(
            "Assinatura não encontrada:",
            assinaturaId
          )
          break
        }

        await prisma.assinatura.update({
          where: {
            id: assinatura.id
          },
          data: {
            status: "CANCELADA"
          }
        })

        console.log(
          `Assinatura ${assinatura.id} marcada como CANCELADA.`
        )

        break
      }

      default: {
        console.log(
          `Evento Stripe não tratado: ${evento.type}`
        )
      }
    }

    return res.status(200).json({
      recebido: true
    })
  } catch (error) {
    console.error(
      "Erro ao processar webhook Stripe:",
      error
    )

    return res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao processar webhook Stripe."
    })
  }
}

import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_KEY)
const FRONTEND_URL = process.env.FRONTEND_URL
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID
const VALOR_PIX_ANUAL = 4788

function validarConfiguracao() {
  if (!process.env.STRIPE_KEY) throw new Error("STRIPE_KEY não configurada.")
  if (!FRONTEND_URL) throw new Error("FRONTEND_URL não configurada.")
}

export async function criarCheckoutStripe({ assinaturaId, usuarioId, email, timeId, pagamento = "cartao" }) {
  validarConfiguracao()
  if (!assinaturaId || !usuarioId || !email) throw new Error("Dados obrigatórios do pagamento não informados.")

  const metadata = {
    assinaturaId: String(assinaturaId),
    usuarioId: String(usuarioId),
    timeId: timeId ? String(timeId) : "",
    plano: pagamento === "pix" ? "ANUAL" : "MENSAL",
    formaPagamento: pagamento
  }

  if (pagamento === "cartao") {
    if (!STRIPE_PRICE_ID) throw new Error("STRIPE_PRICE_ID não configurado.")

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      redirect_on_completion: "if_required",
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: email,
      metadata,
      subscription_data: { metadata },
      return_url: `${FRONTEND_URL}/torcedor/pagamento/retorno?session_id={CHECKOUT_SESSION_ID}`
    })

    if (!session.client_secret) throw new Error("O Stripe não retornou o client_secret do Checkout.")

    return {
      sucesso: true,
      sessionId: session.id,
      clientSecret: session.client_secret,
      pagamento,
      plano: "MENSAL"
    }
  }

  if (pagamento === "pix") {
    const intent = await stripe.paymentIntents.create({
      amount: VALOR_PIX_ANUAL,
      currency: "brl",
      payment_method_types: ["pix"],
      payment_method_data: {
        type: "pix",
        billing_details: { email }
      },
      confirm: true,
      return_url: `${FRONTEND_URL}/torcedor/pagamento/retorno`,
      metadata,
      description: "Assistente do Torcedor Futlance — Plano Anual"
    })

    const qr = intent.next_action?.pix_display_qr_code

    if (!qr && intent.status !== "succeeded") {
      throw new Error("O Stripe não retornou o QR Code Pix. Verifique se o Pix está habilitado na sua conta Stripe.")
    }

    return {
      sucesso: true,
      pagamento: "pix",
      plano: "ANUAL",
      paymentIntentId: intent.id,
      pix: qr ? {
        imagem: qr.image_url_png || qr.image_url_svg || "",
        codigo: qr.data || "",
        expiracao: qr.expires_at || null,
        instrucoes: qr.hosted_instructions_url || ""
      } : null,
      statusPagamento: intent.status
    }
  }

  throw new Error("Forma de pagamento inválida.")
}

export async function cancelarAssinaturaStripe(stripeSubscriptionId) {
  validarConfiguracao()
  if (!stripeSubscriptionId) throw new Error("ID da assinatura Stripe não informado.")

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  if (["canceled", "incomplete_expired"].includes(subscription.status)) return subscription
  if (subscription.cancel_at_period_end) return subscription

  return stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true })
}

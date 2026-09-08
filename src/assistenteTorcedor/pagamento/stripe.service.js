import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_KEY)

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID
const FRONTEND_URL = process.env.FRONTEND_URL

export async function criarCheckoutStripe({
  assinaturaId,
  usuarioId,
  email,
  timeId
}) {
  if (!process.env.STRIPE_KEY) {
    throw new Error("STRIPE_KEY não configurada.")
  }

  if (!STRIPE_PRICE_ID) {
    throw new Error("STRIPE_PRICE_ID não configurado.")
  }

  if (!FRONTEND_URL) {
    throw new Error("FRONTEND_URL não configurada.")
  }

  if (!assinaturaId) {
    throw new Error("ID da assinatura não informado.")
  }

  if (!usuarioId) {
    throw new Error("ID do usuário não informado.")
  }

  if (!email) {
    throw new Error("E-mail do usuário não informado.")
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: STRIPE_PRICE_ID,
        quantity: 1
      }
    ],
    customer_email: email,
    metadata: {
      assinaturaId: String(assinaturaId),
      usuarioId: String(usuarioId),
      timeId: timeId ? String(timeId) : ""
    },
    subscription_data: {
      metadata: {
        assinaturaId: String(assinaturaId),
        usuarioId: String(usuarioId),
        timeId: timeId ? String(timeId) : ""
      }
    },
    success_url: `${FRONTEND_URL}/torcedor/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/torcedor/pagamento/cancelado`
  })

  if (!session.url) {
    throw new Error("O Stripe não retornou a URL do Checkout.")
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url
  }
}
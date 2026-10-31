import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_KEY)

const STRIPE_PRICE_MENSAL =
  "price_1UBOV2BTcHAkgKlXTBMSndt7"

export async function criarCheckoutStripe({
  assinaturaId,
  usuario,
  time
}) {
  if (!assinaturaId) {
    throw new Error("ID da assinatura não informado.")
  }

  if (!usuario?.email) {
    throw new Error("E-mail do usuário não informado.")
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",

    customer_email: usuario.email,

    line_items: [
      {
        price: STRIPE_PRICE_MENSAL,
        quantity: 1
      }
    ],

    metadata: {
      assinaturaId: String(assinaturaId),
      usuarioId: String(usuario.id),
      timeId: time?.id
        ? String(time.id)
        : ""
    },

    subscription_data: {
      metadata: {
        assinaturaId: String(assinaturaId),
        usuarioId: String(usuario.id),
        timeId: time?.id
          ? String(time.id)
          : ""
      }
    },

    success_url:
      "https://futlance.com/torcedor/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}",

    cancel_url:
      "https://futlance.com/torcedor/pagamento/cancelado"
  })

  return {
    sucesso: true,
    sessionId: session.id,
    url: session.url
  }
}
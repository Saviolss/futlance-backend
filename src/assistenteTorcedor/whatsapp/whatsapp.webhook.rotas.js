
import { Router } from "express"
import crypto from "node:crypto"

const router = Router()

function verificarConfiguracao() {
  if (!process.env.WHATSAPP_VERIFY_TOKEN) {
    throw new Error("WHATSAPP_VERIFY_TOKEN não configurado.")
  }
}

function validarAssinaturaMeta(req) {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  const assinatura = req.get("x-hub-signature-256")
  if (!appSecret || !assinatura || !Buffer.isBuffer(req.body)) return false
  const assinaturaEsperada = `sha256=${crypto.createHmac("sha256", appSecret).update(req.body).digest("hex")}`
  const recebida = Buffer.from(assinatura)
  const esperada = Buffer.from(assinaturaEsperada)
  return recebida.length === esperada.length && crypto.timingSafeEqual(recebida, esperada)
}

// Verificação da URL pela Meta
router.get("/", (req, res) => {
  try {
    verificarConfiguracao()
    const modo = req.query["hub.mode"]
    const token = req.query["hub.verify_token"]
    const desafio = req.query["hub.challenge"]
    if (modo === "subscribe" && typeof token === "string" && typeof desafio === "string" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(desafio)
    }
    return res.sendStatus(403)
  } catch (erro) {
    console.error("Erro na verificação do webhook WhatsApp:", erro.message)
    return res.sendStatus(500)
  }
})

// Recebe eventos da Meta, sem processar nem responder mensagens recebidas
router.post("/", (req, res) => {
  if (!validarAssinaturaMeta(req)) {
    console.warn("Webhook WhatsApp rejeitado: assinatura inválida.")
    return res.sendStatus(401)
  }

  let evento
  try {
    evento = JSON.parse(req.body.toString("utf8"))
  } catch {
    return res.status(400).json({ erro: "JSON inválido." })
  }

  if (evento?.object !== "whatsapp_business_account") {
    return res.sendStatus(404)
  }

  // A Meta recebe confirmação rápida; nenhuma mensagem recebida é respondida.
  res.sendStatus(200)

  try {
    for (const entrada of evento.entry || []) {
      for (const alteracao of entrada.changes || []) {
        if (alteracao.field !== "messages") continue
        const dados = alteracao.value || {}

        // Ignora completamente o conteúdo das mensagens recebidas.
        // Registra somente status de envio, entrega e leitura.
        for (const status of dados.statuses || []) {
          console.log("Status WhatsApp:", {
            id: status.id,
            status: status.status,
            destinatario: status.recipient_id,
            timestamp: status.timestamp,
            erro: status.errors?.[0]?.code
          })
        }

        if (dados.errors?.length) {
          console.error("Erros informados pela Meta:", dados.errors)
        }
      }
    }
  } catch (erro) {
    console.error("Erro ao processar status do WhatsApp:", erro.message)
  }
})

export default router

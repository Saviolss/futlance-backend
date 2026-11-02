import axios from "axios"

const WHATSAPP_API_URL = "https://graph.facebook.com/v25.0"
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

export const TEMPLATES = {
  RESULTADO: "resultado",
  NOTICIA: "noticia",
  LEMBRETE: "lembrete"
}

function validarConfiguracao() {
  if (!WHATSAPP_TOKEN) {
    throw new Error("WHATSAPP_ACCESS_TOKEN não configurado.")
  }
  if (!WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID não configurado.")
  }
}

function normalizarNumero(numero) {
  if (!numero || typeof numero !== "string") {
    throw new Error("Número do WhatsApp não informado.")
  }
  const telefone = numero.replace(/\D/g, "")
  if (!telefone) throw new Error("Número do WhatsApp inválido.")
  return telefone
}

async function enviarWhatsApp(dados) {
  validarConfiguracao()
  try {
    const resposta = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      dados,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    )
    return resposta.data
  } catch (erro) {
    const detalhes = erro.response?.data?.error
    const mensagem =
      detalhes?.message ||
      erro.message ||
      "Erro ao enviar mensagem pelo WhatsApp."
    console.error("Erro na API do WhatsApp:", detalhes || mensagem)
    throw new Error(`Erro WhatsApp: ${mensagem}`)
  }
}

export async function enviarMensagemTexto(numero, texto) {
  const telefone = normalizarNumero(numero)
  if (!texto || typeof texto !== "string") {
    throw new Error("Texto da mensagem não informado.")
  }
  return enviarWhatsApp({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: telefone,
    type: "text",
    text: {
      preview_url: true,
      body: texto
    }
  })
}

export async function enviarImagemComTexto(numero, imagem, texto) {
  const telefone = normalizarNumero(numero)
  if (!imagem || typeof imagem !== "string") {
    throw new Error("URL da imagem não informada.")
  }
  if (!texto || typeof texto !== "string") {
    throw new Error("Texto da mensagem não informado.")
  }
  return enviarWhatsApp({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: telefone,
    type: "image",
    image: {
      link: imagem,
      caption: texto
    }
  })
}

export async function enviarTemplateWhatsApp({
  numero,
  nomeTemplate,
  idioma = "pt_BR",
  componentes = []
}) {
  const telefone = normalizarNumero(numero)
  if (!nomeTemplate || typeof nomeTemplate !== "string") {
    throw new Error("Nome do template não informado.")
  }
  if (!Array.isArray(componentes)) {
    throw new Error("Os componentes do template devem ser um array.")
  }
  return enviarWhatsApp({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: telefone,
    type: "template",
    template: {
      name: nomeTemplate,
      language: { code: idioma },
      ...(componentes.length ? { components: componentes } : {})
    }
  })
}

export async function enviarTemplateResultado(numero, componentes) {
  return enviarTemplateWhatsApp({
    numero,
    nomeTemplate: TEMPLATES.RESULTADO,
    componentes
  })
}

export async function enviarTemplateNoticia(numero, imagem, componentes) {
  if (!imagem || typeof imagem !== "string") {
    throw new Error("Imagem do cabeçalho da notícia não informada.")
  }
  if (!Array.isArray(componentes)) {
    throw new Error("Componentes do template de notícia inválidos.")
  }
  const componentesComImagem = [
    {
      type: "header",
      parameters: [
        {
          type: "image",
          image: { link: imagem }
        }
      ]
    },
    ...componentes
  ]
  return enviarTemplateWhatsApp({
    numero,
    nomeTemplate: TEMPLATES.NOTICIA,
    componentes: componentesComImagem
  })
}

export async function enviarTemplateLembrete(numero, componentes) {
  return enviarTemplateWhatsApp({
    numero,
    nomeTemplate: TEMPLATES.LEMBRETE,
    componentes
  })
}
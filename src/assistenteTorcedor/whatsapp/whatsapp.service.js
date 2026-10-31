import {
  enviarMensagemTexto,
  enviarTemplateNoticia,
  enviarTemplateLembrete,
  enviarTemplateResultado
} from "./whatsapp.api.js"

function validarNumero(numero) {
  if (typeof numero !== "string" || !numero.trim()) {
    throw new Error("Número do WhatsApp não informado.")
  }
}

function validarTexto(texto, campo = "Texto", opcional = false) {
  if (opcional && (texto == null || texto === "")) return
  if (typeof texto !== "string" || !texto.trim()) {
    throw new Error(`${ campo } não informado.`)
  }
}

function parametrosTexto(valores) {
  return [{
    type: "body",
    parameters: valores.map(valor => ({
      type: "text",
      text: String(valor ?? "")
    }))
  }]
}

export async function enviarTextoWhatsApp({ numero, texto }) {
  validarNumero(numero)
  validarTexto(texto)
  return enviarMensagemTexto(numero, texto)
}

export async function enviarNoticiaWhatsApp({
  numero,
  titulo,
  descricao,
  imagem,
  url,
  nomeTime
}) {
  validarNumero(numero)
  validarTexto(nomeTime, "Nome do time ou país")
  validarTexto(titulo, "Título da notícia")
  validarTexto(url, "Link da notícia")
  validarTexto(imagem, "Imagem da notícia")

  return enviarTemplateNoticia(
    numero,
    imagem,
    parametrosTexto([nomeTime, titulo, url])
  )
}

export async function enviarLembreteJogo({
  numero,
  campeonato,
  mandante,
  visitante,
  horario,
  estadio
}) {
  validarNumero(numero)
  validarTexto(campeonato, "Campeonato")
  validarTexto(mandante, "Time mandante")
  validarTexto(visitante, "Time visitante")
  validarTexto(horario, "Horário")
  validarTexto(estadio, "Estádio", true)

  return enviarTemplateLembrete(
    numero,
    parametrosTexto([
      campeonato,
      mandante,
      visitante,
      horario,
      estadio?.trim() || "Não informado"
    ])
  )
}

export async function enviarResultadoJogo({
  numero,
  mandante,
  golsMandante,
  visitante,
  golsVisitante
}) {
  validarNumero(numero)
  validarTexto(mandante, "Time mandante")
  validarTexto(visitante, "Time visitante")

  if (
    golsMandante == null || golsVisitante == null ||
    !Number.isInteger(Number(golsMandante)) ||
    !Number.isInteger(Number(golsVisitante)) ||
    Number(golsMandante) < 0 || Number(golsVisitante) < 0
  ) {
    throw new Error("Placar do jogo inválido.")
  }

  return enviarTemplateResultado(
    numero,
    parametrosTexto([
      `${ mandante } ${ golsMandante } `,
      `${ golsVisitante } ${ visitante } `
    ])
  )
}
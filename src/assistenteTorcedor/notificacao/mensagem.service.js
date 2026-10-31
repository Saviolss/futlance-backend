import { MENSAGENS_ASSISTENTE } from "./mensagens.js"

const IDIOMAS_PERMITIDOS = ["pt", "en", "es", "fr", "de", "it"]

function normalizarIdioma(idioma) {
  if (typeof idioma !== "string") return "pt"
  const codigo = idioma.split("-")[0].toLowerCase()
  return IDIOMAS_PERMITIDOS.includes(codigo) ? codigo : "pt"
}

function validarDados(dados) {
  if (!dados || typeof dados !== "object") {
    throw new Error("Dados da mensagem não informados.")
  }
}

export function criarMensagemJogo5Minutos({ idioma, ...dados }) {
  validarDados(dados)
  const codigo = normalizarIdioma(idioma)
  return MENSAGENS_ASSISTENTE[codigo].jogo5Minutos(dados)
}

export function criarMensagemResultadoJogo({ idioma, ...dados }) {
  validarDados(dados)
  const codigo = normalizarIdioma(idioma)
  return MENSAGENS_ASSISTENTE[codigo].resultadoJogo(dados)
}

export function criarMensagemNoticiaTime({ idioma, ...dados }) {
  validarDados(dados)
  const codigo = normalizarIdioma(idioma)
  return MENSAGENS_ASSISTENTE[codigo].noticiaTime(dados)
}
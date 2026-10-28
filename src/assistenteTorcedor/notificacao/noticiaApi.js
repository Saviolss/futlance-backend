
import axios from "axios"

const apiNoticias = axios.create({
  baseURL: "https://api.thenewsapi.com/v1",
  timeout: 50000
})

async function requestApiNoticias(params, mensagemErro) {
  try {
    const response = await apiNoticias.get("/news/all", {
      params: {
        api_token: process.env.API_NOTICIAS_ASSISTENTE,
        language: "pt",
        limit: 3,
        ...params
      }
    })

    return response.data
  } catch (erro) {
    if (erro.response) {
      console.error(
        "API Notícias erro:",
        erro.response.status,
        erro.response.data
      )
    } else {
      console.error("API Notícias erro:", erro.message)
    }

    throw new Error(mensagemErro)
  }
}

export async function buscarNoticiasApi({ nomeTime, limite = 3 } = {}) {
  if (!process.env.API_NOTICIAS_ASSISTENTE) {
    throw new Error("API_NOTICIAS_ASSISTENTE não configurada.")
  }

  if (typeof nomeTime !== "string" || !nomeTime.trim()) {
    throw new Error("Nome do time não informado.")
  }

  const quantidade = Math.min(
    Math.max(Number(limite) || 3, 1),
    3
  )

  return requestApiNoticias(
    {
      search: `"${nomeTime.trim()}"`,
      limit: quantidade,
      sort: "published_at"
    },
    "Erro ao buscar notícias do time."
  )
}

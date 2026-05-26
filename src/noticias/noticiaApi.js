import axios from "axios"

const apiNoticias = axios.create({
  baseURL: "https://api.thenewsapi.com/v1",
  timeout: 50000,
})

async function requestApiNoticias(url, params, mensagemErro) {
  try {
    const response = await apiNoticias.get(url, {
      params: {
        api_token: process.env.API_NOTICIAS_KEY,

        // 🔥 FILTROS FIXOS
        language: "pt",
        search:
          "futebol OR brasileirão OR campeonato brasileiro OR copa do brasil OR copa do mundo",

        limit: 3,

        ...params,
      },
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

      console.error(
        "API Notícias erro:",
        erro.message
      )
    }

    throw new Error(mensagemErro)
  }
}

export function buscarNoticiasApi(params = {}) {
  return requestApiNoticias(
    "/news/all",
    params,
    "Erro ao buscar notícias"
  )
}
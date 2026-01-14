import axios from "axios"

const apiFutebol = axios.create({
  baseURL: "https://api.api-futebol.com.br/v1",
  timeout: 10000,
})

async function requestApiFutebol(endpoint, mensagemErro) {
  try {
    const response = await apiFutebol.get(endpoint, {
      headers: {
        Authorization: `Bearer ${process.env.API_FUTEBOL_KEY}`,
      },
    })

    return response.data
  } catch (erro) {
    if (erro.response) {
      console.error(
        "API-Futebol erro:",
        erro.response.status,
        endpoint,
        erro.response.data
      )
    } else {
      console.error("API-Futebol erro:", erro.message)
    }

    throw new Error(mensagemErro)
  }
}

export function buscarTabelaApi(idCampeonato) {
  return requestApiFutebol(
    `/campeonatos/${idCampeonato}/tabela`,
    "Erro ao buscar tabela do campeonato"
  )
}

export function buscarAgendaApi(idCampeonato) {
  return requestApiFutebol(
    `/campeonatos/${idCampeonato}/partidas`,
    "Erro ao buscar agenda do campeonato"
  )
}





export function artilheirosCampeonatoApi(idCampeonato) {
  return requestApiFutebol(
    `/campeonatos/${idCampeonato}/artilharia`,
    "Erro ao buscar artilheiros do campeonato"
  )
}

export function buscarAoVivoApi() {
  return requestApiFutebol(
    `/ao-vivo`,
    "Erro ao buscar partidas ao vivo"
  )
}

export async function buscarPartidaApi(partidaId) {
  try {
    const response = await apiFutebol.get(
      `/partidas/${partidaId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_FUTEBOL_KEY}`,
        },
      }
    )

    return response.data

  } catch (erro) {

    // ❌ API respondeu (404, 500 etc)
    if (erro.response) {
      console.error(
        "API-Futebol erro:",
        erro.response.status,
        `/partidas/${partidaId}`,
        erro.response.data
      )

      // 404 é normal (partida não existe mais)
      if (erro.response.status === 404) {
        return null
      }
    }

    // 🌐 Erro de rede / timeout
    if (erro.request) {
      console.error(
        "🌐 Erro de rede ao buscar partida:",
        partidaId,
        erro.message
      )
      return null
    }

    // 💥 Erro inesperado
    console.error(
      "💥 Erro inesperado ao buscar partida:",
      erro.message
    )

    return null
  }
}

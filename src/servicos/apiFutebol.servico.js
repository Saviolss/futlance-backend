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

export function buscarPartidaApi(idPartida) {
  return requestApiFutebol(
    `/campeonatos/${idPartida}/partidas`,
    "Erro ao buscar dados da partida"
  )
}

import axios from "axios"

const apiFutebol = axios.create({
  baseURL: "https://api.api-futebol.com.br/v1",
  timeout: 50000,
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


export function buscarRodadasApi(idCampeonato) {
  return requestApiFutebol(
    `/campeonatos/${idCampeonato}/partidas`,
    "Erro ao buscar partidas encerradas do campeonato"
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

export function buscarPartidaApi(partidaId) {
  return requestApiFutebol(
    `/partidas/${partidaId}`,
    "Erro ao buscar informações da partida"
  )
}


/* =========================================================
   TIMES
========================================================= */

export function buscarTimeApi(timeId) {
  return requestApiFutebol(
    `/times/${timeId}`,
    "Erro ao buscar informações do time"
  )
}

export function buscarProximasPartidasTimeApi(timeId) {
  return requestApiFutebol(
    `/times/${timeId}/partidas/proximas`,
    "Erro ao buscar próximas partidas do time"
  )
}
export function buscarElencosCopaApi(idCampeonato) {
  return requestApiFutebol(
    `/campeonatos/${idCampeonato}/elencos`,
    "Erro ao buscar elencos da Copa"
  )
}
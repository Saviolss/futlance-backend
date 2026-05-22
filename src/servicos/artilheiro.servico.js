import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { artilheirosCampeonatoApi } from "./apiFutebol.servico.js"
import { getCache, setCache } from "../cache/cacheMemoria.js"
import { CACHE_TTL } from "../constantes/cacheTTL.js"

/* =========================================================
   FUNÇÃO BASE
========================================================= */

async function buscarArtilheirosCampeonato(idCampeonato) {

  const chaveCache = `artilheiros:${idCampeonato}`

  const cache = getCache(chaveCache)
  if (cache) return cache

  const artilheiros = await artilheirosCampeonatoApi(
    idCampeonato
  )

  console.log(
    "ARTILHEIROS RAW:",
    JSON.stringify(artilheiros, null, 2)
  )

  const normalizada = normalizarArtilheiros(artilheiros)

  const resposta = {
    tipo: "artilheiros",
    ...normalizada
  }

  setCache(
    chaveCache,
    resposta,
    CACHE_TTL.ARTILHEIROS
  )

  return resposta
}

/* =========================================================
   NORMALIZA LISTA
========================================================= */

function normalizarArtilheiros(payload) {

  const lista =
    payload?.artilheiros ||
    payload?.dados ||
    payload

  if (!Array.isArray(lista)) {
    return { dados: [] }
  }

  return {
    dados: lista.map(normalizarArtilheiro)
  }
}

/* =========================================================
   NORMALIZA UM ARTILHEIRO
========================================================= */

function normalizarArtilheiro(artilheiro) {
  return {
    jogador_id: artilheiro.atleta?.atleta_id,

    nome:
      artilheiro.atleta?.nome_popular ||
      "Sem nome",

    clube: {
      nome:
        artilheiro.time?.nome_popular || "",

      escudo:
        artilheiro.time?.escudo || ""
    },

    gols: artilheiro.gols || 0
  }
}

/* =========================================================
   EXPORTS
========================================================= */

export function buscarArtilheirosBrasileirao() {
  return buscarArtilheirosCampeonato(
    CAMPEONATOS.BRASILEIRAO
  )
}

export function buscarArtilheirosCopaMundo() {
  return buscarArtilheirosCampeonato(
    CAMPEONATOS.COPAMUNDO
  )
}

export function buscarArtilheirosCopaBrasil() {
  return buscarArtilheirosCampeonato(
    CAMPEONATOS.COPABRASIL
  )
}
import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { artilheirosCampeonatoApi } from "./apiFutebol.servico.js"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/* =========================================================
   FUNÇÃO BASE
========================================================= */

async function buscarArtilheirosCampeonato(idCampeonato) {

  try {

    const artilheiros = await prisma.artilheiro.findMany({

      where: {
        campeonato_id: idCampeonato
      },

      orderBy: {
        gols: "desc"
      }

    })

    return {

      tipo: "artilheiros",

      dados: artilheiros.map(artilheiro => ({

        jogador_id: artilheiro.jogador_id,

        nome: artilheiro.nome,

        clube: {

          nome: artilheiro.clube_nome,

          escudo: artilheiro.clube_escudo

        },

        gols: artilheiro.gols

      }))

    }

  } catch (erro) {

    console.error(

      `❌ Erro ao buscar artilharia ${idCampeonato}:`,

      erro.message

    )

    return {

      tipo: "artilheiros",

      dados: []

    }

  }

}

export async function atualizarArtilhariaCampeonato(
  idCampeonato
) {

  try {

    const resposta = await artilheirosCampeonatoApi(idCampeonato)

    const lista = normalizarArtilheiros(resposta).dados



    for (const jogador of lista) {

      await prisma.artilheiro.upsert({

        where: {

          campeonato_id_jogador_id: {

            campeonato_id: idCampeonato,

            jogador_id: jogador.jogador_id

          }

        },

        update: {

          campeonato_id: idCampeonato,

          nome: jogador.nome,

          clube_nome: jogador.clube.nome,

          clube_escudo: jogador.clube.escudo,

          gols: jogador.gols

        },

        create: {

          jogador_id: jogador.jogador_id,

          campeonato_id: idCampeonato,

          nome: jogador.nome,

          clube_nome: jogador.clube.nome,

          clube_escudo: jogador.clube.escudo,

          gols: jogador.gols

        }

      })

    }

    const ids = lista.map(j => j.jogador_id)

    await prisma.artilheiro.deleteMany({

      where: {

        campeonato_id: idCampeonato,

        jogador_id: {
          notIn: ids
        }

      }

    })

    console.log(`✅ Artilharia ${idCampeonato} atualizada`)

  } catch (erro) {

    console.error(
      "❌ Erro ao atualizar artilharia:",
      erro.message
    )

  }

}
/* =========================================================
   NORMALIZA LISTA
========================================================= */

function normalizarArtilheiros(payload) {

  let lista = []

  if (Array.isArray(payload)) {

    lista = payload

  } else if (Array.isArray(payload?.artilheiros)) {

    lista = payload.artilheiros

  } else if (Array.isArray(payload?.dados)) {

    lista = payload.dados

  } else if (Array.isArray(payload?.data)) {

    lista = payload.data

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

export function buscarArtilheirosChampions() {
  return buscarArtilheirosCampeonato(
    CAMPEONATOS.CHAMPIONS
  )
}

export function buscarArtilheirosCopaBrasil() {
  return buscarArtilheirosCampeonato(
    CAMPEONATOS.COPABRASIL
  )
}
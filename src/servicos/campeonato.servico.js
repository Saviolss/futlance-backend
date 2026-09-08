import {
  buscarTabelaBrasileirao,
  buscarTabelaChampions,
  buscarTabelaCopaBrasil
} from "./tabela.servico.js"

import {
  buscarAgendaBrasileirao,
  buscarAgendaChampions,
  buscarAgendaCopaBrasil
} from "./agenda.servico.js"

import {
  buscarBrasileiraoAoVivo,
  buscarChampionsAoVivo,
  buscarCopaBrasilAoVivo
} from "./partidaLive.servico.js"

import {
  buscarBrasileiraoFinalizadas,
  buscarChampionsFinalizadas,
  buscarCopaBrasilFinalizadas,
  buscarTodasFinalizadas
} from "./partidaFinalizada.servico.js"

import {
  buscarArtilheirosBrasileirao,
  buscarArtilheirosChampions,
  buscarArtilheirosCopaBrasil
} from "./artilheiro.servico.js"


/* =========================================
   MAPA DE CAMPEONATOS
========================================= */

const CAMPEONATOS = {
  brasileiro: {
    tabela: buscarTabelaBrasileirao,
    agenda: buscarAgendaBrasileirao,
    aoVivo: buscarBrasileiraoAoVivo,
    encerrados: buscarBrasileiraoFinalizadas,
    artilheiros: buscarArtilheirosBrasileirao
  },

  champions: {
    tabela: buscarTabelaChampions,
    agenda: buscarAgendaChampions,
    aoVivo: buscarChampionsAoVivo,
    encerrados: buscarChampionsFinalizadas,
    artilheiros: buscarArtilheirosChampions
  },

  copabrasil: {
    tabela: buscarTabelaCopaBrasil,
    agenda: buscarAgendaCopaBrasil,
    aoVivo: buscarCopaBrasilAoVivo,
    encerrados: buscarCopaBrasilFinalizadas,
    artilheiros: buscarArtilheirosCopaBrasil
  }

}


/* =========================================
   BUSCAR CAMPEONATO COMPLETO
========================================= */

export async function buscarCampeonato(slug) {

  const config = CAMPEONATOS[slug]

  if (!config) {
    throw new Error("Campeonato não encontrado")
  }

  const [
    tabela,
    agenda,
    aoVivo,
    encerrados,
    artilheiros
  ] = await Promise.all([
    config.tabela(),
    config.agenda(),
    config.aoVivo(),
    config.encerrados(),
    config.artilheiros()
  ])

  return {
    fase: tabela?.fase,
    dados: tabela?.dados,

    widgets: [
      {
        tipo: "ao-vivo",
        dados: aoVivo || []
      },

      {
        tipo: "agenda",
        dados: agenda || []
      },

      {
        tipo: "encerrados",
        dados: encerrados || []
      },

      {
        tipo: "artilheiros",
        titulo: "Artilheiros",
        dados: artilheiros?.dados || []
      }
    ]
  }
}
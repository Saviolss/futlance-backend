import {
  buscarTabelaBrasileirao,
  buscarTabelaCopaMundo,
  buscarTabelaCopaBrasil
} from "./tabela.servico.js"

import {
  buscarAgendaBrasileirao,
  buscarAgendaCopaMundo,
  buscarAgendaCopaBrasil
} from "./agenda.servico.js"

import {
  buscarBrasileiraoAoVivo,
  buscarCopaMundoAoVivo,
  buscarCopaBrasilAoVivo
} from "./partidaLive.servico.js"

import {
  buscarBrasileiraoFinalizadas,
  buscarCopaMundoFinalizadas,
  buscarCopaBrasilFinalizadas,
  buscarTodasFinalizadas
} from "./partidaFinalizada.servico.js"

import {
  buscarArtilheirosBrasileirao,
  buscarArtilheirosCopaMundo,
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

  copamundo: {
    tabela: buscarTabelaCopaMundo,
    agenda: buscarAgendaCopaMundo,
    aoVivo: buscarCopaMundoAoVivo,
    encerrados: buscarCopaMundoFinalizadas,
    artilheiros: buscarArtilheirosCopaMundo
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
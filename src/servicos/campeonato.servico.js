import {
  buscarTabelaBrasileirao,
  buscarTabelaPaulista,
  buscarTabelaCarioca,
  buscarTabelaCopaBrasil
} from "./tabela.servico.js"

import {
  buscarAgendaBrasileirao,
  buscarAgendaPaulista,
  buscarAgendaCarioca,
  buscarAgendaCopaBrasil
} from "./agenda.servico.js"

import {
  buscarBrasileiraoAoVivo,
  buscarPaulistaAoVivo,
  buscarCariocaAoVivo,
  buscarCopaBrasilAoVivo
} from "./partidaLive.servico.js"

import {
  buscarBrasileiraoFinalizadas,
  buscarPaulistaFinalizadas,
  buscarCariocaFinalizadas,
  buscarCopaBrasilFinalizadas,
  buscarTodasFinalizadas
} from "./partidaFinalizada.servico.js"

import {
  buscarArtilheirosBrasileirao,
  buscarArtilheirosPaulista,
  buscarArtilheirosCarioca,
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

  paulista: {
    tabela: buscarTabelaPaulista,
    agenda: buscarAgendaPaulista,
    aoVivo: buscarPaulistaAoVivo,
    encerrados: buscarPaulistaFinalizadas,
    artilheiros: buscarArtilheirosPaulista
  },

  carioca: {
    tabela: buscarTabelaCarioca,
    agenda: buscarAgendaCarioca,
    aoVivo: buscarCariocaAoVivo,
    encerrados: buscarCariocaFinalizadas,
    artilheiros: buscarArtilheirosCarioca
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
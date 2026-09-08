import {
  buscarTodasAoVivo,
  buscarBrasileiraoAoVivo,
  buscarChampionsAoVivo,
  buscarCopaBrasilAoVivo

} from "../servicos/partidaLive.servico.js"

import { buscarAgendaGeralInterno } from "./agenda.controlador.js"
/* ======================================================
   🏠 HOME (AGRUPADOR DE WIDGETS)
====================================================== */
export async function getHome(req, res, next) {
  try {
    const jogosAoVivo = await buscarTodasAoVivo()
    const jogosAgenda = await buscarAgendaGeralInterno()
    const widgets = []

    if (jogosAoVivo.length) {
      widgets.push({
        tipo: "ao-vivo",
        dados: jogosAoVivo
      })
    }
    if (jogosAgenda.length) {
      widgets.push({
        tipo: "agenda",
        dados: jogosAgenda
      })
    }

    res.json({ widgets })
  } catch (erro) {
    next(erro)
  }
}

/* ======================================================
   🔹 HOME / WIDGET
====================================================== */
export async function getAoVivoWidget(req, res, next) {
  try {
    const [brasileirao, champions, copaBrasil] = await Promise.allSettled([
      buscarBrasileiraoAoVivo(),
      buscarChampionsAoVivo(),
      buscarCopaBrasilAoVivo()
    ])

    const dados = [
      ...(brasileirao.status === "fulfilled" ? brasileirao.value : []),
      ...(champions.status === "fulfilled" ? champions.value : []),
      ...(copaBrasil.status === "fulfilled" ? copaBrasil.value : [])
    ]

    res.json({
      tipo: "ao-vivo",
      dados
    })
  } catch (erro) {
    next(erro)
  }
}

/* ======================================================
   🔹 ROTAS DIRETAS (páginas específicas)
====================================================== */
export async function getTodasAoVivo(req, res, next) {
  try {
    const partidas = await buscarTodasAoVivo()
    res.json({
      tipo: "ao-vivo",
      dados: partidas
    })
  } catch (erro) {
    next(erro)
  }
}

export async function getBrasileiraoAoVivo(req, res, next) {
  try {
    const partidas = await buscarBrasileiraoAoVivo()
    res.json({
      tipo: "ao-vivo",
      dados: partidas
    })
  } catch (erro) {
    next(erro)
  }
}

export async function getChampionsAoVivo(req, res, next) {
  try {
    const partidas = await buscarChampionsAoVivo()
    res.json({
      tipo: "ao-vivo",
      dados: partidas
    })
  } catch (erro) {
    next(erro)
  }
}

export async function getCariocaAoVivo(req, res, next) {
  try {
    const partidas = await buscarCariocaAoVivo()
    res.json({
      tipo: "ao-vivo",
      dados: partidas
    })
  } catch (erro) {
    next(erro)
  }
}

export async function getCopaBrasilAoVivo(req, res, next) {
  try {
    const partidas = await buscarCopaBrasilAoVivo()
    res.json({
      tipo: "ao-vivo",
      dados: partidas
    })
  } catch (erro) {
    next(erro)
  }
}

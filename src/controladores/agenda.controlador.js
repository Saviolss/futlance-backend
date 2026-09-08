import {
  buscarAgendaBrasileirao,
  buscarAgendaChampions,
  buscarAgendaCopaBrasil
} from "../servicos/agenda.servico.js"

/* =========================================================
   FUNÇÃO INTERNA (REUTILIZÁVEL)
========================================================= */
async function buscarAgendaGeralInterno() {
  const [
    brasileirao,
    champions,
    copaBrasil
  ] = await Promise.allSettled([
    buscarAgendaBrasileirao(),
    buscarAgendaChampions(),
    buscarAgendaCopaBrasil()
  ])

  return [
    ...(brasileirao.status === "fulfilled"
      ? brasileirao.value
      : []),

    ...(champions.status === "fulfilled"
      ? champions.value
      : []),

    ...(copaBrasil.status === "fulfilled"
      ? copaBrasil.value
      : [])
  ]
}

/* =========================================================
   CONTROLLER
========================================================= */
export async function getAgendaGeral(req, res) {
  console.log("entreino: getAgendaGeral")

  try {
    const jogosAgenda = await buscarAgendaGeralInterno()

    const widgets = []

    if (jogosAgenda.length) {
      widgets.push({
        tipo: "agenda",
        dados: jogosAgenda
      })
    }

    console.log("jogosAgenda:", jogosAgenda)
    console.log("widgets:", widgets)

    res.json({ widgets })

  } catch (erro) {
    console.error("Erro ao buscar agenda geral:", erro)
    res.status(500).json({ erro: "Erro ao carregar agenda" })
  }
}

/* =========================================================
   EXPORTA FUNÇÃO INTERNA (IMPORTANTE)
========================================================= */
export { buscarAgendaGeralInterno }

/* =========================================================
   ROTAS INDIVIDUAIS (WIDGETS)
========================================================= */
export async function getAgendaBrasileirao(req, res, next) {
  try {
    const agenda = await buscarAgendaBrasileirao()
    res.json(agenda)
  } catch (erro) {
    next(erro)
  }
}

export async function getAgendaChampions(req, res, next) {
  try {
    const agenda = await buscarAgendaChampions()
    res.json(agenda)
  } catch (erro) {
    next(erro)
  }
}

export async function getAgendaCarioca(req, res, next) {
  try {
    const agenda = await buscarAgendaCarioca()
    res.json(agenda)
  } catch (erro) {
    next(erro)
  }
}

export async function getAgendaCopaBrasil(req, res, next) {
  try {
    const agenda = await buscarAgendaCopaBrasil()
    res.json(agenda)
  } catch (erro) {
    next(erro)
  }
}
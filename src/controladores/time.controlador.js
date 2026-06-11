import { buscarTimesCopa, buscarTimePorSlug } from "../servicos/time.servico.js"

/* ======================================================
   LISTA TODOS OS TIMES DA COPA
====================================================== */

export async function getTimes(req, res, next) {

  try {

    const times =
      await buscarTimesCopa()

    return res.json({
      total: times.length,
      dados: times
    })

  } catch (erro) {

    next(erro)
  }
}

/* ======================================================
   DETALHES DE UM TIME
====================================================== */

export async function getTime(req, res, next) {

  try {

    const { slug } = req.params

    const time =
      await buscarTimePorSlug(slug)

    if (!time) {

      return res.status(404).json({
        erro: "Time não encontrado"
      })
    }

    return res.json(time)

  } catch (erro) {

    next(erro)
  }
}
import {
  buscarTimePorSlugBanco,
  buscarTimesBanco
} from "../servicos/timeBanco.servico.js"

export async function getTime(
  req,
  res
) {

  const time =
    await buscarTimePorSlugBanco(
      req.params.slug
    )

  if (!time) {

    return res.status(404).json({
      erro: "Time não encontrado"
    })
  }

  res.json(time)
}

export async function getTimes(
  req,
  res
) {

  const times =
    await buscarTimesBanco()

  res.json(times)
}
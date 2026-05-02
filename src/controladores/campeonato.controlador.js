import { buscarCampeonato } from "../servicos/campeonato.servico.js"

export async function getCampeonato(req, res, next) {
  try {

    const { slug } = req.params

    const campeonato = await buscarCampeonato(slug)

    res.json(campeonato)

  } catch (erro) {
    next(erro)
  }
}
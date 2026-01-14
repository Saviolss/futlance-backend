import {
  buscarTodasAoVivo,
  buscarBrasileiraoAoVivo,
  buscarPaulistaAoVivo,
  buscarCariocaAoVivo
} from "../servicos/partidaLive.servico.js"

export async function getTodasAoVivo(req, res, next) {
  try {
    const partidas = await buscarTodasAoVivo()
    res.json(partidas)
  } catch (erro) {
    next(erro)
  }
}

export async function getBrasileiraoAoVivo(req, res, next) {
  try {
    const partidas = await buscarBrasileiraoAoVivo()
    res.json(partidas)
  } catch (erro) {
    next(erro)
  }
}

export async function getPaulistaAoVivo(req, res, next) {
  try {
    const partidas = await buscarPaulistaAoVivo()
    res.json(partidas)
  } catch (erro) {
    next(erro)
  }
}

export async function getCariocaAoVivo(req, res, next) {
  try {
    const partidas = await buscarCariocaAoVivo()
    res.json(partidas)
  } catch (erro) {
    next(erro)
  }
}

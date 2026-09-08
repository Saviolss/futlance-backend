import { obterTodasPartidasAoVivo } from "../utils/partidasAoVivo.js"

export function getAoVivo(req, res) {
  const partidas = obterTodasPartidasAoVivo()

  res.json({
    atualizadoEm: new Date().toISOString(),
    campeonatos: partidas
  })
}


export function getAoVivoBrasileiro(req, res) {
  const partidas = obterTodasPartidasAoVivo()

  res.json({
    atualizadoEm: new Date().toISOString(),
    campeonatos: partidas["brasileiro"] || []
  })
}

export function getAoVivoCopaBrasil(req, res) {
  const partidas = obterTodasPartidasAoVivo()

  res.json({
    atualizadoEm: new Date().toISOString(),
    campeonatos: partidas["copabrasil"] || []
  })
}

export function getAoVivoChampions(req, res) {
  const partidas = obterTodasPartidasAoVivo()

  res.json({
    atualizadoEm: new Date().toISOString(),
    campeonatos: partidas["champions"] || []
  })
}
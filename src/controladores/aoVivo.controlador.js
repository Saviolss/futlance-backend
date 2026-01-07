import { obterTodasPartidasAoVivo } from "../utils/partidasAoVivo.js"

export function getAoVivo(req, res) {
  const partidas = obterTodasPartidasAoVivo()

  res.json({
    atualizadoEm: new Date().toISOString(),
    campeonatos: partidas
  })
}

export function getAoVivoPaulista(req, res) {
  const partidas = obterTodasPartidasAoVivo()

  res.json({
    atualizadoEm: new Date().toISOString(),
    campeonatos: partidas["paulista"] || []
  })
}

export function getAoVivoBrasileiro(req, res) {
  const partidas = obterTodasPartidasAoVivo()

  res.json({
    atualizadoEm: new Date().toISOString(),
    campeonatos: partidas["brasileiro"] || []
  })
}

export function getAoVivoCarioca(req, res) {
  const partidas = obterTodasPartidasAoVivo()

  res.json({
    atualizadoEm: new Date().toISOString(),
    campeonatos: partidas["carioca"] || []
  })
}
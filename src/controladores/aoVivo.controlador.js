import { obterTodasPartidasAoVivo } from "../utils/partidasAoVivo.js"

export function getAoVivo(req, res) {
  const partidas = obterTodasPartidasAoVivo()

  res.json({
    atualizadoEm: new Date().toISOString(),
    campeonatos: partidas
  })
}
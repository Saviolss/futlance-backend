export function detectarEventosPartida(atual, anterior) {
  if (!anterior) {
    return { gol: false, fimDeJogo: false }
  }

  const gol =
    atual.status === "andamento" &&
    atual.placar !== anterior.placar

  const fimDeJogo =
    anterior.status === "andamento" &&
    atual.status === "finalizado"

  return { gol, fimDeJogo }
}

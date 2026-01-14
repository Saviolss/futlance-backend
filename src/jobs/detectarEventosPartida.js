export function detectarEventosPartida(atualApi, anterior) {
  const atual = normalizar(atualApi)

  // Primeira execução (sem histórico)
  if (!anterior) {
    return {
      gol: false,
      golMandante: false,
      golVisitante: false,
      fimDeJogo: false
    }
  }

  const golMandante =
    atual.placar.mandante > anterior.placar.mandante

  const golVisitante =
    atual.placar.visitante > anterior.placar.visitante

  const gol = golMandante || golVisitante

  const fimDeJogo =
    anterior.status === "andamento" &&
    atual.status !== "andamento"

  return {
    gol,
    golMandante,
    golVisitante,
    fimDeJogo
  }
}

/* 🔹 normalização interna */
function normalizar(p) {
  return {
    status: p.status,
    placar: {
      mandante: Number(p.placar_mandante ?? 0),
      visitante: Number(p.placar_visitante ?? 0)
    }
  }
}

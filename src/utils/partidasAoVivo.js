const partidasAoVivoPorCampeonato = {}

export function adicionarPartidaAoVivo(idCampeonato, partida) {
  if (!partidasAoVivoPorCampeonato[idCampeonato]) {
    partidasAoVivoPorCampeonato[idCampeonato] = []
  }

  const existe = partidasAoVivoPorCampeonato[idCampeonato]
    .some(p => p.partida_id === partida.partida_id)

  if (!existe) {
    partidasAoVivoPorCampeonato[idCampeonato].push(partida)
  }
}

export function obterPartidasAoVivo(idCampeonato) {
  return partidasAoVivoPorCampeonato[idCampeonato] || []
}

export function obterTodasPartidasAoVivo() {
  return partidasAoVivoPorCampeonato
}

export function removerPartidaAoVivo(idCampeonato, idPartida) {
  if (!partidasAoVivoPorCampeonato[idCampeonato]) return

  partidasAoVivoPorCampeonato[idCampeonato] =
    partidasAoVivoPorCampeonato[idCampeonato]
      .filter(p => p.partida_id !== idPartida)
}

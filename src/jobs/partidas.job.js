import { buscarPartida } from "../servicos/partida.servico.js"
import { atualizarTabelaCampeonato } from "../servicos/tabela.servico.js"

export async function processarPartida(idPartida, idCampeonato) {
  const partida = await buscarPartida(idPartida)

  // EVENTOS IMPORTANTES
  if (
    partida.status === "EM_ANDAMENTO" ||
    partida.status === "ENCERRADO"
  ) {
    await atualizarTabelaCampeonato(idCampeonato)
  }

  return partida
}

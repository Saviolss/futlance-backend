const agendaCache = new Map()

export function salvarAgendaCache(campeonatoId, agenda) {
  agendaCache.set(campeonatoId, agenda)
}

export function obterAgendaCache(campeonatoId) {
  return agendaCache.get(campeonatoId)
}

export function limparAgendaCache(campeonatoId) {
  agendaCache.delete(campeonatoId)
}

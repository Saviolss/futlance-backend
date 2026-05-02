import { getCache } from "../cache/cacheMemoria.js"

/*
  Critérios:
  - agenda de hoje existe
  - ou cache ao-vivo não está vazio
*/
export function temJogosHoje() {
  const agendaHoje = getCache("agenda:hoje")
  if (Array.isArray(agendaHoje) && agendaHoje.length > 0) {
    return true
  }

  const aoVivo = getCache("ao-vivo:todas")
  if (Array.isArray(aoVivo) && aoVivo.length > 0) {
    return true
  }

  return false
}

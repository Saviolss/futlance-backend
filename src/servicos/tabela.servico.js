import { buscarTabelaApi } from "./apiFutebol.servico.js"
import { CAMPEONATOS } from "../constantes/campeonatos.js"

export async function buscarTabelaBrasileirao() {
  return await buscarTabelaApi(CAMPEONATOS.BRASILEIRAO)
}

export async function buscarTabelaPaulista() {
  return await buscarTabelaApi(CAMPEONATOS.PAULISTA)
}

export async function buscarTabelaCarioca() {
  return await buscarTabelaApi(CAMPEONATOS.CARIOCA)
}
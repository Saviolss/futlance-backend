import { buscarPartidaApi } from "./apiFutebol.servico.js";
import { PARTIDAS } from "../constantes/partidas.js";

export async function buscarPartidaBrasileirao() {
  return await buscarPartidaApi(PARTIDAS.BRASILEIRAO);
}

export async function buscarPartidaPaulista() {
  return await buscarPartidaApi(PARTIDAS.PAULISTA);
}

export async function buscarPartidaCarioca() {
  return await buscarPartidaApi(PARTIDAS.CARIOCA);
}
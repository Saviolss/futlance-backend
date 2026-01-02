import { buscarAgendaApi } from "./apiFutebol.servico.js";
import { CAMPEONATOS } from "../constantes/campeonatos.js";

export async function buscarAgendaBrasileirao() {
  return await buscarAgendaApi(CAMPEONATOS.BRASILEIRAO);
}

export async function buscarAgendaPaulista() {
  return await buscarAgendaApi(CAMPEONATOS.PAULISTA);
}

export async function buscarAgendaCarioca() {
  return await buscarAgendaApi(CAMPEONATOS.CARIOCA);
}
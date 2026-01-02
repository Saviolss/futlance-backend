import { buscarAgendaBrasileirao, buscarAgendaCarioca, buscarAgendaPaulista } from "../servicos/agenda.servico.js";

export async function getAgendaBrasileirao(req, res, next) {
  try {
    const agenda = await buscarAgendaBrasileirao();
    res.json(agenda);
  } catch (erro) {
    next(erro);
  }
} 

export async function getAgendaPaulista(req, res, next) {
  try {
    const agenda = await buscarAgendaPaulista();
    res.json(agenda);
  } catch (erro) {
    next(erro);
  }
}

export async function getAgendaCarioca(req, res, next) {
  try {
    const agenda = await buscarAgendaCarioca();
    res.json(agenda);
  } catch (erro) {
    next(erro);
  }
}
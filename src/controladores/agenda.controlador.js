import { buscarAgendaBrasileirao, buscarAgendaCarioca, buscarAgendaPaulista } from "../servicos/agenda.servico.js";

export async function getAgendaGeral(req, res) {
  const [brasileirao, paulista, carioca] = await Promise.allSettled([
    buscarAgendaPaulista(),
    buscarAgendaCarioca(),
    buscarAgendaBrasileirao() 
  ])

  res.json({
    brasileirao: brasileirao.status === "fulfilled" ? brasileirao.value : [],
    paulista: paulista.status === "fulfilled" ? paulista.value : [],
    carioca: carioca.status === "fulfilled" ? carioca.value : []
  })
}


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
import { buscarPartidaBrasileirao, buscarPartidaCarioca, buscarPartidaPaulista } from "../servicos/partida.servico.js";

export async function getPartidaBrasileirao(req, res, next) {
  try {
    const partida = await buscarPartidaBrasileirao();
    res.json(partida);
  } catch (erro) {
    next(erro);
  }
} 

export async function getPartidaPaulista(req, res, next) {
  try {
    const partida = await buscarPartidaPaulista();
    res.json(partida);
  } catch (erro) {
    next(erro);
  }
}

export async function getPartidaCarioca(req, res, next) {
  try {
    const partida = await buscarPartidaCarioca();
    res.json(partida);
  } catch (erro) {
    next(erro);
  }
}
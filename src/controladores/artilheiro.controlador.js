import {
  buscarArtilheirosBrasileirao,
  buscarArtilheirosChampions,
  buscarArtilheirosCopaBrasil
} from "../servicos/artilheiro.servico.js";

/* =========================================================
   BRASILEIRÃO
========================================================= */
export async function getArtilheirosBrasileirao(req, res, next) {
  try {
    const artilheiros = await buscarArtilheirosBrasileirao();

    // 🔥 resposta já vem pronta pro front
    // { dados }
    res.json(artilheiros);
  } catch (erro) {
    next(erro);
  }
}

/* =========================================================
    CHAMPIONS LEAGUE
========================================================= */
export async function getArtilheirosChampions(req, res, next) {
  try {
    const artilheiros = await buscarArtilheirosChampions();
    res.json(artilheiros);
  } catch (erro) {
    next(erro);
  }
}

/* =========================================================
   COPA DO BRASIL
========================================================= */
export async function getArtilheirosCopaBrasil(req, res, next) {
  try {
    const artilheiros = await buscarArtilheirosCopaBrasil();
    res.json(artilheiros);
  } catch (erro) {
    next(erro);
  }
}
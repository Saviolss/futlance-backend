import {
  buscarArtilheirosBrasileirao,
  buscarArtilheirosPaulista,
  buscarArtilheirosCarioca,
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
   PAULISTA
========================================================= */
export async function getArtilheirosPaulista(req, res, next) {
  try {
    const artilheiros = await buscarArtilheirosPaulista();
    res.json(artilheiros);
  } catch (erro) {
    next(erro);
  }
}

/* =========================================================
   CARIOCA
========================================================= */
export async function getArtilheirosCarioca(req, res, next) {
  try {
    const artilheiros = await buscarArtilheirosCarioca();
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
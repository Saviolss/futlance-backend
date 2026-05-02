import {
  buscarTabelaBrasileirao,
  buscarTabelaPaulista,
  buscarTabelaCarioca,
  buscarTabelaCopaBrasil
} from "../servicos/tabela.servico.js"

/* =========================================================
   BRASILEIRÃO
========================================================= */
export async function getTabelaBrasileirao(req, res, next) {
  try {
    const tabela = await buscarTabelaBrasileirao()

    // 🔥 resposta já vem pronta pro front
    // { fase, dados }
    res.json(tabela)
  } catch (erro) {
    next(erro)
  }
}

/* =========================================================
   PAULISTA
========================================================= */
export async function getTabelaPaulista(req, res, next) {
  try {
    const tabela = await buscarTabelaPaulista()
    res.json(tabela)
  } catch (erro) {
    next(erro)
  }
}

/* =========================================================
   CARIOCA
========================================================= */
export async function getTabelaCarioca(req, res, next) {
  try {
    const tabela = await buscarTabelaCarioca()
    res.json(tabela)
  } catch (erro) {
    next(erro)
  }
}

/* =========================================================
   COPA DO BRASIL
========================================================= */
export async function getTabelaCopaBrasil(req, res, next) {
  try {
    const tabela = await buscarTabelaCopaBrasil()
    res.json(tabela)
  } catch (erro) {
    next(erro)
  }
}
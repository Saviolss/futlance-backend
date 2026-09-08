import {
  buscarTabelaBrasileirao,
  buscarTabelaChampions,
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
   CHAMPIONS LEAGUE
========================================================= */
export async function getTabelaChampions(req, res, next) {
  try {
    const tabela = await buscarTabelaChampions()
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
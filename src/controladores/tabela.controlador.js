import {
  buscarTabelaBrasileirao,
  buscarTabelaCopaMundo,
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
   COPA DO MUNDO
========================================================= */
export async function getTabelaCopaMundo(req, res, next) {
  try {
    const tabela = await buscarTabelaCopaMundo()
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
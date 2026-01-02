import { buscarTabelaBrasileirao, buscarTabelaPaulista, buscarTabelaCarioca } from "../servicos/tabela.servico.js"

export async function getTabelaBrasileirao(req, res, next) {
  try {
    const tabela = await buscarTabelaBrasileirao()
    res.json(tabela)
  } catch (erro) {
    next(erro)
  }
}

export async function getTabelaPaulista(req, res, next) {
  try {
    const tabela = await buscarTabelaPaulista()
    res.json(tabela)
  } catch (erro) {
    next(erro)
  }
}

export async function getTabelaCarioca(req, res, next) {
  try {
    const tabela = await buscarTabelaCarioca()
    res.json(tabela)
  } catch (erro) {
    next(erro)
  }
}           
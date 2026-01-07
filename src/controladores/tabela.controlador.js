import { 
  buscarTabelaBrasileirao, buscarTabelaPaulista, buscarTabelaCarioca,
  buscarArtilheirosBrasileirao, buscarArtilheirosCarioca, buscarArtilheirosPaulista 
} from "../servicos/tabela.servico.js"

export async function getArtilheirosBrasileirao(req, res, next) {
  try {
    const artilheiros = await buscarArtilheirosBrasileirao()
    res.json(artilheiros)
  } catch (erro) {
    next(erro)
  }
}

export async function getArtilheirosPaulista(req, res, next) {
  try {
    const artilheiros = await buscarArtilheirosPaulista()
    res.json(artilheiros)
  } catch (erro) {
    next(erro)
  }
}

export async function getArtilheirosCarioca(req, res, next) {
  try {
    const artilheiros = await buscarArtilheirosCarioca()
    res.json(artilheiros)
  } catch (erro) {
    next(erro)
  }
}

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
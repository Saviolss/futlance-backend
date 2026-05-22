import {
  buscarTodasFinalizadas,
  buscarBrasileiraoFinalizadas,
  buscarCopaMundoFinalizadas,
  buscarCopaBrasilFinalizadas
} from "../servicos/partidaFinalizada.servico.js"

/* ============================
   CONTROLLERS
============================ */

export async function getFinalizadas(req, res, next) {
  try {
    const partidas = await buscarTodasFinalizadas()
    res.json(partidas)
  } catch (err) {
    next(err)
  }
}

export async function getFinalizadasBrasileirao(req, res, next) {
  try {
    const partidas = await buscarBrasileiraoFinalizadas()
    res.json(partidas)
  } catch (err) {
    next(err)
  }
}

export async function getFinalizadasCopaMundo(req, res, next) {
  try {
    const partidas = await buscarCopaMundoFinalizadas()
    res.json(partidas)
  } catch (err) {
    next(err)
  }
} 

export async function getFinalizadasCopaBrasil(req, res, next) {
  try {
    const partidas = await buscarCopaBrasilFinalizadas()
    res.json(partidas)
  } catch (err) {
    next(err)
  }
}

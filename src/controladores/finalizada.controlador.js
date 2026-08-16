import {
  buscarTodasFinalizadas,
  buscarBrasileiraoFinalizadas,
  buscarCopaMundoFinalizadas,
  buscarCopaBrasilFinalizadas
} from "../servicos/partidaFinalizada.servico.js"


/* ======================================================
   CONTROLLER — TODAS FINALIZADAS
====================================================== */

export async function getFinalizadas(req, res, next) {

  try {

    const partidas =
      await buscarTodasFinalizadas()

    return res.json(partidas)

  } catch (err) {

    console.error(
      "❌ Erro ao buscar todas partidas finalizadas:",
      err.message
    )

    next(err)

  }

}


/* ======================================================
   CONTROLLER — BRASILEIRÃO
====================================================== */

export async function getFinalizadasBrasileirao(
  req,
  res,
  next
) {

  try {

    const partidas =
      await buscarBrasileiraoFinalizadas()

    return res.json(partidas)

  } catch (err) {

    console.error(
      "❌ Erro ao buscar finalizadas do Brasileirão:",
      err.message
    )

    next(err)

  }

}


/* ======================================================
   CONTROLLER — COPA DO MUNDO
====================================================== */

export async function getFinalizadasCopaMundo(
  req,
  res,
  next
) {

  try {

    const partidas =
      await buscarCopaMundoFinalizadas()

    return res.json(partidas)

  } catch (err) {

    console.error(
      "❌ Erro ao buscar finalizadas da Copa do Mundo:",
      err.message
    )

    next(err)

  }

}


/* ======================================================
   CONTROLLER — COPA DO BRASIL
====================================================== */

export async function getFinalizadasCopaBrasil(
  req,
  res,
  next
) {

  try {

    const partidas =
      await buscarCopaBrasilFinalizadas()

    return res.json(partidas)

  } catch (err) {

    console.error(
      "❌ Erro ao buscar finalizadas da Copa do Brasil:",
      err.message
    )

    next(err)

  }

}
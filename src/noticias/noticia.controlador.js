import { buscarNoticias } from "./noticia.servico.js"

/* ======================================================
   📰 CONTROLLER DE NOTÍCIAS
====================================================== */

export async function getNoticias(req, res, next) {

  try {

    const noticias = await buscarNoticias()

    const widgets = []

    if (noticias.length) {

      widgets.push({
        tipo: "noticias",
        dados: noticias
      })
    }

    return res.json({
      widgets
    })

  } catch (erro) {

    next(erro)
  }
}
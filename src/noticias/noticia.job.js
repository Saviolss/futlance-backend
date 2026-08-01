import { atualizarNoticias } from "./noticia.servico.js"

/* ======================================================
   JOB NOTÍCIAS
====================================================== */

export function iniciarJobNoticias() {

  console.log(
    "📰 Job de notícias inicializado"
  )

  async function atualizar() {

    try {

      await atualizarNoticias()

      console.log(
        "📰 Notícias atualizadas"
      )

    } catch (erro) {

      console.error(
        "❌ Erro job notícias:",
        erro.message
      )

    }

    /* ==========================================
       48 req/dia
    ========================================== */

    setTimeout(

      atualizar,

      30 * 60 * 1000

    )

  }

  atualizar()

}
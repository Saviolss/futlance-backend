import {
  atualizarNoticias
} from "./noticia.servico.js"

/* ======================================================
   JOB NOTÍCIAS
====================================================== */

export function iniciarJobNoticias() {

  console.log(
    "📰 Job de notícias inicializado"
  )

  async function atualizar() {

    try {

      const noticias =
        await atualizarNoticias()

      console.log(
        `📰 Notícias atualizadas: ${noticias.length}`
      )

    } catch (e) {

      console.error(
        "❌ Erro job notícias:",
        e.message
      )
    }

    /* ==========================================
       48 req/dia
    ========================================== */

    setTimeout(
      atualizar,
      30 * 60 * 1000 // 30 min
    )
  }

  atualizar()
}
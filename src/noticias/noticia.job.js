import { buscarNoticias } from "./noticia.servico.js"
 
/* ======================================================
   ⚽ JOB DE NOTÍCIAS
====================================================== */

export function iniciarJobNoticias() {

  console.log("📰 Job de notícias inicializado")

  async function atualizar() {

    try {

      const noticias = await buscarNoticias()

      console.log(
        `📰 Notícias atualizadas: ${noticias.length}`
      )

    } catch (e) {

      console.error(
        "❌ Erro job notícias:",
        e.message
      )
    }

    /* ======================================================
       🔥 ECONOMIA DE REQUISIÇÕES
       
       1 req a cada 30 min
       = 48 req por dia
    ====================================================== */

    setTimeout(
      atualizar,
      30 * 60 * 1000
    )
  }

  atualizar()
}
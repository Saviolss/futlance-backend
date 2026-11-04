import { buscarTimesCampeonatos } from "../servicos/time.servico.js"

import { prisma } from "../lib/prisma.js"

/* ======================================================
   JOB DOS TIMES
====================================================== */

export function iniciarJobTimes() {

  console.log(
    "🌎 Job de times inicializado"
  )

  async function atualizar() {
    let houveErro = false

    try {

      /* =====================================
         LISTA DE TIMES
      ===================================== */

      const times =
        await buscarTimesCampeonatos()

      console.log(
        `⚽ Times encontrados: ${times.length}`
      )

      if (times.length === 0) {
        houveErro = true
        console.error(
          "❌ Nenhum time encontrado; uma nova tentativa será feita em 1 hora."
        )
      }

      /* =====================================
         TIMES
      ===================================== */

      for (const item of times) {

        try {

          await prisma.time.upsert({

            where: {
              timeId: item.time_id
            },

            update: {
              timeId: item.time_id,

              nome:
                item.nome,

              nomePopular:
                item.nome,

              escudo:
                item.escudo,

              slug:
                item.slug
            },

            create: {

              timeId:
                item.time_id,

              nome:
                item.nome,

              nomePopular:
                item.nome,

              escudo:
                item.escudo,

              slug:
                item.slug
            }
          })


          await new Promise(resolve =>
            setTimeout(resolve, 500)
          )

        } catch (erro) {
          houveErro = true

          console.error(
            `❌ Erro time ${item.nome}:`,
            erro.message
          )
        }
      }

      if (houveErro) {
        console.warn(
          "⚠️ Atualização dos times concluída com erros."
        )
      } else {
        console.log(
          "🏁 Atualização dos times concluída"
        )
      }

    } catch (erro) {
      houveErro = true

      console.error(
        "❌ Erro job times:",
        erro.message
      )
    }

    /* =====================================
       PRÓXIMA ATUALIZAÇÃO
    ===================================== */

    const proximaAtualizacao =
      houveErro
        ? 60 * 60 * 1000
        : 15 * 24 * 60 * 60 * 1000

    console.log(
      `⏱ Próxima atualização em ${
        houveErro ? "1 hora" : "15 dias"
      }`
    )

    setTimeout(
      atualizar,
      proximaAtualizacao
    )
  }

  atualizar()
}
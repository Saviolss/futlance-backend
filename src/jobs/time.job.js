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

    try {

      /* =====================================
         LISTA DE TIMES
      ===================================== */

      const times =
        await buscarTimesCampeonatos()

      console.log(
        `⚽ Times encontrados: ${times.length}`
      )

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

          console.error(
            `❌ Erro time ${item.nome}:`,
            erro.message
          )
        }
      }

      console.log(
        "🏁 Atualização dos times concluída"
      )

    } catch (erro) {

      console.error(
        "❌ Erro job times:",
        erro.message
      )
    }

    /* =====================================
       24 HORAS
    ===================================== */

    const proximaAtualizacao =
      24 * 60 * 60 * 1000

    console.log(
      `⏱ Próxima atualização em ${proximaAtualizacao / 3600000
      } horas`
    )

    setTimeout(
      atualizar,
      proximaAtualizacao
    )
  }

  atualizar()
}
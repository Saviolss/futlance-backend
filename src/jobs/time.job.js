import { buscarTimesCopa, buscarTimePorSlug } from "../servicos/time.servico.js"

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
        await buscarTimesCopa()

      console.log(
        `⚽ Times encontrados: ${times.length}`
      )

      /* =====================================
         TIMES
      ===================================== */

      for (const item of times) {

        try {

          const time =
            await buscarTimePorSlug(
              item.slug
            )

          /* ==========================
             TIME
          ========================== */

          await prisma.time.upsert({

            where: {
              timeId: time.time_id
            },

            update: {
              timeId: time.time_id,

              nome:
                time.nome,

              nomePopular:
                time.nome_popular,

              sigla:
                time.sigla,

              escudo:
                time.escudo,

              slug:
                time.slug,

              tecnicoNome:
                time.tecnico?.nome || null,

              tecnicoPais:
                time.tecnico?.pais || null,


              idadeMedia:
                time.idadeMedia || null,

              alturaMedia:
                time.alturaMedia || null,

              camisa10:
                time.camisa10 || null,

              jogadoresNoPais:
                time.jogadoresNoPais || 0
            },

            create: {

              timeId:
                time.time_id,

              nome:
                time.nome,

              nomePopular:
                time.nome_popular,

              sigla:
                time.sigla,

              escudo:
                time.escudo,

              slug:
                time.slug,

              tecnicoNome:
                time.tecnico?.nome || null,

              tecnicoPais:
                time.tecnico?.pais || null,

              idadeMedia:
                time.idadeMedia || null,

              alturaMedia:
                time.alturaMedia || null,

              camisa10:
                time.camisa10 || null,

              jogadoresNoPais:
                time.jogadoresNoPais || 0
            }
          })

          /* ==========================
             ELENCO
          ========================== */

          await prisma.elenco.deleteMany({
            where: {
              timeId: time.time_id
            }
          })

          if (time.elenco?.length) {

            await prisma.elenco.createMany({

              data: time.elenco.map(
                jogador => ({

                  timeId:
                    time.time_id,

                  numeroCamisa:
                    jogador.numero_camisa,

                  nome:
                    jogador.nome,

                  nomeCompleto:
                    jogador.nome_completo,

                  posicao:
                    jogador.posicao,

                  clube:
                    jogador.clube,

                  alturaCm:
                    jogador.altura_cm
                })
              )
            })
          }

          /* ==========================
             PARTIDAS
          ========================== */

          for (const partida of time.proximasPartidas) {

            await prisma.partida.upsert({

              where: {
                partidaId_timeId: {
                  partidaId: partida.partida_id,
                  timeId: time.time_id
                }
              },

              update: {

                timeId:
                  time.time_id,

                campeonato:
                  partida.campeonato,

                status:
                  partida.status,

                data:
                  partida.data,

                hora:
                  partida.hora,

                mandante:
                  partida.mandante.nome,

                visitante:
                  partida.visitante.nome
              },

              create: {

                partidaId:
                  partida.partida_id,

                timeId:
                  time.time_id,

                campeonato:
                  partida.campeonato,

                status:
                  partida.status,

                data:
                  partida.data,

                hora:
                  partida.hora,

                mandante:
                  partida.mandante.nome,

                visitante:
                  partida.visitante.nome
              }
            })
          }

          console.log(
            `✅ ${time.nome_popular} salvo`
          )

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
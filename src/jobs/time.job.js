import { buscarTimesCampeonatos } from "../servicos/time.servico.js"
import { desativarTimeParaAssinaturas } from "../servicos/time.disponibilidade.service.js"
import { prisma } from "../lib/prisma.js"

export function iniciarJobTimes() {
  console.log("🌎 Job de times inicializado")

  async function atualizar() {
    let houveErro = false

    try {
      const times = await buscarTimesCampeonatos(
        undefined,
        { ignorarCache: true }
      )

      console.log(`⚽ Times encontrados: ${times.length}`)

      if (!Array.isArray(times) || times.length === 0) {
        throw new Error("Nenhum time encontrado. Atualização cancelada.")
      }

      const idsTimesAtuais = times.map(item => Number(item.time_id))

      if (
        idsTimesAtuais.some(id => !Number.isInteger(id) || id <= 0) ||
        new Set(idsTimesAtuais).size !== idsTimesAtuais.length
      ) {
        throw new Error("A lista contém IDs inválidos ou duplicados.")
      }

      for (const item of times) {
        try {
          await prisma.time.upsert({
            where: { timeId: Number(item.time_id) },
            update: {
              nome: item.nome,
              nomePopular: item.nome,
              apelido: item.apelido,
              escudo: item.escudo,
              slug: item.slug,
              disponivelAssinatura: true
            },
            create: {
              timeId: Number(item.time_id),
              nome: item.nome,
              nomePopular: item.nome,
              apelido: item.apelido,
              escudo: item.escudo,
              slug: item.slug,
              disponivelAssinatura: true
            }
          })

          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (erro) {
          houveErro = true
          console.error(`❌ Erro ao atualizar time ${item.nome}:`, erro.message)
        }
      }

      if (houveErro) {
        console.warn("⚠️ Atualização incompleta. Nenhum time será desativado.")
      } else {
        const timesForaDaSerieA = await prisma.time.findMany({
          where: {
            timeId: { notIn: idsTimesAtuais },
            disponivelAssinatura: true
          },
          select: {
            timeId: true,
            nomePopular: true
          }
        })

        console.log(`📋 Times que deixaram a Série A: ${timesForaDaSerieA.length}`)

        for (const time of timesForaDaSerieA) {
          try {
            await desativarTimeParaAssinaturas(time.timeId)
            console.log(`🔒 ${time.nomePopular} desativado para novas notificações.`)
          } catch (erro) {
            houveErro = true
            console.error(`❌ Erro ao desativar ${time.nomePopular}:`, erro.message)
          }
        }
      }

      if (!houveErro) {
        console.log("🏁 Atualização dos times concluída com sucesso.")
      }
    } catch (erro) {
      houveErro = true
      console.error("❌ Erro job times:", erro.message)
    }

    const proximaAtualizacao = houveErro
      ? 60 * 60 * 1000
      : 24 * 60 * 60 * 1000

    console.log(`⏱ Próxima atualização em ${houveErro ? "1 hora" : "1 dia"}`)
    setTimeout(atualizar, proximaAtualizacao)
  }

  atualizar()
}

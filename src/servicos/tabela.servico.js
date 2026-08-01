import { CAMPEONATOS } from "../constantes/campeonatos.js"
import { buscarTabelaApi } from "./apiFutebol.servico.js"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/* =========================================================
   FUNÇÃO BASE
========================================================= */

async function buscarTabelaCampeonato(idCampeonato) {

  try {

    /* Copa do Brasil continua sem tabela */
    if (idCampeonato === CAMPEONATOS.COPABRASIL) {

      return {

        tipo: "campeonatos",

        fase: null,

        dados: []

      }

    }

    const tabela = await prisma.tabela.findMany({

      where: {

        campeonato_id: idCampeonato

      },

      orderBy: [
        
        { fase: "asc" },

        { grupo: "asc" },

        { posicao: "asc" }

      ]

    })

    if (!tabela.length) {

      return {

        tipo: "campeonatos",

        fase: null,

        dados: []

      }

    }

    /* ============================
       FASE DE GRUPOS
    ============================ */

    const possuiGrupos = tabela.some(time => time.grupo)

    if (possuiGrupos) {

      const grupos = {}

      for (const time of tabela) {

        if (!grupos[time.grupo]) {

          grupos[time.grupo] = []

        }

        grupos[time.grupo].push({

          time_id: time.time_id,

          nome: time.nome,

          escudo: time.escudo,

          posicao: time.posicao,

          pontos: time.pontos,

          jogos: time.jogos,

          vitorias: time.vitorias,

          empates: time.empates,

          derrotas: time.derrotas,

          gols_pro: time.gols_pro,

          gols_contra: time.gols_contra,

          saldo_gols: time.saldo_gols,

          aproveitamento: time.aproveitamento

        })

      }

      return {

        tipo: "campeonatos",

        fase: "grupos",

        dados: Object.entries(grupos).map(

          ([grupo, times]) => ({

            grupo,

            times

          })

        )

      }

    }

    /* ============================
       PONTOS CORRIDOS
    ============================ */

    return {

      tipo: "campeonatos",

      fase: "tabela",

      dados: tabela.map(time => ({

        time_id: time.time_id,

        nome: time.nome,

        escudo: time.escudo,

        posicao: time.posicao,

        pontos: time.pontos,

        jogos: time.jogos,

        vitorias: time.vitorias,

        empates: time.empates,

        derrotas: time.derrotas,

        gols_pro: time.gols_pro,

        gols_contra: time.gols_contra,

        saldo_gols: time.saldo_gols,

        aproveitamento: time.aproveitamento

      }))

    }

  } catch (erro) {

    console.error(

      `❌ Erro ao buscar tabela ${idCampeonato}:`,

      erro.message

    )

    return {

      tipo: "campeonatos",

      fase: null,

      dados: []

    }

  }

}

export async function atualizarTabelaCampeonato(idCampeonato) {

  try {

    /* Copa do Brasil não possui tabela */

    if (idCampeonato === CAMPEONATOS.COPABRASIL) {
      return
    }

    const tabelaApi =
      await buscarTabelaApi(idCampeonato)

    const tabela =
      normalizarTabela(tabelaApi)

    /* ============================
       PONTOS CORRIDOS
    ============================ */

    if (tabela.fase === "tabela") {

      for (const time of tabela.dados) {

        await prisma.tabela.upsert({

          where: {

            campeonato_id_time_id: {

              campeonato_id: idCampeonato,

              time_id: time.time_id

            }

          },

          update: {

            nome: time.nome,

            escudo: time.escudo,

            posicao: time.posicao,

            pontos: time.pontos,

            jogos: time.jogos,

            vitorias: time.vitorias,

            empates: time.empates,

            derrotas: time.derrotas,

            gols_pro: time.gols_pro,

            gols_contra: time.gols_contra,

            saldo_gols: time.saldo_gols,

            aproveitamento: time.aproveitamento,

            grupo: null,

            fase: "tabela"

          },

          create: {

            campeonato_id: idCampeonato,

            time_id: time.time_id,

            nome: time.nome,

            escudo: time.escudo,

            posicao: time.posicao,

            pontos: time.pontos,

            jogos: time.jogos,

            vitorias: time.vitorias,

            empates: time.empates,

            derrotas: time.derrotas,

            gols_pro: time.gols_pro,

            gols_contra: time.gols_contra,

            saldo_gols: time.saldo_gols,

            aproveitamento: time.aproveitamento,

            grupo: null,

            fase: "tabela"

          }

        })

      }

      const ids = tabela.dados.map(time => time.time_id)

      await prisma.tabela.deleteMany({

        where: {

          campeonato_id: idCampeonato,

          time_id: {

            notIn: ids

          }

        }

      })

    }

    /* ============================
       FASE DE GRUPOS
    ============================ */

    if (tabela.fase === "grupos") {

      const ids = []

      for (const grupo of tabela.dados) {

        for (const time of grupo.times) {

          ids.push(time.time_id)

          await prisma.tabela.upsert({

            where: {

              campeonato_id_time_id: {

                campeonato_id: idCampeonato,

                time_id: time.time_id

              }

            },

            update: {

              nome: time.nome,

              escudo: time.escudo,

              posicao: time.posicao,

              pontos: time.pontos,

              jogos: time.jogos,

              vitorias: time.vitorias,

              empates: time.empates,

              derrotas: time.derrotas,

              gols_pro: time.gols_pro,

              gols_contra: time.gols_contra,

              saldo_gols: time.saldo_gols,

              aproveitamento: time.aproveitamento,

              grupo: grupo.grupo,

              fase: "grupos"

            },

            create: {

              campeonato_id: idCampeonato,

              time_id: time.time_id,

              nome: time.nome,

              escudo: time.escudo,

              posicao: time.posicao,

              pontos: time.pontos,

              jogos: time.jogos,

              vitorias: time.vitorias,

              empates: time.empates,

              derrotas: time.derrotas,

              gols_pro: time.gols_pro,

              gols_contra: time.gols_contra,

              saldo_gols: time.saldo_gols,

              aproveitamento: time.aproveitamento,

              grupo: grupo.grupo,

              fase: "grupos"

            }

          })

        }

      }

      await prisma.tabela.deleteMany({

        where: {

          campeonato_id: idCampeonato,

          time_id: {

            notIn: ids

          }

        }

      })

    }

    console.log(`✅ Tabela ${idCampeonato} atualizada`)

  } catch (erro) {

    console.error(

      `❌ Erro ao atualizar tabela ${idCampeonato}:`,

      erro.message

    )

  }

}


/* =========================================================
   NORMALIZA TABELA
========================================================= */

function normalizarTabela(tabela) {

  /* ============================
     PONTOS CORRIDOS
  ============================ */

  if (Array.isArray(tabela)) {

    return {
      fase: "tabela",

      dados: tabela.map(
        normalizarTime
      )
    }
  }

  /* ============================
     FASE DE GRUPOS
  ============================ */

  // 🔥 Copa do Mundo
  const faseGrupos =
    tabela?.["fase-de-grupos"]

  if (faseGrupos) {

    return {

      fase: "grupos",

      dados: Object.entries(faseGrupos)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([nomeGrupo, times]) => ({

        grupo:
          nomeGrupo
            .replace("grupo-", "")
            .toUpperCase(),

        times:
          (times || [])
            .map(normalizarTime)
      }))
    }
  }

  /* ============================
     MATA-MATA
  ============================ */

  if (tabela?.fases) {

    return {
      fase: "mata-mata",
      dados: []
    }
  }

  /* ============================
     FALLBACK
  ============================ */

  return {
    fase: null,
    dados: []
  }
}


/* =========================================================
   NORMALIZA TIME
========================================================= */

function normalizarTime(time) {

  const dadosTime = time.time || {}

  return {
    time_id: dadosTime.time_id,
    nome: dadosTime.nome_popular || "",
    escudo: dadosTime.escudo || "",

    posicao: time.posicao,
    pontos: time.pontos,
    jogos: time.jogos,

    vitorias: time.vitorias,
    empates: time.empates,
    derrotas: time.derrotas,

    gols_pro: time.gols_pro,
    gols_contra: time.gols_contra,
    saldo_gols: time.saldo_gols,

    aproveitamento: time.aproveitamento
  }
}


/* =========================================================
   EXPORTS
========================================================= */

export function buscarTabelaBrasileirao() {
  return buscarTabelaCampeonato(
    CAMPEONATOS.BRASILEIRAO
  )
}

export function buscarTabelaCopaMundo() {
  return buscarTabelaCampeonato(
    CAMPEONATOS.COPAMUNDO
  )
}

export function buscarTabelaCopaBrasil() {
  return buscarTabelaCampeonato(
    CAMPEONATOS.COPABRASIL
  )
}


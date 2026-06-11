import {
  buscarTabelaApi,
  buscarTimeApi,
  buscarProximasPartidasTimeApi,
  buscarElencosCopaApi
} from "../servicos/apiFutebol.servico.js"

import {
  getCache,
  setCache
} from "../cache/cacheMemoria.js"

import { CACHE_TTL } from "../constantes/cacheTTL.js"

import { CAMPEONATOS } from "../constantes/campeonatos.js"

/* ======================================================
   SLUG
====================================================== */

function gerarSlug(nome = "") {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/* ======================================================
   EXTRAI TIMES DA COPA
====================================================== */

function extrairTimesCopa(tabela) {

  const times = []

  Object.values(tabela || {}).forEach(fase => {

    if (!fase || typeof fase !== "object") {
      return
    }

    Object.values(fase).forEach(grupo => {

      if (!Array.isArray(grupo)) {
        return
      }

      grupo.forEach(item => {

        if (!item?.time) {
          return
        }

        times.push({
          time_id: item.time.time_id,
          nome: item.time.nome_popular,
          escudo: item.time.escudo
        })
      })
    })
  })

  return times
}

/* ======================================================
   LISTA DE TIMES DA COPA
====================================================== */

export async function buscarTimesCopa() {

  const chave = "copa:times"

  const cache = getCache(chave)

  if (cache) {
    return cache
  }

  const tabela = await buscarTabelaApi(
    CAMPEONATOS.COPAMUNDO
  )

  const times = extrairTimesCopa(tabela)

  const unicos = [
    ...new Map(
      times.map(t => [t.time_id, t])
    ).values()
  ]

  const resultado = unicos.map(time => ({
    ...time,
    slug: gerarSlug(time.nome)
  }))

  setCache(
    chave,
    resultado,
    CACHE_TTL.TABELA
  )

  return resultado
}

/* ======================================================
   PRÓXIMAS PARTIDAS
====================================================== */

function normalizarProximasPartidas(partidas = {}) {

  const lista = []

  Object.values(partidas).forEach(campeonato => {

    if (!Array.isArray(campeonato)) return

    campeonato.forEach(partida => {

      lista.push({
        partida_id: partida.partida_id,

        campeonato:
          partida.campeonato?.nome,

        status:
          partida.status,

        data:
          partida.data_realizacao,

        hora:
          partida.hora_realizacao,

        estadio:
          partida.estadio?.nome_popular,

        mandante: {
          nome:
            partida.time_mandante?.nome_popular,

          escudo:
            partida.time_mandante?.escudo
        },

        visitante: {
          nome:
            partida.time_visitante?.nome_popular,

          escudo:
            partida.time_visitante?.escudo
        }
      })
    })
  })

  return lista
}

/* ======================================================
   ELENCO
====================================================== */

function normalizarElenco(jogadores = []) {

  return jogadores.map(jogador => ({
    numero_camisa:
      jogador.numero_camisa,

    nome:
      jogador.nome_popular,

    nome_completo:
      jogador.nome_completo,

    posicao:
      jogador.posicao?.nome,

    sigla_posicao:
      jogador.posicao?.sigla,

    clube:
      jogador.clube,

    clube_pais:
      jogador.clube_pais,

    altura_cm:
      jogador.altura_cm,

    data_nascimento:
      jogador.data_nascimento
  }))
}

/* ======================================================
   ESTATÍSTICAS DO ELENCO
====================================================== */

function gerarEstatisticasElenco(jogadores = []) {

  const estatisticas = {
    goleiros: 0,
    defensores: 0,
    meioCampistas: 0,
    atacantes: 0
  }

  jogadores.forEach(jogador => {

    switch (jogador.posicao?.nome) {

      case "Goleiro":
        estatisticas.goleiros++
        break

      case "Defensor":
        estatisticas.defensores++
        break

      case "Meio-campista":
        estatisticas.meioCampistas++
        break

      case "Atacante":
        estatisticas.atacantes++
        break
    }
  })

  return estatisticas
}

/* ======================================================
   CLUBE MAIS REPRESENTADO
====================================================== */

function gerarClubeMaisConvocados(jogadores = []) {

  const clubes = {}

  jogadores.forEach(jogador => {

    if (!jogador.clube) return

    clubes[jogador.clube] =
      (clubes[jogador.clube] || 0) + 1
  })

  const ranking = Object.entries(clubes)
    .sort((a, b) => b[1] - a[1])

  if (!ranking.length) {
    return null
  }

  return {
    nome: ranking[0][0],
    quantidade: ranking[0][1]
  }
}

/* ======================================================
   PRINCIPAIS JOGADORES
====================================================== */

function gerarPrincipaisJogadores(jogadores = []) {

  return jogadores
    .slice(0, 5)
    .map(j => j.nome_popular)
}

/* ======================================================
   IDADE MÉDIA
====================================================== */

function calcularIdadeMedia(jogadores = []) {

  const hoje = new Date()

  const idades = jogadores
    .filter(j => j.data_nascimento)
    .map(j => {

      const [dia, mes, ano] =
        j.data_nascimento.split("/")

      const nascimento =
        new Date(ano, mes - 1, dia)

      let idade =
        hoje.getFullYear() -
        nascimento.getFullYear()

      const mesAtual =
        hoje.getMonth() -
        nascimento.getMonth()

      if (
        mesAtual < 0 ||
        (
          mesAtual === 0 &&
          hoje.getDate() <
          nascimento.getDate()
        )
      ) {
        idade--
      }

      return idade
    })

  if (!idades.length) return null

  const media =
    idades.reduce((a, b) => a + b, 0) /
    idades.length

  return Number(media.toFixed(1))
}

/* ======================================================
   ALTURA MÉDIA
====================================================== */

function calcularAlturaMedia(jogadores = []) {

  const alturas =
    jogadores
      .map(j => j.altura_cm)
      .filter(Boolean)

  if (!alturas.length) return null

  const media =
    alturas.reduce((a, b) => a + b, 0) /
    alturas.length

  return Number(media.toFixed(0))
}

/* ======================================================
   PAÍSES DOS CLUBES
====================================================== */

function gerarRankingPaises(jogadores = []) {

  const paises = {}

  jogadores.forEach(jogador => {

    if (!jogador.clube_pais) return

    paises[jogador.clube_pais] =
      (paises[jogador.clube_pais] || 0) + 1
  })

  return Object.entries(paises)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pais, quantidade]) => ({
      pais,
      quantidade
    }))
}

function calcularJogadoresNoPais(
  jogadores = [],
  siglaSelecao
) {

  if (!siglaSelecao) {
    return 0
  }

  return jogadores.filter(
    jogador =>
      jogador.clube_pais === siglaSelecao
  ).length
}

/* ======================================================
   CAMISA 10
====================================================== */

function buscarCamisa10(jogadores = []) {

  return jogadores.find(
    jogador => jogador.numero_camisa === 10
  )
}

/* ======================================================
   TEXTO SEO
====================================================== */

function gerarResumoSeo(time) {

  return `
${time.nome_popular} é uma das seleções participantes da Copa do Mundo 2026.

A equipe também é conhecida como ${time.apelido || time.nome_popular}.

Nesta página você acompanha próximos jogos, elenco, estatísticas e atualizações da seleção ${time.nome_popular}.
`
    .replace(/\s+/g, " ")
    .trim()
}

function gerarTextoAutomatico({
  time,
  tecnico,
  jogadores,
  estatisticas,
  clubeMaisConvocados
}) {

  const idadeMedia =
    calcularIdadeMedia(jogadores)

  const alturaMedia =
    calcularAlturaMedia(jogadores)

  const paises =
    gerarRankingPaises(jogadores)

  const camisa10 =
    buscarCamisa10(jogadores)

  const principais =
    gerarPrincipaisJogadores(jogadores)

  const textoPaises =
    paises.length
      ? paises
        .map(
          p =>
            `${p.quantidade} atuam em clubes da ${p.pais}`
        )
        .join(", ")
      : "Não há informações de clubes disponíveis"

  return `
${time.nome_popular} disputa a Copa do Mundo 2026 com um elenco formado por ${jogadores.length} jogadores.

A seleção é comandada por ${tecnico?.nome || "técnico não informado"}.

O grupo possui idade média de ${idadeMedia || "-"} anos e altura média de ${alturaMedia || "-"} cm.

O elenco conta com ${estatisticas.goleiros} goleiros, ${estatisticas.defensores} defensores, ${estatisticas.meioCampistas} meio-campistas e ${estatisticas.atacantes} atacantes.

O clube mais representado na convocação é ${clubeMaisConvocados?.nome || "não informado"}, com ${clubeMaisConvocados?.quantidade || 0} jogadores.

Dos atletas convocados, ${textoPaises}.

O camisa 10 da seleção é ${camisa10?.nome_popular || "não informado"}, atualmente atuando pelo ${camisa10?.clube || "clube não informado"}.

Entre os principais nomes da equipe estão ${principais.join(", ")}.
`
    .replace(/\s+/g, " ")
    .trim()
}

/* ======================================================
   DETALHES DO TIME
====================================================== */

export async function buscarTimePorSlug(slug) {

  const chave = `time:${slug}`

  const cache = getCache(chave)

  if (cache) {
    return cache
  }

  const times = await buscarTimesCopa()

  const encontrado = times.find(
    t => t.slug === slug
  )

  if (!encontrado) {
    return null
  }

  const [
    time,
    proximas,
    elencos
  ] = await Promise.all([
    buscarTimeApi(
      encontrado.time_id
    ),

    buscarProximasPartidasTimeApi(
      encontrado.time_id
    ),

    buscarElencosCopaApi(
      CAMPEONATOS.COPAMUNDO
    )
  ])

  const elencoSelecao =
    elencos?.elencos?.find(elenco => {

      const nomeApi =
        elenco.selecao
          ?.normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()

      const nomeTime =
        time.nome_popular
          ?.normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()

      return nomeApi === nomeTime
    })

  const jogadores =
    elencoSelecao?.jogadores || []

  const estatisticasElenco =
    gerarEstatisticasElenco(
      jogadores
    )

  const clubeMaisConvocados =
    gerarClubeMaisConvocados(
      jogadores
    )

  const idadeMedia =
    calcularIdadeMedia(jogadores)

  const alturaMedia =
    calcularAlturaMedia(jogadores)

  const paisesClubes =
    gerarRankingPaises(jogadores)

  const jogadoresNoPais =
    calcularJogadoresNoPais(
      jogadores,
      time.sigla
    )

  const camisa10 =
    buscarCamisa10(jogadores)

  const resultado = {

    time_id:
      time.time_id,

    nome:
      time.nome,

    nome_popular:
      time.nome_popular,

    apelido:
      time.apelido,

    sigla:
      time.sigla,

    escudo:
      time.escudo,

    slug,

    resumoSeo:
      gerarResumoSeo(time),

    tecnico:
      elencoSelecao?.tecnico || null,

    estatisticasElenco,

    clubeMaisConvocados,

    textoAutomatico:
      gerarTextoAutomatico({
        time,
        tecnico:
          elencoSelecao?.tecnico,
        jogadores,
        estatisticas:
          estatisticasElenco,
        clubeMaisConvocados
      }),

    elenco:
      normalizarElenco(
        jogadores
      ),

    idadeMedia,

    alturaMedia,

    jogadoresNoPais,

    paisesClubes,

    camisa10:
      camisa10?.nome_popular || null,

    proximasPartidas:
      normalizarProximasPartidas(
        proximas
      )
  }

  setCache(
    chave,
    resultado,
    CACHE_TTL.TABELA
  )

  return resultado
}
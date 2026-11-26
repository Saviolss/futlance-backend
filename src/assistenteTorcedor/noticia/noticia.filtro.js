
function normalizarTexto(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const INDICADORES_CLUBE_NO_TITULO = [
  "vence", "vencem", "enfrenta", "encara", "joga", "disputa",
  "anuncia", "contrata", "treina", "faz", "segue", "perde",
  "empata", "avanca", "avancam", "busca", "tera", "tem",
  "abre", "fecha", "recebe", "visita", "viaja", "demite",
  "apresenta", "confirma", "volta", "renova", "conquista",
  "decide", "esta", "vai", "pede", "torcida", "clube",
  "time", "elenco", "contratacao", "reforco", "derrota",
  "vitora", "classifica", "elimina", "goleia", "demite",
  "acerta", "negocia", "contrata", "dispensa", "pressiona",
  "enfrentara", "encara", "treinador", "presidente"
].map(normalizarTexto)

const PREPOSICOES_ANTES_DO_CLUBE = [
  "do", "da", "no", "na", "pelo", "pela", "para o",
  "para a", "contra o", "contra a", "com o", "com a",
  "sobre o", "sobre a", "ao", "a", "entre"
]

const INDICADORES_FUTEBOL = [
  "futebol", "campeonato", "brasileirao", "copa",
  "libertadores", "sul americana", "copa do brasil",
  "final", "semifinal", "classificacao", "serie a",
  "serie b", "serie c", "futebol feminino", "selecao",
  "gol", "gols", "partida", "jogo", "rodada",
  "classico", "torcida", "elenco", "contratacao",
  "reforco", "treino", "treinador", "tecnico",
  "presidente", "dirigente", "diretoria", "contrato",
  "atacante", "zagueiro", "goleiro", "volante",
  "lateral", "meia", "gramado", "estadio",
  "arbitragem", "pênalti", "penalti", "escalação",
  "escala", "relacionados", "mercado da bola",
  "transferencia", "fifa", "cbf", "conmebol",
  "mundial", "continental", "copa do mundo",
  "brasileiro", "paulista", "carioca", "mineiro",
  "gaucho", "nordestao", "recopa", "supercopa"
].map(normalizarTexto)

const NOMES_AMBIGUOS = new Set([
  "santos",
  "bahia",
  "vitoria",
  "sport",
  "inter",
  "america",
  "atletico",
  "portuguesa",
  "juventude",
  "coritiba",
  "cruzeiro",
  "vasco"
].map(normalizarTexto))

const SEGMENTOS_NAO_CLUBE = new Set([
  "brasileirao",
  "brasileiro",
  "campeonato brasileiro",
  "copa",
  "copa do brasil",
  "libertadores",
  "sul americana",
  "paulista",
  "carioca",
  "mineiro",
  "gaucho",
  "serie a",
  "serie b",
  "serie c",
  "futebol",
  "artigo",
  "noticia",
  "noticias",
  "times",
  "time",
  "esportes"
])

function contemFrase(texto, frase) {
  if (!texto || !frase) return false
  return ` ${texto} `.includes(` ${frase} `)
}

function contemAlgumIndicador(texto, indicadores) {
  return indicadores.some(indicador => contemFrase(texto, indicador))
}

function obterNomesDoTime(time) {
  return [...new Set(
    [time.nome, time.nomePopular, time.apelido, time.slug]
      .filter(Boolean)
      .map(normalizarTexto)
      .filter(nome => nome.length >= 3)
  )]
}

function obterSlugTimeNaUrl(url, nomesDoTime, time) {
  if (!url) return false

  try {
    const segmentos = new URL(url).pathname
      .split("/")
      .filter(Boolean)
      .map(normalizarTexto)

    const slugsDoTime = [
      time.slug,
      ...nomesDoTime
    ]
      .filter(Boolean)
      .map(normalizarTexto)

    // Reconhece URLs do tipo /times/palmeiras/
    const indiceTimes = segmentos.lastIndexOf("times")
    if (
      indiceTimes >= 0 &&
      slugsDoTime.includes(segmentos[indiceTimes + 1])
    ) return true

    // Reconhece URLs do tipo /futebol/flamengo/artigo/
    const indiceFutebol = segmentos.lastIndexOf("futebol")
    if (indiceFutebol >= 0) {
      const possivelTime = segmentos[indiceFutebol + 1]
      if (
        possivelTime &&
        !SEGMENTOS_NAO_CLUBE.has(possivelTime) &&
        slugsDoTime.includes(possivelTime)
      ) return true
    }

    // Reconhece URLs de outras fontes com o slug do clube.
    return segmentos.some(segmento =>
      slugsDoTime.includes(segmento)
    )
  } catch {
    return false
  }
}

function nomeAmbiguoNoTitulo(titulo, nome) {
  const posicao = titulo.indexOf(` ${nome} `)
  if (posicao < 0) return false

  const antesNome = titulo.slice(0, posicao + 1)
  const depoisNome = titulo.slice(posicao + nome.length + 2).trimStart()

  const mencaoComoSujeito = contemAlgumIndicador(
    depoisNome,
    INDICADORES_CLUBE_NO_TITULO
  )

  const mencaoComPreposicao = PREPOSICOES_ANTES_DO_CLUBE.some(preposicao =>
    antesNome.endsWith(`${preposicao} `)
  )

  return mencaoComoSujeito || mencaoComPreposicao
}

function mencionaTime(texto, nomesDoTime, titulo = false) {
  return nomesDoTime.some(nome => {
    if (!contemFrase(texto, nome)) return false

    if (NOMES_AMBIGUOS.has(nome)) {
      return titulo && nomeAmbiguoNoTitulo(texto, nome)
    }

    return true
  })
}

export function noticiaPertenceAoTime(noticia, time) {
  if (!noticia || !time) return false

  const titulo = normalizarTexto(noticia.titulo)
  const descricao = normalizarTexto(noticia.descricao)

  const categorias = normalizarTexto(
    Array.isArray(noticia.categoria)
      ? noticia.categoria.join(" ")
      : noticia.categoria
  )

  const contexto = [titulo, descricao, categorias]
    .filter(Boolean)
    .join(" ")

  const nomesDoTime = obterNomesDoTime(time)

  if (!titulo || !nomesDoTime.length) return false

  // Primeiro verifica se a URL identifica diretamente o clube.
  const urlEspecificaDoTime = obterSlugTimeNaUrl(
    noticia.url,
    nomesDoTime,
    time
  )

  if (urlEspecificaDoTime) return true

  // Exige contexto futebolístico para evitar notícias de outros assuntos.
  const mencionaFutebol = contemAlgumIndicador(
    contexto,
    INDICADORES_FUTEBOL
  )

  if (!mencionaFutebol) return false

  // Procura o time no título.
  const mencionaTimeNoTitulo = mencionaTime(
    titulo,
    nomesDoTime,
    true
  )

  if (mencionaTimeNoTitulo) return true

  // Procura o time na descrição.
  const mencionaTimeNaDescricao = mencionaTime(
    descricao,
    nomesDoTime,
    false
  )

  return mencionaTimeNaDescricao
}

function normalizarTexto(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const NOMES_EQUIVALENTES_TIMES = [
  ["santos", "santos fc", "santos futebol clube"],
  ["flamengo", "mengao", "clube de regatas do flamengo"],
  ["palmeiras", "verdao", "sociedade esportiva palmeiras"],
  ["corinthians", "timao", "sport club corinthians paulista"],
  ["sao paulo", "sao paulo fc", "spfc", "tricolor paulista"],
  ["gremio", "gremio fbpa", "gremio porto alegrense"],
  ["internacional", "sport club internacional", "colorado"],
  ["vasco", "vasco da gama", "club de regatas vasco da gama"],
  ["atletico mineiro", "atletico mg", "galo", "clube atletico mineiro"],
  ["athletico paranaense", "atletico paranaense", "athletico pr", "furacao"],
  ["botafogo", "botafogo de futebol e regatas", "fogao"],
  ["fluminense", "fluminense football club", "flu"],
  ["cruzeiro", "cruzeiro esporte clube"],
  ["red bull bragantino", "rb bragantino", "bragantino"],
  ["bahia", "esporte clube bahia"],
  ["fortaleza", "fortaleza esporte clube"],
  ["ceara", "ceara sporting club"],
  ["sport", "sport club do recife"],
  ["vitoria", "esporte clube vitoria"],
  ["goias", "goias esporte clube"]
].map(grupo => grupo.map(normalizarTexto))

const NOMES_AMBIGUOS = new Set([
  "santos",
  "sao paulo",
  "inter",
  "sport",
  "bahia",
  "vitoria"
])

const INDICADORES_CLUBE_NO_TITULO = [
  "x",
  "vence",
  "enfrenta",
  "encara",
  "joga",
  "disputa",
  "anuncia",
  "contrata",
  "treina",
  "faz",
  "segue",
  "perde",
  "empata",
  "avança",
  "avançam",
  "busca",
  "terá",
  "tem",
  "abre",
  "fecha",
  "recebe",
  "visita",
  "viaja",
  "demite",
  "apresenta",
  "confirma",
  "volta",
  "renova",
  "conquista",
  "decide",
  "está",
  "vai",
  "pede",
  "seleção",
  "classico",
  "torcida",
  "clube",
  "time"
].map(normalizarTexto)

const PREPOSICOES_ANTES_DO_CLUBE = [
  "do",
  "no",
  "pelo",
  "para o",
  "contra o",
  "com o",
  "sobre o",
  "ao",
  "x"
]

const INDICADORES_FUTEBOL = [
  "futebol",
  "campeonato",
  "brasileirao",
  "campeonato brasileiro",
  "copa",
  "libertadores",
  "copa do brasil",
  "final",
  "semifinal",
  "classificacao",
  "serie a",
  "serie b",
  "serie c",
  "futebol feminino",
  "selecao",
  "gol",
  "gols",
  "partida",
  "jogo",
  "rodada",
  "classico",
  "torcida",
  "elenco",
  "escalação",
  "contratacao",
  "reforco",
  "treino",
  "treinador",
  "tecnico",
  "presidente",
  "eleicao",
  "dirigente",
  "diretoria",
  "contrato",
  "atacante",
  "zagueiro",
  "goleiro",
  "volante",
  "lateral",
  "meia"
].map(normalizarTexto)

function contemFrase(texto, frase) {
  return ` ${texto} `.includes(` ${frase} `)
}

function nomeAmbiguoNoTitulo(titulo, nome) {
  const tituloComEspacos = ` ${titulo} `
  const mencao = ` ${nome} `
  const inicio = tituloComEspacos.indexOf(mencao)
  if (inicio < 0) return false

  const antesNome = tituloComEspacos.slice(0, inicio + 1)
  const aposNome = tituloComEspacos.slice(inicio + mencao.length).trimStart()
  const mencaoComoSujeito = INDICADORES_CLUBE_NO_TITULO.some(indicador =>
    aposNome.startsWith(`${indicador} `) || aposNome === indicador
  )
  const mencaoComPreposicao = PREPOSICOES_ANTES_DO_CLUBE.some(preposicao =>
    antesNome.endsWith(`${preposicao} `)
  )
  const mencaoEmConfronto = NOMES_EQUIVALENTES_TIMES
    .flat()
    .some(outroTime =>
      outroTime !== nome && aposNome.startsWith(`e ${outroTime} `)
    )

  return mencaoComoSujeito || mencaoComPreposicao || mencaoEmConfronto
}

function obterNomesDoTime(time) {
  const nomesDoTime = [time.nomePopular, time.nome]
    .filter(Boolean)
    .map(normalizarTexto)
    .filter(nome => nome.length >= 3)

  const nomesEquivalentes = NOMES_EQUIVALENTES_TIMES
    .filter(grupo => grupo.some(nome => nomesDoTime.includes(nome)))
    .flat()

  return [...new Set([...nomesDoTime, ...nomesEquivalentes])]
}

function obterSlugTimeNaUrl(url) {
  if (!url) return null

  try {
    const segmentos = new URL(url).pathname
      .split("/")
      .filter(Boolean)
      .map(normalizarTexto)
    const indiceTimes = segmentos.lastIndexOf("times")
    const indiceFutebol = segmentos.lastIndexOf("futebol")
    const indiceTime = indiceTimes >= 0 ? indiceTimes : indiceFutebol

    return indiceTime >= 0 ? segmentos[indiceTime + 1] || null : null
  } catch {
    return null
  }
}

export function noticiaPertenceAoTime(noticia, time) {
  const titulo = normalizarTexto(noticia.titulo)
  const descricao = normalizarTexto(noticia.descricao)
  const categorias = normalizarTexto(
    Array.isArray(noticia.categoria) ? noticia.categoria.join(" ") : noticia.categoria
  )
  const contexto = [titulo, descricao, categorias].filter(Boolean).join(" ")
  const nomesDoTime = obterNomesDoTime(time)

  const mencionaTimeNoTitulo = nomesDoTime.some(nome =>
    contemFrase(titulo, nome) &&
    (!NOMES_AMBIGUOS.has(nome) || nomeAmbiguoNoTitulo(titulo, nome))
  )
  const mencionaFutebol = INDICADORES_FUTEBOL.some(indicador =>
    contemFrase(contexto, indicador)
  )
  const slugTimeNaUrl = obterSlugTimeNaUrl(noticia.url)
  const slugsDoTime = [time.slug, ...nomesDoTime]
    .filter(Boolean)
    .map(normalizarTexto)
  const urlEspecificaDoTime = slugTimeNaUrl && slugsDoTime.includes(slugTimeNaUrl)

  if (slugTimeNaUrl && !urlEspecificaDoTime) return false
  return urlEspecificaDoTime || (mencionaTimeNoTitulo && mencionaFutebol)
}

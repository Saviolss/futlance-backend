const cache = new Map()

export function getCache(chave) {
  const item = cache.get(chave)

  if (!item) return null

  const agora = Date.now()

  if (agora > item.expiraEm) {
    cache.delete(chave)
    return null
  }

  return item.valor
}

export function setCache(chave, valor, ttlEmSegundos = 60) {
  const expiraEm = Date.now() + ttlEmSegundos * 1000

  cache.set(chave, {
    valor,
    expiraEm,
  })
}

export function deleteCache(chave) {
  cache.delete(chave)
}

export function limparTudo() {
  cache.clear()
}

import jwt from "jsonwebtoken"

import { prisma } from "../../lib/prisma.js"

function normalizarUsuarioId(usuarioId) {
  if (typeof usuarioId === "number") {
    return Number.isInteger(usuarioId) && usuarioId > 0 ? String(usuarioId) : null
  }

  if (typeof usuarioId !== "string") {
    return null
  }

  const valor = usuarioId.trim()

  if (!valor) {
    return null
  }

  if (/^\d+$/.test(valor)) {
    return Number.isInteger(Number(valor)) && Number(valor) > 0 ? String(valor) : null
  }

  const uuidValido = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

  return uuidValido.test(valor) ? valor : null
}

function removerCookieSessao(res) {
  const producao = process.env.NODE_ENV === "production"

  res.clearCookie("futlance_sessao", {
    httpOnly: true,
    secure: producao,
    sameSite: "lax",
    ...(producao ? { domain: ".futlance.com" } : {}),
    path: "/"
  })
}

export async function autenticarUsuario(req, res, next) {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET não configurado.")
      return res.status(500).json({
        autenticado: false,
        mensagem: "Erro interno de autenticação."
      })
    }

    const token = req.cookies?.futlance_sessao

    if (!token || typeof token !== "string") {
      return res.status(401).json({
        autenticado: false,
        mensagem: "Usuário não autenticado."
      })
    }

    let payload

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "futlance",
        audience: "futlance-usuario"
      })
    } catch (erro) {
      removerCookieSessao(res)

      if (erro.name === "TokenExpiredError") {
        return res.status(401).json({
          autenticado: false,
          mensagem: "Sessão expirada. Faça login novamente."
        })
      }

      return res.status(401).json({
        autenticado: false,
        mensagem: "Sessão inválida."
      })
    }

    const usuarioId = normalizarUsuarioId(payload.sub)

    if (!usuarioId) {
      removerCookieSessao(res)

      return res.status(401).json({
        autenticado: false,
        mensagem: "Sessão inválida."
      })
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        id: usuarioId
      },
      select: {
        id: true,
        ativo: true
      }
    })

    if (!usuario) {
      removerCookieSessao(res)

      return res.status(401).json({
        autenticado: false,
        mensagem: "Usuário não encontrado."
      })
    }

    if (!usuario.ativo) {
      removerCookieSessao(res)

      return res.status(403).json({
        autenticado: false,
        mensagem: "Esta conta está bloqueada."
      })
    }

    req.usuarioId = usuario.id
    req.usuario = usuario

    return next()
  } catch (erro) {
    console.error("❌ ERRO AO VERIFICAR SESSÃO:", erro)

    return res.status(500).json({
      autenticado: false,
      mensagem: "Erro interno ao verificar a sessão."
    })
  }
}
import jwt from "jsonwebtoken"


// ============================================================
// VERIFICAR AUTENTICAÇÃO
// ============================================================

export function autenticarUsuario(
  req,
  res,
  next
) {

  try {

    // ========================================================
    // PEGAR COOKIE
    // ========================================================

    const token =
      req.cookies?.futlance_sessao


    if (!token) {

      return res.status(401).json({

        autenticado: false,

        mensagem:
          "Usuário não autenticado."

      })

    }


    // ========================================================
    // VERIFICAR JWT
    // ========================================================

    const payload =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      )


    // ========================================================
    // SALVAR USUÁRIO NA REQUEST
    // ========================================================

    req.usuarioId =
      payload.usuarioId


    // ========================================================
    // CONTINUAR
    // ========================================================

    next()


  } catch (erro) {

    console.error(
      "Erro ao verificar sessão:",
      erro
    )


    return res.status(401).json({

      autenticado: false,

      mensagem:
        "Sessão inválida ou expirada."

    })

  }

}
import { OAuth2Client } from "google-auth-library"


// ============================================================
// CLIENTE GOOGLE
// ============================================================

const clienteGoogle = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
)


// ============================================================
// VALIDAR ID TOKEN
// ============================================================

export async function validarIdTokenGoogle(idToken) {

  try {

    // ========================================================
    // VALIDAÇÃO BÁSICA
    // ========================================================

    if (
      !idToken ||
      typeof idToken !== "string"
    ) {

      const erro = new Error(
        "ID Token do Google não informado."
      )

      erro.codigo =
        "TOKEN_GOOGLE_INVALIDO"

      throw erro

    }


    // ========================================================
    // VERIFICAR TOKEN
    // ========================================================

    const ticket =
      await clienteGoogle.verifyIdToken({

        idToken,

        audience:
          process.env.GOOGLE_CLIENT_ID

      })


    // ========================================================
    // PAYLOAD
    // ========================================================

    const payload =
      ticket.getPayload()


    if (!payload) {

      const erro = new Error(
        "Não foi possível obter os dados do Google."
      )

      erro.codigo =
        "TOKEN_GOOGLE_INVALIDO"

      throw erro

    }


    // ========================================================
    // DADOS
    // ========================================================

    const googleId =
      payload.sub

    const nome =
      payload.name

    const email =
      payload.email


    // ========================================================
    // VALIDAÇÕES
    // ========================================================

    if (!googleId) {

      const erro = new Error(
        "Identificador Google não encontrado."
      )

      erro.codigo =
        "TOKEN_GOOGLE_INVALIDO"

      throw erro

    }


    if (!email) {

      const erro = new Error(
        "E-mail Google não encontrado."
      )

      erro.codigo =
        "TOKEN_GOOGLE_INVALIDO"

      throw erro

    }


    if (!nome) {

      const erro = new Error(
        "Nome Google não encontrado."
      )

      erro.codigo =
        "TOKEN_GOOGLE_INVALIDO"

      throw erro

    }


    // ========================================================
    // E-MAIL VERIFICADO
    // ========================================================

    if (
      payload.email_verified !== true
    ) {

      const erro = new Error(
        "O e-mail do Google não foi verificado."
      )

      erro.codigo =
        "TOKEN_GOOGLE_INVALIDO"

      throw erro

    }


    // ========================================================
    // RETORNO
    // ========================================================

    return {

      googleId,

      nome,

      email:
        email.toLowerCase()

    }

  } catch (erro) {

    // ========================================================
    // ERRO CONTROLADO
    // ========================================================

    if (
      erro.codigo ===
      "TOKEN_GOOGLE_INVALIDO"
    ) {

      throw erro

    }


    // ========================================================
    // ERRO DO GOOGLE
    // ========================================================

    console.error(
      "Erro ao validar token do Google:",
      erro
    )


    const erroGoogle =
      new Error(
        "Token do Google inválido ou expirado."
      )

    erroGoogle.codigo =
      "TOKEN_GOOGLE_INVALIDO"


    throw erroGoogle

  }

}
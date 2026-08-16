import jwt from "jsonwebtoken"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
import {
  validarIdTokenGoogle
} from "./google.service.js"


// ============================================================
// IDIOMAS PERMITIDOS
// ============================================================

const IDIOMAS_PERMITIDOS = [
  "pt",
  "en",
  "es",
  "fr",
  "de",
  "it"
]


// ============================================================
// VALIDAR CONFIGURAÇÕES
// ============================================================

function validarConfiguracoes() {

  if (!process.env.GOOGLE_CLIENT_ID) {

    throw new Error(
      "GOOGLE_CLIENT_ID não configurado."
    )

  }


  if (!process.env.JWT_SECRET) {

    throw new Error(
      "JWT_SECRET não configurado."
    )

  }

}


// ============================================================
// NORMALIZAR IDIOMA
// ============================================================

function normalizarIdioma(idioma) {

  if (
    typeof idioma !== "string"
  ) {

    return "pt"

  }


  if (
    !IDIOMAS_PERMITIDOS.includes(idioma)
  ) {

    return "pt"

  }


  return idioma

}


// ============================================================
// CRIAR TOKEN DA SESSÃO
// ============================================================

function criarTokenSessao(usuario) {

  return jwt.sign(

    {
      sub: String(usuario.id),

      googleId: usuario.googleId

    },

    process.env.JWT_SECRET,

    {
      expiresIn: "7d",

      issuer: "futlance",

      audience: "futlance-usuario"
    }

  )

}


// ============================================================
// AUTENTICAR COM GOOGLE
// ============================================================

export async function autenticarComGoogle({

  idToken,

  idioma

}) {

  // ==========================================================
  // CONFIGURAÇÕES
  // ==========================================================

  validarConfiguracoes()


  // ==========================================================
  // VALIDAR TOKEN GOOGLE
  // ==========================================================

  const dadosGoogle =
    await validarIdTokenGoogle(
      idToken
    )


  // ==========================================================
  // NORMALIZAR IDIOMA
  // ==========================================================

  const idiomaUsuario =
    normalizarIdioma(
      idioma
    )


  // ==========================================================
  // PROCURAR USUÁRIO
  // ==========================================================

  let usuario =
    await prisma.usuario.findUnique({

      where: {
        googleId:
          dadosGoogle.googleId
      }

    })


  let criado = false


  // ==========================================================
  // CRIAR USUÁRIO
  // ==========================================================

  if (!usuario) {

    usuario =
      await prisma.usuario.create({

        data: {

          googleId:
            dadosGoogle.googleId,

          nome:
            dadosGoogle.nome,

          email:
            dadosGoogle.email,

          idioma:
            idiomaUsuario,

          aceitouPolitica:
            true,

          aceitouPoliticaEm:
            new Date(),

          ativo:
            true

        }

      })


    criado = true

  }


  // ==========================================================
  // USUÁRIO EXISTENTE
  // ==========================================================

  else {

    // --------------------------------------------------------
    // CONTA DESATIVADA
    // --------------------------------------------------------

    if (
      usuario.ativo === false
    ) {

      const erro =
        new Error(
          "Usuário bloqueado."
        )

      erro.codigo =
        "USUARIO_BLOQUEADO"

      throw erro

    }


    // --------------------------------------------------------
    // ATUALIZAR DADOS
    // --------------------------------------------------------

    usuario =
      await prisma.usuario.update({

        where: {

          id:
            usuario.id

        },

        data: {

          nome:
            dadosGoogle.nome,

          email:
            dadosGoogle.email,

          idioma:
            idiomaUsuario,

          aceitouPolitica:
            true,

          aceitouPoliticaEm:
            usuario.aceitouPoliticaEm ||
            new Date()

        }

      })

  }


  // ==========================================================
  // GERAR SESSÃO
  // ==========================================================

  const token =
    criarTokenSessao(
      usuario
    )


  // ==========================================================
  // RETORNO
  // ==========================================================

  return {

    criado,

    token,

    usuario: {

      id:
        usuario.id,

      nome:
        usuario.nome,

      email:
        usuario.email,

      idioma:
        usuario.idioma,

      ativo:
        usuario.ativo

    }

  }

}

export async function buscarSessao(
  usuarioId
) {

  const usuario =
    await prisma.usuario.findUnique({

      where: {
        id: usuarioId
      },

      select: {

        id: true,

        nome: true,

        email: true,

        idioma: true,

        ativo: true

      }

    })


  if (!usuario) {

    throw new Error(
      "Usuário não encontrado."
    )

  }


  if (!usuario.ativo) {

    throw new Error(
      "Usuário desativado."
    )

  }


  return usuario

}
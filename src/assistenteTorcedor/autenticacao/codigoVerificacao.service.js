import bcrypt from "bcrypt"

import { PrismaClient } from "@prisma/client"

import {
  enviarCodigoPorEmail
} from "./email.service.js"


const prisma = new PrismaClient()


// ============================================================
// CONFIGURAÇÕES
// ============================================================

const VALIDADE_CODIGO_MINUTOS = 10

const MAX_TENTATIVAS = 5

const SALT_ROUNDS = 12


// ============================================================
// GERAR CÓDIGO
// ============================================================

function gerarCodigo() {

  return Math.floor(
    100000 +
    Math.random() * 900000
  ).toString()

}


// ============================================================
// GERAR HASH DO CÓDIGO
// ============================================================

async function gerarHashCodigo(codigo) {

  return bcrypt.hash(
    codigo,
    SALT_ROUNDS
  )

}


// ============================================================
// CRIAR CÓDIGO
// ============================================================

export async function criarCodigoVerificacao({

  usuarioId,

  tipo

}) {

  // ==========================================================
  // TIPOS PERMITIDOS
  // ==========================================================

  const tiposPermitidos = [

    "CONFIRMAR_EMAIL",

    "REDEFINIR_SENHA"

  ]


  if (
    !tiposPermitidos.includes(tipo)
  ) {

    const erro =
      new Error(
        "Tipo de código inválido."
      )

    erro.codigo =
      "TIPO_CODIGO_INVALIDO"

    throw erro

  }


  // ==========================================================
  // BUSCAR USUÁRIO
  // ==========================================================

  const usuario =
    await prisma.usuario.findUnique({

      where: {

        id:
          usuarioId

      },

      select: {

        id: true,

        nome: true,

        email: true,

        ativo: true

      }

    })


  // ==========================================================
  // USUÁRIO NÃO ENCONTRADO
  // ==========================================================

  if (!usuario) {

    const erro =
      new Error(
        "Usuário não encontrado."
      )

    erro.codigo =
      "USUARIO_NAO_ENCONTRADO"

    throw erro

  }


  // ==========================================================
  // USUÁRIO DESATIVADO
  // ==========================================================

  if (
    usuario.ativo === false
  ) {

    const erro =
      new Error(
        "Usuário desativado."
      )

    erro.codigo =
      "USUARIO_BLOQUEADO"

    throw erro

  }


  // ==========================================================
  // INVALIDAR CÓDIGOS ANTERIORES
  // ==========================================================

  await prisma.codigoVerificacao.updateMany({

    where: {

      usuarioId,

      tipo,

      usado: false

    },

    data: {

      usado: true

    }

  })


  // ==========================================================
  // GERAR CÓDIGO
  // ==========================================================

  const codigo =
    gerarCodigo()


  // ==========================================================
  // HASH
  // ==========================================================

  const codigoHash =
    await gerarHashCodigo(
      codigo
    )


  // ==========================================================
  // EXPIRAÇÃO
  // ==========================================================

  const expiracao =
    new Date(
      Date.now() +
      VALIDADE_CODIGO_MINUTOS *
      60 *
      1000
    )


  // ==========================================================
  // SALVAR NO BANCO
  // ==========================================================

  const registro =
    await prisma.codigoVerificacao.create({

      data: {

        usuarioId,

        codigoHash,

        tipo,

        expiracao,

        usado: false,

        tentativas: 0

      }

    })


  // ==========================================================
  // ENVIAR PELO BREVO
  // ==========================================================

  try {

    await enviarCodigoPorEmail({

      para:
        usuario.email,

      nome:
        usuario.nome,

      codigo,

      tipo

    })

  } catch (erro) {

    // ========================================================
    // SE O E-MAIL FALHAR
    // INVALIDAR O CÓDIGO
    // ========================================================

    await prisma.codigoVerificacao.update({

      where: {

        id:
          registro.id

      },

      data: {

        usado: true

      }

    })


    console.error(
      "❌ Código criado, mas não foi possível enviar o e-mail:",
      erro
    )


    const erroEnvio =
      new Error(
        "Não foi possível enviar o código de verificação."
      )

    erroEnvio.codigo =
      "ERRO_ENVIO_EMAIL"

    throw erroEnvio

  }


  // ==========================================================
  // RETORNO
  // ==========================================================
  //
  // IMPORTANTE:
  //
  // O código puro NÃO é salvo no banco.
  //
  // Ele somente existe temporariamente nesta função
  // para ser enviado pelo Brevo.
  //

  return {

    id:
      registro.id,

    codigo,

    expiracao

  }

}


// ============================================================
// VALIDAR CÓDIGO
// ============================================================

export async function validarCodigoVerificacao({

  usuarioId,

  tipo,

  codigo

}) {

  // ==========================================================
  // VALIDAR FORMATO
  // ==========================================================

  if (
    typeof codigo !== "string" ||
    !/^\d{6}$/.test(codigo)
  ) {

    const erro =
      new Error(
        "Código inválido."
      )

    erro.codigo =
      "CODIGO_INVALIDO"

    throw erro

  }


  // ==========================================================
  // BUSCAR CÓDIGO MAIS RECENTE
  // ==========================================================

  const registro =
    await prisma.codigoVerificacao.findFirst({

      where: {

        usuarioId,

        tipo,

        usado: false

      },

      orderBy: {

        criadoEm: "desc"

      }

    })


  // ==========================================================
  // NÃO ENCONTRADO
  // ==========================================================

  if (!registro) {

    const erro =
      new Error(
        "Código inválido ou expirado."
      )

    erro.codigo =
      "CODIGO_INVALIDO"

    throw erro

  }


  // ==========================================================
  // LIMITE DE TENTATIVAS
  // ==========================================================

  if (
    registro.tentativas >=
    MAX_TENTATIVAS
  ) {

    await prisma.codigoVerificacao.update({

      where: {

        id:
          registro.id

      },

      data: {

        usado: true

      }

    })


    const erro =
      new Error(
        "Código inválido ou expirado."
      )

    erro.codigo =
      "CODIGO_INVALIDO"

    throw erro

  }


  // ==========================================================
  // EXPIRAÇÃO
  // ==========================================================

  if (
    new Date() >
    registro.expiracao
  ) {

    await prisma.codigoVerificacao.update({

      where: {

        id:
          registro.id

      },

      data: {

        usado: true

      }

    })


    const erro =
      new Error(
        "Código inválido ou expirado."
      )

    erro.codigo =
      "CODIGO_INVALIDO"

    throw erro

  }


  // ==========================================================
  // COMPARAR HASH
  // ==========================================================

  const correto =
    await bcrypt.compare(

      codigo,

      registro.codigoHash

    )


  // ==========================================================
  // CÓDIGO INCORRETO
  // ==========================================================

  if (!correto) {

    const atualizado =
      await prisma.codigoVerificacao.update({

        where: {

          id:
            registro.id

        },

        data: {

          tentativas: {

            increment: 1

          }

        }

      })


    // ========================================================
    // ATINGIU LIMITE
    // ========================================================

    if (
      atualizado.tentativas >=
      MAX_TENTATIVAS
    ) {

      await prisma.codigoVerificacao.update({

        where: {

          id:
            registro.id

        },

        data: {

          usado: true

        }

      })

    }


    const erro =
      new Error(
        "Código inválido ou expirado."
      )

    erro.codigo =
      "CODIGO_INVALIDO"

    throw erro

  }


  // ==========================================================
  // CÓDIGO CORRETO
  // ==========================================================

  const codigoValidado =
    await prisma.codigoVerificacao.update({

      where: {

        id:
          registro.id

      },

      data: {

        usado: true

      }

    })


  // ==========================================================
  // RETORNO
  // ==========================================================

  return {

    valido: true,

    id:
      codigoValidado.id,

    usuarioId:
      codigoValidado.usuarioId,

    tipo:
      codigoValidado.tipo

  }

}
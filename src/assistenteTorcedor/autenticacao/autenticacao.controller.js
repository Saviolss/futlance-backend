import * as autenticacaoService from "./autenticacao.service.js";
import {
  buscarSessao
} from "./autenticacao.service.js"
// ============================================================
// LOGIN COM GOOGLE
// ============================================================

export async function entrarComGoogle(req, res) {

  try {

    const {
      idToken,
      idioma,
      aceitouPolitica
    } = req.body;

    // ========================================================
    // VALIDAÇÃO BÁSICA
    // ========================================================

    if (!idToken || typeof idToken !== "string") {

      return res.status(400).json({
        sucesso: false,
        mensagem: "Token do Google não informado."
      });

    }

    // ========================================================
    // IDIOMA
    // ========================================================

    const idiomasPermitidos = [
      "pt",
      "en",
      "es",
      "fr",
      "de",
      "it"
    ];

    const idiomaUsuario =
      typeof idioma === "string" &&
        idiomasPermitidos.includes(idioma)
        ? idioma
        : "pt";

    // ========================================================
    // POLÍTICA DE PRIVACIDADE
    // ========================================================

    if (aceitouPolitica !== true) {

      return res.status(400).json({
        sucesso: false,
        mensagem: "É necessário aceitar a Política de Privacidade e os Termos de Uso."
      });

    }

    // ========================================================
    // AUTENTICAÇÃO
    // ========================================================

    const resultado =
      await autenticacaoService.autenticarComGoogle({
        idToken,
        idioma: idiomaUsuario
      });

    // ========================================================
    // COOKIE DE SESSÃO
    // ========================================================

    const producao =
      process.env.NODE_ENV === "production"


    res.cookie(
      "futlance_sessao",
      resultado.token,
      {
        httpOnly: true,

        secure: producao,

        sameSite: "lax",

        ...(producao
          ? {
            domain: ".futlance.com"
          }
          : {}),

        maxAge:
          1000 * 60 * 60 * 24 * 7,

        path: "/"
      }
    )

    // ========================================================
    // RESPOSTA
    // ========================================================

    return res.status(
      resultado.criado ? 201 : 200
    ).json({

      sucesso: true,

      mensagem: resultado.criado
        ? "Conta criada com sucesso."
        : "Login realizado com sucesso.",

      usuario: resultado.usuario

    });

  } catch (erro) {

    console.error(
      "Erro na autenticação com Google:",
      erro
    );

    // ========================================================
    // ERROS CONTROLADOS
    // ========================================================

    if (erro.codigo === "TOKEN_GOOGLE_INVALIDO") {

      return res.status(401).json({
        sucesso: false,
        mensagem: "Token do Google inválido ou expirado."
      });

    }

    if (erro.codigo === "USUARIO_BLOQUEADO") {

      return res.status(403).json({
        sucesso: false,
        mensagem: "Esta conta está bloqueada."
      });

    }

    // ========================================================
    // ERRO GENÉRICO
    // ========================================================

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível realizar a autenticação."
    });

  }

}


// ============================================================
// VERIFICAR SESSÃO
// ============================================================

export async function verificarSessao(req, res) {

  try {

    // O middleware de autenticação deverá
    // colocar o usuário em req.usuario.

    if (!req.usuario) {

      return res.status(401).json({
        sucesso: false,
        autenticado: false,
        mensagem: "Usuário não autenticado."
      });

    }

    return res.status(200).json({

      sucesso: true,

      autenticado: true,

      usuario: req.usuario

    });

  } catch (erro) {

    console.error(
      "Erro ao verificar sessão:",
      erro
    );

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível verificar a sessão."
    });

  }

}

export async function sessao(
  req,
  res,
  next
) {

  try {

    const usuario =
      await buscarSessao(
        req.usuarioId
      )


    return res.json({

      autenticado: true,

      usuario

    })


  } catch (erro) {

    next(erro)

  }

}


// ============================================================
// SAIR DA CONTA
// ============================================================

export async function sair(req, res) {

  try {

    res.clearCookie(
      "futlance_sessao",
      {
        httpOnly: true,

        secure: process.env.NODE_ENV === "production",

        sameSite: "lax",

        path: "/"
      }
    );

    return res.status(200).json({

      sucesso: true,

      mensagem: "Sessão encerrada com sucesso."

    });

  } catch (erro) {

    console.error(
      "Erro ao encerrar sessão:",
      erro
    );

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível encerrar a sessão."
    });

  }

}

export async function logout(
  req,
  res
) {

  const producao =
    process.env.NODE_ENV === "production"


  res.clearCookie(
    "futlance_sessao",
    {

      httpOnly: true,

      secure: producao,

      sameSite: "lax",

      ...(producao
        ? {
          domain: ".futlance.com"
        }
        : {}),

      path: "/"

    }
  )


  return res.json({

    sucesso: true,

    mensagem:
      "Sessão encerrada."

  })

}
import * as autenticacaoService from "./autenticacao.service.js"

function criarCookieSessao(res, token) {
  const producao = process.env.NODE_ENV === "production"
  res.cookie("futlance_sessao", token, {
    httpOnly: true,
    secure: producao,
    sameSite: "lax",
    ...(producao ? { domain: ".futlance.com" } : {}),
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: "/"
  })
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

// ============================================================
// POST /auth/google
// ============================================================

export async function entrarComGoogle(req, res) {
  try {
    const { idToken, idioma, aceitouPolitica } = req.body

    if (!idToken || typeof idToken !== "string") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Token do Google não informado."
      })
    }

    if (aceitouPolitica !== true) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "É necessário aceitar a Política de Privacidade e os Termos de Uso."
      })
    }

    const resultado = await autenticacaoService.autenticarComGoogle({
      idToken,
      idioma
    })

    criarCookieSessao(res, resultado.token)

    return res.status(resultado.criado ? 201 : 200).json({
      sucesso: true,
      mensagem: resultado.criado ? "Conta criada com sucesso." : "Login realizado com sucesso.",
      usuario: resultado.usuario
    })
  } catch (erro) {
    console.error("Erro na autenticação com Google:", erro)

    if (erro.codigo === "TOKEN_GOOGLE_INVALIDO") {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Token do Google inválido ou expirado."
      })
    }

    if (erro.codigo === "USUARIO_BLOQUEADO") {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Esta conta está bloqueada."
      })
    }

    if (erro.codigo === "EMAIL_JA_CADASTRADO") {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Este e-mail já está cadastrado. Entre utilizando e-mail e senha."
      })
    }

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível realizar a autenticação."
    })
  }
}

// ============================================================
// POST /auth/cadastro
// ============================================================

export async function cadastrar(req, res) {
  try {
    const { nome, email, senha, idioma, aceitouPolitica } = req.body

    if (aceitouPolitica !== true) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "É necessário aceitar a Política de Privacidade e os Termos de Uso."
      })
    }

    const resultado = await autenticacaoService.cadastrarComEmail({
      nome,
      email,
      senha,
      idioma,
      aceitouPolitica
    })

    return res.status(201).json({
      sucesso: true,
      criado: resultado.criado,
      aguardandoConfirmacao: resultado.aguardandoConfirmacao,
      usuarioId: resultado.usuarioId,
      email: resultado.email,
      mensagem: resultado.mensagem
    })
  } catch (erro) {
    console.error("Erro no cadastro:", erro)

    if (erro.codigo === "POLITICA_NAO_ACEITA") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "É necessário aceitar a Política de Privacidade e os Termos de Uso."
      })
    }

    if (erro.codigo === "NOME_INVALIDO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nome inválido."
      })
    }

    if (erro.codigo === "EMAIL_INVALIDO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "E-mail inválido."
      })
    }

    if (erro.codigo === "SENHA_INVALIDA") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A senha deve ter pelo menos 6 caracteres, um número e um caractere especial."
      })
    }

    if (erro.codigo === "EMAIL_JA_CADASTRADO") {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Este e-mail já está cadastrado."
      })
    }

    if (erro.codigo === "ERRO_ENVIO_EMAIL") {
      return res.status(503).json({
        sucesso: false,
        mensagem: "Não foi possível enviar o código de confirmação. Tente novamente."
      })
    }

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível criar sua conta."
    })
  }
}

// ============================================================
// POST /auth/confirmar-email
// ============================================================

export async function confirmarEmail(req, res) {
  try {
    const { usuarioId, codigo } = req.body

    if (!usuarioId || !codigo || typeof codigo !== "string") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do usuário e código de confirmação são obrigatórios."
      })
    }

    const resultado = await autenticacaoService.confirmarEmail({
      usuarioId,
      codigo
    })

    criarCookieSessao(res, resultado.token)

    return res.status(200).json({
      sucesso: true,
      confirmado: resultado.confirmado,
      mensagem: "E-mail confirmado com sucesso.",
      usuario: resultado.usuario
    })
  } catch (erro) {
    console.error("Erro ao confirmar e-mail:", erro)

    if (erro.codigo === "CODIGO_INVALIDO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Código inválido ou expirado."
      })
    }

    if (erro.codigo === "EMAIL_JA_VERIFICADO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Este e-mail já foi confirmado."
      })
    }

    if (erro.codigo === "USUARIO_NAO_ENCONTRADO") {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado."
      })
    }

    if (erro.codigo === "USUARIO_BLOQUEADO") {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Esta conta está bloqueada."
      })
    }

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível confirmar o e-mail."
    })
  }
}

// ============================================================
// POST /auth/reenviar-codigo
// ============================================================

export async function reenviarCodigo(req, res) {
  try {
    const { email } = req.body

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "E-mail é obrigatório."
      })
    }

    const resultado = await autenticacaoService.reenviarCodigoConfirmacao({
      email
    })

    return res.status(200).json({
      sucesso: true,
      enviado: resultado.enviado,
      mensagem: "Se o e-mail estiver cadastrado e ainda não confirmado, um novo código será enviado."
    })
  } catch (erro) {
    console.error("Erro ao reenviar código:", erro)

    if (erro.codigo === "EMAIL_INVALIDO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "E-mail inválido."
      })
    }

    if (erro.codigo === "ERRO_ENVIO_EMAIL") {
      return res.status(503).json({
        sucesso: false,
        mensagem: "Não foi possível enviar o código. Tente novamente."
      })
    }

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível reenviar o código."
    })
  }
}

// ============================================================
// POST /auth/login
// ============================================================

export async function entrarComEmail(req, res) {
  try {
    const { email, senha } = req.body

    if (typeof email !== "string" || typeof senha !== "string") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "E-mail ou senha inválidos."
      })
    }

    const resultado = await autenticacaoService.autenticarComEmail({
      email,
      senha
    })

    criarCookieSessao(res, resultado.token)

    return res.status(200).json({
      sucesso: true,
      mensagem: "Login realizado com sucesso.",
      usuario: resultado.usuario
    })
  } catch (erro) {
    console.error("Erro no login por e-mail:", erro)

    if (erro.codigo === "CREDENCIAIS_INVALIDAS") {
      return res.status(401).json({
        sucesso: false,
        mensagem: "E-mail ou senha inválidos."
      })
    }

    if (erro.codigo === "USUARIO_BLOQUEADO") {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Esta conta está bloqueada."
      })
    }

    if (erro.codigo === "EMAIL_NAO_VERIFICADO") {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Confirme seu e-mail antes de fazer login."
      })
    }

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível realizar o login."
    })
  }
}

// ============================================================
// POST /auth/esqueci-senha
// ============================================================

export async function esqueciSenha(req, res) {
  try {
    const { email } = req.body

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "E-mail é obrigatório."
      })
    }

    const resultado = await autenticacaoService.esqueciSenha({
      email
    })

    return res.status(200).json({
      sucesso: true,
      enviado: resultado.enviado,
      mensagem: "Se o e-mail estiver cadastrado, enviaremos um código para redefinir sua senha."
    })
  } catch (erro) {
    console.error("Erro ao solicitar redefinição de senha:", erro)

    if (erro.codigo === "EMAIL_INVALIDO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "E-mail inválido."
      })
    }

    if (erro.codigo === "ERRO_ENVIO_EMAIL") {
      return res.status(503).json({
        sucesso: false,
        mensagem: "Não foi possível enviar o código. Tente novamente."
      })
    }

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível processar a solicitação."
    })
  }
}

// ============================================================
// POST /auth/redefinir-senha
// ============================================================

export async function redefinirSenha(req, res) {
  try {
    const { email, codigo, novaSenha } = req.body

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "E-mail é obrigatório."
      })
    }

    if (typeof codigo !== "string" || !/^\d{6}$/.test(codigo)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Código inválido ou expirado."
      })
    }

    if (typeof novaSenha !== "string") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nova senha é obrigatória."
      })
    }

    const resultado = await autenticacaoService.redefinirSenha({
      email,
      codigo,
      novaSenha
    })

    removerCookieSessao(res)

    return res.status(200).json({
      sucesso: true,
      redefinida: resultado.redefinida,
      mensagem: "Senha redefinida com sucesso. Faça login novamente."
    })
  } catch (erro) {
    console.error("Erro ao redefinir senha:", erro)

    if (erro.codigo === "EMAIL_INVALIDO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "E-mail inválido."
      })
    }

    if (erro.codigo === "SENHA_INVALIDA") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A senha deve ter pelo menos 6 caracteres, um número e um caractere especial."
      })
    }

    if (erro.codigo === "CODIGO_INVALIDO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Código inválido ou expirado."
      })
    }

    if (erro.codigo === "USUARIO_BLOQUEADO") {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Esta conta está bloqueada."
      })
    }

    if (erro.codigo === "CONTA_SEM_SENHA") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Esta conta não possui senha para redefinir."
      })
    }

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível redefinir a senha."
    })
  }
}

// ============================================================
// GET /auth/sessao
// ============================================================

export async function sessao(req, res, next) {
  try {
    const usuario = await autenticacaoService.buscarSessao(req.usuarioId)

    return res.status(200).json({
      sucesso: true,
      autenticado: true,
      usuario
    })
  } catch (erro) {
    next(erro)
  }
}

// ============================================================
// POST /auth/logout
// ============================================================

export async function logout(req, res) {
  try {
    removerCookieSessao(res)

    return res.status(200).json({
      sucesso: true,
      mensagem: "Sessão encerrada com sucesso."
    })
  } catch (erro) {
    console.error("Erro ao encerrar sessão:", erro)

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível encerrar a sessão."
    })
  }
}
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { validarIdTokenGoogle } from "./google.service.js"
import { criarCodigoVerificacao, validarCodigoVerificacao } from "./codigoVerificacao.service.js"
import { cancelarAssinaturaStripe } from "../pagamento/stripe.service.js"
import { prisma } from "../../lib/prisma.js"
const IDIOMAS_PERMITIDOS = ["pt", "en", "es", "fr", "de", "it"]
const SALT_ROUNDS = 12
const MAX_TENTATIVAS = 5
const JWT_ISSUER = "futlance"
const JWT_AUDIENCE = "futlance-usuario"

function validarJwt() {
  if (!process.env.JWT_SECRET) {
    const erro = new Error("JWT_SECRET não configurado.")
    erro.codigo = "JWT_SECRET_NAO_CONFIGURADO"
    throw erro
  }
}

function validarGoogle() {
  validarJwt()
  if (!process.env.GOOGLE_CLIENT_ID) {
    const erro = new Error("GOOGLE_CLIENT_ID não configurado.")
    erro.codigo = "GOOGLE_CLIENT_ID_NAO_CONFIGURADO"
    throw erro
  }
}

function normalizarIdioma(idioma) {
  if (typeof idioma !== "string") return "pt"
  const idiomaNormalizado = idioma.split("-")[0].toLowerCase()
  return IDIOMAS_PERMITIDOS.includes(idiomaNormalizado) ? idiomaNormalizado : "pt"
}

function normalizarEmail(email) {
  if (typeof email !== "string") return ""
  return email.trim().toLowerCase()
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validarSenha(senha) {
  if (typeof senha !== "string") return false
  if (senha.length < 6) return false
  if (!/[0-9]/.test(senha)) return false
  if (!/[^A-Za-z0-9\s]/.test(senha)) return false
  return true
}

function normalizarUsuarioId(usuarioId) {
  if (typeof usuarioId === "number") {
    return Number.isInteger(usuarioId) && usuarioId > 0 ? String(usuarioId) : null
  }
  if (typeof usuarioId !== "string") return null
  const valor = usuarioId.trim()
  if (!valor) return null
  if (/^\d+$/.test(valor)) {
    return Number.isInteger(Number(valor)) && Number(valor) > 0 ? String(valor) : null
  }
  const uuidValido = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
  return uuidValido.test(valor) ? valor : null
}

function criarTokenSessao(usuario) {
  validarJwt()
  return jwt.sign(
    { sub: String(usuario.id) },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }
  )
}

function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    idioma: usuario.idioma,
    ativo: usuario.ativo,
    emailVerificado: usuario.emailVerificado
  }
}

// ============================================================
// LOGIN COM GOOGLE
// ============================================================

export async function autenticarComGoogle({ idToken, idioma }) {
  validarGoogle()
  if (!idToken || typeof idToken !== "string") {
    const erro = new Error("Token do Google não informado.")
    erro.codigo = "TOKEN_GOOGLE_INVALIDO"
    throw erro
  }
  const dadosGoogle = await validarIdTokenGoogle(idToken)
  if (!dadosGoogle || !dadosGoogle.googleId || !dadosGoogle.email) {
    const erro = new Error("Token do Google inválido.")
    erro.codigo = "TOKEN_GOOGLE_INVALIDO"
    throw erro
  }
  const idiomaUsuario = normalizarIdioma(idioma)
  const emailGoogle = normalizarEmail(dadosGoogle.email)
  if (!emailValido(emailGoogle)) {
    const erro = new Error("E-mail do Google inválido.")
    erro.codigo = "TOKEN_GOOGLE_INVALIDO"
    throw erro
  }
  let usuario = await prisma.usuario.findUnique({
    where: { googleId: dadosGoogle.googleId }
  })
  let criado = false
  if (!usuario) {
    const usuarioEmail = await prisma.usuario.findUnique({
      where: { email: emailGoogle }
    })
    if (usuarioEmail) {
      const erro = new Error("Este e-mail já está cadastrado.")
      erro.codigo = "EMAIL_JA_CADASTRADO"
      throw erro
    }
    usuario = await prisma.usuario.create({
      data: {
        googleId: dadosGoogle.googleId,
        nome: dadosGoogle.nome,
        email: emailGoogle,
        senhaHash: null,
        idioma: idiomaUsuario,
        aceitouPolitica: true,
        aceitouPoliticaEm: new Date(),
        emailVerificado: true,
        ativo: true
      }
    })
    criado = true
  } else {
    if (!usuario.ativo) {
      const erro = new Error("Usuário bloqueado.")
      erro.codigo = "USUARIO_BLOQUEADO"
      throw erro
    }
    usuario = await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        nome: dadosGoogle.nome,
        email: emailGoogle,
        idioma: idiomaUsuario,
        aceitouPolitica: true,
        aceitouPoliticaEm: usuario.aceitouPoliticaEm || new Date(),
        emailVerificado: true
      }
    })
  }
  const token = criarTokenSessao(usuario)
  return {
    criado,
    token,
    usuario: usuarioPublico(usuario)
  }
}

// ============================================================
// CADASTRO COM E-MAIL E SENHA
// ============================================================

export async function cadastrarComEmail({ nome, email, senha, idioma, aceitouPolitica }) {
  validarJwt()
  if (aceitouPolitica !== true) {
    const erro = new Error("É necessário aceitar a Política de Privacidade e os Termos de Uso.")
    erro.codigo = "POLITICA_NAO_ACEITA"
    throw erro
  }
  const nomeNormalizado = typeof nome === "string" ? nome.trim() : ""
  const emailNormalizado = normalizarEmail(email)
  const idiomaUsuario = normalizarIdioma(idioma)
  if (nomeNormalizado.length < 2 || nomeNormalizado.length > 100) {
    const erro = new Error("Nome inválido.")
    erro.codigo = "NOME_INVALIDO"
    throw erro
  }
  if (!emailValido(emailNormalizado)) {
    const erro = new Error("E-mail inválido.")
    erro.codigo = "EMAIL_INVALIDO"
    throw erro
  }
  if (!validarSenha(senha)) {
    const erro = new Error("A senha deve ter pelo menos 6 caracteres, um número e um caractere especial.")
    erro.codigo = "SENHA_INVALIDA"
    throw erro
  }
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email: emailNormalizado }
  })
  if (usuarioExistente) {
    const erro = new Error("Este e-mail já está cadastrado.")
    erro.codigo = "EMAIL_JA_CADASTRADO"
    throw erro
  }
  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS)
  const usuario = await prisma.usuario.create({
    data: {
      googleId: null,
      nome: nomeNormalizado,
      email: emailNormalizado,
      senhaHash,
      idioma: idiomaUsuario,
      aceitouPolitica: true,
      aceitouPoliticaEm: new Date(),
      emailVerificado: false,
      ativo: true
    }
  })
  await criarCodigoVerificacao({
    usuarioId: usuario.id,
    tipo: "CONFIRMAR_EMAIL"
  })
  return {
    criado: true,
    aguardandoConfirmacao: true,
    usuarioId: usuario.id,
    email: usuario.email,
    mensagem: "Conta criada. Enviamos um código de confirmação para o seu e-mail."
  }
}

// ============================================================
// CONFIRMAR E-MAIL
// ============================================================

export async function confirmarEmail({ usuarioId, codigo }) {
  validarJwt()
  const id = normalizarUsuarioId(usuarioId)
  if (!id) {
    const erro = new Error("Usuário inválido.")
    erro.codigo = "USUARIO_NAO_ENCONTRADO"
    throw erro
  }
  const usuarioAntes = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      ativo: true,
      emailVerificado: true
    }
  })
  if (!usuarioAntes) {
    const erro = new Error("Usuário não encontrado.")
    erro.codigo = "USUARIO_NAO_ENCONTRADO"
    throw erro
  }
  if (!usuarioAntes.ativo) {
    const erro = new Error("Usuário bloqueado.")
    erro.codigo = "USUARIO_BLOQUEADO"
    throw erro
  }
  if (usuarioAntes.emailVerificado) {
    const erro = new Error("Este e-mail já foi confirmado.")
    erro.codigo = "EMAIL_JA_VERIFICADO"
    throw erro
  }
  const resultado = await validarCodigoVerificacao({
    usuarioId: id,
    tipo: "CONFIRMAR_EMAIL",
    codigo
  })
  const usuario = await prisma.usuario.update({
    where: { id: resultado.usuarioId },
    data: { emailVerificado: true }
  })
  const token = criarTokenSessao(usuario)
  return {
    confirmado: true,
    token,
    usuario: usuarioPublico(usuario)
  }
}

// ============================================================
// LOGIN COM E-MAIL E SENHA
// ============================================================

export async function autenticarComEmail({ email, senha }) {
  validarJwt()
  const emailNormalizado = normalizarEmail(email)
  const erroCredenciais = new Error("E-mail ou senha inválidos.")
  erroCredenciais.codigo = "CREDENCIAIS_INVALIDAS"
  if (!emailValido(emailNormalizado) || typeof senha !== "string") {
    throw erroCredenciais
  }
  const usuario = await prisma.usuario.findUnique({
    where: { email: emailNormalizado }
  })
  if (!usuario) throw erroCredenciais
  if (!usuario.ativo) {
    const erro = new Error("Usuário bloqueado.")
    erro.codigo = "USUARIO_BLOQUEADO"
    throw erro
  }
  if (!usuario.senhaHash) throw erroCredenciais
  const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash)
  if (!senhaCorreta) throw erroCredenciais
  if (!usuario.emailVerificado) {
    const erro = new Error("E-mail ainda não confirmado.")
    erro.codigo = "EMAIL_NAO_VERIFICADO"
    throw erro
  }
  const token = criarTokenSessao(usuario)
  return {
    token,
    usuario: usuarioPublico(usuario)
  }
}

// ============================================================
// REENVIAR CÓDIGO DE CONFIRMAÇÃO
// ============================================================

export async function reenviarCodigoConfirmacao({ email }) {
  validarJwt()
  const emailNormalizado = normalizarEmail(email)
  if (!emailValido(emailNormalizado)) {
    const erro = new Error("E-mail inválido.")
    erro.codigo = "EMAIL_INVALIDO"
    throw erro
  }
  const usuario = await prisma.usuario.findUnique({
    where: { email: emailNormalizado },
    select: {
      id: true,
      ativo: true,
      emailVerificado: true
    }
  })
  if (!usuario || !usuario.ativo || usuario.emailVerificado) {
    return { enviado: true }
  }
  await criarCodigoVerificacao({
    usuarioId: usuario.id,
    tipo: "CONFIRMAR_EMAIL"
  })
  return { enviado: true }
}

// ============================================================
// ESQUECI A SENHA
// ============================================================

export async function esqueciSenha({ email }) {
  validarJwt()
  const emailNormalizado = normalizarEmail(email)
  if (!emailValido(emailNormalizado)) {
    const erro = new Error("E-mail inválido.")
    erro.codigo = "EMAIL_INVALIDO"
    throw erro
  }
  const usuario = await prisma.usuario.findUnique({
    where: { email: emailNormalizado },
    select: {
      id: true,
      ativo: true,
      senhaHash: true
    }
  })
  if (!usuario || !usuario.ativo || !usuario.senhaHash) {
    return { enviado: true }
  }
  await criarCodigoVerificacao({
    usuarioId: usuario.id,
    tipo: "REDEFINIR_SENHA"
  })
  return { enviado: true }
}

// ============================================================
// CONFIRMAR CÓDIGO DE RECUPERAÇÃO
// ============================================================

export async function confirmarCodigoRecuperacao({ email, codigo }) {
  validarJwt()
  const emailNormalizado = normalizarEmail(email)
  if (!emailValido(emailNormalizado)) {
    const erro = new Error("E-mail inválido.")
    erro.codigo = "EMAIL_INVALIDO"
    throw erro
  }

  if (typeof codigo !== "string" || !/^\d{6}$/.test(codigo)) {
    const erro = new Error("Código inválido ou expirado.")
    erro.codigo = "CODIGO_INVALIDO"
    throw erro
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: emailNormalizado },
    select: {
      id: true,
      email: true,
      ativo: true,
      senhaHash: true
    }
  })

  if (!usuario) {
    const erro = new Error("Código inválido ou expirado.")
    erro.codigo = "CODIGO_INVALIDO"
    throw erro
  }

  if (!usuario.ativo) {
    const erro = new Error("Usuário bloqueado.")
    erro.codigo = "USUARIO_BLOQUEADO"
    throw erro
  }

  if (!usuario.senhaHash) {
    const erro = new Error("Esta conta não possui senha.")
    erro.codigo = "CONTA_SEM_SENHA"
    throw erro
  }

  const registro = await prisma.codigoVerificacao.findFirst({
    where: {
      usuarioId: usuario.id,
      tipo: "REDEFINIR_SENHA",
      usado: false
    },
    orderBy: {
      criadoEm: "desc"
    }
  })

  if (!registro) {
    const erro = new Error("Código inválido ou expirado.")
    erro.codigo = "CODIGO_INVALIDO"
    throw erro
  }

  if (registro.tentativas >= MAX_TENTATIVAS) {
    await prisma.codigoVerificacao.update({
      where: { id: registro.id },
      data: { usado: true }
    })
    const erro = new Error("Código inválido ou expirado.")
    erro.codigo = "CODIGO_INVALIDO"
    throw erro
  }

  if (new Date() > registro.expiracao) {
    await prisma.codigoVerificacao.update({
      where: { id: registro.id },
      data: { usado: true }
    })
    const erro = new Error("Código inválido ou expirado.")
    erro.codigo = "CODIGO_INVALIDO"
    throw erro
  }

  const correto = await bcrypt.compare(codigo, registro.codigoHash)

  if (!correto) {
    const atualizado = await prisma.codigoVerificacao.update({
      where: { id: registro.id },
      data: { tentativas: { increment: 1 } }
    })

    if (atualizado.tentativas >= MAX_TENTATIVAS) {
      await prisma.codigoVerificacao.update({
        where: { id: registro.id },
        data: { usado: true }
      })
    }

    const erro = new Error("Código inválido ou expirado.")
    erro.codigo = "CODIGO_INVALIDO"
    throw erro
  }

  return {
    valido: true,
    usuarioId: usuario.id,
    email: usuario.email,
    mensagem: "Código validado com sucesso."
  }
}

// ============================================================
// REDEFINIR SENHA
// ============================================================

export async function redefinirSenha({ email, codigo, novaSenha }) {
  validarJwt()
  const emailNormalizado = normalizarEmail(email)
  if (!emailValido(emailNormalizado)) {
    const erro = new Error("E-mail inválido.")
    erro.codigo = "EMAIL_INVALIDO"
    throw erro
  }
  if (!validarSenha(novaSenha)) {
    const erro = new Error("A senha deve ter pelo menos 6 caracteres, um número e um caractere especial.")
    erro.codigo = "SENHA_INVALIDA"
    throw erro
  }
  if (typeof codigo !== "string" || !/^\d{6}$/.test(codigo)) {
    const erro = new Error("Código inválido ou expirado.")
    erro.codigo = "CODIGO_INVALIDO"
    throw erro
  }
  const usuario = await prisma.usuario.findUnique({
    where: { email: emailNormalizado },
    select: {
      id: true,
      ativo: true,
      senhaHash: true
    }
  })
  if (!usuario) {
    const erro = new Error("Código inválido ou expirado.")
    erro.codigo = "CODIGO_INVALIDO"
    throw erro
  }
  if (!usuario.ativo) {
    const erro = new Error("Usuário bloqueado.")
    erro.codigo = "USUARIO_BLOQUEADO"
    throw erro
  }
  if (!usuario.senhaHash) {
    const erro = new Error("Esta conta não possui senha.")
    erro.codigo = "CONTA_SEM_SENHA"
    throw erro
  }
  const registro = await prisma.codigoVerificacao.findFirst({
    where: {
      usuarioId: usuario.id,
      tipo: "REDEFINIR_SENHA",
      usado: false
    },
    orderBy: {
      criadoEm: "desc"
    }
  })

  if (!registro) {
    const erro = new Error("Código inválido ou expirado.")
    erro.codigo = "CODIGO_INVALIDO"
    throw erro
  }

  if (registro.tentativas >= MAX_TENTATIVAS) {
    await prisma.codigoVerificacao.update({
      where: { id: registro.id },
      data: { usado: true }
    })
    const erro = new Error("Código inválido ou expirado.")
    erro.codigo = "CODIGO_INVALIDO"
    throw erro
  }

  if (new Date() > registro.expiracao) {
    await prisma.codigoVerificacao.update({
      where: { id: registro.id },
      data: { usado: true }
    })
    const erro = new Error("Código inválido ou expirado.")
    erro.codigo = "CODIGO_INVALIDO"
    throw erro
  }

  const correto = await bcrypt.compare(codigo, registro.codigoHash)

  if (!correto) {
    const atualizado = await prisma.codigoVerificacao.update({
      where: { id: registro.id },
      data: { tentativas: { increment: 1 } }
    })

    if (atualizado.tentativas >= MAX_TENTATIVAS) {
      await prisma.codigoVerificacao.update({
        where: { id: registro.id },
        data: { usado: true }
      })
    }

    const erro = new Error("Código inválido ou expirado.")
    erro.codigo = "CODIGO_INVALIDO"
    throw erro
  }

  const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS)
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash }
  })

  await prisma.codigoVerificacao.update({
    where: { id: registro.id },
    data: { usado: true }
  })

  return { redefinida: true }
}

// ============================================================
// ATUALIZAR PERFIL
// ============================================================

export async function atualizarPerfil(usuarioId, { idioma, whatsapp }) {
  validarJwt()
  const id = normalizarUsuarioId(usuarioId)
  if (!id) {
    const erro = new Error("Usuário inválido.")
    erro.codigo = "USUARIO_INVALIDO"
    throw erro
  }
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      idioma: true,
      whatsapp: true,
      ativo: true,
      emailVerificado: true
    }
  })
  if (!usuario) {
    const erro = new Error("Usuário não encontrado.")
    erro.codigo = "USUARIO_NAO_ENCONTRADO"
    throw erro
  }
  if (!usuario.ativo) {
    const erro = new Error("Usuário bloqueado.")
    erro.codigo = "USUARIO_BLOQUEADO"
    throw erro
  }
  const idiomaNormalizado = normalizarIdioma(idioma)
  let whatsappNormalizado = null
  if (whatsapp !== null && whatsapp !== undefined && whatsapp !== "") {
    if (typeof whatsapp !== "string") {
      const erro = new Error("Número de WhatsApp inválido.")
      erro.codigo = "WHATSAPP_INVALIDO"
      throw erro
    }
    const numeros = whatsapp.replace(/\D/g, "")
    if (numeros.length < 10 || numeros.length > 15) {
      const erro = new Error("Digite um número de WhatsApp válido com DDD e código do país.")
      erro.codigo = "WHATSAPP_INVALIDO"
      throw erro
    }
    whatsappNormalizado = numeros
  }
  const usuarioAtualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      idioma: idiomaNormalizado,
      whatsapp: whatsappNormalizado
    },
    select: {
      id: true,
      nome: true,
      email: true,
      idioma: true,
      whatsapp: true,
      ativo: true,
      emailVerificado: true
    }
  })
  return usuarioAtualizado
}

// ============================================================
// EXCLUIR CONTA
// ============================================================

export async function excluirConta(usuarioId) {
  validarJwt()
  const id = normalizarUsuarioId(usuarioId)
  if (!id) {
    const erro = new Error("Usuário inválido.")
    erro.codigo = "USUARIO_INVALIDO"
    throw erro
  }
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      ativo: true,
      assinaturas: {
        where: {
          status: {
            in: ["ATIVA", "PENDENTE"]
          }
        },
        select: {
          id: true,
          formaPagamento: true,
          plano: true,
          status: true,
          stripeSubscriptionId: true
        }
      }
    }
  })
  if (!usuario) {
    const erro = new Error("Usuário não encontrado.")
    erro.codigo = "USUARIO_NAO_ENCONTRADO"
    throw erro
  }
  if (!usuario.ativo) {
    const erro = new Error("Usuário bloqueado.")
    erro.codigo = "USUARIO_BLOQUEADO"
    throw erro
  }
  for (const assinatura of usuario.assinaturas) {
    if (assinatura.formaPagamento === "cartao" && assinatura.stripeSubscriptionId) {
      try {
        await cancelarAssinaturaStripe(assinatura.stripeSubscriptionId)
      } catch (error) {
        console.error("Erro ao cancelar assinatura no Stripe durante exclusão da conta:", error)
        const erro = new Error("Não foi possível cancelar sua assinatura antes de excluir a conta.")
        erro.codigo = "ERRO_STRIPE_EXCLUSAO"
        throw erro
      }
    }
  }
  await prisma.usuario.delete({
    where: { id: usuario.id }
  })
  return {
    sucesso: true,
    mensagem: "Conta excluída com sucesso."
  }
}

// ============================================================
// BUSCAR SESSÃO
// ============================================================

export async function buscarSessao(usuarioId) {
  validarJwt()
  const id = normalizarUsuarioId(usuarioId)
  if (!id) {
    const erro = new Error("ID de usuário inválido.")
    erro.codigo = "USUARIO_INVALIDO"
    throw erro
  }
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      idioma: true,
      whatsapp: true,
      ativo: true,
      emailVerificado: true
    }
  })
  if (!usuario) {
    const erro = new Error("Usuário não encontrado.")
    erro.codigo = "USUARIO_NAO_ENCONTRADO"
    throw erro
  }
  if (!usuario.ativo) {
    const erro = new Error("Usuário desativado.")
    erro.codigo = "USUARIO_BLOQUEADO"
    throw erro
  }
  return usuario
}

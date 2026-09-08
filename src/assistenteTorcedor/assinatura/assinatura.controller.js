import { criarAssinatura } from "./assinatura.service.js"

export async function criarAssinaturaController(req, res) {
  try {
    const usuarioId = req.usuario?.id

    if (!usuarioId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      })
    }

    const {
      telefone,
      idioma,
      pagamento,
      time
    } = req.body

    const resultado = await criarAssinatura({
      usuarioId,
      telefone,
      idioma,
      pagamento,
      time
    })

    return res.status(201).json(resultado)
  } catch (error) {
    console.error(
      "Erro ao criar assinatura:",
      error
    )

    const errosConhecidos = {
      USUARIO_NAO_AUTENTICADO: 401,
      USUARIO_NAO_ENCONTRADO: 404,
      USUARIO_BLOQUEADO: 403,
      WHATSAPP_INVALIDO: 400,
      IDIOMA_INVALIDO: 400,
      PAGAMENTO_INVALIDO: 400,
      PLANO_INVALIDO: 400,
      TIME_NAO_INFORMADO: 400,
      TIME_INVALIDO: 400,
      TIME_NAO_ENCONTRADO: 404,
      ASSINATURA_ATIVA: 409,
      ASSINATURA_PENDENTE: 409,
      ERRO_STRIPE: 502
    }

    const status =
      errosConhecidos[error.codigo] || 500

    return res.status(status).json({
      sucesso: false,
      codigo: error.codigo || "ERRO_INTERNO",
      mensagem:
        error.message ||
        "Não foi possível criar a assinatura."
    })
  }
}
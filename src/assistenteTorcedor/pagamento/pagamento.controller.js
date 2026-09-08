import { criarCheckoutStripe } from "./pagamento.service.js"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function criarCheckoutStripeController(req, res) {
  try {
    const usuarioId = req.usuario?.id

    if (!usuarioId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      })
    }

    const { assinaturaId } = req.body

    if (!assinaturaId) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID da assinatura não informado."
      })
    }

    const assinatura =
      await prisma.assinatura.findUnique({
        where: {
          id: assinaturaId
        },
        select: {
          id: true,
          usuarioId: true,
          timeId: true,
          formaPagamento: true,
          plano: true,
          status: true
        }
      })

    if (!assinatura) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Assinatura não encontrada."
      })
    }

    if (assinatura.usuarioId !== usuarioId) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Essa assinatura não pertence ao usuário."
      })
    }

    if (assinatura.status !== "PENDENTE") {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Essa assinatura não está aguardando pagamento."
      })
    }

    if (assinatura.formaPagamento !== "cartao") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Essa assinatura não utiliza pagamento por cartão."
      })
    }

    if (assinatura.plano !== "MENSAL") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O plano dessa assinatura não é mensal."
      })
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        id: usuarioId
      },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true
      }
    })

    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado."
      })
    }

    if (!usuario.ativo) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Usuário bloqueado."
      })
    }

    let time = null

    if (assinatura.timeId) {
      time = await prisma.time.findUnique({
        where: {
          timeId: assinatura.timeId
        },
        select: {
          timeId: true,
          nomePopular: true,
          nome: true,
          escudo: true,
          slug: true
        }
      })
    }

    const resultado = await criarCheckoutStripe({
      assinaturaId: assinatura.id,
      usuario,
      time: time
        ? {
          id: time.timeId,
          nome:
            time.nomePopular ||
            time.nome ||
            "",
          escudo:
            time.escudo ||
            null,
          slug:
            time.slug ||
            ""
        }
        : null
    })

    return res.status(200).json(resultado)
  } catch (error) {
    console.error(
      "Erro ao criar Checkout Stripe:",
      error
    )

    return res.status(500).json({
      sucesso: false,
      mensagem:
        "Não foi possível iniciar o pagamento."
    })
  }
}
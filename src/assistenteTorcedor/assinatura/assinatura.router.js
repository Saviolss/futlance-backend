import { Router } from "express"
import {
  criarAssinaturaController,
  listarAssinaturasController,
  cancelarAssinaturaController,
  consultarRetornoPagamentoController
} from "./assinatura.controller.js"
import { autenticarUsuario } from "../autenticacao/autenticacao.middleware.js"

const router = Router()

router.get("/pagamento/retorno", autenticarUsuario, consultarRetornoPagamentoController)
router.post("/", autenticarUsuario, criarAssinaturaController)
router.get("/", autenticarUsuario, listarAssinaturasController)
router.post("/:id/cancelar", autenticarUsuario, cancelarAssinaturaController)

export default router
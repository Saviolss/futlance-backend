import { Router } from "express"
import { criarCheckoutStripeController } from "./pagamento.controller.js"
import { autenticarUsuario } from "../autenticacao/autenticacao.middleware.js"
const router = Router()

router.post(
  "/stripe",
  autenticarUsuario,
  criarCheckoutStripeController
)

export default router
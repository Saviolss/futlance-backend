import { Router } from "express"
import { criarAssinaturaController } from "./assinatura.controller.js"
import { autenticarUsuario } from "../autenticacao/autenticacao.middleware.js"
const router = Router()

router.post(
  "/",
  autenticarUsuario,
  criarAssinaturaController
)

export default router
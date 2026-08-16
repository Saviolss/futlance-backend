import { Router } from "express"

import {
  entrarComGoogle,
  verificarSessao,
  logout,
  sair
} from "./autenticacao.controller.js"

import {
  autenticarUsuario
} from "./autenticacao.middleware.js"




const router = Router()


/* ============================================================
   LOGIN GOOGLE
============================================================ */

router.post(
  "/google",
  entrarComGoogle
)


/* ============================================================
   VERIFICAR SESSÃO
============================================================ */

router.get(
  "/sessao",
  autenticarUsuario,
  verificarSessao
)


/* ============================================================
   SAIR
============================================================ */

router.post(
  "/sair",
  sair
)

router.post(
  "/logout",
  autenticarUsuario,
  logout
)

export default router
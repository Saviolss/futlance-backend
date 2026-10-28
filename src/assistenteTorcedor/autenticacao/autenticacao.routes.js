import { Router } from "express"
import {
  entrarComGoogle,
  cadastrar,
  confirmarEmail,
  confirmarCodigoRecuperacao,
  reenviarCodigo,
  entrarComEmail,
  esqueciSenha,
  redefinirSenha,
  sessao,
  logout,
  atualizarPerfil,
  excluirConta
} from "./autenticacao.controller.js"
import { autenticarUsuario } from "./autenticacao.middleware.js"
import { limiteLogin, limiteCadastro } from "./autenticacao.rateLimit.js"

const router = Router()

router.post("/google", limiteLogin, entrarComGoogle)
router.post("/cadastro", limiteCadastro, cadastrar)
router.post("/confirmar-email", confirmarEmail)
router.post("/confirmar-codigo-recuperacao", confirmarCodigoRecuperacao)
router.post("/reenviar-codigo", reenviarCodigo)
router.post("/login", limiteLogin, entrarComEmail)
router.post("/esqueci-senha", limiteLogin, esqueciSenha)
router.post("/redefinir-senha", limiteLogin, redefinirSenha)

router.get("/sessao", autenticarUsuario, sessao)
router.put("/perfil", autenticarUsuario, atualizarPerfil)
router.delete("/conta", autenticarUsuario, excluirConta)
router.post("/logout", autenticarUsuario, logout)

export default router
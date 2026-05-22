import { Router } from "express"
import {
  getTabelaBrasileirao, getTabelaCopaMundo, getTabelaCopaBrasil
 } from "../controladores/tabela.controlador.js"

const router = Router()

router.get("/brasileirao", getTabelaBrasileirao)
router.get("/copa-mundo", getTabelaCopaMundo)
router.get("/copa-brasil", getTabelaCopaBrasil)

export default router

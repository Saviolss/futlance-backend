import { Router } from "express"
import {
  getTabelaBrasileirao, getTabelaChampions, getTabelaCopaBrasil
 } from "../controladores/tabela.controlador.js"

const router = Router()

router.get("/brasileirao", getTabelaBrasileirao)
router.get("/champions", getTabelaChampions)
router.get("/copa-brasil", getTabelaCopaBrasil)

export default router

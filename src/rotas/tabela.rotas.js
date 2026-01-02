import { Router } from "express"
import { getTabelaBrasileirao, getTabelaPaulista, getTabelaCarioca } from "../controladores/tabela.controlador.js"

const router = Router()

router.get("/brasileirao", getTabelaBrasileirao)
router.get("/paulista", getTabelaPaulista)
router.get("/carioca", getTabelaCarioca)

export default router

import { Router } from "express"
import { getAoVivo, getAoVivoBrasileiro, getAoVivoCarioca, getAoVivoPaulista } from "../controladores/aoVivo.controlador.js"

const router = Router()

router.get("/ao-vivo", getAoVivo)
router.get("/ao-vivo/paulista", getAoVivoPaulista)
router.get("/ao-vivo/brasileiro", getAoVivoBrasileiro)
router.get("/ao-vivo/carioca", getAoVivoCarioca)
export default router
import { Router } from "express"
import {
  getTodasAoVivo,
  getBrasileiraoAoVivo,
  getPaulistaAoVivo,
  getCariocaAoVivo
} from "../controladores/partidaLive.controlador.js"

const router = Router()

router.get("/ao-vivo", getTodasAoVivo)
router.get("/ao-vivo/brasileirao", getBrasileiraoAoVivo)
router.get("/ao-vivo/paulista", getPaulistaAoVivo)
router.get("/ao-vivo/carioca", getCariocaAoVivo)

export default router

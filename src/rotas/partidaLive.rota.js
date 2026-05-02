import { Router } from "express"
import {
  getTodasAoVivo,
  getBrasileiraoAoVivo,
  getPaulistaAoVivo,
  getCariocaAoVivo,
  getCopaBrasilAoVivo,
  getAoVivoWidget,
  getHome
} from "../controladores/partidaLive.controlador.js"

const router = Router()

router.get("/", getTodasAoVivo)
router.get("/ao-vivo/brasileirao", getBrasileiraoAoVivo)
router.get("/ao-vivo/paulista", getPaulistaAoVivo)
router.get("/ao-vivo/carioca", getCariocaAoVivo)
router.get("/ao-vivo/copabrasil", getCopaBrasilAoVivo)

export default router

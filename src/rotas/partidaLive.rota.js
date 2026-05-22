import { Router } from "express"
import {
  getTodasAoVivo,
  getBrasileiraoAoVivo,
  getCopaMundoAoVivo,
  getCopaBrasilAoVivo,
  getAoVivoWidget,
  getHome
} from "../controladores/partidaLive.controlador.js"

const router = Router()

router.get("/", getTodasAoVivo)
router.get("/ao-vivo/brasileirao", getBrasileiraoAoVivo)
router.get("/ao-vivo/copamundo", getCopaMundoAoVivo)
router.get("/ao-vivo/copabrasil", getCopaBrasilAoVivo)

export default router

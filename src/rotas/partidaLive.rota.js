import { Router } from "express"
import {
  getTodasAoVivo,
  getBrasileiraoAoVivo,
  getChampionsAoVivo,
  getCopaBrasilAoVivo,
  getAoVivoWidget,
  getHome
} from "../controladores/partidaLive.controlador.js"

const router = Router()

router.get("/", getTodasAoVivo)
router.get("/ao-vivo/brasileirao", getBrasileiraoAoVivo)
router.get("/ao-vivo/champions", getChampionsAoVivo)
router.get("/ao-vivo/copabrasil", getCopaBrasilAoVivo)

export default router

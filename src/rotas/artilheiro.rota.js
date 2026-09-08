import { Router } from "express"
import {
  getArtilheirosBrasileirao, 
  getArtilheirosChampions, getArtilheirosCopaBrasil
 } from "../controladores/artilheiro.controlador.js"

const router = Router()

router.get("/brasileirao", getArtilheirosBrasileirao)
  router.get("/champions", getArtilheirosChampions)
router.get("/copabrasil", getArtilheirosCopaBrasil)

export default router

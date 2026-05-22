import { Router } from "express"
import {
  getArtilheirosBrasileirao, 
  getArtilheirosCopaMundo, getArtilheirosCopaBrasil
 } from "../controladores/artilheiro.controlador.js"

const router = Router()

router.get("/brasileirao", getArtilheirosBrasileirao)
  router.get("/copamundo", getArtilheirosCopaMundo)
router.get("/copabrasil", getArtilheirosCopaBrasil)

export default router

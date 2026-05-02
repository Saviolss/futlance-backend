import { Router } from "express"
import {
  getArtilheirosBrasileirao, getArtilheirosPaulista,
  getArtilheirosCarioca, getArtilheirosCopaBrasil
 } from "../controladores/artilheiro.controlador.js"

const router = Router()

router.get("/brasileirao", getArtilheirosBrasileirao)
router.get("/paulista", getArtilheirosPaulista)
router.get("/carioca", getArtilheirosCarioca)
router.get("/copabrasil", getArtilheirosCopaBrasil)

export default router

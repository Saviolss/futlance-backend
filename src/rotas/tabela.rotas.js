import { Router } from "express"
import {
  getTabelaBrasileirao, getTabelaPaulista, getTabelaCarioca,
  getArtilheirosBrasileirao, getArtilheirosPaulista, getArtilheirosCarioca
 } from "../controladores/tabela.controlador.js"

const router = Router()

router.get("/brasileirao", getTabelaBrasileirao)
router.get("/paulista", getTabelaPaulista)
router.get("/carioca", getTabelaCarioca)
router.get("/artilheiros/brasileirao", getArtilheirosBrasileirao)
router.get("/artilheiros/paulista", getArtilheirosPaulista)
router.get("/artilheiros/carioca", getArtilheirosCarioca)

export default router

import Router from "express"
import {
  getFinalizadas,
  getFinalizadasBrasileirao,
  getFinalizadasPaulista,
  getFinalizadasCarioca,
  getFinalizadasCopaBrasil
} from "../controladores/finalizada.controlador.js"

const router = Router()

router.get("/finalizadas", getFinalizadas)
router.get("/finalizadas/brasileirao", getFinalizadasBrasileirao)
router.get("/finalizadas/paulista", getFinalizadasPaulista)
router.get("/finalizadas/carioca", getFinalizadasCarioca)
router.get("/finalizadas/copabrasil", getFinalizadasCopaBrasil)

export default router
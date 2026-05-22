import Router from "express"
import {
  getFinalizadas,
  getFinalizadasBrasileirao,
  getFinalizadasCopaMundo,
  getFinalizadasCopaBrasil
} from "../controladores/finalizada.controlador.js"

const router = Router()

router.get("/finalizadas", getFinalizadas)
router.get("/finalizadas/brasileirao", getFinalizadasBrasileirao)
router.get("/finalizadas/copamundo", getFinalizadasCopaMundo)
router.get("/finalizadas/copabrasil", getFinalizadasCopaBrasil)

export default router
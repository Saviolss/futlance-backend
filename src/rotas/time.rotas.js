import { Router } from "express"
import { getTime, getTimes } from "../controladores/timeBanco.controlador.js"

const router = Router()

router.get(
  "/times",
  getTimes
)

router.get(
  "/times/:slug",
  getTime
)

export default router
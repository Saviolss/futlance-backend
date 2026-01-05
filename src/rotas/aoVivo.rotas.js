import { Router } from "express"
import { getAoVivo } from "../controladores/aoVivo.controlador.js"

const router = Router()

router.get("/ao-vivo", getAoVivo)

export default router
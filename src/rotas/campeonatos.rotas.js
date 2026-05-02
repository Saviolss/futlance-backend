import express from "express"
import { getCampeonato } from "../controladores/campeonato.controlador.js"

const router = express.Router()

router.get("/:slug", getCampeonato)

export default router
import  { Router } from "express"
import { getHome } from "../controladores/partidaLive.controlador.js";
import { getAgendaGeral } from "../controladores/agenda.controlador.js";

const router = Router()

router.get("/home", getHome)
router.get("/home/agenda", getAgendaGeral)

export default router;
import  { Router } from "express"
import { getHome } from "../controladores/partidaLive.controlador.js";

const router = Router()

router.get("/home", getHome)

export default router;
import { Router } from "express";
import { getAgendaBrasileirao, getAgendaCopaMundo, getAgendaCopaBrasil } from "../controladores/agenda.controlador.js";

const router = Router();

router.get("/brasileirao", getAgendaBrasileirao);
router.get("/copamundo", getAgendaCopaMundo);
router.get("/copabrasil", getAgendaCopaBrasil);

export default router;  
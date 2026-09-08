import { Router } from "express";
import { getAgendaBrasileirao, getAgendaChampions, getAgendaCopaBrasil } from "../controladores/agenda.controlador.js";

const router = Router();

router.get("/brasileirao", getAgendaBrasileirao);
router.get("/champions", getAgendaChampions);
router.get("/copabrasil", getAgendaCopaBrasil);

export default router;  
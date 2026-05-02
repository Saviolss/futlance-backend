import { Router } from "express";
import { getAgendaBrasileirao, getAgendaCarioca, getAgendaPaulista, getAgendaCopaBrasil } from "../controladores/agenda.controlador.js";

const router = Router();

router.get("/brasileirao", getAgendaBrasileirao);
router.get("/paulista", getAgendaPaulista);
router.get("/carioca", getAgendaCarioca);
router.get("/copabrasil", getAgendaCopaBrasil);

export default router;  
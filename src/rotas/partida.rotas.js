import { Router } from "express";
import { getPartidaBrasileirao, getPartidaCarioca, getPartidaPaulista } from "../controladores/partida.controlador.js";

const router = Router();

router.get("/brasileirao", getPartidaBrasileirao);
router.get("/paulista", getPartidaPaulista);
router.get("/carioca", getPartidaCarioca);

export default router;
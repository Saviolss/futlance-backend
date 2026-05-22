import { Router } from "express";
import { getNoticias } from "./noticia.controlador.js";

const router = Router();

router.get("/noticias", getNoticias);

export default router;
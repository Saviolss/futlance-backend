import {  Router } from 'express';
import { getAgendaGeral } from '../controladores/agenda.controlador.js';

const router = Router();

router.get('/agenda', getAgendaGeral);

export default router;
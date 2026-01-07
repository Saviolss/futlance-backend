import {  Router } from 'express';
import { getAgendaGeral } from '../controladores/agenda.controlador.js';

const router = Router();

router.get('/', getAgendaGeral);

export default router;
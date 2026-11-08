// Rutas de chats e invitaciones (RF-17). Se montan en /api/chats.
const express = require('express');
const auth = require('../../middlewares/auth');
const controlador = require('./controlador');

const router = express.Router();

router.use(auth); // solo los participantes e invitados ven sus chats (RNF-02)

router.get('/', controlador.misChats);                                // mis chats
router.post('/', controlador.crear);                                  // CU-24: crear e invitar
router.get('/invitaciones', controlador.invitaciones);                // invitaciones pendientes
router.post('/invitaciones/:id/aceptar', controlador.aceptar);        // CU-25
router.post('/invitaciones/:id/rechazar', controlador.rechazar);      // CU-26

module.exports = router;

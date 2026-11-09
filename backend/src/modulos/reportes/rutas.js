// Rutas de la moderación por reportes (RF-12). Se montan en /api/moderacion, junto a las de RF-13.
const express = require('express');
const auth = require('../../middlewares/auth');
const roles = require('../../middlewares/roles');
const controlador = require('./controlador');

const router = express.Router();

router.post('/reportes', auth, controlador.reportar);                        // reportar perfil o publicación
router.post('/apelaciones/publicacion', auth, controlador.apelarPublicacion); // el autor apela su publicación
router.post('/apelaciones/cuenta', controlador.apelarCuenta);                // sin sesión: la cuenta está deshabilitada
router.post('/limpieza', auth, roles('administrador'), controlador.limpiar); // eliminar ahora lo no apelado

module.exports = router;

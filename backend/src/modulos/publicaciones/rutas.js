// Rutas de publicaciones (RF-06 y RF-07). Se montan en /api/publicaciones.
const express = require('express');
const auth = require('../../middlewares/auth');
const roles = require('../../middlewares/roles');
const controlador = require('./controlador');

const router = express.Router();

router.use(auth); // todas las rutas de este archivo exigen sesión iniciada

router.post('/', roles('estudiante'), controlador.crear); // RF-06: solo estudiantes publican
router.get('/mias', controlador.listarMias);              // RF-07: mis publicaciones
router.put('/:id', controlador.editar);                   // RF-07: editar una propia
router.delete('/:id', controlador.borrar);                // RF-07: borrar una propia

module.exports = router;

// Rutas de guías prácticas (RF-11). Se montan en /api/guias.
const express = require('express');
const auth = require('../../middlewares/auth');
const roles = require('../../middlewares/roles');
const controlador = require('./controlador');

const router = express.Router();

router.use(auth); // todas las rutas exigen sesión

router.get('/', controlador.listar);                                         // ver guías (?carrera=)
router.post('/', roles('docente'), controlador.crear);                       // solo docentes publican
router.patch('/:id/solucion', roles('docente'), controlador.cambiarSolucion); // indicar si trae solución

module.exports = router;

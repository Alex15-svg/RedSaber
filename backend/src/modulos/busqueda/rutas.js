// Rutas de búsqueda (RF-09). Se montan en /api/buscar.
const express = require('express');
const auth = require('../../middlewares/auth');
const controlador = require('./controlador');

const router = express.Router();

router.use(auth); // buscar exige sesión (RNF-01)

router.get('/', controlador.buscar);           // buscar con filtros
router.get('/carreras', controlador.carreras); // etiquetas de carrera disponibles

module.exports = router;

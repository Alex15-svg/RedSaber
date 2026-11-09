// Rutas de talleres (RF-16). Se montan en /api/talleres.
const express = require('express');
const auth = require('../../middlewares/auth');
const controlador = require('./controlador');

const router = express.Router();

router.get('/', auth, controlador.listar); // ver talleres con inscritos y capacidad

module.exports = router;

// Rutas de la lista privada de guardados (RF-08). Se montan en /api/guardados.
// :tipo = publicaciones | documentos
const express = require('express');
const auth = require('../../middlewares/auth');
const controlador = require('./controlador');

const router = express.Router();

router.use(auth); // la lista es privada: siempre se usa el usuario de la sesión

router.get('/', controlador.listar);              // ver mi lista
router.post('/:tipo/:id', controlador.guardar);   // guardar
router.delete('/:tipo/:id', controlador.quitar);  // quitar de la lista

module.exports = router;

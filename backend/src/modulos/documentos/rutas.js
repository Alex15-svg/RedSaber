// Rutas de la documentación por áreas (RF-10). Se montan en /api/documentos.
const express = require('express');
const auth = require('../../middlewares/auth');
const roles = require('../../middlewares/roles');
const { subida } = require('./subida');
const controlador = require('./controlador');

const router = express.Router();

router.use(auth); // leer y descargar también exigen sesión (RNF-01)

router.get('/areas', controlador.areas);                 // áreas con su cantidad de documentos
router.get('/', controlador.listar);                     // documentos (filtro ?area=)
router.get('/:id', controlador.ver);                     // datos de un documento
router.get('/:id/leer', controlador.leer);               // vista de lectura
router.get('/:id/descargar', controlador.descargar);     // descarga

// Subir: solo docentes y administración. Primero el rol, después multer guarda el PDF.
router.post('/', roles('docente', 'administrador'), subida.single('archivo'), controlador.crear);

module.exports = router;

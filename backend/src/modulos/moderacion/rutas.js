const router = require('express').Router();
const controlador = require('./controlador');
const revision = require('./revision');
const auth = require('../../middlewares/auth');
const roles = require('../../middlewares/roles');

// Moderación previa: publicaciones que esperan la revisión del administrador.
router.get('/publicaciones/pendientes', auth, roles('administrador'), revision.pendientes);
router.post('/publicaciones/:id/aprobar', auth, roles('administrador'), revision.aprobar);
router.post('/publicaciones/:id/rechazar', auth, roles('administrador'), revision.rechazar);

router.get('/apelaciones', auth, roles('administrador'), controlador.listarApelaciones);
router.post('/apelaciones/:id/rehabilitar', auth, roles('administrador'), controlador.rehabilitar);
router.post('/apelaciones/:id/rechazar', auth, roles('administrador'), controlador.rechazar);

module.exports = router;
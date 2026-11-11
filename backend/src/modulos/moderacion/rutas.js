const router = require('express').Router();
const controlador = require('./controlador');
const auth = require('../../middlewares/auth');
const roles = require('../../middlewares/roles');

router.get('/apelaciones', auth, roles('administrador'), controlador.listarApelaciones);
router.post('/apelaciones/:id/rehabilitar', auth, roles('administrador'), controlador.rehabilitar);
router.post('/apelaciones/:id/rechazar', auth, roles('administrador'), controlador.rechazar);

module.exports = router;
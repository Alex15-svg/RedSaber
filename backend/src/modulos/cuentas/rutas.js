//Define los endpoints disponibles.
const router = require('express').Router();
const controlador = require('./controlador');
const auth = require('../../middlewares/auth');
const roles = require('../../middlewares/roles');


router.post('/registro', controlador.registrar);
router.post('/login', controlador.iniciarSesionCorreo);
router.post('/recuperar', controlador.recuperar);
router.post('/restablecer', controlador.restablecer);
router.get('/usuarios', auth, roles('administrador'), controlador.listarUsuarios);

module.exports = router;
//Define los endpoints disponibles.
const router = require('express').Router();
const controlador = require('./controlador');
const auth = require('../../middlewares/auth');
const roles = require('../../middlewares/roles');
const { limiteLogin, limiteRecuperar, limiteRegistro } = require('../../config/seguridad');

// Las rutas públicas llevan límite de intentos para frenar la fuerza bruta (OWASP A07).
router.post('/registro', limiteRegistro, controlador.registrar);
router.post('/login', limiteLogin, controlador.iniciarSesionCorreo);
router.post('/recuperar', limiteRecuperar, controlador.recuperar);
router.post('/restablecer', controlador.restablecer);
router.get('/usuarios', auth, roles('administrador'), controlador.listarUsuarios);

module.exports = router;
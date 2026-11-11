const router = require('express').Router();
const c = require('./controlador');
const auth = require('../../middlewares/auth');
const roles = require('../../middlewares/roles');

// Catálogo: cursos disponibles para la pantalla de cursos (catalogo.js)
router.get('/', auth, require('./catalogo').disponibles);

// RF-14 (estudiante pide, docente recibe)
router.post('/solicitar', auth, roles('estudiante'), c.solicitar);
router.get('/solicitudes', auth, roles('docente'), c.solicitudes);

// RF-15 (docente gestiona sus cursos)
router.get('/mios', auth, roles('docente'), c.misCursos);
router.post('/:id/abrir', auth, roles('docente'), c.abrir);
router.post('/:id/cerrar', auth, roles('docente'), c.cerrar);
router.get('/:id/ingresados', auth, roles('docente'), c.listaIngresados);

// Estudiante: interés e ingreso
router.post('/:id/interes', auth, roles('estudiante'), c.interes);
router.post('/:id/ingresar', auth, roles('estudiante'), c.ingresar);

module.exports = router;
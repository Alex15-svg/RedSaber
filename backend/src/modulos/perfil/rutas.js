// Rutas para personalizar el perfil propio (RF-05). Se montan en /api/perfil.
const express = require('express');
const auth = require('../../middlewares/auth');
const { subida } = require('./subida');
const controlador = require('./controlador');

const router = express.Router();

router.use(auth); // todas las rutas de este archivo exigen sesión iniciada

// Ver mi perfil.
router.get('/', controlador.verMiPerfil);

// Cambiar foto, encabezado o fondo. :campo = foto | encabezado | fondo
// Orden: 1) validar el campo, 2) multer guarda la imagen, 3) se actualiza la base.
router.put('/imagen/:campo', controlador.revisarCampo, subida.single('imagen'), controlador.cambiarImagen);

// Elegir si el correo es público o privado. Cuerpo: { "publico": true }
router.patch('/correo', controlador.cambiarCorreo);

module.exports = router;

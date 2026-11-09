// Lógica para personalizar el perfil propio (RF-05):
// cambiar foto, encabezado o fondo, y elegir si el correo es público o privado.
const fs = require('fs/promises');
const path = require('path');
const modelo = require('./modelo');
const { CARPETA } = require('./subida');
const { esOpcion } = require('../../utils/validar');

// Se ejecuta ANTES de multer: si el campo no es válido, no se guarda ningún archivo.
function revisarCampo(req, res, next) {
    if (!esOpcion(modelo.COLUMNAS, req.params.campo)) {
        return res.status(400).json({ error: 'El campo debe ser foto, encabezado o fondo.' });
    }
    next();
}

// Se ejecuta DESPUÉS de multer: la imagen ya está guardada en la carpeta uploads/perfiles.
async function cambiarImagen(req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'Adjunta una imagen en el campo "imagen".' });
    }

    const url = `/uploads/perfiles/${req.file.filename}`;
    const anterior = await modelo.cambiarImagen(req.usuario.id, req.params.campo, url);

    // Borra la imagen anterior para no acumular archivos. Si ya no existe, no pasa nada.
    if (anterior) {
        await fs.unlink(path.join(CARPETA, path.basename(anterior))).catch(() => {});
    }

    res.json({ campo: req.params.campo, url });
}

async function cambiarCorreo(req, res) {
    const { publico } = req.body || {};

    if (typeof publico !== 'boolean') {
        return res.status(400).json({ error: 'Indica "publico": true para mostrar tu correo o false para ocultarlo.' });
    }

    const existe = await modelo.cambiarVisibilidadCorreo(req.usuario.id, publico);
    if (!existe) {
        return res.status(404).json({ error: 'La cuenta no existe.' });
    }

    res.json({ correo_publico: publico });
}

module.exports = { revisarCampo, cambiarImagen, cambiarCorreo };

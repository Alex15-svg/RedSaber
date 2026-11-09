// Último middleware de app.js: responde en JSON los errores que nadie manejó antes.
const multer = require('multer');

// Express reconoce un manejador de errores porque recibe 4 parámetros.
function manejarErrores(err, req, res, next) {
    // Errores de multer al subir archivos (por ejemplo, imagen demasiado grande).
    if (err instanceof multer.MulterError) {
        const mensaje = err.code === 'LIMIT_FILE_SIZE'
            ? 'El archivo supera el tamaño máximo permitido.'
            : 'No se pudo subir el archivo.';
        return res.status(400).json({ error: mensaje });
    }

    // El cliente envió un JSON mal escrito.
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON válido.' });
    }

    // Errores creados por nosotros con un código 4xx y un mensaje para el usuario.
    if (err.status >= 400 && err.status < 500) {
        return res.status(err.status).json({ error: err.message });
    }

    // Cualquier otro error: se registra en la consola y no se muestran detalles internos.
    console.error(err);
    res.status(500).json({ error: 'Ocurrió un error interno. Intenta de nuevo.' });
}

module.exports = manejarErrores;

// Configuración de multer para subir documentos PDF (RF-10).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

// Carpeta privada: <proyecto>/backend/archivos/documentos. No se publica como estática;
// los archivos solo se entregan por las rutas de lectura y descarga, que exigen sesión.
const CARPETA = path.join(__dirname, '..', '..', '..', 'archivos', 'documentos');

// 10 MB: valor de ejemplo de RNF-07 para documentos.
const TAMANO_MAXIMO = 10 * 1024 * 1024;

fs.mkdirSync(CARPETA, { recursive: true });

const almacenamiento = multer.diskStorage({
    destination: CARPETA,
    // Nombre aleatorio: no depende del nombre que puso el usuario.
    filename: (req, archivo, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.pdf`)
});

// Solo se aceptan PDF, porque es el formato que el navegador puede mostrar en la vista de lectura.
function filtrar(req, archivo, cb) {
    if (archivo.mimetype === 'application/pdf') {
        return cb(null, true);
    }
    const error = new Error('Formato no admitido. Sube el documento en PDF.');
    error.status = 400;
    cb(error);
}

const subida = multer({
    storage: almacenamiento,
    fileFilter: filtrar,
    limits: { fileSize: TAMANO_MAXIMO, files: 1 }
});

module.exports = { subida, CARPETA };

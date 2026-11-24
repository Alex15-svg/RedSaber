// Configuración de multer para subir documentos PDF (RF-10).
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Carpeta privada de la versión anterior: <proyecto>/backend/archivos/documentos.
// Los PDF nuevos se guardan en la base (columna contenido); la carpeta solo se lee para
// los documentos que se subieron antes de ese cambio.
const CARPETA = path.join(__dirname, '..', '..', '..', 'archivos', 'documentos');

// 10 MB: valor de ejemplo de RNF-07 para documentos.
const TAMANO_MAXIMO = 10 * 1024 * 1024;

fs.mkdirSync(CARPETA, { recursive: true });

// Solo se aceptan PDF, porque es el formato que el navegador puede mostrar en la vista de lectura.
function filtrar(req, archivo, cb) {
    if (archivo.mimetype === 'application/pdf') {
        return cb(null, true);
    }
    const error = new Error('Formato no admitido. Sube el documento en PDF.');
    error.status = 400;
    cb(error);
}

// El archivo queda en memoria (req.file.buffer) y el controlador lo guarda en PostgreSQL.
// En la nube (Render gratis) el disco del servidor se borra al reiniciar; la base no.
const subida = multer({
    storage: multer.memoryStorage(),
    fileFilter: filtrar,
    limits: { fileSize: TAMANO_MAXIMO, files: 1 }
});

module.exports = { subida, CARPETA };

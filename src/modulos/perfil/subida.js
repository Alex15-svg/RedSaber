// Configuración de multer para subir las imágenes del perfil (RF-05).
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Carpeta donde se guardan las imágenes: <proyecto>/uploads/perfiles
const CARPETA = path.join(__dirname, '..', '..', '..', 'uploads', 'perfiles');

// 2 MB: valor de ejemplo de RNF-07 (el tamaño definitivo está por definir).
const TAMANO_MAXIMO = 2 * 1024 * 1024;

// Tipos de imagen aceptados y la extensión con que se guarda cada uno.
const EXTENSIONES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

fs.mkdirSync(CARPETA, { recursive: true }); // crea la carpeta si no existe

const almacenamiento = multer.diskStorage({
    destination: CARPETA,
    // Nombre único: id del usuario, campo y fecha. La extensión sale del tipo aceptado,
    // no del nombre original, para que nadie suba un archivo con una extensión engañosa.
    filename: (req, archivo, cb) => {
        const extension = EXTENSIONES[archivo.mimetype];
        cb(null, `${req.usuario.id}-${req.params.campo}-${Date.now()}${extension}`);
    }
});

// Rechaza todo lo que no sea JPG, PNG o WEBP.
function filtrar(req, archivo, cb) {
    if (Object.hasOwn(EXTENSIONES, archivo.mimetype)) {
        return cb(null, true);
    }
    const error = new Error('Formato no admitido. Usa una imagen JPG, PNG o WEBP.');
    error.status = 400;
    cb(error);
}

const subida = multer({
    storage: almacenamiento,
    fileFilter: filtrar,
    limits: { fileSize: TAMANO_MAXIMO, files: 1 }
});

module.exports = { subida, CARPETA };

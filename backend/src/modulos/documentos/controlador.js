// Lógica de la documentación por áreas (RF-10): ver áreas y documentos,
// leerlos en el navegador, descargarlos y subir nuevos (docentes y administración).
const fs = require('fs/promises');
const path = require('path');
const modelo = require('./modelo');
const { CARPETA } = require('./subida');
const { leerId, revisarTextos, textoOpcional } = require('../../utils/validar');

// Ruta en disco del archivo. path.basename impide salir de la carpeta privada.
const rutaArchivo = (documento) => path.join(CARPETA, path.basename(documento.archivo_url));

// Busca el documento de la URL. Si no existe, responde 404 y devuelve null.
async function buscarDocumento(req, res) {
    const id = leerId(req.params.id);
    const documento = id ? await modelo.buscar(id) : null;
    if (!documento) {
        res.status(404).json({ error: 'El documento no existe.' });
    }
    return documento;
}

async function areas(req, res) {
    res.json(await modelo.areas());
}

// GET /api/documentos?area=Bases de datos  (sin área: todos)
async function listar(req, res) {
    res.json(await modelo.listar(textoOpcional(req.query.area, 120)));
}

async function ver(req, res) {
    const documento = await buscarDocumento(req, res);
    if (!documento) return;
    const { archivo_url, ...datos } = documento; // el nombre interno del archivo no se muestra
    res.json(datos);
}

// Vista de lectura: el PDF se abre dentro del navegador («inline»).
async function leer(req, res) {
    const documento = await buscarDocumento(req, res);
    if (!documento) return;
    // Las cabeceras van en las opciones: así solo se aplican si el archivo realmente se envía.
    const cabeceras = { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="documento-${documento.id}.pdf"` };
    res.sendFile(rutaArchivo(documento), { headers: cabeceras }, (error) => {
        if (error && !res.headersSent) res.status(404).json({ error: 'El archivo del documento no está disponible.' });
    });
}

// Descarga: el navegador guarda el PDF con el título del documento como nombre.
async function descargar(req, res) {
    const documento = await buscarDocumento(req, res);
    if (!documento) return;
    res.download(rutaArchivo(documento), `${documento.titulo}.pdf`, (error) => {
        if (error && !res.headersSent) res.status(404).json({ error: 'El archivo del documento no está disponible.' });
    });
}

// Subir un documento. Cuerpo: formulario con "titulo", "area" y el PDF en "archivo".
async function crear(req, res) {
    const cuerpo = req.body || {};
    const errores = revisarTextos(cuerpo, { titulo: 200, area: 120 });
    if (!req.file) errores.push('Adjunta el documento en PDF en el campo "archivo".');

    if (errores.length) {
        // Si multer ya guardó el archivo pero los datos no sirven, se borra para no dejar basura.
        if (req.file) await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ error: errores.join(' ') });
    }

    const documento = await modelo.crear({
        titulo: cuerpo.titulo.trim(),
        area: cuerpo.area.trim(),
        archivo: req.file.filename,
        tamanoMb: Math.max(0.01, Number((req.file.size / 1048576).toFixed(2)))
    });
    res.status(201).json(documento);
}

module.exports = { areas, listar, ver, leer, descargar, crear };

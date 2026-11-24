// Lógica de la documentación por áreas (RF-10): ver áreas y documentos,
// leerlos en el navegador, descargarlos y subir nuevos (docentes y administración).
const crypto = require('crypto');
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

// Envía el PDF: desde la base si está ahí; si no, desde la carpeta (documentos anteriores al cambio).
// «inline» lo abre en el navegador (vista de lectura); «attachment» lo descarga con el título como nombre.
async function enviarPdf(req, res, modo) {
    const documento = await buscarDocumento(req, res);
    if (!documento) return;
    const nombre = modo === 'inline' ? `documento-${documento.id}.pdf` : `${documento.titulo}.pdf`;
    const bytes = await modelo.contenido(documento.id);
    if (bytes) {
        res.attachment(nombre); // arma Content-Disposition con el nombre bien codificado
        if (modo === 'inline') res.set('Content-Disposition', res.get('Content-Disposition').replace('attachment', 'inline'));
        return res.type('application/pdf').send(bytes);
    }
    const opciones = { headers: { 'Content-Type': 'application/pdf' } };
    const alTerminar = (error) => {
        if (error && !res.headersSent) res.status(404).json({ error: 'El archivo del documento no está disponible.' });
    };
    if (modo === 'inline') {
        opciones.headers['Content-Disposition'] = `inline; filename="${nombre}"`;
        return res.sendFile(rutaArchivo(documento), opciones, alTerminar);
    }
    res.download(rutaArchivo(documento), nombre, alTerminar);
}

const leer = (req, res) => enviarPdf(req, res, 'inline');
const descargar = (req, res) => enviarPdf(req, res, 'attachment');

// Subir un documento. Cuerpo: formulario con "titulo", "area" y el PDF en "archivo".
async function crear(req, res) {
    const cuerpo = req.body || {};
    const errores = revisarTextos(cuerpo, { titulo: 200, area: 120 });
    if (!req.file) errores.push('Adjunta el documento en PDF en el campo "archivo".');

    // El archivo está en memoria: si los datos no sirven, simplemente no se guarda.
    if (errores.length) return res.status(400).json({ error: errores.join(' ') });

    const documento = await modelo.crear({
        titulo: cuerpo.titulo.trim(),
        area: cuerpo.area.trim(),
        archivo: `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.pdf`, // nombre interno de referencia
        contenido: req.file.buffer,
        tamanoMb: Math.max(0.01, Number((req.file.size / 1048576).toFixed(2)))
    });
    res.status(201).json(documento);
}

module.exports = { areas, listar, ver, leer, descargar, crear };

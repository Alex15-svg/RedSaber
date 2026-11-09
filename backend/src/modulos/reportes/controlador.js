// Lógica de la moderación por reportes (RF-12): reportar perfiles y publicaciones,
// apelar lo deshabilitado y ejecutar la limpieza de lo no apelado.
const bcrypt = require('bcrypt');
const modelo = require('./modelo');
const { eliminarVencidos } = require('./limpieza');
const { UMBRAL_REPORTES, PLAZO_APELACION_DIAS } = require('../../config/moderacion');
const { leerId, revisarTextos, esOpcion } = require('../../utils/validar');

const fechaCorta = (fecha) => new Date(fecha).toLocaleDateString('es-CL');

// Convierte el resultado de una apelación en la respuesta HTTP.
function responderApelacion(res, { resultado, limite }) {
    const respuestas = {
        ok: [201, { mensaje: `Apelación enviada. Un administrador la revisará. Plazo: ${fechaCorta(limite)}.` }],
        activo: [409, { error: 'No está deshabilitado: no hay nada que apelar.' }],
        vencido: [409, { error: `El plazo para apelar venció el ${fechaCorta(limite)}.` }],
        repetida: [409, { error: 'Ya enviaste una apelación. Espera la revisión del administrador.' }]
    };
    const [codigo, cuerpo] = respuestas[resultado];
    res.status(codigo).json(cuerpo);
}

// POST /api/moderacion/reportes  Cuerpo: { "tipo": "publicacion", "id": 5, "motivo": "..." }
async function reportar(req, res) {
    const { tipo, motivo } = req.body || {};
    const id = leerId((req.body || {}).id);
    const errores = revisarTextos({ motivo }, { motivo: 500 });

    if (!esOpcion(modelo.OBJETIVOS, tipo)) errores.unshift('El campo "tipo" debe ser "publicacion" o "usuario".');
    if (!id) errores.unshift('El campo "id" no es válido.');
    if (errores.length) return res.status(400).json({ error: errores.join(' ') });

    const objetivo = await modelo.buscarObjetivo(tipo, id);
    if (!objetivo) return res.status(404).json({ error: 'Lo que intentas reportar no existe.' });
    if (objetivo.dueno_id === req.usuario.id) return res.status(400).json({ error: 'No puedes reportar tu propio perfil o publicación.' });
    if (objetivo.estado !== 'activa') return res.status(409).json({ error: 'Ya está deshabilitado y en revisión.' });

    try {
        await modelo.reportar(req.usuario.id, tipo, id, motivo.trim(), UMBRAL_REPORTES);
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Ya reportaste esto antes.' });
        throw error;
    }
    // No se informa cuántos reportes lleva: así nadie sabe cuántos faltan para deshabilitar.
    res.status(201).json({ mensaje: 'Reporte recibido. Gracias por cuidar la comunidad.' });
}

// POST /api/moderacion/apelaciones/publicacion  Cuerpo: { "id": 5, "justificacion": "..." }
async function apelarPublicacion(req, res) {
    const { justificacion } = req.body || {};
    const id = leerId((req.body || {}).id);
    const errores = revisarTextos({ justificacion }, { justificacion: 2000 });
    if (!id) errores.unshift('El campo "id" no es válido.');
    if (errores.length) return res.status(400).json({ error: errores.join(' ') });

    const objetivo = await modelo.buscarObjetivo('publicacion', id);
    if (!objetivo) return res.status(404).json({ error: 'La publicación no existe.' });
    if (objetivo.dueno_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el autor puede apelar su publicación.' });

    const resultado = await modelo.apelar('publicacion', id, justificacion.trim(), PLAZO_APELACION_DIAS, `usuario ${req.usuario.id}`);
    responderApelacion(res, resultado);
}

// POST /api/moderacion/apelaciones/cuenta  Cuerpo: { "correo", "contrasena", "justificacion" }
// Sin token: una cuenta deshabilitada no puede iniciar sesión, así que se identifica con su contraseña.
async function apelarCuenta(req, res) {
    const { correo, contrasena, justificacion } = req.body || {};
    const errores = revisarTextos({ correo, contrasena, justificacion }, { correo: 254, contrasena: 200, justificacion: 2000 });
    if (errores.length) return res.status(400).json({ error: errores.join(' ') });

    const cuenta = await modelo.buscarCuenta(correo.trim());
    const valida = cuenta && await bcrypt.compare(contrasena, cuenta.contrasena_hash);
    if (!valida) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    const resultado = await modelo.apelar('usuario', cuenta.id, justificacion.trim(), PLAZO_APELACION_DIAS, `usuario ${cuenta.id}`);
    responderApelacion(res, resultado);
}

// POST /api/moderacion/limpieza (administración): ejecuta ahora la eliminación de lo no apelado.
async function limpiar(req, res) {
    res.json({ eliminados: await eliminarVencidos() });
}

module.exports = { reportar, apelarPublicacion, apelarCuenta, limpiar };

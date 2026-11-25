// Lógica de chats (RF-17): crear un chat invitando a otros usuarios,
// ver mis chats y mis invitaciones, y aceptar o rechazar invitaciones.
const modelo = require('./modelo');
const mensajes = require('./mensajes');
const tiempoReal = require('./tiempoReal');
const { leerId, revisarTextos } = require('../../utils/validar');

// Largo máximo de un mensaje de chat.
const LARGO_MENSAJE = 1000;

// Revisa la lista de invitados. Devuelve un mensaje de error, o null si está todo bien.
function revisarInvitados(tipo, ids, creadorId) {
    if (ids.includes(null)) return 'Hay ids de usuario no válidos en "invitados".';
    if (ids.includes(creadorId)) return 'No puedes invitarte a ti mismo.';
    if (tipo === 'individual' && ids.length !== 1) return 'Un chat individual se crea con un solo invitado.';
    if (tipo === 'grupal' && ids.length < 2) return 'Un chat grupal necesita al menos dos invitados.';
    return null;
}

// CU-24: crear un chat e invitar. Cuerpo: { "tipo": "individual", "invitados": [5] }
async function crear(req, res) {
    const { tipo, invitados } = req.body || {};

    if (tipo !== 'individual' && tipo !== 'grupal') {
        return res.status(400).json({ error: 'El campo "tipo" debe ser "individual" o "grupal".' });
    }
    if (!Array.isArray(invitados) || invitados.length === 0) {
        return res.status(400).json({ error: 'Indica en "invitados" la lista de ids de los usuarios.' });
    }

    const ids = [...new Set(invitados.map(leerId))]; // sin ids repetidos
    const error = revisarInvitados(tipo, ids, req.usuario.id);
    if (error) {
        return res.status(400).json({ error });
    }
    if (!(await modelo.usuariosValidos(ids))) {
        return res.status(404).json({ error: 'Alguno de los usuarios invitados no existe o está deshabilitado.' });
    }

    const chat = await modelo.crearChat(req.usuario.id, tipo, ids);
    res.status(201).json({ ...chat, invitados: ids });
}

async function misChats(req, res) {
    res.json(await modelo.misChats(req.usuario.id));
}

async function invitaciones(req, res) {
    res.json(await modelo.invitacionesPendientes(req.usuario.id));
}

// CU-25 y CU-26 comparten esta lógica; solo cambia si se acepta o se rechaza.
async function responder(req, res, aceptar) {
    const id = leerId(req.params.id);
    const respondida = id ? await modelo.responder(id, req.usuario.id, aceptar) : false;

    if (!respondida) {
        return res.status(404).json({ error: 'La invitación no existe o ya fue respondida.' });
    }
    res.json({ id, estado: aceptar ? 'aceptada' : 'rechazada' });
}

const aceptar = (req, res) => responder(req, res, true);
const rechazar = (req, res) => responder(req, res, false);

// Revisa que el chat de la URL exista y que el usuario participe. Si no, responde 404 y devuelve null
// (no se distingue «no existe» de «no participas», para no revelar qué chats existen).
async function chatPropio(req, res) {
    const id = leerId(req.params.id);
    if (id && await mensajes.esParticipante(id, req.usuario.id)) return id;
    res.status(404).json({ error: 'El chat no existe o no participas en él.' });
    return null;
}

// RF-17: historial del chat (los 100 mensajes más recientes).
async function verMensajes(req, res) {
    const id = await chatPropio(req, res);
    if (id) res.json(await mensajes.listar(id));
}

// RF-17: enviar un mensaje. Cuerpo: { "contenido": "Hola" }. Se guarda y se reparte en tiempo real.
async function enviar(req, res) {
    const errores = revisarTextos(req.body || {}, { contenido: LARGO_MENSAJE });
    if (errores.length) return res.status(400).json({ error: errores.join(' ') });
    const id = await chatPropio(req, res);
    if (!id) return;
    const mensaje = await mensajes.crear(id, req.usuario.id, req.body.contenido.trim());
    tiempoReal.repartir(mensaje);
    res.status(201).json(mensaje);
}

module.exports = { crear, misChats, invitaciones, aceptar, rechazar, verMensajes, enviar };

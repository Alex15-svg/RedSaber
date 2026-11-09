// Mensajes: chats individuales o grupales por invitación (RF-17, CU-24 a CU-26).
import { api, usuario } from '../api.js';
import { $, esc, vacio, abrirModal, cerrarModal, campo, errorGeneral, marcarError, avisar, refrescar, irA, ROLES } from '../ui.js';

let chatActual = null;
const elegidos = new Map(); // personas marcadas en «Nuevo chat»: id -> nombre

export async function render() {
    const [chats, invitaciones] = await Promise.all([api('GET', '/chats'), api('GET', '/chats/invitaciones')]);
    const chat = chats.find((c) => c.id === chatActual) || chats[0];
    const pendientes = invitaciones.map((i) => `<div class="rs-notice d-flex justify-content-between align-items-center gap-2 flex-wrap">
        <span><strong>Invitación</strong> · ${esc(i.remitente)} te invitó a un chat ${esc(i.tipo)}.</span>
        <span class="d-flex gap-2"><button class="rs-button rs-button--sm" type="button" data-action="aceptar" data-id="${i.id}">Aceptar</button>
        <button class="rs-button rs-button--ghost rs-button--sm" type="button" data-action="rechazar" data-id="${i.id}">Rechazar</button></span></div>`).join('');
    const lista = chats.map((c) => `<button class="rs-chat-item" type="button" data-action="chat" data-id="${c.id}" aria-current="${chat?.id === c.id}">
        <strong>Chat ${esc(c.tipo)} Nº ${c.id}</strong><span class="rs-meta d-block">${c.participantes} participantes</span></button>`).join('');
    const ventana = chat ? `<div class="rs-chat-head"><strong class="rs-h3 mb-0">Chat ${esc(chat.tipo)} Nº ${chat.id}</strong><span class="rs-tag">${chat.participantes} personas</span></div>
        <div class="rs-messages"><p class="rs-notice mb-0"><strong>Próximamente</strong> · El envío de mensajes en tiempo real (Socket.IO) aún no está en el backend.
        Por ahora se crean los chats y se gestionan las invitaciones.</p></div>`
        : vacio('Sin chats', 'Crea un chat o invita a alguien desde Explorar.');
    return `<section class="rs-section">${pendientes}
      <div class="d-flex justify-content-end mb-3"><button class="rs-button" type="button" data-action="nuevo-chat">+ Nuevo chat</button></div>
      <div class="rs-chat"><div class="rs-chat-list">${lista}</div><div class="rs-chat-window">${ventana}</div></div></section>`;
}

// Lista de personas para elegir, a partir de la búsqueda de usuarios (RF-09).
async function pintarPersonas(texto = '') {
    const datos = await api('GET', `/buscar?en=usuarios&q=${encodeURIComponent(texto)}`);
    const yo = usuario();
    const filas = datos.usuarios.filter((u) => u.id !== yo.id).map((u) => `<label class="rs-check">
        <input type="checkbox" data-persona="${u.id}" data-nombre="${esc(u.nombre)}" ${elegidos.has(u.id) ? 'checked' : ''}>
        ${esc(u.nombre)} <span class="rs-meta">${ROLES[u.ocupacion] || ''} · ${esc(u.carrera || '')}</span></label>`).join('');
    $('#personas').innerHTML = filas || '<p class="rs-muted mb-0">Sin resultados.</p>';
}

function pintarElegidos() {
    $('#elegidos').textContent = elegidos.size
        ? `${[...elegidos.values()].join(', ')} · chat ${elegidos.size === 1 ? 'individual' : 'grupal'}`
        : 'Nadie elegido todavía.';
}

function abrirNuevoChat(id, nombre) {
    elegidos.clear();
    if (id) elegidos.set(id, nombre);
    abrirModal('Nuevo chat', `<form class="rs-form" data-form="nuevo-chat" novalidate>
        ${campo('persona', 'Buscar personas', '<input class="rs-input" id="f-persona" name="persona" type="search" data-busca-persona placeholder="Nombre">')}
        <div class="rs-seleccion" id="personas"><p class="rs-muted mb-0">Cargando…</p></div>
        <p class="rs-meta mb-0" id="elegidos"></p><span class="rs-error" id="e-invitados" hidden></span><input type="hidden" name="invitados">
        <p class="rs-caption mb-0">Un invitado: chat individual. Dos o más: grupal. Cada persona acepta o rechaza su invitación.</p>
        ${errorGeneral}<button class="rs-button rs-button--block" type="submit">Enviar invitaciones</button></form>`);
    pintarElegidos();
    pintarPersonas().catch((e) => avisar(e.message));
}

// Eventos del modal «Nuevo chat», que app.js reenvía aquí.
let espera;
export function alEscribirPersona(control) {
    clearTimeout(espera);
    espera = setTimeout(() => pintarPersonas(control.value.trim()).catch((e) => avisar(e.message)), 300);
}
export function alMarcarPersona(control) {
    const id = Number(control.dataset.persona);
    if (control.checked) elegidos.set(id, control.dataset.nombre); else elegidos.delete(id);
    pintarElegidos();
}

async function responder(id, aceptar) {
    await api('POST', `/chats/invitaciones/${id}/${aceptar ? 'aceptar' : 'rechazar'}`);
    avisar(aceptar ? 'Te uniste al chat.' : 'Invitación rechazada.');
    refrescar();
}

export const acciones = {
    chat: (b) => { chatActual = Number(b.dataset.id); refrescar(); },
    'nuevo-chat': () => abrirNuevoChat(),
    invitar: (b) => { irA('mensajes'); abrirNuevoChat(Number(b.dataset.id), b.dataset.nombre); },
    aceptar: (b) => responder(b.dataset.id, true),
    rechazar: (b) => responder(b.dataset.id, false)
};

export const formularios = {
    async 'nuevo-chat'(d, f) {
        const invitados = [...elegidos.keys()];
        if (!invitados.length) return marcarError(f, 'invitados', 'Elige al menos una persona.');
        const tipo = invitados.length === 1 ? 'individual' : 'grupal';
        const chat = await api('POST', '/chats', { tipo, invitados });
        chatActual = chat.id;
        cerrarModal();
        avisar(`Invitación enviada a ${invitados.length} ${invitados.length === 1 ? 'persona' : 'personas'}.`);
        irA('mensajes');
        refrescar();
    }
};

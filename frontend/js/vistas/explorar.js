// Explorar: búsqueda de publicaciones, usuarios y ejercicios filtrada por etiqueta de carrera (RF-09).
import { api, usuario } from '../api.js';
import { $, esc, avatar, vacio, campo, ROLES, TIPOS } from '../ui.js';
import { entrada, cargarGuardadas } from './entrada.js';

const filtros = { q: '', carrera: '', tipo: '', en: 'todo' };
let espera;

// Otras vistas (la columna de carreras, el buscador lateral) fijan filtros antes de abrir Explorar.
export function fijarFiltros(nuevos) {
    Object.assign(filtros, { q: '', carrera: '', tipo: '', en: 'todo' }, nuevos);
}

function persona(u) {
    const yo = usuario();
    return `<div class="rs-list-row">${avatar(u.nombre, u.ocupacion, null, 'rs-avatar--sm')}
      <div><strong>${esc(u.nombre)}</strong><div class="rs-meta">${esc(u.carrera || 'Sin carrera')} · ${ROLES[u.ocupacion] || ''}${u.correo ? ' · ' + esc(u.correo) : ''}</div></div>
      ${u.id === yo.id ? '<span class="rs-tag rs-tag--soft">Tú</span>' : `
        <button class="rs-button rs-button--ghost rs-button--sm" type="button" data-action="invitar" data-id="${u.id}" data-nombre="${esc(u.nombre)}">Invitar a chat</button>
        <button class="rs-action" type="button" data-action="reportar" data-tipo="usuario" data-id="${u.id}">Reportar perfil</button>`}
    </div>`;
}

// Pide los resultados con los filtros actuales y los pinta.
async function resultados() {
    const params = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v));
    const datos = await api('GET', `/buscar?${params}`);
    const pubs = datos.publicaciones.map(entrada).join('');
    const personas = datos.usuarios.map(persona).join('');
    if (!pubs && !personas) return vacio('Sin resultados', 'Prueba con otra palabra o quita los filtros.');
    return `${filtros.en !== 'usuarios' ? `<h2 class="rs-h3 rs-section pb-0 mb-0">Publicaciones · ${datos.publicaciones.length}</h2>${pubs}` : ''}
      ${filtros.en !== 'publicaciones' ? `<section class="rs-section"><h2 class="rs-h3 rs-panel--rule">Personas · ${datos.usuarios.length}</h2>${personas || '<p class="rs-muted">Sin personas para estos filtros.</p>'}</section>` : ''}`;
}

export async function render() {
    const [carreras] = await Promise.all([api('GET', '/buscar/carreras'), cargarGuardadas()]);
    const opcion = (valor, texto, actual) => `<option value="${esc(valor)}" ${valor === actual ? 'selected' : ''}>${esc(texto)}</option>`;
    return `<section class="rs-section pb-0"><div class="row g-3">
        <div class="col-md-5">${campo('q', 'Buscar', `<input class="rs-input" id="f-q" name="q" type="search" data-filtro value="${esc(filtros.q)}" placeholder="Título, asignatura o persona">`)}</div>
        <div class="col-6 col-md-3">${campo('carrera', 'Etiqueta de carrera', `<select class="rs-input" id="f-carrera" name="carrera" data-filtro>${opcion('', 'Todas', filtros.carrera)}${carreras.map((c) => opcion(c, c, filtros.carrera)).join('')}</select>`)}</div>
        <div class="col-6 col-md-2">${campo('tipo', 'Tipo', `<select class="rs-input" id="f-tipo" name="tipo" data-filtro>${opcion('', 'Todos', filtros.tipo)}${Object.entries(TIPOS).map(([v, t]) => opcion(v, v === 'guia' ? 'Ejercicios (guías)' : t, filtros.tipo)).join('')}</select>`)}</div>
        <div class="col-md-2">${campo('en', 'Buscar en', `<select class="rs-input" id="f-en" name="en" data-filtro>${opcion('todo', 'Todo', filtros.en)}${opcion('publicaciones', 'Publicaciones', filtros.en)}${opcion('usuarios', 'Personas', filtros.en)}</select>`)}</div>
      </div></section>
      <div id="resultados">${await resultados()}</div>`;
}

// Al escribir o cambiar un filtro, se actualizan solo los resultados (con una pequeña espera al escribir).
export function alCambiarFiltro(control) {
    filtros[control.name] = control.value.trim();
    clearTimeout(espera);
    espera = setTimeout(async () => {
        const destino = $('#resultados');
        if (destino) destino.innerHTML = await resultados().catch((e) => vacio('No se pudo buscar', esc(e.message)));
    }, control.tagName === 'INPUT' ? 300 : 0);
}

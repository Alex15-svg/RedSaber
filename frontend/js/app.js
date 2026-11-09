// Punto de entrada del frontend: pinta la estructura, elige la vista según la dirección (#/portada)
// y reparte los clics (data-action) y los formularios (data-form) a cada vista.
import { api, usuario } from './api.js';
import { $, esc, avatar, vacio, ROLES, irA, avisar, abrirModal, cerrarModal, limpiarErrores, mostrarErrorGeneral } from './ui.js';
import * as acceso from './vistas/acceso.js';
import * as entrada from './vistas/entrada.js';
import * as portada from './vistas/portada.js';
import * as explorar from './vistas/explorar.js';
import * as mensajes from './vistas/mensajes.js';
import * as guardados from './vistas/guardados.js';
import * as biblioteca from './vistas/biblioteca.js';
import * as talleres from './vistas/talleres.js';
import * as perfil from './vistas/perfil.js';
import * as moderacion from './vistas/moderacion.js';

const VISTAS = { portada, explorar, mensajes, guardados, biblioteca, talleres, perfil, moderacion };
const TITULOS = { portada: 'Portada', explorar: 'Explorar', mensajes: 'Mensajes', guardados: 'Guardados',
    biblioteca: 'Biblioteca', talleres: 'Talleres', perfil: 'Perfil', moderacion: 'Moderación' };
const SOLO_ESCRITORIO = ['guardados', 'biblioteca', 'moderacion']; // en celular se llega por «Menú»

const paginaActual = () => (VISTAS[location.hash.slice(2)] ? location.hash.slice(2) : 'portada');
const paginasVisibles = () => Object.keys(VISTAS).filter((p) => p !== 'moderacion' || usuario()?.ocupacion === 'administrador');

function pintarEstructura(pagina) {
    const u = usuario(), numero = String(Object.keys(VISTAS).indexOf(pagina) + 1).padStart(2, '0');
    $('#pageKicker').textContent = `Nº ${numero} · ${TITULOS[pagina]}`;
    $('#pageTitle').textContent = u ? TITULOS[pagina] : 'RedSaber';
    $('#fecha').textContent = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
    $('#btnSesion').textContent = u ? 'Cerrar sesión' : 'Ingresar';
    $('#temaTexto').textContent = document.documentElement.dataset.bsTheme === 'dark' ? 'Tema claro' : 'Tema oscuro';
    $('#nav').innerHTML = paginasVisibles().map((p, i) => `<button class="rs-nav-link" type="button" data-action="ir" data-pagina="${p}"
        ${p === pagina ? 'aria-current="page"' : ''} ${SOLO_ESCRITORIO.includes(p) ? 'data-movil="no"' : ''}>
        <span class="rs-nav-index">${String(i + 1).padStart(2, '0')}</span><svg aria-hidden="true"><use href="img/iconos.svg#i-${p}"/></svg><span class="rs-nav-text">${TITULOS[p]}</span></button>`).join('');
    $('#cuenta').innerHTML = u
        ? `${avatar(u.nombre, u.ocupacion, null, 'rs-avatar--sm')}<span class="rs-account-text"><strong>${esc(u.nombre)}</strong><small>${ROLES[u.ocupacion]}</small></span>`
        : '<span class="rs-avatar rs-avatar--sm" aria-hidden="true">RS</span><span class="rs-account-text"><strong>Visitante</strong><small>Ingresa con tu cuenta</small></span>';
}

// Columna derecha: etiquetas de carrera que llevan a Explorar con ese filtro (RF-09).
async function pintarCarreras() {
    if (!usuario()) return;
    const carreras = await api('GET', '/buscar/carreras').catch(() => []);
    $('#carreras').innerHTML = carreras.map((c) => `<li><button type="button" data-action="carrera" data-valor="${esc(c)}"><strong>${esc(c)}</strong><small>Ver publicaciones y personas</small></button></li>`).join('')
        || '<li><small class="rs-muted">Aún no hay carreras.</small></li>';
}

async function render() {
    const pagina = paginaActual();
    if (pagina === 'moderacion' && usuario()?.ocupacion !== 'administrador') return irA('portada');
    pintarEstructura(pagina);
    if (!usuario()) { $('#vista').innerHTML = acceso.bienvenida(); return; } // todo exige sesión (RNF-01)
    $('#vista').innerHTML = '<p class="rs-cargando">CARGANDO…</p>';
    try {
        $('#vista').innerHTML = await VISTAS[pagina].render();
    } catch (error) {
        $('#vista').innerHTML = vacio('No se pudo cargar', esc(error.message));
    }
}

// Abre Explorar con los filtros ya fijados (si ya está abierto, solo vuelve a pintar).
const abrirExplorar = () => (paginaActual() === 'explorar' ? render() : irA('explorar'));

// Todas las acciones y formularios de las vistas, más los de la estructura.
const ACCIONES = Object.assign({}, acceso.acciones, entrada.acciones, ...Object.values(VISTAS).map((v) => v.acciones || {}), {
    ir: (b) => { cerrarModal(); irA(b.dataset.pagina); },
    cuenta: () => (usuario() ? irA('perfil') : acceso.abrirAcceso('ingresar')),
    carrera: (b) => { explorar.fijarFiltros({ carrera: b.dataset.valor }); abrirExplorar(); },
    menu: () => abrirModal('Secciones', `<ol class="rs-aside-list">${paginasVisibles().map((p) => `<li><button type="button" data-action="ir" data-pagina="${p}"><strong>${TITULOS[p]}</strong></button></li>`).join('')}</ol>`),
    tema: () => {
        const nuevo = document.documentElement.dataset.bsTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', nuevo);
        try { localStorage.setItem('rs-tema', nuevo); } catch { /* sin almacenamiento */ }
        pintarEstructura(paginaActual());
    }
});
const FORMULARIOS = Object.assign({}, acceso.formularios, entrada.formularios, ...Object.values(VISTAS).map((v) => v.formularios || {}), {
    'buscar-lateral': (d) => { explorar.fijarFiltros({ q: d.get('q').trim() }); abrirExplorar(); }
});

document.addEventListener('click', async (e) => {
    const boton = e.target.closest('[data-action]');
    if (!boton || !ACCIONES[boton.dataset.action]) return;
    e.preventDefault();
    if (!usuario() && !['acceso', 'sesion', 'tema', 'menu', 'cuenta', 'ir'].includes(boton.dataset.action)) return acceso.abrirAcceso('ingresar');
    try { await ACCIONES[boton.dataset.action](boton); } catch (error) { avisar(error.message); }
});

document.addEventListener('submit', async (e) => {
    const form = e.target, manejar = FORMULARIOS[form.dataset.form];
    if (!manejar) return;
    e.preventDefault();
    limpiarErrores(form);
    const enviar = form.querySelector('[type="submit"]');
    enviar?.classList.add('rs-loading'); enviar?.setAttribute('disabled', '');
    try { await manejar(new FormData(form), form); } catch (error) { mostrarErrorGeneral(form, error.message); }
    enviar?.classList.remove('rs-loading'); enviar?.removeAttribute('disabled');
});

// Filtros de Explorar y selector de personas de «Nuevo chat».
document.addEventListener('input', (e) => {
    if (e.target.matches('[data-filtro]')) explorar.alCambiarFiltro(e.target);
    if (e.target.matches('[data-busca-persona]')) mensajes.alEscribirPersona(e.target);
});
document.addEventListener('change', (e) => {
    if (e.target.matches('[data-persona]')) mensajes.alMarcarPersona(e.target);
});

window.addEventListener('hashchange', render);
window.addEventListener('rs-refrescar', () => { render(); pintarCarreras(); });
window.addEventListener('rs-sesion-vencida', () => { avisar('Tu sesión venció. Ingresa de nuevo.'); render(); });

render();
pintarCarreras();

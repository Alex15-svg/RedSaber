// Utilidades de la interfaz: texto seguro, avatares, avisos, modal y formularios.
export const $ = (selector, raiz = document) => raiz.querySelector(selector);

export const ROLES = { estudiante: 'Estudiante', docente: 'Docente', administrador: 'Administración' };
export const TIPOS = { pregunta: 'Pregunta', solucion: 'Solución', guia: 'Guía docente' };
export const CARRERAS = ['Ingeniería en Informática', 'Administración', 'Electricidad', 'Construcción'];

// Escapa el texto antes de ponerlo en el HTML: evita que un dato del usuario se ejecute como código.
export const esc = (texto = '') => String(texto ?? '').replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const iniciales = (nombre = '?') => nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
export const fecha = (f) => new Date(f).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).toUpperCase();

export function avatar(nombre, ocupacion = 'estudiante', foto = null, extra = '') {
    const contenido = foto ? `<img src="${esc(foto)}" alt="">` : esc(iniciales(nombre));
    return `<span class="rs-avatar rs-avatar--${esc(ocupacion)} ${extra}" aria-hidden="true">${contenido}</span>`;
}

export const vacio = (titulo, texto) => `<div class="rs-empty"><p class="rs-h2">${titulo}</p><p>${texto}</p></div>`;

// Navegar y volver a pintar: se avisa con eventos para que las vistas no dependan de app.js.
export const irA = (pagina) => { location.hash = '#/' + pagina; };
export const refrescar = () => window.dispatchEvent(new Event('rs-refrescar'));

// Aviso flotante que desaparece solo.
let temporizador;
export function avisar(texto) {
    const toast = $('#toast');
    toast.textContent = texto;
    toast.hidden = false;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => { toast.hidden = true; }, 3200);
}

// Modal único de Bootstrap: cambia su título y contenido.
let modal;
export function abrirModal(titulo, html) {
    modal = modal || new bootstrap.Modal('#modal');
    $('#modalTitulo').textContent = titulo;
    $('#modalCuerpo').innerHTML = html;
    modal.show();
}
export const cerrarModal = () => modal?.hide();

// Campo de formulario con etiqueta, ayuda opcional y espacio para su error.
export function campo(nombre, etiqueta, entrada, ayuda = '') {
    return `<div class="rs-field"><label class="rs-label" for="f-${nombre}">${etiqueta}</label>${entrada}
        ${ayuda ? `<span class="rs-hint">${ayuda}</span>` : ''}<span class="rs-error" id="e-${nombre}" hidden></span></div>`;
}

// Error general del formulario (por ejemplo, el mensaje que devuelve el servidor).
export const errorGeneral = '<p class="rs-error rs-form-error" data-error-general hidden></p>';

// Marca un campo con error. Devuelve false para poder escribir: ok = marcarError(...).
export function marcarError(form, nombre, texto) {
    const entrada = form.querySelector(`[name="${nombre}"]`);
    const error = form.querySelector(`#e-${nombre}`) || form.querySelector('[data-error-general]');
    entrada?.classList.add('is-invalid');
    entrada?.setAttribute('aria-invalid', 'true');
    if (error) { error.textContent = texto; error.hidden = false; } else avisar(texto);
    return false;
}

export function mostrarErrorGeneral(form, texto) {
    const error = form.querySelector('[data-error-general]');
    if (error) { error.textContent = texto; error.hidden = false; } else avisar(texto);
}

export function limpiarErrores(form) {
    form.querySelectorAll('.is-invalid').forEach((x) => { x.classList.remove('is-invalid'); x.removeAttribute('aria-invalid'); });
    form.querySelectorAll('.rs-error').forEach((x) => { x.hidden = true; });
}

// Revisa que los campos obligatorios tengan texto. pares: [[nombre, mensaje], ...]
export function exigir(form, datos, pares) {
    let ok = true;
    for (const [nombre, mensaje] of pares) {
        if (!String(datos.get(nombre) || '').trim()) ok = marcarError(form, nombre, mensaje);
    }
    return ok;
}

// Lee un FormData como objeto de textos sin espacios sobrantes.
export const textos = (datos, nombres) => Object.fromEntries(nombres.map((n) => [n, String(datos.get(n) || '').trim()]));

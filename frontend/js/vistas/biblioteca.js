// Biblioteca: documentación por áreas de la carrera, con vista de lectura y descarga (RF-10).
import { api, archivo, usuario } from '../api.js';
import { esc, vacio, abrirModal, cerrarModal, campo, errorGeneral, exigir, marcarError, avisar, refrescar } from '../ui.js';

let areaActual = '';

export async function render() {
    const u = usuario();
    const [areas, documentos] = await Promise.all([
        api('GET', '/documentos/areas'),
        api('GET', `/documentos${areaActual ? '?area=' + encodeURIComponent(areaActual) : ''}`)
    ]);
    const tab = (valor, texto) => `<button class="rs-tab" type="button" role="tab" data-action="area" data-valor="${esc(valor)}" aria-selected="${areaActual === valor}">${esc(texto)}</button>`;
    const puedeSubir = ['docente', 'administrador'].includes(u.ocupacion);
    const fichas = documentos.map((d, i) => `<div class="col-md-6"><article class="rs-panel ${i === 0 ? 'rs-panel--ink rs-paper-texture' : ''} h-100">
        <div class="d-flex justify-content-between"><span class="rs-kicker">${esc(d.area)}</span><span class="rs-tag ${i === 0 ? 'text-light border-light' : ''}">PDF · ${esc(d.tamano_mb)} MB</span></div>
        <h2 class="rs-h2 mt-2">${esc(d.titulo)}</h2>
        <div class="d-flex gap-2 flex-wrap mt-3">
          <button class="rs-button rs-button--sm" type="button" data-action="leer" data-id="${d.id}">Leer</button>
          <button class="rs-button rs-button--ghost rs-button--sm ${i === 0 ? 'text-light border-light' : ''}" type="button" data-action="descargar" data-id="${d.id}" data-titulo="${esc(d.titulo)}">Descargar</button>
          <button class="rs-action ${i === 0 ? 'text-light' : ''}" type="button" data-action="guardar-doc" data-id="${d.id}">Guardar</button>
        </div></article></div>`).join('');
    return `<div class="rs-tabs" role="tablist">${tab('', 'Todas')}${areas.map((a) => tab(a.area, `${a.area} · ${a.documentos}`)).join('')}</div>
      <section class="rs-section">
        ${puedeSubir ? '<div class="d-flex justify-content-end mb-3"><button class="rs-button" type="button" data-action="subir-doc">+ Subir documento</button></div>' : ''}
        ${fichas ? `<div class="row g-3">${fichas}</div>` : vacio('Sin documentos', 'Todavía no hay documentos en esta área.')}
      </section>`;
}

export const acciones = {
    area: (b) => { areaActual = b.dataset.valor; refrescar(); },
    leer: (b) => archivo(`/documentos/${b.dataset.id}/leer`).catch((e) => avisar(e.message)),
    descargar: (b) => archivo(`/documentos/${b.dataset.id}/descargar`, `${b.dataset.titulo}.pdf`, true).catch((e) => avisar(e.message)),
    async 'guardar-doc'(b) {
        await api('POST', `/guardados/documentos/${b.dataset.id}`);
        avisar('Documento guardado en tu lista privada.');
    },
    'subir-doc': () => abrirModal('Subir documento', `<form class="rs-form" data-form="subir-doc" novalidate>
        ${campo('titulo', 'Título', '<input class="rs-input" id="f-titulo" name="titulo" maxlength="200">')}
        ${campo('area', 'Área de la carrera', `<input class="rs-input" id="f-area" name="area" maxlength="120" value="${esc(areaActual)}">`)}
        ${campo('archivo', 'Archivo PDF', '<input class="rs-input" id="f-archivo" name="archivo" type="file" accept="application/pdf">', 'Solo PDF, hasta 10 MB.')}
        ${errorGeneral}<button class="rs-button rs-button--block" type="submit">Subir</button></form>`)
};

export const formularios = {
    async 'subir-doc'(d, f) {
        let ok = exigir(f, d, [['titulo', 'Escribe el título.'], ['area', 'Indica el área.']]);
        const pdf = d.get('archivo');
        if (!pdf || !pdf.size) ok = marcarError(f, 'archivo', 'Elige un archivo PDF.');
        else if (pdf.size > 10 * 1024 * 1024) ok = marcarError(f, 'archivo', 'El archivo supera los 10 MB.');
        if (!ok) return;
        await api('POST', '/documentos', d); // se envía como formulario con archivo
        areaActual = d.get('area').trim();
        cerrarModal();
        avisar('Documento publicado.');
        refrescar();
    }
};

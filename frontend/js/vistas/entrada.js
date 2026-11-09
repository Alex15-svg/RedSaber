// Tarjeta de una publicación y sus acciones, compartidas por portada, explorar, guardados y perfil:
// guardar (RF-08), reportar (RF-12), editar y borrar (RF-07), apelar (RF-12) y solución de guías (RF-11).
import { api, usuario } from '../api.js';
import { esc, avatar, fecha, TIPOS, abrirModal, cerrarModal, campo, errorGeneral, exigir, textos, avisar, refrescar } from '../ui.js';

const recordadas = new Map(); // publicaciones pintadas, para rellenar el formulario de edición
let guardadas = new Set();    // ids de publicaciones en la lista privada del usuario

// Carga los ids guardados (RF-08) para mostrar «Guardada» en cada tarjeta.
export async function cargarGuardadas() {
    const lista = await api('GET', '/guardados');
    guardadas = new Set(lista.publicaciones.map((p) => p.id));
    return lista;
}

export function entrada(p) {
    recordadas.set(p.id, p);
    const yo = usuario(), mia = p.autor_id === yo?.id, guardada = guardadas.has(p.id);
    const deshabilitada = p.estado === 'deshabilitada';
    const boton = (accion, texto, extra = '') => `<button class="rs-action" type="button" data-action="${accion}" data-id="${p.id}" ${extra}>${texto}</button>`;
    return `<article class="rs-entry ${p.tipo === 'guia' ? 'rs-entry--guia' : ''} ${deshabilitada ? 'rs-entry--disabled' : ''}" aria-labelledby="t-${p.id}">
      ${avatar(p.autor || yo?.nombre || 'RS', p.autor_ocupacion || (mia ? yo.ocupacion : 'estudiante'))}
      <div>
        <div class="rs-entry-head"><strong>${esc(p.autor || (mia ? yo.nombre : 'Publicación'))}</strong>
          ${p.autor_ocupacion === 'docente' ? '<span class="rs-verified">■ Docente</span>' : ''}
          <span class="rs-meta">${fecha(p.creado_en || p.guardado_en)}</span></div>
        <div class="rs-tags"><span class="rs-tag ${p.tipo === 'guia' ? 'rs-tag--accent' : ''}">${TIPOS[p.tipo] || esc(p.tipo)}</span>
          <span class="rs-tag rs-tag--soft">${esc(p.asignatura)}</span>${p.seccion ? `<span class="rs-tag rs-tag--soft">${esc(p.seccion)}</span>` : ''}
          ${p.verificada ? '<span class="rs-tag">✓ Verificada</span>' : ''}${p.con_solucion ? '<span class="rs-tag">Con solución</span>' : ''}
          ${deshabilitada ? '<span class="rs-tag rs-tag--accent">Deshabilitada por reportes</span>' : ''}</div>
        <h2 class="rs-entry-title" id="t-${p.id}">${esc(p.titulo)}</h2>
        ${p.descripcion ? `<p class="rs-entry-text">${esc(p.descripcion)}</p>` : ''}
        <p class="rs-meta mb-0">${esc(p.carrera)}</p>
        <div class="rs-actions">
          ${deshabilitada ? '' : boton('guardar', guardada ? '■ Guardada' : '□ Guardar', `aria-pressed="${guardada}"`)}
          ${mia ? boton('editar', 'Editar') + boton('borrar', 'Borrar') : boton('reportar', 'Reportar')}
          ${mia && deshabilitada ? boton('apelar', 'Apelar') : ''}
          ${mia && p.tipo === 'guia' && !deshabilitada ? boton('solucion', 'Cambiar «con solución»') : ''}
        </div>
      </div>
    </article>`;
}

const textoLargo = (nombre, etiqueta, valor = '') => campo(nombre, etiqueta, `<textarea class="rs-input" id="f-${nombre}" name="${nombre}" rows="4">${esc(valor)}</textarea>`);
const linea = (nombre, etiqueta, valor = '') => campo(nombre, etiqueta, `<input class="rs-input" id="f-${nombre}" name="${nombre}" value="${esc(valor)}">`);
const CAMPOS = ['titulo', 'carrera', 'asignatura', 'seccion', 'descripcion'];

export const acciones = {
    async guardar(b) {
        const id = Number(b.dataset.id), ya = guardadas.has(id);
        await api(ya ? 'DELETE' : 'POST', `/guardados/publicaciones/${id}`);
        if (ya) guardadas.delete(id); else guardadas.add(id);
        avisar(ya ? 'Quitada de tu lista privada.' : 'Guardada en tu lista privada.');
        refrescar();
    },
    reportar: (b) => abrirModal('Reportar', `<form class="rs-form" data-form="reportar" data-tipo="${b.dataset.tipo || 'publicacion'}" data-id="${b.dataset.id}" novalidate>
        <p class="mb-0">Se revisará si incumple las normas de la comunidad. Al acumular reportes se deshabilita automáticamente.</p>
        ${textoLargo('motivo', 'Motivo')}${errorGeneral}<button class="rs-button rs-button--block" type="submit">Enviar reporte</button></form>`),
    editar(b) {
        const p = recordadas.get(Number(b.dataset.id));
        abrirModal('Editar publicación', `<form class="rs-form" data-form="editar" data-id="${p.id}" novalidate>
            ${linea('titulo', 'Título', p.titulo)}${textoLargo('descripcion', 'Descripción', p.descripcion)}
            ${linea('carrera', 'Carrera', p.carrera)}${linea('asignatura', 'Asignatura', p.asignatura)}${linea('seccion', 'Sección', p.seccion)}
            ${errorGeneral}<button class="rs-button rs-button--block" type="submit">Guardar cambios</button></form>`);
    },
    borrar: (b) => abrirModal('Borrar publicación', `<p>Esta acción no se puede deshacer.</p><div class="d-flex gap-2 justify-content-end">
        <button class="rs-button rs-button--ghost" type="button" data-bs-dismiss="modal">Cancelar</button>
        <button class="rs-button" type="button" data-action="confirmar-borrar" data-id="${b.dataset.id}">Borrar</button></div>`),
    async 'confirmar-borrar'(b) {
        await api('DELETE', `/publicaciones/${b.dataset.id}`);
        cerrarModal(); avisar('Publicación borrada.'); refrescar();
    },
    apelar: (b) => abrirModal('Apelar', `<form class="rs-form" data-form="apelar" data-id="${b.dataset.id}" novalidate>
        <p class="mb-0">Explica por qué tu publicación no incumple las normas. Un administrador la revisará.</p>
        ${textoLargo('justificacion', 'Justificación')}${errorGeneral}<button class="rs-button rs-button--block" type="submit">Enviar apelación</button></form>`),
    async solucion(b) {
        const p = recordadas.get(Number(b.dataset.id));
        const guia = await api('PATCH', `/guias/${p.id}/solucion`, { con_solucion: !p.con_solucion });
        avisar(guia.con_solucion ? 'La guía ahora indica que trae solución.' : 'La guía ahora indica que no trae solución.');
        refrescar();
    }
};

export const formularios = {
    async reportar(d, f) {
        if (!exigir(f, d, [['motivo', 'Escribe el motivo del reporte.']])) return;
        const r = await api('POST', '/moderacion/reportes', { tipo: f.dataset.tipo, id: Number(f.dataset.id), motivo: d.get('motivo').trim() });
        cerrarModal(); avisar(r.mensaje);
    },
    async editar(d, f) {
        const pares = CAMPOS.map((c) => [c, 'Este campo es obligatorio.']);
        if (!exigir(f, d, pares)) return;
        await api('PUT', `/publicaciones/${f.dataset.id}`, textos(d, CAMPOS));
        cerrarModal(); avisar('Cambios guardados.'); refrescar();
    },
    async apelar(d, f) {
        if (!exigir(f, d, [['justificacion', 'Escribe tu justificación.']])) return;
        const r = await api('POST', '/moderacion/apelaciones/publicacion', { id: Number(f.dataset.id), justificacion: d.get('justificacion').trim() });
        cerrarModal(); avisar(r.mensaje); refrescar();
    }
};

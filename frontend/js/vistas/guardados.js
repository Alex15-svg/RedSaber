// Guardados: lista privada de publicaciones y documentos del perfil (RF-08).
import { api } from '../api.js';
import { esc, vacio, avisar, refrescar } from '../ui.js';
import { entrada, cargarGuardadas } from './entrada.js';

export async function render() {
    const lista = await cargarGuardadas();
    const documentos = lista.documentos.map((d) => `<div class="rs-list-row"><span class="rs-tag">PDF</span>
        <div><strong>${esc(d.titulo)}</strong><div class="rs-meta">${esc(d.area)}</div></div>
        <button class="rs-button rs-button--sm" type="button" data-action="leer" data-id="${d.id}">Leer</button>
        <button class="rs-action" type="button" data-action="quitar-doc" data-id="${d.id}">Quitar</button></div>`).join('');
    return `<section class="rs-section pb-0"><p class="rs-notice mb-0"><strong>Lista privada</strong> · Solo tú ves lo que guardas.</p></section>
      ${lista.publicaciones.map(entrada).join('') || vacio('Sin publicaciones guardadas', 'Usa «Guardar» en cualquier publicación.')}
      <section class="rs-section"><h2 class="rs-h3 rs-panel--rule">Documentos</h2>
      ${documentos || '<p class="rs-muted">No has guardado documentos. Puedes hacerlo desde la Biblioteca.</p>'}</section>`;
}

export const acciones = {
    async 'quitar-doc'(b) {
        await api('DELETE', `/guardados/documentos/${b.dataset.id}`);
        avisar('Documento quitado de tu lista.');
        refrescar();
    }
    // «Leer» usa la acción de la Biblioteca (biblioteca.js).
};

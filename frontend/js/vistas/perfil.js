// Perfil propio: datos y etiquetas, personalización (RF-05) y mis publicaciones (RF-07),
// con la opción de apelar las que la moderación deshabilitó (RF-12).
import { api } from '../api.js';
import { esc, avatar, vacio, abrirModal, cerrarModal, campo, errorGeneral, marcarError, avisar, refrescar, ROLES } from '../ui.js';
import { entrada, cargarGuardadas } from './entrada.js';

let perfil = null;
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];

export async function render() {
    const [datos, mias, guias] = await Promise.all([api('GET', '/perfil'), api('GET', '/publicaciones/mias'), api('GET', '/guias'), cargarGuardadas()]);
    perfil = datos;
    // Las guías propias traen además su marca de verificación y «con_solucion» (RF-11).
    const guia = new Map(guias.map((g) => [g.id, g]));
    const publicaciones = mias.map((p) => ({ ...p, verificada: guia.get(p.id)?.verificada, con_solucion: guia.get(p.id)?.con_solucion }));
    const fondo = datos.encabezado_url ? `background-image:url('${esc(datos.encabezado_url)}')` : '';
    return `<div class="rs-cover rs-paper-texture rs-torn" style="${fondo}"><span class="rs-cover-word" aria-hidden="true">${esc(datos.nombre.split(' ')[0])}</span></div>
      <div class="rs-profile-head">${avatar(datos.nombre, datos.ocupacion, datos.foto_url, 'rs-avatar--lg')}
        <button class="rs-button rs-button--ghost rs-button--sm mb-2" type="button" data-action="editar-perfil">Personalizar perfil</button></div>
      <section class="rs-section">
        <h2 class="rs-h2 mb-1">${esc(datos.nombre)}</h2>
        <p class="rs-meta">${esc(datos.correo_institucional)} · ${datos.correo_publico ? 'CORREO PÚBLICO' : 'CORREO PRIVADO'}</p>
        <div class="rs-tags"><span class="rs-tag rs-tag--accent">${ROLES[datos.ocupacion]}</span><span class="rs-tag">${esc(datos.carrera || 'Sin carrera')}</span>
          <span class="rs-tag rs-tag--soft">${mias.length} publicaciones</span></div>
      </section>
      <h2 class="rs-h3 rs-section pb-0 mb-0">Mis publicaciones</h2>
      ${publicaciones.map(entrada).join('') || vacio('Sin publicaciones', 'Lo que publiques aparecerá aquí, con opciones para editar o borrar.')}`;
}

const archivoImagen = (nombre, etiqueta) => campo(nombre, etiqueta, `<input class="rs-input" id="f-${nombre}" name="${nombre}" type="file" accept="image/jpeg,image/png,image/webp">`);

export const acciones = {
    'editar-perfil': () => abrirModal('Personalizar perfil', `<form class="rs-form" data-form="perfil" novalidate>
        ${archivoImagen('foto', 'Foto de perfil')}${archivoImagen('encabezado', 'Encabezado')}${archivoImagen('fondo', 'Fondo')}
        <p class="rs-hint mb-0">JPG, PNG o WEBP de hasta 2 MB. Deja vacío lo que no quieras cambiar.</p>
        <label class="rs-check"><input type="checkbox" name="publico" ${perfil?.correo_publico ? 'checked' : ''}> Mostrar mi correo en el perfil y en las búsquedas</label>
        ${errorGeneral}<button class="rs-button rs-button--block" type="submit">Guardar cambios</button></form>`)
};

export const formularios = {
    async perfil(d, f) {
        // 1) Revisar las imágenes elegidas antes de subir nada.
        const imagenes = ['foto', 'encabezado', 'fondo'].map((c) => [c, d.get(c)]).filter(([, a]) => a && a.size);
        let ok = true;
        for (const [nombre, a] of imagenes) {
            if (!TIPOS_IMAGEN.includes(a.type)) ok = marcarError(f, nombre, 'Formato no admitido: usa JPG, PNG o WEBP.');
            else if (a.size > 2 * 1024 * 1024) ok = marcarError(f, nombre, 'La imagen supera los 2 MB.');
        }
        if (!ok) return;
        // 2) Subir cada imagen (una solicitud por campo) y guardar la visibilidad del correo.
        for (const [nombre, a] of imagenes) {
            const envio = new FormData();
            envio.append('imagen', a);
            await api('PUT', `/perfil/imagen/${nombre}`, envio);
        }
        await api('PATCH', '/perfil/correo', { publico: d.get('publico') === 'on' });
        cerrarModal();
        avisar('Perfil actualizado.');
        refrescar();
    }
};

// Moderación (solo administración): apelaciones pendientes y rehabilitación (RF-13, rutas de Fabián),
// lista de usuarios (RF-02) y eliminación manual de lo no apelado (RF-12).
import { api } from '../api.js';
import { esc, fecha, vacio, avisar, refrescar, ROLES } from '../ui.js';

export async function render() {
    const [apelaciones, usuarios] = await Promise.all([api('GET', '/moderacion/apelaciones'), api('GET', '/cuentas/usuarios')]);
    const deshabilitadas = usuarios.filter((u) => u.estado === 'deshabilitada').length;

    const filas = apelaciones.map((a) => `<div class="rs-list-row">
        <span class="rs-tag rs-tag--accent">${a.usuario_id ? 'Cuenta' : 'Publicación'} Nº ${a.usuario_id || a.publicacion_id}</span>
        <div><strong>${esc(a.justificacion)}</strong><div class="rs-meta">ENVIADA ${fecha(a.creado_en)} · PLAZO ${fecha(a.fecha_limite)}</div></div>
        <button class="rs-button rs-button--sm" type="button" data-action="rehabilitar" data-id="${a.id}">Aceptar y rehabilitar</button></div>`).join('');

    const tabla = usuarios.map((u) => `<tr><td>${esc(u.nombre)}</td><td><span class="rs-tag">${ROLES[u.ocupacion] || esc(u.ocupacion)}</span></td>
        <td class="rs-meta">${esc(u.correo_institucional)}</td><td>${u.estado === 'activa' ? 'Activa' : '<span class="rs-tag rs-tag--accent">Deshabilitada</span>'}</td></tr>`).join('');

    return `<section class="rs-section"><div class="row g-3 mb-3">
        <div class="col-sm-4"><div class="rs-panel rs-panel--ink rs-paper-texture h-100"><div class="rs-stat">${apelaciones.length}</div><div class="rs-meta">APELACIONES PENDIENTES</div></div></div>
        <div class="col-sm-4"><div class="rs-panel h-100"><div class="rs-stat">${deshabilitadas}</div><div class="rs-meta">CUENTAS DESHABILITADAS</div></div></div>
        <div class="col-sm-4"><div class="rs-panel h-100"><p class="rs-meta">ELIMINAR LO NO APELADO EN PLAZO</p>
          <button class="rs-button rs-button--sm" type="button" data-action="limpieza">Ejecutar ahora</button></div></div>
      </div>
      <h2 class="rs-h3 rs-panel--rule">Apelaciones pendientes</h2>
      ${filas || vacio('Sin apelaciones', 'No hay apelaciones esperando revisión.')}
      <h2 class="rs-h3 rs-panel--rule mt-4">Usuarios</h2>
      <div class="table-responsive"><table class="rs-table"><thead><tr><th scope="col">Nombre</th><th scope="col">Rol</th><th scope="col">Correo</th><th scope="col">Estado</th></tr></thead>
      <tbody>${tabla}</tbody></table></div></section>`;
}

export const acciones = {
    async rehabilitar(b) {
        const r = await api('POST', `/moderacion/apelaciones/${b.dataset.id}/rehabilitar`);
        avisar(r.mensaje);
        refrescar();
    },
    async limpieza() {
        const r = await api('POST', '/moderacion/limpieza');
        avisar(r.eliminados ? `Se eliminaron ${r.eliminados} elementos no apelados.` : 'No había nada vencido para eliminar.');
        refrescar();
    }
};

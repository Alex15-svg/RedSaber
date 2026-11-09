// Talleres de la sede con inscritos y capacidad actual (RF-16).
import { api } from '../api.js';
import { esc, vacio } from '../ui.js';

export async function render() {
    const { talleres, mensaje } = await api('GET', '/talleres');
    if (!talleres.length) return `<section class="rs-section">${vacio('Sin talleres', esc(mensaje || 'No hay talleres disponibles en la sede.'))}</section>`;

    const fichas = talleres.map((t) => {
        const lleno = t.cupos_disponibles <= 0;
        const porcentaje = Math.min(100, (t.inscritos / t.capacidad) * 100);
        return `<div class="col-md-6 col-xl-4"><article class="rs-panel h-100">
          <div class="d-flex justify-content-between"><span class="rs-meta">TALLER Nº ${t.id}</span>${lleno ? '<span class="rs-tag rs-tag--accent">Sin cupos</span>' : ''}</div>
          <h2 class="rs-h3 mt-2">${esc(t.nombre)}</h2>
          <div class="d-flex align-items-baseline gap-2"><span class="rs-stat">${t.inscritos}</span><span class="rs-meta">/ ${t.capacidad} CUPOS</span></div>
          <div class="rs-meter ${lleno ? 'rs-meter--full' : ''}" role="img" aria-label="${t.inscritos} de ${t.capacidad} cupos ocupados"><span style="width:${porcentaje}%"></span></div>
          <p class="rs-meta mt-2 mb-0">${Math.max(0, t.cupos_disponibles)} CUPOS DISPONIBLES</p>
        </article></div>`;
    }).join('');
    return `<section class="rs-section"><p class="rs-muted">Talleres de la sede con inscritos y capacidad actual.</p><div class="row g-3">${fichas}</div></section>`;
}

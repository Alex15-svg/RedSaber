// Portada: últimas publicaciones (vía la búsqueda de RF-09) y formulario para publicar.
// Estudiantes publican preguntas o soluciones (RF-06); docentes publican guías verificadas (RF-11).
import { api, usuario } from '../api.js';
import { $, esc, vacio, campo, errorGeneral, exigir, textos, avisar, refrescar, irA, TIPOS, CARRERAS } from '../ui.js';
import { entrada, cargarGuardadas } from './entrada.js';

let filtro = 'todos';
const CAMPOS = ['titulo', 'descripcion', 'carrera', 'asignatura', 'seccion'];

function formularioPublicar(u, carreras) {
    if (u.ocupacion === 'administrador') return '';
    const docente = u.ocupacion === 'docente';
    const tipos = docente ? ['guia'] : ['pregunta', 'solucion'];
    const opciones = [...new Set([...carreras, ...CARRERAS])].map((c) => `<option value="${esc(c)}">`).join('');
    return `<section class="rs-compose" aria-label="Publicar">
      <div class="rs-compose-head"><span class="rs-label">Nueva entrada</span><span class="rs-meta" style="color:inherit">${docente ? 'GUÍA DOCENTE · VERIFICADA' : 'DUDA O SOLUCIÓN'}</span></div>
      <form class="rs-compose-body rs-form" data-form="publicar" novalidate>
        ${campo('titulo', 'Título', '<input class="rs-input" id="f-titulo" name="titulo" maxlength="200" placeholder="¿Qué necesitas resolver?">')}
        ${campo('descripcion', 'Descripción', '<textarea class="rs-input" id="f-descripcion" name="descripcion" maxlength="5000" placeholder="Explica el contexto, lo que intentaste y dónde te trabaste."></textarea>')}
        <div class="row g-2">
          <div class="col-6 col-lg-3">${campo('tipo', 'Tipo', `<select class="rs-input" id="f-tipo" name="tipo">${tipos.map((t) => `<option value="${t}">${TIPOS[t]}</option>`).join('')}</select>`)}</div>
          <div class="col-6 col-lg-3">${campo('carrera', 'Carrera', `<input class="rs-input" id="f-carrera" name="carrera" maxlength="120" list="carreras-publicar"><datalist id="carreras-publicar">${opciones}</datalist>`)}</div>
          <div class="col-6 col-lg-3">${campo('asignatura', 'Asignatura', '<input class="rs-input" id="f-asignatura" name="asignatura" maxlength="120">')}</div>
          <div class="col-6 col-lg-3">${campo('seccion', 'Sección', '<input class="rs-input" id="f-seccion" name="seccion" maxlength="30" placeholder="TI3043">')}</div>
        </div>
        ${docente ? '<label class="rs-check"><input type="checkbox" name="con_solucion"> La guía incluye su solución</label>' : ''}
        ${errorGeneral}<div class="d-flex justify-content-end"><button class="rs-button" type="submit">Publicar</button></div>
      </form>
    </section>`;
}

export async function render() {
    const u = usuario();
    const tipo = filtro === 'todos' ? '' : `&tipo=${filtro}`;
    const [resultado, carreras] = await Promise.all([
        api('GET', `/buscar?en=publicaciones${tipo}`),
        api('GET', '/buscar/carreras'),
        cargarGuardadas()
    ]);
    const tab = (v, t) => `<button class="rs-tab" type="button" role="tab" data-action="filtro" data-valor="${v}" aria-selected="${filtro === v}">${t}</button>`;
    return `<div class="rs-tabs" role="tablist">${tab('todos', 'Todo')}${tab('pregunta', 'Preguntas')}${tab('solucion', 'Soluciones')}${tab('guia', 'Guías docentes')}</div>
      ${formularioPublicar(u, carreras)}
      <div id="feed">${resultado.publicaciones.map(entrada).join('') || vacio('Sin entradas', 'Todavía no hay publicaciones en esta sección.')}</div>`;
}

export const acciones = {
    filtro: (b) => { filtro = b.dataset.valor; refrescar(); },
    'publicar-foco': () => {
        irA('portada');
        setTimeout(() => $('#f-titulo')?.focus(), 300);
    }
};

export const formularios = {
    async publicar(d, f) {
        const pares = [['titulo', 'Escribe un título.'], ['descripcion', 'Describe tu duda, solución o guía.'], ['carrera', 'Indica la carrera.'],
            ['asignatura', 'Indica la asignatura.'], ['seccion', 'Indica la sección.']];
        if (!exigir(f, d, pares)) return;
        const datos = textos(d, CAMPOS);
        if (d.get('tipo') === 'guia') {
            await api('POST', '/guias', { ...datos, con_solucion: d.get('con_solucion') === 'on' });
        } else {
            await api('POST', '/publicaciones', { ...datos, tipo: d.get('tipo') });
        }
        filtro = 'todos';
        avisar('Publicación creada.');
        refrescar();
    }
};

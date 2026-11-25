// Moderación previa (solo administración): publicaciones que esperan revisión antes de verse.
// Aprobar la publica; rechazar la deja visible solo para su autor, que puede editarla y reenviarla.
import { fecha } from '../utiles.js';
import { Etiqueta, Vacio } from '../componentes/Piezas.jsx';

const TIPOS = { pregunta: 'Pregunta', solucion: 'Solución', publicacion: 'Publicación' };

export default function RevisionPublicaciones({ pendientes, hacer }) {
    return (<>
        <h2 className="rs-h3 rs-panel--rule">Publicaciones por revisar</h2>
        {pendientes.length ? pendientes.map((p) => (
            <div key={p.id} className="rs-list-row">
                <Etiqueta acento>{TIPOS[p.tipo] || p.tipo}</Etiqueta>
                <div>
                    {p.titulo && <strong className="d-block">{p.titulo}</strong>}
                    <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{p.descripcion}</span>
                    <div className="rs-meta">{p.autor} · {p.correo} · {fecha(p.actualizado_en)}
                        {p.carrera ? ` · ${p.carrera} · ${p.asignatura} · ${p.seccion}` : ''}</div>
                </div>
                <button className="rs-button rs-button--sm" type="button"
                    onClick={() => hacer('POST', `/moderacion/publicaciones/${p.id}/aprobar`)}>Aprobar</button>
                <button className="rs-button rs-button--ghost rs-button--sm" type="button"
                    onClick={() => hacer('POST', `/moderacion/publicaciones/${p.id}/rechazar`)}>Rechazar</button>
            </div>)) : <Vacio titulo="Nada por revisar">No hay publicaciones esperando revisión.</Vacio>}
    </>);
}

// Cursos del docente: solicitudes recibidas (RF-14) y gestión de sus cursos (RF-15):
// abrir el ingreso, cerrarlo y ver los estudiantes ingresados.
import { api } from '../api.js';
import { useAviso, useModal } from '../contexto.jsx';
import { useDatos } from '../ganchos.js';
import { fecha } from '../utiles.js';
import { Estado, Etiqueta, Vacio } from '../componentes/Piezas.jsx';

function Ingresados({ id }) {
    const { datos, error, cargando } = useDatos(() => api('GET', `/cursos/${id}/ingresados`), [id]);
    return (
        <Estado cargando={cargando} error={error}>
            {datos?.length ? datos.map((u) => (
                <div key={u.id} className="rs-list-row"><div><strong>{u.nombre}</strong><div className="rs-meta">{u.correo_institucional}</div></div>
                    <span className="rs-meta">{fecha(u.ingresado_en)}</span></div>
            )) : <Vacio titulo="Sin ingresados">Todavía no ingresa nadie a este curso.</Vacio>}
        </Estado>
    );
}

export default function CursosDocente() {
    const avisar = useAviso();
    const modal = useModal();
    const { datos, error, cargando, recargar } = useDatos(async () => {
        const [solicitudes, cursos] = await Promise.all([api('GET', '/cursos/solicitudes'), api('GET', '/cursos/mios')]);
        return { solicitudes, cursos };
    });

    async function cambiar(id, accion) {
        try { avisar((await api('POST', `/cursos/${id}/${accion}`)).mensaje); recargar(); } catch (e) { avisar(e.message); }
    }

    if (!datos) return <Estado cargando={cargando} error={error} />;
    const pendientes = datos.solicitudes.filter((s) => s.estado === 'solicitado');
    return (
        <section className="rs-section">
            <h2 className="rs-h3 rs-panel--rule">Solicitudes recibidas · {pendientes.length}</h2>
            {pendientes.length ? pendientes.map((s) => (
                <article key={s.curso_id} className="rs-panel">
                    <div className="d-flex justify-content-between gap-2 flex-wrap"><h3 className="rs-h3 mb-1">{s.nombre}</h3><span className="rs-meta">{fecha(s.fecha)}</span></div>
                    <p className="mb-2">{s.objetivo}</p>
                    <p className="rs-meta mb-2">GRUPO «{s.grupo}» · {(s.integrantes || []).join(', ')}</p>
                    <button className="rs-button rs-button--sm" type="button" onClick={() => cambiar(s.curso_id, 'abrir')}>Abrir el curso</button>
                </article>
            )) : <p className="rs-muted">No tienes solicitudes pendientes.</p>}

            <h2 className="rs-h3 rs-panel--rule mt-4">Mis cursos · {datos.cursos.length}</h2>
            {datos.cursos.length ? (
                <div className="table-responsive"><table className="rs-table">
                    <thead><tr><th scope="col">Curso</th><th scope="col">Estado</th><th scope="col">Interesados</th><th scope="col">Ingresados</th><th scope="col">Acciones</th></tr></thead>
                    <tbody>{datos.cursos.map((c) => (
                        <tr key={c.id}>
                            <td>{c.nombre}</td>
                            <td><Etiqueta acento={c.estado === 'abierto'}>{c.estado}</Etiqueta></td>
                            <td>{c.interesados}</td>
                            <td>{c.ingresados}{c.capacidad ? ` / ${c.capacidad}` : ''}</td>
                            <td className="d-flex gap-2 flex-wrap">
                                {c.estado === 'solicitado' && <button className="rs-button rs-button--sm" type="button" onClick={() => cambiar(c.id, 'abrir')}>Abrir</button>}
                                {c.estado === 'abierto' && <button className="rs-button rs-button--ghost rs-button--sm" type="button" onClick={() => cambiar(c.id, 'cerrar')}>Cerrar ingreso</button>}
                                <button className="rs-action" type="button" onClick={() => modal.abrir(`Ingresados · ${c.nombre}`, <Ingresados id={c.id} />)}>Ver ingresados</button>
                            </td>
                        </tr>))}
                    </tbody>
                </table></div>
            ) : <Vacio titulo="Sin cursos">Cuando un grupo te solicite un curso, aparecerá aquí.</Vacio>}
        </section>
    );
}

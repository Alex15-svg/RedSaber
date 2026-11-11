// Moderación (solo administración): apelaciones pendientes con aceptar o rechazar (RF-13, rutas de Fabián),
// lista de usuarios (RF-02) y eliminación manual de lo no apelado o rechazado (RF-12).
import { api } from '../api.js';
import { useAviso } from '../contexto.jsx';
import { useDatos } from '../ganchos.js';
import { ROLES, fecha } from '../utiles.js';
import { Estado, Etiqueta, Vacio } from '../componentes/Piezas.jsx';

export default function Moderacion() {
    const avisar = useAviso();
    const { datos, error, cargando, recargar } = useDatos(async () => {
        const [apelaciones, usuarios] = await Promise.all([api('GET', '/moderacion/apelaciones'), api('GET', '/cuentas/usuarios')]);
        return { apelaciones, usuarios };
    });

    // Ejecuta una acción de moderación, muestra el mensaje del servidor y vuelve a cargar.
    async function hacer(metodo, ruta, mensaje) {
        try {
            const r = await api(metodo, ruta);
            avisar(mensaje ? mensaje(r) : r.mensaje);
            recargar();
        } catch (e) { avisar(e.message); }
    }
    const limpiar = () => hacer('POST', '/moderacion/limpieza',
        (r) => (r.eliminados ? `Se eliminaron ${r.eliminados} elementos no apelados o rechazados.` : 'No había nada vencido para eliminar.'));

    if (!datos) return <Estado cargando={cargando} error={error} />;
    const { apelaciones, usuarios } = datos;
    return (
        <section className="rs-section">
            <div className="row g-3 mb-3">
                <div className="col-sm-4"><div className="rs-panel rs-panel--ink rs-paper-texture h-100"><div className="rs-stat">{apelaciones.length}</div><div className="rs-meta">APELACIONES PENDIENTES</div></div></div>
                <div className="col-sm-4"><div className="rs-panel h-100"><div className="rs-stat">{usuarios.filter((u) => u.estado === 'deshabilitada').length}</div><div className="rs-meta">CUENTAS DESHABILITADAS</div></div></div>
                <div className="col-sm-4"><div className="rs-panel h-100"><p className="rs-meta">ELIMINAR LO VENCIDO SIN APELACIÓN VIGENTE</p>
                    <button className="rs-button rs-button--sm" type="button" onClick={limpiar}>Ejecutar ahora</button></div></div>
            </div>

            <h2 className="rs-h3 rs-panel--rule">Apelaciones pendientes</h2>
            {apelaciones.length ? apelaciones.map((a) => (
                <div key={a.id} className="rs-list-row">
                    <Etiqueta acento>{a.usuario_id ? 'Cuenta' : 'Publicación'} Nº {a.usuario_id || a.publicacion_id}</Etiqueta>
                    <div><strong>{a.justificacion}</strong><div className="rs-meta">ENVIADA {fecha(a.creado_en)} · PLAZO {fecha(a.fecha_limite)}</div></div>
                    <button className="rs-button rs-button--sm" type="button" onClick={() => hacer('POST', `/moderacion/apelaciones/${a.id}/rehabilitar`)}>Aceptar y rehabilitar</button>
                    <button className="rs-button rs-button--ghost rs-button--sm" type="button" onClick={() => hacer('POST', `/moderacion/apelaciones/${a.id}/rechazar`)}>Rechazar</button>
                </div>)) : <Vacio titulo="Sin apelaciones">No hay apelaciones esperando revisión.</Vacio>}

            <h2 className="rs-h3 rs-panel--rule mt-4">Usuarios</h2>
            <div className="table-responsive"><table className="rs-table">
                <thead><tr><th scope="col">Nombre</th><th scope="col">Rol</th><th scope="col">Correo</th><th scope="col">Estado</th></tr></thead>
                <tbody>{usuarios.map((u) => (
                    <tr key={u.id}><td>{u.nombre}</td><td><Etiqueta>{ROLES[u.ocupacion] || u.ocupacion}</Etiqueta></td>
                        <td className="rs-meta">{u.correo_institucional}</td>
                        <td>{u.estado === 'activa' ? 'Activa' : <Etiqueta acento>Deshabilitada</Etiqueta>}</td></tr>))}
                </tbody>
            </table></div>
        </section>
    );
}

// Guardados: lista privada de publicaciones y documentos del perfil (RF-08).
import { api, archivo } from '../api.js';
import { useAviso } from '../contexto.jsx';
import { useDatos } from '../ganchos.js';
import { Estado, Vacio } from '../componentes/Piezas.jsx';
import Entrada from '../componentes/Entrada.jsx';

export default function Guardados() {
    const avisar = useAviso();
    const { datos, error, cargando, recargar } = useDatos(() => api('GET', '/guardados'));
    const guardadas = new Set((datos?.publicaciones || []).map((p) => p.id));

    async function quitar(id) {
        try { await api('DELETE', `/guardados/documentos/${id}`); avisar('Documento quitado de tu lista.'); recargar(); }
        catch (e) { avisar(e.message); }
    }

    return (
        <Estado cargando={cargando && !datos} error={error}>
            <section className="rs-section pb-0"><p className="rs-notice mb-0"><strong>Lista privada</strong> · Solo tú ves lo que guardas.</p></section>
            {datos?.publicaciones.length
                ? datos.publicaciones.map((p) => <Entrada key={p.id} p={p} guardadas={guardadas} alCambiar={recargar} />)
                : <Vacio titulo="Sin publicaciones guardadas">Usa «Guardar» en cualquier publicación.</Vacio>}
            <section className="rs-section"><h2 className="rs-h3 rs-panel--rule">Documentos</h2>
                {datos?.documentos.length ? datos.documentos.map((d) => (
                    <div key={d.id} className="rs-list-row"><span className="rs-tag">PDF</span>
                        <div><strong>{d.titulo}</strong><div className="rs-meta">{d.area}</div></div>
                        <button className="rs-button rs-button--sm" type="button" onClick={() => archivo(`/documentos/${d.id}/leer`).catch((e) => avisar(e.message))}>Leer</button>
                        <button className="rs-action" type="button" onClick={() => quitar(d.id)}>Quitar</button>
                    </div>)) : <p className="rs-muted">No has guardado documentos. Puedes hacerlo desde la Biblioteca.</p>}
            </section>
        </Estado>
    );
}

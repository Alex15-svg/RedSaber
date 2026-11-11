// Talleres de la sede con inscritos y capacidad actual (RF-16).
import { api } from '../api.js';
import { useDatos } from '../ganchos.js';
import { Estado, Vacio } from '../componentes/Piezas.jsx';

function Taller({ t }) {
    const lleno = t.cupos_disponibles <= 0;
    return (
        <div className="col-md-6 col-xl-4"><article className="rs-panel h-100">
            <div className="d-flex justify-content-between"><span className="rs-meta">TALLER Nº {t.id}</span>
                {lleno && <span className="rs-tag rs-tag--accent">Sin cupos</span>}</div>
            <h2 className="rs-h3 mt-2">{t.nombre}</h2>
            <div className="d-flex align-items-baseline gap-2"><span className="rs-stat">{t.inscritos}</span><span className="rs-meta">/ {t.capacidad} CUPOS</span></div>
            <div className={`rs-meter ${lleno ? 'rs-meter--full' : ''}`} role="img" aria-label={`${t.inscritos} de ${t.capacidad} cupos ocupados`}>
                <span style={{ width: `${Math.min(100, (t.inscritos / t.capacidad) * 100)}%` }} />
            </div>
            <p className="rs-meta mt-2 mb-0">{Math.max(0, t.cupos_disponibles)} CUPOS DISPONIBLES</p>
        </article></div>
    );
}

export default function Talleres() {
    const { datos, error, cargando } = useDatos(() => api('GET', '/talleres'));
    return (
        <Estado cargando={cargando && !datos} error={error}>
            <section className="rs-section">
                {datos?.talleres.length ? <>
                    <p className="rs-muted">Talleres de la sede con inscritos y capacidad actual.</p>
                    <div className="row g-3">{datos.talleres.map((t) => <Taller key={t.id} t={t} />)}</div>
                </> : <Vacio titulo="Sin talleres">{datos?.mensaje || 'No hay talleres disponibles en la sede.'}</Vacio>}
            </section>
        </Estado>
    );
}

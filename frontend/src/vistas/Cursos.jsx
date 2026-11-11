// Cursos (RF-14 y RF-15). El docente gestiona sus cursos; el estudiante ve el catálogo,
// marca interés, ingresa a los abiertos y solicita cursos nuevos con su grupo.
import { api } from '../api.js';
import { useSesion, useAviso, useModal } from '../contexto.jsx';
import { useDatos } from '../ganchos.js';
import { Estado, Etiqueta, Vacio } from '../componentes/Piezas.jsx';
import CursosDocente from './CursosDocente.jsx';
import SolicitarCurso from './SolicitarCurso.jsx';

const ESTADOS = { solicitado: 'Solicitado', abierto: 'Abierto', cerrado: 'Cerrado' };

function Curso({ c, estudiante, alAccion }) {
    const lleno = c.capacidad && c.ingresados >= c.capacidad;
    return (
        <div className="col-md-6"><article className={`rs-panel h-100 ${c.estado === 'abierto' ? 'rs-panel--ink rs-paper-texture' : ''}`}>
            <div className="d-flex justify-content-between gap-2">
                <span className="rs-kicker">Docente: {c.docente}</span>
                <span className={`rs-tag ${c.estado === 'abierto' ? 'text-light border-light' : ''}`}>{ESTADOS[c.estado]}</span>
            </div>
            <h2 className="rs-h2 mt-2">{c.nombre}</h2>
            <p className={c.estado === 'abierto' ? '' : 'rs-muted'}>{c.objetivo}</p>
            <p className="rs-meta">{c.interesados} INTERESADOS · {c.ingresados}{c.capacidad ? ` / ${c.capacidad}` : ''} INGRESADOS</p>
            <div className="d-flex gap-2 flex-wrap align-items-center">
                {c.ingresado && <Etiqueta acento>Ya ingresaste</Etiqueta>}
                {estudiante && !c.ingresado && c.estado === 'abierto' && !lleno &&
                    <button className="rs-button rs-button--sm" type="button" onClick={() => alAccion(c.id, 'ingresar')}>Ingresar</button>}
                {estudiante && !c.ingresado && lleno && <Etiqueta acento>Sin cupos</Etiqueta>}
                {estudiante && !c.ingresado && !c.me_interesa && c.estado !== 'cerrado' &&
                    <button className={`rs-action ${c.estado === 'abierto' ? 'text-light' : ''}`} type="button" onClick={() => alAccion(c.id, 'interes')}>Me interesa</button>}
                {c.me_interesa && !c.ingresado && <span className="rs-meta">■ TE INTERESA</span>}
            </div>
        </article></div>
    );
}

export default function Cursos() {
    const { usuario } = useSesion();
    const avisar = useAviso();
    const modal = useModal();
    const estudiante = usuario.ocupacion === 'estudiante';
    const { datos, error, cargando, recargar } = useDatos(() => api('GET', '/cursos'));

    async function accion(id, tipo) {
        try { avisar((await api('POST', `/cursos/${id}/${tipo}`)).mensaje); recargar(); } catch (e) { avisar(e.message); }
    }
    const solicitar = () => modal.abrir('Solicitar curso', <SolicitarCurso alSolicitar={(mensaje) => { modal.cerrar(); avisar(mensaje); recargar(); }} />);

    return (
        <>
            {usuario.ocupacion === 'docente' && <CursosDocente />}
            <section className="rs-section">
                <div className="d-flex justify-content-between align-items-end gap-2 flex-wrap mb-3">
                    <h2 className="rs-h3 rs-panel--rule mb-0 flex-grow-1">Catálogo de cursos</h2>
                    {estudiante && <button className="rs-button" type="button" onClick={solicitar}>+ Solicitar curso</button>}
                </div>
                <Estado cargando={cargando && !datos} error={error}>
                    {datos?.length
                        ? <div className="row g-3">{datos.map((c) => <Curso key={c.id} c={c} estudiante={estudiante} alAccion={accion} />)}</div>
                        : <Vacio titulo="Sin cursos">{estudiante ? 'Forma un grupo y solicita un curso a un docente.' : 'Todavía no hay cursos.'}</Vacio>}
                </Estado>
            </section>
        </>
    );
}

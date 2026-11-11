// Explorar: búsqueda de publicaciones, usuarios y ejercicios filtrada por etiqueta de carrera (RF-09).
// Los filtros iniciales pueden venir en la dirección: #/explorar?carrera=...&q=...
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useSesion, useModal, useAviso } from '../contexto.jsx';
import { useDatos } from '../ganchos.js';
import { ROLES, TIPOS, ir } from '../utiles.js';
import { Campo } from '../componentes/Formulario.jsx';
import { Avatar, Estado, Etiqueta, Vacio } from '../componentes/Piezas.jsx';
import { FormReportar } from '../componentes/FormulariosEntrada.jsx';
import Entrada from '../componentes/Entrada.jsx';

function Persona({ u }) {
    const { usuario } = useSesion();
    const modal = useModal();
    const avisar = useAviso();
    const listo = (mensaje) => { modal.cerrar(); avisar(mensaje); };
    return (
        <div className="rs-list-row">
            <Avatar nombre={u.nombre} ocupacion={u.ocupacion} tamano="rs-avatar--sm" />
            <div><strong>{u.nombre}</strong>
                <div className="rs-meta">{u.carrera || 'Sin carrera'} · {ROLES[u.ocupacion]}{u.correo ? ` · ${u.correo}` : ''}</div></div>
            {u.id === usuario.id ? <Etiqueta suave>Tú</Etiqueta> : <>
                <button className="rs-button rs-button--ghost rs-button--sm" type="button" onClick={() => ir('mensajes', { invitar: u.id, nombre: u.nombre })}>Invitar a chat</button>
                <button className="rs-action" type="button" onClick={() => modal.abrir('Reportar perfil', <FormReportar tipo="usuario" id={u.id} alListo={listo} />)}>Reportar perfil</button>
            </>}
        </div>
    );
}

export default function Explorar({ parametros }) {
    const inicial = { q: parametros.q || '', carrera: parametros.carrera || '', tipo: '', en: 'todo' };
    const [filtros, setFiltros] = useState(inicial);
    const [consulta, setConsulta] = useState(inicial); // filtros aplicados (el texto espera 300 ms)
    useEffect(() => {
        const espera = setTimeout(() => setConsulta(filtros), 300);
        return () => clearTimeout(espera);
    }, [filtros]);
    // Si se elige otra carrera o búsqueda desde la columna derecha estando aquí, se aplican.
    useEffect(() => {
        if (parametros.carrera || parametros.q) setFiltros({ ...inicial });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parametros.carrera, parametros.q]);

    const { datos: carreras } = useDatos(() => api('GET', '/buscar/carreras'));
    const { datos, error, cargando, recargar } = useDatos(async () => {
        const params = new URLSearchParams(Object.entries(consulta).filter(([, v]) => v));
        const [resultado, guardados] = await Promise.all([api('GET', `/buscar?${params}`), api('GET', '/guardados')]);
        return { ...resultado, guardadas: new Set(guardados.publicaciones.map((p) => p.id)) };
    }, [JSON.stringify(consulta)]);

    const cambiar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
    const opciones = (lista) => lista.map(([v, t]) => <option key={v} value={v}>{t}</option>);

    return (
        <>
            <section className="rs-section pb-0"><div className="row g-3">
                <div className="col-md-5"><Campo nombre="q" etiqueta="Buscar" type="search" value={filtros.q} onChange={cambiar} placeholder="Título, asignatura o persona" /></div>
                <div className="col-6 col-md-3"><Campo nombre="carrera" etiqueta="Etiqueta de carrera" como="select" value={filtros.carrera} onChange={cambiar}>
                    {opciones([['', 'Todas'], ...(carreras || []).map((c) => [c, c])])}</Campo></div>
                <div className="col-6 col-md-2"><Campo nombre="tipo" etiqueta="Tipo" como="select" value={filtros.tipo} onChange={cambiar}>
                    {opciones([['', 'Todos'], ...Object.entries(TIPOS).map(([v, t]) => [v, v === 'guia' ? 'Ejercicios (guías)' : t])])}</Campo></div>
                <div className="col-md-2"><Campo nombre="en" etiqueta="Buscar en" como="select" value={filtros.en} onChange={cambiar}>
                    {opciones([['todo', 'Todo'], ['publicaciones', 'Publicaciones'], ['usuarios', 'Personas']])}</Campo></div>
            </div></section>
            <Estado cargando={cargando && !datos} error={error}>
                {datos && !datos.publicaciones.length && !datos.usuarios.length && <Vacio titulo="Sin resultados">Prueba con otra palabra o quita los filtros.</Vacio>}
                {datos?.publicaciones.length > 0 && <>
                    <h2 className="rs-h3 rs-section pb-0 mb-0">Publicaciones · {datos.publicaciones.length}</h2>
                    {datos.publicaciones.map((p) => <Entrada key={p.id} p={p} guardadas={datos.guardadas} alCambiar={recargar} />)}
                </>}
                {datos?.usuarios.length > 0 && <section className="rs-section">
                    <h2 className="rs-h3 rs-panel--rule">Personas · {datos.usuarios.length}</h2>
                    {datos.usuarios.map((u) => <Persona key={u.id} u={u} />)}
                </section>}
            </Estado>
        </>
    );
}

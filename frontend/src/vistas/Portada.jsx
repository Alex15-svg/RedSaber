// Portada: últimas publicaciones (vía la búsqueda de RF-09) y formulario para publicar.
// Estudiantes publican preguntas, soluciones o publicaciones libres (RF-06); docentes publican guías verificadas (RF-11).
import { useState } from 'react';
import { api } from '../api.js';
import { useSesion, useAviso } from '../contexto.jsx';
import { useDatos } from '../ganchos.js';
import { TIPOS, CARRERAS, exigir, textos } from '../utiles.js';
import { useFormulario, Campo, Enviar } from '../componentes/Formulario.jsx';
import { Estado, Vacio } from '../componentes/Piezas.jsx';
import Entrada from '../componentes/Entrada.jsx';

const CAMPOS = ['titulo', 'descripcion', 'carrera', 'asignatura', 'seccion'];
const PESTANAS = [['', 'Todo'], ['pregunta', 'Preguntas'], ['solucion', 'Soluciones'], ['guia', 'Guías docentes'], ['publicacion', 'Publicaciones']];

// Formulario de duda, solución o guía docente (el de siempre).
function FormDuda({ carreras, enfocar, alPublicar }) {
    const { usuario } = useSesion();
    const avisar = useAviso();
    const docente = usuario.ocupacion === 'docente';
    const { errores, ocupado, onSubmit } = useFormulario(async (d, marcar, formulario) => {
        const pares = [['titulo', 'Escribe un título.'], ['descripcion', 'Describe tu duda, solución o guía.'], ['carrera', 'Indica la carrera.'],
            ['asignatura', 'Indica la asignatura.'], ['seccion', 'Indica la sección.']];
        if (!exigir(d, pares, marcar)) return;
        if (d.get('tipo') === 'guia') await api('POST', '/guias', { ...textos(d, CAMPOS), con_solucion: d.get('con_solucion') === 'on' });
        else await api('POST', '/publicaciones', { ...textos(d, CAMPOS), tipo: d.get('tipo') });
        formulario.reset();
        avisar('Publicación creada.');
        alPublicar();
    });
    const opciones = [...new Set([...carreras, ...CARRERAS])];

    return (
        <form className="rs-compose-body rs-form" onSubmit={onSubmit} noValidate>
            <Campo nombre="titulo" etiqueta="Título" maxLength={200} placeholder="¿Qué necesitas resolver?" autoFocus={enfocar} error={errores.titulo} />
            <Campo nombre="descripcion" etiqueta="Descripción" como="textarea" maxLength={5000} error={errores.descripcion}
                   placeholder="Explica el contexto, lo que intentaste y dónde te trabaste." />
            <div className="row g-2">
                <div className="col-6 col-lg-3"><Campo nombre="tipo" etiqueta="Tipo" como="select">
                    {(docente ? ['guia'] : ['pregunta', 'solucion']).map((t) => <option key={t} value={t}>{TIPOS[t]}</option>)}</Campo></div>
                <div className="col-6 col-lg-3"><Campo nombre="carrera" etiqueta="Carrera" maxLength={120} list="carreras-publicar" error={errores.carrera} />
                    <datalist id="carreras-publicar">{opciones.map((c) => <option key={c} value={c} />)}</datalist></div>
                <div className="col-6 col-lg-3"><Campo nombre="asignatura" etiqueta="Asignatura" maxLength={120} error={errores.asignatura} /></div>
                <div className="col-6 col-lg-3"><Campo nombre="seccion" etiqueta="Sección" maxLength={30} placeholder="TI3043" error={errores.seccion} /></div>
            </div>
            {docente && <label className="rs-check"><input type="checkbox" name="con_solucion" /> La guía incluye su solución</label>}
            <div className="d-flex flex-column align-items-end gap-2"><Enviar ocupado={ocupado} error={errores.general} bloque={false}>Publicar</Enviar></div>
        </form>
    );
}

// Publicación libre (como en una red social): solo texto.
function FormLibre({ alPublicar }) {
    const avisar = useAviso();
    const { errores, ocupado, onSubmit } = useFormulario(async (d, marcar, formulario) => {
        if (!exigir(d, [['descripcion', 'Escribe algo para publicar.']], marcar)) return;
        await api('POST', '/publicaciones', { tipo: 'publicacion', descripcion: textos(d, ['descripcion']).descripcion });
        formulario.reset();
        avisar('Publicación creada.');
        alPublicar();
    });

    return (
        <form className="rs-compose-body rs-form" onSubmit={onSubmit} noValidate>
            <Campo nombre="descripcion" etiqueta="¿Qué quieres compartir?" como="textarea" rows={4} maxLength={400}
                   placeholder="Escribe tu publicación…" error={errores.descripcion} />
            <div className="d-flex flex-column align-items-end gap-2"><Enviar ocupado={ocupado} error={errores.general} bloque={false}>Publicar</Enviar></div>
        </form>
    );
}

// Ventana «Nueva entrada». Los estudiantes eligen entre «Duda o solución» y «Publicación» libre;
// los docentes solo publican guías. La ventana se muestra siempre, aunque la lista esté cargando o falle.
const MODOS = [['duda', 'Duda o solución'], ['libre', 'Publicación']];

function Publicar({ carreras, enfocar, alPublicar }) {
    const { usuario } = useSesion();
    const [modo, setModo] = useState('duda');
    if (usuario.ocupacion === 'administrador') return null;
    const docente = usuario.ocupacion === 'docente';
    const libre = !docente && modo === 'libre';

    return (
        <section className="rs-compose" aria-label="Publicar">
            <div className="rs-compose-head"><span className="rs-label">Nueva entrada</span>
                <span className="rs-meta" style={{ color: 'inherit' }}>{docente ? 'GUÍA DOCENTE · VERIFICADA' : libre ? 'PUBLICACIÓN' : 'DUDA O SOLUCIÓN'}</span></div>
            {!docente && (
                <div className="rs-compose-modes" role="tablist" aria-label="Tipo de entrada">
                    {MODOS.map(([id, titulo]) => (
                        <button key={id} className="rs-tab" type="button" role="tab" aria-selected={modo === id} onClick={() => setModo(id)}>{titulo}</button>
                    ))}
                </div>
            )}
            {libre ? <FormLibre alPublicar={alPublicar} /> : <FormDuda carreras={carreras} enfocar={enfocar} alPublicar={alPublicar} />}
        </section>
    );
}

export default function Portada({ parametros }) {
    const [filtro, setFiltro] = useState('');
    const { datos, error, cargando, recargar } = useDatos(async () => {
        const [resultado, carreras, guardados] = await Promise.all([
            api('GET', `/buscar?en=publicaciones${filtro ? `&tipo=${filtro}` : ''}`),
            api('GET', '/buscar/carreras'),
            api('GET', '/guardados')
        ]);
        return { publicaciones: resultado.publicaciones, carreras, guardadas: new Set(guardados.publicaciones.map((p) => p.id)) };
    }, [filtro]);

    return (
        <>
            <div className="rs-tabs" role="tablist">
                {PESTANAS.map(([v, t]) => <button key={t} className="rs-tab" type="button" role="tab" aria-selected={filtro === v} onClick={() => setFiltro(v)}>{t}</button>)}
            </div>
            <Publicar carreras={datos?.carreras || []} enfocar={!!parametros.publicar} alPublicar={() => (filtro ? setFiltro('') : recargar())} />
            <Estado cargando={cargando && !datos} error={error}>
                {datos?.publicaciones.length
                    ? datos.publicaciones.map((p) => <Entrada key={p.id} p={p} guardadas={datos.guardadas} alCambiar={recargar} />)
                    : <Vacio titulo="Sin entradas">Todavía no hay publicaciones en esta sección.</Vacio>}
            </Estado>
        </>
    );
}

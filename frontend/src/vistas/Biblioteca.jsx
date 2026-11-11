// Biblioteca: documentación por áreas de la carrera, con vista de lectura y descarga (RF-10).
import { useState } from 'react';
import { api, archivo } from '../api.js';
import { useSesion, useAviso, useModal } from '../contexto.jsx';
import { useDatos } from '../ganchos.js';
import { exigir } from '../utiles.js';
import { useFormulario, Campo, Enviar } from '../componentes/Formulario.jsx';
import { Estado, Vacio } from '../componentes/Piezas.jsx';

function Subir({ area, alSubir }) {
    const { errores, ocupado, onSubmit } = useFormulario(async (d, marcar) => {
        let ok = exigir(d, [['titulo', 'Escribe el título.'], ['area', 'Indica el área.']], marcar);
        const pdf = d.get('archivo');
        if (!pdf || !pdf.size) { marcar('archivo', 'Elige un archivo PDF.'); ok = false; }
        else if (pdf.size > 10 * 1024 * 1024) { marcar('archivo', 'El archivo supera los 10 MB.'); ok = false; }
        if (!ok) return;
        await api('POST', '/documentos', d); // se envía como formulario con archivo
        alSubir(d.get('area').trim());
    });
    return (
        <form className="rs-form" onSubmit={onSubmit} noValidate>
            <Campo nombre="titulo" etiqueta="Título" maxLength={200} error={errores.titulo} />
            <Campo nombre="area" etiqueta="Área de la carrera" maxLength={120} defaultValue={area} error={errores.area} />
            <Campo nombre="archivo" etiqueta="Archivo PDF" type="file" accept="application/pdf" ayuda="Solo PDF, hasta 10 MB." error={errores.archivo} />
            <Enviar ocupado={ocupado} error={errores.general}>Subir</Enviar>
        </form>
    );
}

export default function Biblioteca() {
    const { usuario } = useSesion();
    const avisar = useAviso();
    const modal = useModal();
    const [area, setArea] = useState('');
    const { datos, error, cargando, recargar } = useDatos(async () => {
        const [areas, documentos] = await Promise.all([
            api('GET', '/documentos/areas'),
            api('GET', `/documentos${area ? '?area=' + encodeURIComponent(area) : ''}`)
        ]);
        return { areas, documentos };
    }, [area]);

    const intentar = (promesa, mensaje) => promesa.then(() => mensaje && avisar(mensaje)).catch((e) => avisar(e.message));
    const subir = () => modal.abrir('Subir documento', <Subir area={area} alSubir={(nueva) => {
        modal.cerrar(); avisar('Documento publicado.');
        if (nueva === area) recargar(); else setArea(nueva);
    }} />);
    const pestana = (valor, texto) => <button key={valor} className="rs-tab" type="button" role="tab" aria-selected={area === valor} onClick={() => setArea(valor)}>{texto}</button>;

    return (
        <>
            <div className="rs-tabs" role="tablist">{pestana('', 'Todas')}{datos?.areas.map((a) => pestana(a.area, `${a.area} · ${a.documentos}`))}</div>
            <section className="rs-section">
                {['docente', 'administrador'].includes(usuario.ocupacion) &&
                    <div className="d-flex justify-content-end mb-3"><button className="rs-button" type="button" onClick={subir}>+ Subir documento</button></div>}
                <Estado cargando={cargando && !datos} error={error}>
                    {datos?.documentos.length ? <div className="row g-3">{datos.documentos.map((d, i) => {
                        const claro = i === 0 ? 'text-light border-light' : ''; // la primera ficha va destacada sobre fondo oscuro
                        return (
                            <div key={d.id} className="col-md-6"><article className={`rs-panel h-100 ${i === 0 ? 'rs-panel--ink rs-paper-texture' : ''}`}>
                                <div className="d-flex justify-content-between"><span className="rs-kicker">{d.area}</span><span className={`rs-tag ${claro}`}>PDF · {d.tamano_mb} MB</span></div>
                                <h2 className="rs-h2 mt-2">{d.titulo}</h2>
                                <div className="d-flex gap-2 flex-wrap mt-3">
                                    <button className="rs-button rs-button--sm" type="button" onClick={() => intentar(archivo(`/documentos/${d.id}/leer`))}>Leer</button>
                                    <button className={`rs-button rs-button--ghost rs-button--sm ${claro}`} type="button"
                                            onClick={() => intentar(archivo(`/documentos/${d.id}/descargar`, `${d.titulo}.pdf`, true))}>Descargar</button>
                                    <button className={`rs-action ${claro}`} type="button"
                                            onClick={() => intentar(api('POST', `/guardados/documentos/${d.id}`), 'Documento guardado en tu lista privada.')}>Guardar</button>
                                </div>
                            </article></div>);
                    })}</div> : <Vacio titulo="Sin documentos">Todavía no hay documentos en esta área.</Vacio>}
                </Estado>
            </section>
        </>
    );
}

// Tarjeta de una publicación, compartida por portada, explorar, guardados y perfil.
// Acciones: guardar (RF-08), reportar (RF-12), editar y borrar (RF-07), apelar (RF-12) y solución de guías (RF-11).
import { api } from '../api.js';
import { useSesion, useAviso, useModal } from '../contexto.jsx';
import { TIPOS, fecha } from '../utiles.js';
import { Avatar, Etiqueta } from './Piezas.jsx';
import { FormReportar, FormEditar, FormApelar, Confirmar } from './FormulariosEntrada.jsx';

const Accion = ({ al, children, ...resto }) => <button className="rs-action" type="button" onClick={al} {...resto}>{children}</button>;

// guardadas: Set con los ids de la lista privada. alCambiar(): vuelve a cargar la vista.
export default function Entrada({ p, guardadas, alCambiar }) {
    const { usuario } = useSesion();
    const avisar = useAviso();
    const modal = useModal();
    const mia = p.autor_id === usuario.id;
    const deshabilitada = p.estado === 'deshabilitada';
    const guardada = guardadas?.has(p.id);
    const libre = p.tipo === 'publicacion'; // publicación libre: solo texto, sin título ni etiquetas
    const listo = (mensaje) => { modal.cerrar(); avisar(mensaje); alCambiar(); };

    // Ejecuta una acción y muestra el error del servidor si falla.
    const intentar = (accion) => async () => {
        try { await accion(); } catch (error) { avisar(error.message); }
    };
    const guardar = intentar(async () => {
        await api(guardada ? 'DELETE' : 'POST', `/guardados/publicaciones/${p.id}`);
        avisar(guardada ? 'Quitada de tu lista privada.' : 'Guardada en tu lista privada.');
        alCambiar();
    });
    const solucion = intentar(async () => {
        const guia = await api('PATCH', `/guias/${p.id}/solucion`, { con_solucion: !p.con_solucion });
        avisar(guia.con_solucion ? 'La guía ahora indica que trae solución.' : 'La guía ahora indica que no trae solución.');
        alCambiar();
    });
    const borrar = () => modal.abrir('Borrar publicación', (
        <Confirmar texto="Esta acción no se puede deshacer." boton="Borrar" alCancelar={modal.cerrar}
                   alConfirmar={async () => { await api('DELETE', `/publicaciones/${p.id}`); listo('Publicación borrada.'); }} />));

    const autor = p.autor || (mia ? usuario.nombre : 'Publicación');
    const ocupacion = p.autor_ocupacion || (mia ? usuario.ocupacion : 'estudiante');

    return (
        <article className={`rs-entry ${p.tipo === 'guia' ? 'rs-entry--guia' : ''} ${deshabilitada ? 'rs-entry--disabled' : ''}`} aria-labelledby={libre ? undefined : `t-${p.id}`}>
            <Avatar nombre={autor} ocupacion={ocupacion} />
            <div>
                <div className="rs-entry-head">
                    <strong>{autor}</strong>
                    {ocupacion === 'docente' && <span className="rs-verified">■ Docente</span>}
                    <span className="rs-meta">{fecha(p.creado_en || p.guardado_en)}</span>
                </div>
                <div className="rs-tags">
                    <Etiqueta acento={p.tipo === 'guia'}>{TIPOS[p.tipo] || p.tipo}</Etiqueta>
                    {!libre && <Etiqueta suave>{p.asignatura}</Etiqueta>}
                    {p.seccion && <Etiqueta suave>{p.seccion}</Etiqueta>}
                    {p.verificada && <Etiqueta>✓ Verificada</Etiqueta>}
                    {p.con_solucion && <Etiqueta>Con solución</Etiqueta>}
                    {deshabilitada && <Etiqueta acento>Deshabilitada por reportes</Etiqueta>}
                </div>
                {!libre && <h2 className="rs-entry-title" id={`t-${p.id}`}>{p.titulo}</h2>}
                {p.descripcion && <p className="rs-entry-text">{p.descripcion}</p>}
                {!libre && <p className="rs-meta mb-0">{p.carrera}</p>}
                <div className="rs-actions">
                    {!deshabilitada && <Accion al={guardar} aria-pressed={!!guardada}>{guardada ? '■ Guardada' : '□ Guardar'}</Accion>}
                    {mia ? <>
                        <Accion al={() => modal.abrir('Editar publicación', <FormEditar p={p} alListo={listo} />)}>Editar</Accion>
                        <Accion al={borrar}>Borrar</Accion>
                    </> : <Accion al={() => modal.abrir('Reportar', <FormReportar tipo="publicacion" id={p.id} alListo={listo} />)}>Reportar</Accion>}
                    {mia && deshabilitada && <Accion al={() => modal.abrir('Apelar', <FormApelar id={p.id} alListo={listo} />)}>Apelar</Accion>}
                    {mia && p.tipo === 'guia' && !deshabilitada && <Accion al={solucion}>Cambiar «con solución»</Accion>}
                </div>
            </div>
        </article>
    );
}

// Formularios que se abren desde una tarjeta de publicación o un perfil.
// alListo(mensaje) cierra la ventana, avisa y vuelve a cargar la vista.
import { useState } from 'react';
import { api } from '../api.js';
import { exigir, textos } from '../utiles.js';
import { useFormulario, Campo, Enviar } from './Formulario.jsx';

const CAMPOS = ['titulo', 'descripcion', 'carrera', 'asignatura', 'seccion'];

// RF-12: reportar una publicación o un perfil (tipo = 'publicacion' | 'usuario').
export function FormReportar({ tipo, id, alListo }) {
    const { errores, ocupado, onSubmit } = useFormulario(async (datos, marcar) => {
        if (!exigir(datos, [['motivo', 'Escribe el motivo del reporte.']], marcar)) return;
        const r = await api('POST', '/moderacion/reportes', { tipo, id, motivo: datos.get('motivo').trim() });
        alListo(r.mensaje);
    });
    return (
        <form className="rs-form" onSubmit={onSubmit} noValidate>
            <p className="mb-0">Se revisará si incumple las normas de la comunidad. Al acumular reportes se deshabilita automáticamente.</p>
            <Campo nombre="motivo" etiqueta="Motivo" como="textarea" rows={4} error={errores.motivo} />
            <Enviar ocupado={ocupado} error={errores.general}>Enviar reporte</Enviar>
        </form>
    );
}

// RF-07: editar una publicación propia (el backend exige los cinco textos).
export function FormEditar({ p, alListo }) {
    const { errores, ocupado, onSubmit } = useFormulario(async (datos, marcar) => {
        if (!exigir(datos, CAMPOS.map((c) => [c, 'Este campo es obligatorio.']), marcar)) return;
        await api('PUT', `/publicaciones/${p.id}`, textos(datos, CAMPOS));
        alListo('Cambios guardados.');
    });
    return (
        <form className="rs-form" onSubmit={onSubmit} noValidate>
            <Campo nombre="titulo" etiqueta="Título" defaultValue={p.titulo} maxLength={200} error={errores.titulo} />
            <Campo nombre="descripcion" etiqueta="Descripción" como="textarea" rows={4} defaultValue={p.descripcion} error={errores.descripcion} />
            <Campo nombre="carrera" etiqueta="Carrera" defaultValue={p.carrera} error={errores.carrera} />
            <Campo nombre="asignatura" etiqueta="Asignatura" defaultValue={p.asignatura} error={errores.asignatura} />
            <Campo nombre="seccion" etiqueta="Sección" defaultValue={p.seccion} error={errores.seccion} />
            <Enviar ocupado={ocupado} error={errores.general}>Guardar cambios</Enviar>
        </form>
    );
}

// RF-12: el autor apela su publicación deshabilitada.
export function FormApelar({ id, alListo }) {
    const { errores, ocupado, onSubmit } = useFormulario(async (datos, marcar) => {
        if (!exigir(datos, [['justificacion', 'Escribe tu justificación.']], marcar)) return;
        const r = await api('POST', '/moderacion/apelaciones/publicacion', { id, justificacion: datos.get('justificacion').trim() });
        alListo(r.mensaje);
    });
    return (
        <form className="rs-form" onSubmit={onSubmit} noValidate>
            <p className="mb-0">Explica por qué tu publicación no incumple las normas. Un administrador la revisará.</p>
            <Campo nombre="justificacion" etiqueta="Justificación" como="textarea" rows={4} error={errores.justificacion} />
            <Enviar ocupado={ocupado} error={errores.general}>Enviar apelación</Enviar>
        </form>
    );
}

// Confirmación para acciones que no se pueden deshacer.
export function Confirmar({ texto, boton, alConfirmar, alCancelar }) {
    const [error, setError] = useState('');
    const [ocupado, setOcupado] = useState(false);
    async function confirmar() {
        setOcupado(true);
        try { await alConfirmar(); } catch (e) { setError(e.message); setOcupado(false); }
    }
    return (
        <>
            <p>{texto}</p>
            {error && <p className="rs-error rs-form-error">{error}</p>}
            <div className="d-flex gap-2 justify-content-end">
                <button className="rs-button rs-button--ghost" type="button" onClick={alCancelar}>Cancelar</button>
                <button className={`rs-button ${ocupado ? 'rs-loading' : ''}`} type="button" onClick={confirmar} disabled={ocupado}>{boton}</button>
            </div>
        </>
    );
}

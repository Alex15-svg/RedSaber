// Formularios: un gancho que maneja el envío y los errores, y componentes para los campos.
import { useState } from 'react';

// enviar(datos, marcar, formulario) recibe el FormData y la función marcar(campo, mensaje).
// Si enviar lanza un error (por ejemplo, el mensaje del servidor), se muestra como error general.
export function useFormulario(enviar) {
    const [errores, setErrores] = useState({});
    const [ocupado, setOcupado] = useState(false);

    async function onSubmit(evento) {
        evento.preventDefault();
        const formulario = evento.currentTarget;
        const nuevos = {};
        setOcupado(true);
        try {
            await enviar(new FormData(formulario), (campo, mensaje) => { nuevos[campo] = mensaje; }, formulario);
        } catch (error) {
            nuevos.general = error.message;
        }
        setErrores(nuevos);
        setOcupado(false);
    }
    return { errores, ocupado, onSubmit };
}

// Campo con etiqueta asociada, ayuda opcional y su mensaje de error.
// como = 'input' | 'textarea' | 'select'. El resto de las propiedades va al control.
export function Campo({ nombre, etiqueta, error, ayuda, como = 'input', children, ...resto }) {
    const Control = como;
    return (
        <div className="rs-field">
            <label className="rs-label" htmlFor={`f-${nombre}`}>{etiqueta}</label>
            <Control className={`rs-input ${error ? 'is-invalid' : ''}`} id={`f-${nombre}`} name={nombre}
                     aria-invalid={error ? 'true' : undefined} {...resto}>{children}</Control>
            {ayuda && <span className="rs-hint">{ayuda}</span>}
            {error && <span className="rs-error">{error}</span>}
        </div>
    );
}

// Botón de envío con el error general encima; se desactiva mientras espera al servidor.
export const Enviar = ({ ocupado, error, children, bloque = true }) => (
    <>
        {error && <p className="rs-error rs-form-error">{error}</p>}
        <button className={`rs-button ${bloque ? 'rs-button--block' : ''} ${ocupado ? 'rs-loading' : ''}`} type="submit" disabled={ocupado}>
            {children}
        </button>
    </>
);

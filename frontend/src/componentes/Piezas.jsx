// Piezas pequeñas que se repiten en toda la interfaz.
import { iniciales, icono } from '../utiles.js';

export const Icono = ({ nombre, ...resto }) => (
    <svg aria-hidden="true" {...resto}><use href={icono(nombre)} /></svg>
);

// Foto o iniciales. El color depende de la ocupación (rojo docente, negro administración).
export const Avatar = ({ nombre, ocupacion = 'estudiante', foto, tamano = '' }) => (
    <span className={`rs-avatar rs-avatar--${ocupacion} ${tamano}`} aria-hidden="true">
        {foto ? <img src={foto} alt="" /> : iniciales(nombre)}
    </span>
);

export const Vacio = ({ titulo, children }) => (
    <div className="rs-empty"><p className="rs-h2">{titulo}</p><p>{children}</p></div>
);

// Muestra «cargando» o el error de una carga; si no hay nada que mostrar, pinta el contenido.
export function Estado({ cargando, error, children }) {
    if (error) return <Vacio titulo="No se pudo cargar">{error.message}</Vacio>;
    if (cargando) return <p className="rs-cargando">CARGANDO…</p>;
    return children;
}

export const Etiqueta = ({ acento, suave, children }) => (
    <span className={`rs-tag ${acento ? 'rs-tag--accent' : ''} ${suave ? 'rs-tag--soft' : ''}`}>{children}</span>
);

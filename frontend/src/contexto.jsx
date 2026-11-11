// Estado compartido por toda la aplicación: la sesión, los avisos flotantes y la ventana modal.
// Cada parte se usa con su gancho: useSesion(), useAviso() y useModal().
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { leerSesion, guardarSesion } from './api.js';

const Contexto = createContext(null);
export const useSesion = () => useContext(Contexto).sesion;
export const useAviso = () => useContext(Contexto).avisar;
export const useModal = () => useContext(Contexto).modal;

export function Proveedores({ children }) {
    const [sesion, setSesion] = useState(leerSesion);
    const [aviso, setAviso] = useState('');
    const [ventana, setVentana] = useState(null); // { titulo, contenido }
    const temporizador = useRef();

    const entrar = (datos) => { guardarSesion(datos); setSesion(datos); };
    const salir = () => { guardarSesion(null); setSesion(null); };
    const avisar = (texto) => {
        setAviso(texto);
        clearTimeout(temporizador.current);
        temporizador.current = setTimeout(() => setAviso(''), 3200);
    };
    const modal = { abrir: (titulo, contenido) => setVentana({ titulo, contenido }), cerrar: () => setVentana(null) };

    // Si la API detecta un token vencido, se cierra la sesión.
    useEffect(() => {
        const vencida = () => { setSesion(null); avisar('Tu sesión venció. Ingresa de nuevo.'); };
        window.addEventListener('rs-sesion-vencida', vencida);
        return () => window.removeEventListener('rs-sesion-vencida', vencida);
    }, []);

    const valor = { sesion: { usuario: sesion?.usuario || null, entrar, salir }, avisar, modal };
    return (
        <Contexto.Provider value={valor}>
            {children}
            <Ventana ventana={ventana} cerrar={modal.cerrar} />
            <div className="rs-toast" role="status" aria-live="polite" hidden={!aviso}>{aviso}</div>
        </Contexto.Provider>
    );
}

// Ventana modal con las clases de Bootstrap; se cierra con Escape, con la X o al hacer clic fuera.
function Ventana({ ventana, cerrar }) {
    useEffect(() => {
        if (!ventana) return undefined;
        const tecla = (e) => { if (e.key === 'Escape') cerrar(); };
        document.addEventListener('keydown', tecla);
        document.body.classList.add('modal-open');
        return () => { document.removeEventListener('keydown', tecla); document.body.classList.remove('modal-open'); };
    }, [ventana, cerrar]);

    if (!ventana) return null;
    return (
        <>
            <div className="modal fade show d-block rs-modal" role="dialog" aria-modal="true" aria-labelledby="modalTitulo"
                 onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
                <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title" id="modalTitulo">{ventana.titulo}</h2>
                            <button type="button" className="btn-close" aria-label="Cerrar" onClick={cerrar} />
                        </div>
                        <div className="modal-body">{ventana.contenido}</div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />
        </>
    );
}

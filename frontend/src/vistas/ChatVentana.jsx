// Ventana de un chat (RF-17): historial, mensajes nuevos en tiempo real (Socket.IO) y envío.
// Los mensajes se envían por la API (que valida y guarda) y llegan a los demás por Socket.IO.
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, leerSesion } from '../api.js';
import { useAviso } from '../contexto.jsx';

// Una sola conexión para toda la aplicación. Si cambia la sesión (otra cuenta), se rehace.
let conexion = null;
let tokenConexion = null;
function socket() {
    const token = leerSesion()?.token || null;
    if (conexion && tokenConexion !== token) { conexion.disconnect(); conexion = null; }
    if (!conexion) {
        tokenConexion = token;
        conexion = io({ auth: { token } });
    }
    return conexion;
}

const hora = (fecha) => new Date(fecha).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// Agrega un mensaje si todavía no está (puede llegar por la API y por Socket.IO a la vez).
const agregar = (lista, mensaje) => (lista.some((m) => m.id === mensaje.id) ? lista : [...lista, mensaje]);

export default function ChatVentana({ chat }) {
    const avisar = useAviso();
    const yo = leerSesion()?.usuario?.id;
    const [mensajes, setMensajes] = useState([]);
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const fin = useRef(null);

    useEffect(() => {
        let activo = true;
        setMensajes([]);
        api('GET', `/chats/${chat.id}/mensajes`).then((lista) => activo && setMensajes(lista)).catch((e) => avisar(e.message));
        const s = socket();
        const unirse = () => s.emit('unirse', chat.id);
        const recibir = (m) => { if (m.chat_id === chat.id) setMensajes((lista) => agregar(lista, m)); };
        unirse();
        s.on('connect', unirse); // si se corta la conexión, al volver se une de nuevo a la sala
        s.on('mensaje', recibir);
        return () => {
            activo = false;
            s.emit('salir', chat.id);
            s.off('connect', unirse);
            s.off('mensaje', recibir);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chat.id]);

    // Siempre muestra el último mensaje.
    useEffect(() => { fin.current?.scrollIntoView({ block: 'end' }); }, [mensajes]);

    async function enviar(evento) {
        evento.preventDefault();
        const contenido = texto.trim();
        if (!contenido) return;
        setEnviando(true);
        try {
            const mensaje = await api('POST', `/chats/${chat.id}/mensajes`, { contenido });
            setMensajes((lista) => agregar(lista, mensaje));
            setTexto('');
        } catch (e) { avisar(e.message); } finally { setEnviando(false); }
    }

    return (<>
        <div className="rs-messages" aria-live="polite">
            {mensajes.length === 0 && <p className="rs-meta mb-0">Aún no hay mensajes. Escribe el primero.</p>}
            {mensajes.map((m) => (
                <div key={m.id} className={`rs-bubble${m.autor_id === yo ? ' rs-bubble--mine' : ''}`}>
                    {m.autor_id !== yo && <strong className="d-block">{m.autor || 'Usuario eliminado'}</strong>}
                    <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.contenido}</span>
                    <span className="rs-meta">{hora(m.fecha_envio)}</span>
                </div>))}
            <div ref={fin} />
        </div>
        <form className="rs-chat-send" onSubmit={enviar}>
            <input className="rs-input flex-grow-1" type="text" maxLength={1000} placeholder="Escribe un mensaje"
                aria-label="Escribe un mensaje" value={texto} onChange={(e) => setTexto(e.target.value)} />
            <button className="rs-button" type="submit" disabled={enviando || !texto.trim()}>Enviar</button>
        </form>
    </>);
}

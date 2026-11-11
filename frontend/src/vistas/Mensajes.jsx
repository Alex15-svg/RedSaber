// Mensajes: chats individuales o grupales por invitación (RF-17, CU-24 a CU-26).
// Si se llega con #/mensajes?invitar=ID&nombre=..., se abre «Nuevo chat» con esa persona marcada.
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAviso, useModal } from '../contexto.jsx';
import { useDatos } from '../ganchos.js';
import { ir } from '../utiles.js';
import { Estado, Vacio } from '../componentes/Piezas.jsx';
import NuevoChat from './NuevoChat.jsx';

export default function Mensajes({ parametros }) {
    const avisar = useAviso();
    const modal = useModal();
    const [actual, setActual] = useState(null);
    const { datos, error, cargando, recargar } = useDatos(async () => {
        const [chats, invitaciones] = await Promise.all([api('GET', '/chats'), api('GET', '/chats/invitaciones')]);
        return { chats, invitaciones };
    });

    function abrirNuevo(inicial) {
        modal.abrir('Nuevo chat', <NuevoChat inicial={inicial} alCrear={(id, cantidad) => {
            modal.cerrar();
            avisar(`Invitación enviada a ${cantidad} ${cantidad === 1 ? 'persona' : 'personas'}.`);
            setActual(id);
            recargar();
        }} />);
    }

    // Llegada desde «Invitar a chat» en Explorar: abre la ventana y limpia la dirección.
    useEffect(() => {
        if (parametros.invitar) {
            abrirNuevo({ id: Number(parametros.invitar), nombre: parametros.nombre });
            ir('mensajes');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parametros.invitar]);

    async function responder(id, aceptar) {
        try {
            await api('POST', `/chats/invitaciones/${id}/${aceptar ? 'aceptar' : 'rechazar'}`);
            avisar(aceptar ? 'Te uniste al chat.' : 'Invitación rechazada.');
            recargar();
        } catch (e) { avisar(e.message); }
    }

    return (
        <Estado cargando={cargando && !datos} error={error}>
            {datos && <section className="rs-section">
                {datos.invitaciones.map((i) => (
                    <div key={i.id} className="rs-notice d-flex justify-content-between align-items-center gap-2 flex-wrap">
                        <span><strong>Invitación</strong> · {i.remitente} te invitó a un chat {i.tipo}.</span>
                        <span className="d-flex gap-2">
                            <button className="rs-button rs-button--sm" type="button" onClick={() => responder(i.id, true)}>Aceptar</button>
                            <button className="rs-button rs-button--ghost rs-button--sm" type="button" onClick={() => responder(i.id, false)}>Rechazar</button>
                        </span>
                    </div>))}
                <div className="d-flex justify-content-end mb-3"><button className="rs-button" type="button" onClick={() => abrirNuevo(null)}>+ Nuevo chat</button></div>
                <Chats chats={datos.chats} actual={actual} alElegir={setActual} />
            </section>}
        </Estado>
    );
}

function Chats({ chats, actual, alElegir }) {
    const chat = chats.find((c) => c.id === actual) || chats[0];
    return (
        <div className="rs-chat">
            <div className="rs-chat-list">{chats.map((c) => (
                <button key={c.id} className="rs-chat-item" type="button" aria-current={chat?.id === c.id} onClick={() => alElegir(c.id)}>
                    <strong>Chat {c.tipo} Nº {c.id}</strong><span className="rs-meta d-block">{c.participantes} participantes</span>
                </button>))}
            </div>
            <div className="rs-chat-window">{chat ? <>
                <div className="rs-chat-head"><strong className="rs-h3 mb-0">Chat {chat.tipo} Nº {chat.id}</strong><span className="rs-tag">{chat.participantes} personas</span></div>
                <div className="rs-messages"><p className="rs-notice mb-0"><strong>Próximamente</strong> · El envío de mensajes en tiempo real (Socket.IO)
                    aún no está en el backend. Por ahora se crean los chats y se gestionan las invitaciones.</p></div>
            </> : <Vacio titulo="Sin chats">Crea un chat o invita a alguien desde Explorar.</Vacio>}</div>
        </div>
    );
}

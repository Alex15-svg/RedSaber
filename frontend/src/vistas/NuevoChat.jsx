// Ventana «Nuevo chat» (RF-17, CU-24): buscar personas, elegirlas e invitarlas.
// Una persona es un chat individual; dos o más, grupal.
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useSesion } from '../contexto.jsx';
import { ROLES } from '../utiles.js';
import { useFormulario, Campo, Enviar } from '../componentes/Formulario.jsx';

export default function NuevoChat({ inicial, alCrear }) {
    const { usuario } = useSesion();
    const [texto, setTexto] = useState('');
    const [personas, setPersonas] = useState(null);
    const [elegidos, setElegidos] = useState(() => new Map(inicial ? [[inicial.id, inicial.nombre]] : []));

    // Busca personas con la búsqueda de usuarios de RF-09, esperando 300 ms entre teclas.
    useEffect(() => {
        const espera = setTimeout(() => {
            api('GET', `/buscar?en=usuarios&q=${encodeURIComponent(texto)}`)
                .then((d) => setPersonas(d.usuarios.filter((u) => u.id !== usuario.id)))
                .catch(() => setPersonas([]));
        }, 300);
        return () => clearTimeout(espera);
    }, [texto, usuario.id]);

    function marcar(u, marcado) {
        const nuevos = new Map(elegidos);
        if (marcado) nuevos.set(u.id, u.nombre); else nuevos.delete(u.id);
        setElegidos(nuevos);
    }

    const { errores, ocupado, onSubmit } = useFormulario(async (d, marcarError) => {
        const invitados = [...elegidos.keys()];
        if (!invitados.length) return marcarError('general', 'Elige al menos una persona.');
        const chat = await api('POST', '/chats', { tipo: invitados.length === 1 ? 'individual' : 'grupal', invitados });
        alCrear(chat.id, invitados.length);
    });

    return (
        <form className="rs-form" onSubmit={onSubmit} noValidate>
            <Campo nombre="persona" etiqueta="Buscar personas" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre" />
            <div className="rs-seleccion">
                {personas === null && <p className="rs-muted mb-0">Cargando…</p>}
                {personas?.length === 0 && <p className="rs-muted mb-0">Sin resultados.</p>}
                {personas?.map((u) => (
                    <label key={u.id} className="rs-check">
                        <input type="checkbox" checked={elegidos.has(u.id)} onChange={(e) => marcar(u, e.target.checked)} />
                        {u.nombre} <span className="rs-meta">{ROLES[u.ocupacion]} · {u.carrera || ''}</span>
                    </label>))}
            </div>
            <p className="rs-meta mb-0">{elegidos.size
                ? `${[...elegidos.values()].join(', ')} · chat ${elegidos.size === 1 ? 'individual' : 'grupal'}`
                : 'Nadie elegido todavía.'}</p>
            <p className="rs-caption mb-0">Un invitado: chat individual. Dos o más: grupal. Cada persona acepta o rechaza su invitación.</p>
            <Enviar ocupado={ocupado} error={errores.general}>Enviar invitaciones</Enviar>
        </form>
    );
}

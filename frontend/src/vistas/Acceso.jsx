// Acceso: bienvenida sin sesión y ventana con ingresar (RF-03), crear cuenta (RF-01),
// recuperar contraseña (RF-04) y apelar una cuenta deshabilitada (RF-12).
import { useState } from 'react';
import { api } from '../api.js';
import { useSesion, useAviso, useModal } from '../contexto.jsx';
import { CARRERAS, exigir, textos, ir } from '../utiles.js';
import { useFormulario, Campo, Enviar } from '../componentes/Formulario.jsx';

const PESTANAS = [['ingresar', 'Ingresar'], ['crear', 'Crear cuenta'], ['recuperar', 'Recuperar']];

export function Bienvenida({ alAbrir }) {
    return (
        <section className="rs-landing">
            <p className="rs-kicker">Comunidad académica de la sede</p>
            <h2 className="rs-display rs-misprint">Preguntar, resolver y aprender juntos.</h2>
            <p>Publica dudas y soluciones, consulta guías verificadas de tus docentes, revisa la documentación por área y conversa con tu grupo.</p>
            <div className="d-flex gap-2 flex-wrap mt-4">
                <button className="rs-button" type="button" onClick={() => alAbrir('ingresar')}>Ingresar</button>
                <button className="rs-button rs-button--ghost" type="button" onClick={() => alAbrir('crear')}>Crear cuenta</button>
            </div>
            <p className="rs-caption mt-4">Necesitas un correo @inacapmail.cl.</p>
        </section>
    );
}

// Contenido de la ventana de acceso. Cambia de formulario sin cerrar la ventana.
export function Acceso({ modoInicial = 'ingresar' }) {
    const [modo, setModo] = useState(modoInicial);
    const { entrar } = useSesion();
    const avisar = useAviso();
    const modal = useModal();

    async function ingresar(correo, contrasena) {
        const datos = await api('POST', '/cuentas/login', { correo, contrasena });
        entrar({ token: datos.token, usuario: datos.usuario });
        modal.cerrar();
        avisar(`Hola, ${datos.usuario.nombre.split(' ')[0]}.`);
        ir('portada');
    }

    const formulario = useFormulario(async (d, marcar) => {
        const claveNueva = () => { if (d.get('contrasena').length < 8) { marcar('contrasena', 'La contraseña debe tener al menos 8 caracteres.'); return false; } return true; };
        if (modo === 'ingresar') {
            if (!exigir(d, [['correo', 'Escribe tu correo.'], ['contrasena', 'Escribe tu contraseña.']], marcar)) return;
            try { await ingresar(d.get('correo').trim(), d.get('contrasena')); } catch (e) { if (e.status === 403) return setModo('apelar'); throw e; }
        } else if (modo === 'crear') {
            const { nombre, correo, carrera } = textos(d, ['nombre', 'correo', 'carrera']);
            let ok = exigir(d, [['nombre', 'Escribe tu nombre.']], marcar);
            if (!correo.toLowerCase().endsWith('@inacapmail.cl')) { marcar('correo', 'Usa tu correo @inacapmail.cl.'); ok = false; }
            if (!claveNueva() || !ok) return;
            await api('POST', '/cuentas/registro', { nombre, correo, contrasena: d.get('contrasena'), carrera: carrera || null });
            await ingresar(correo, d.get('contrasena'));
        } else if (modo === 'recuperar') {
            if (!exigir(d, [['correo', 'Escribe tu correo institucional.']], marcar)) return;
            avisar((await api('POST', '/cuentas/recuperar', { correo: d.get('correo').trim() })).mensaje);
            setModo('restablecer');
        } else if (modo === 'restablecer') {
            if (!exigir(d, [['token', 'Pega el código que recibiste.']], marcar) || !claveNueva()) return;
            avisar((await api('POST', '/cuentas/restablecer', { token: d.get('token').trim(), contrasena: d.get('contrasena') })).mensaje);
            setModo('ingresar');
        } else {
            if (!exigir(d, [['correo', 'Escribe tu correo.'], ['contrasena', 'Escribe tu contraseña.'], ['justificacion', 'Explica por qué debería rehabilitarse.']], marcar)) return;
            const cuerpo = { ...textos(d, ['correo', 'justificacion']), contrasena: d.get('contrasena') }; // la contraseña no se recorta
            modal.cerrar();
            avisar((await api('POST', '/moderacion/apelaciones/cuenta', cuerpo)).mensaje);
        }
    });

    const { errores, ocupado, onSubmit } = formulario;
    const correo = <Campo nombre="correo" etiqueta="Correo institucional" type="email" autoComplete="username" placeholder="nombre@inacapmail.cl" error={errores.correo} />;
    const clave = (nueva) => <Campo nombre="contrasena" etiqueta="Contraseña" type="password" autoComplete={nueva ? 'new-password' : 'current-password'}
                                    ayuda={nueva ? 'Mínimo 8 caracteres.' : ''} error={errores.contrasena} />;
    const textosBoton = { ingresar: 'Ingresar', crear: 'Crear cuenta', recuperar: 'Enviar código', restablecer: 'Cambiar contraseña', apelar: 'Enviar apelación' };

    return (
        <>
            <div className="rs-tabs px-0 mb-3" role="tablist">
                {PESTANAS.map(([m, t]) => <button key={m} className="rs-tab" type="button" role="tab" aria-selected={modo === m} onClick={() => setModo(m)}>{t}</button>)}
            </div>
            <form className="rs-form" onSubmit={onSubmit} noValidate key={modo}>
                {modo === 'recuperar' && <p className="mb-0">Te enviaremos un código de un solo uso a tu correo institucional.</p>}
                {modo === 'apelar' && <p className="mb-0">Tu cuenta fue deshabilitada por reportes. Puedes apelar dentro del plazo.</p>}
                {modo === 'crear' && <Campo nombre="nombre" etiqueta="Nombre completo" autoComplete="name" error={errores.nombre} />}
                {modo !== 'restablecer' && correo}
                {modo === 'restablecer' && <Campo nombre="token" etiqueta="Código recibido" autoComplete="one-time-code" error={errores.token}
                                                  ayuda="Llega a tu correo. Sin servidor de correo configurado, aparece en la consola del servidor." />}
                {['ingresar', 'apelar'].includes(modo) && clave(false)}
                {['crear', 'restablecer'].includes(modo) && clave(true)}
                {modo === 'crear' && <Campo nombre="carrera" etiqueta="Carrera" list="lista-carreras" error={errores.carrera} />}
                {modo === 'crear' && <datalist id="lista-carreras">{CARRERAS.map((c) => <option key={c} value={c} />)}</datalist>}
                {modo === 'apelar' && <Campo nombre="justificacion" etiqueta="Justificación" como="textarea" rows={4} error={errores.justificacion} />}
                <Enviar ocupado={ocupado} error={errores.general}>{textosBoton[modo]}</Enviar>
                {modo === 'ingresar' && <button className="rs-action" type="button" onClick={() => setModo('recuperar')}>¿Olvidaste tu contraseña?</button>}
                {modo === 'crear' && <p className="rs-caption mb-0">La ocupación (estudiante, docente o administración) se asigna según el correo.</p>}
            </form>
        </>
    );
}

// Acceso a la plataforma: bienvenida, ingresar (RF-03), crear cuenta (RF-01), recuperar contraseña (RF-04)
// y apelar una cuenta deshabilitada (RF-12). Usa las rutas /api/cuentas tal como están.
import { api, guardarSesion, usuario } from '../api.js';
import { abrirModal, cerrarModal, campo, errorGeneral, exigir, marcarError, mostrarErrorGeneral, textos, avisar, refrescar, irA, CARRERAS } from '../ui.js';

const correo = campo('correo', 'Correo institucional', '<input class="rs-input" id="f-correo" name="correo" type="email" autocomplete="username" placeholder="nombre@inacapmail.cl">');
const clave = (auto) => campo('contrasena', 'Contraseña', `<input class="rs-input" id="f-contrasena" name="contrasena" type="password" autocomplete="${auto}">`, auto === 'new-password' ? 'Mínimo 8 caracteres.' : '');
const enviar = (texto) => `${errorGeneral}<button class="rs-button rs-button--block" type="submit">${texto}</button>`;

const FORMULARIOS_HTML = {
    ingresar: () => `<form class="rs-form" data-form="ingresar" novalidate>${correo}${clave('current-password')}${enviar('Ingresar')}
        <button class="rs-action" type="button" data-action="acceso" data-modo="recuperar">¿Olvidaste tu contraseña?</button></form>`,
    crear: () => `<form class="rs-form" data-form="crear" novalidate>
        ${campo('nombre', 'Nombre completo', '<input class="rs-input" id="f-nombre" name="nombre" autocomplete="name">')}${correo}${clave('new-password')}
        ${campo('carrera', 'Carrera', `<input class="rs-input" id="f-carrera" name="carrera" list="lista-carreras"><datalist id="lista-carreras">${CARRERAS.map((c) => `<option value="${c}">`).join('')}</datalist>`)}
        ${enviar('Crear cuenta')}<p class="rs-caption mb-0">La ocupación (estudiante o docente) se asigna según el correo.</p></form>`,
    recuperar: () => `<form class="rs-form" data-form="recuperar" novalidate><p class="mb-0">Te enviaremos un código de un solo uso para crear una contraseña nueva.</p>
        ${correo}${enviar('Enviar código')}</form>`,
    restablecer: () => `<form class="rs-form" data-form="restablecer" novalidate>
        ${campo('token', 'Código recibido', '<input class="rs-input" id="f-token" name="token" autocomplete="one-time-code">', 'En el prototipo, el código aparece en la consola del servidor.')}
        ${clave('new-password')}${enviar('Cambiar contraseña')}</form>`,
    apelar: () => `<form class="rs-form" data-form="apelar-cuenta" novalidate><p class="mb-0">Tu cuenta fue deshabilitada por reportes. Puedes apelar dentro del plazo.</p>
        ${correo}${clave('current-password')}
        ${campo('justificacion', 'Justificación', '<textarea class="rs-input" id="f-justificacion" name="justificacion" rows="4"></textarea>')}${enviar('Enviar apelación')}</form>`
};

// Ventana de acceso con pestañas.
export function abrirAcceso(modo = 'ingresar') {
    const tab = (m, t) => `<button class="rs-tab" type="button" role="tab" data-action="acceso" data-modo="${m}" aria-selected="${modo === m}">${t}</button>`;
    abrirModal('Acceso', `<div class="rs-tabs px-0 mb-3" role="tablist">${tab('ingresar', 'Ingresar')}${tab('crear', 'Crear cuenta')}${tab('recuperar', 'Recuperar')}</div>${FORMULARIOS_HTML[modo]()}`);
}

// Portada para quien no inició sesión: toda la plataforma exige cuenta institucional (RNF-01).
export const bienvenida = () => `<section class="rs-landing">
    <p class="rs-kicker">Comunidad académica de la sede</p>
    <h2 class="rs-display rs-misprint">Preguntar, resolver y aprender juntos.</h2>
    <p>Publica dudas y soluciones, consulta guías verificadas de tus docentes, revisa la documentación por área y conversa con tu grupo.</p>
    <div class="d-flex gap-2 flex-wrap mt-4"><button class="rs-button" type="button" data-action="acceso" data-modo="ingresar">Ingresar</button>
    <button class="rs-button rs-button--ghost" type="button" data-action="acceso" data-modo="crear">Crear cuenta</button></div>
    <p class="rs-caption mt-4">Necesitas un correo @inacapmail.cl.</p></section>`;

async function ingresar(correoTexto, contrasena) {
    const datos = await api('POST', '/cuentas/login', { correo: correoTexto, contrasena });
    guardarSesion({ token: datos.token, usuario: datos.usuario });
    cerrarModal();
    avisar(`Hola, ${datos.usuario.nombre.split(' ')[0]}.`);
    irA('portada');
    refrescar();
}

export const acciones = {
    acceso: (b) => abrirAcceso(b.dataset.modo),
    sesion: () => {
        if (!usuario()) return abrirAcceso('ingresar');
        guardarSesion(null);
        avisar('Sesión cerrada.');
        irA('portada');
        refrescar();
    }
};

export const formularios = {
    async ingresar(d, f) {
        if (!exigir(f, d, [['correo', 'Escribe tu correo.'], ['contrasena', 'Escribe tu contraseña.']])) return;
        try {
            await ingresar(d.get('correo').trim(), d.get('contrasena'));
        } catch (error) {
            if (error.status === 403) return abrirAcceso('apelar'); // cuenta deshabilitada por moderación
            mostrarErrorGeneral(f, error.message);
        }
    },
    async crear(d, f) {
        const { nombre, correo: c, carrera } = textos(d, ['nombre', 'correo', 'carrera']);
        let ok = exigir(f, d, [['nombre', 'Escribe tu nombre.']]);
        if (!c.toLowerCase().endsWith('@inacapmail.cl')) ok = marcarError(f, 'correo', 'Usa tu correo @inacapmail.cl.');
        if (d.get('contrasena').length < 8) ok = marcarError(f, 'contrasena', 'La contraseña debe tener al menos 8 caracteres.');
        if (!ok) return;
        await api('POST', '/cuentas/registro', { nombre, correo: c, contrasena: d.get('contrasena'), carrera: carrera || null });
        await ingresar(c, d.get('contrasena'));
    },
    async recuperar(d, f) {
        if (!exigir(f, d, [['correo', 'Escribe tu correo institucional.']])) return;
        const respuesta = await api('POST', '/cuentas/recuperar', { correo: d.get('correo').trim() });
        avisar(respuesta.mensaje);
        abrirAcceso('restablecer');
    },
    async restablecer(d, f) {
        let ok = exigir(f, d, [['token', 'Pega el código que recibiste.']]);
        if (d.get('contrasena').length < 8) ok = marcarError(f, 'contrasena', 'La contraseña debe tener al menos 8 caracteres.');
        if (!ok) return;
        const respuesta = await api('POST', '/cuentas/restablecer', { token: d.get('token').trim(), contrasena: d.get('contrasena') });
        avisar(respuesta.mensaje);
        abrirAcceso('ingresar');
    },
    async 'apelar-cuenta'(d, f) {
        if (!exigir(f, d, [['correo', 'Escribe tu correo.'], ['contrasena', 'Escribe tu contraseña.'], ['justificacion', 'Explica por qué debería rehabilitarse.']])) return;
        const cuerpo = { ...textos(d, ['correo', 'justificacion']), contrasena: d.get('contrasena') }; // la contraseña no se recorta
        const respuesta = await api('POST', '/moderacion/apelaciones/cuenta', cuerpo);
        cerrarModal();
        avisar(respuesta.mensaje);
    }
};

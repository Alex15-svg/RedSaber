// Endurecimiento del servidor (OWASP A05 y A07): cabeceras de seguridad y límite de intentos.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// La interfaz compilada trae un script en línea (aplica el tema antes de pintar).
// Se permite solo ese script, por su huella SHA-256; cualquier otro script en línea queda bloqueado.
function huellasScripts() {
    try {
        const html = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'frontend', 'dist', 'index.html'), 'utf8');
        return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
            // El navegador convierte los saltos de línea de Windows (\r\n) en \n antes de calcular la huella.
            .map((m) => m[1].replace(/\r\n?/g, '\n'))
            .map((js) => `'sha256-${crypto.createHash('sha256').update(js).digest('base64')}'`);
    } catch {
        return []; // sin interfaz compilada (solo API): no hay scripts que permitir
    }
}

// Cabeceras: CSP, nosniff, X-Frame-Options, HSTS, Referrer-Policy y sin X-Powered-By.
const cabeceras = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", ...huellasScripts()],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:', 'blob:'],
            // «Leer» abre el PDF en una ventana blob:, que hereda esta política: el visor de PDF
            // del navegador necesita que object-src admita contenido propio y blob:.
            objectSrc: ["'self'", 'blob:'],
            frameAncestors: ["'none'"]
        }
    }
});

// Las respuestas de la API no se guardan en caché: llevan datos de la sesión.
function sinCache(req, res, next) {
    res.set('Cache-Control', 'no-store');
    next();
}

// Clave del límite: la IP más el correo, para frenar la fuerza bruta contra una cuenta
// sin bloquear a toda la sede, que puede salir a Internet con una misma IP.
const porCorreo = (req) => `${req.ip}|${String((req.body || {}).correo || '').toLowerCase()}`;

function limite(maximo, minutos, mensaje, soloFallidos) {
    return rateLimit({
        windowMs: minutos * 60 * 1000,
        limit: Number(process.env.LIMITE_INTENTOS) || maximo,
        keyGenerator: porCorreo,
        skipSuccessfulRequests: soloFallidos,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { error: mensaje }
    });
}

module.exports = {
    cabeceras,
    sinCache,
    // 10 intentos fallidos de inicio de sesión cada 15 minutos por correo e IP.
    limiteLogin: limite(10, 15, 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo otra vez.', true),
    // 5 pedidos de recuperación cada 15 minutos por correo e IP.
    limiteRecuperar: limite(5, 15, 'Demasiadas solicitudes de recuperación. Espera 15 minutos.', false),
    // 20 registros por hora desde una misma IP.
    limiteRegistro: rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: 'draft-7',
        legacyHeaders: false, message: { error: 'Demasiados registros desde esta red. Espera una hora.' } })
};

// Envío de correos con nodemailer (RF-04).
// Si no hay SMTP configurado en el .env, el correo se muestra en la consola del servidor.
const nodemailer = require('nodemailer');

let transporte = null;

function obtenerTransporte() {
    if (transporte) return transporte;
    if (!process.env.SMTP_HOST) return null;
    const puerto = Number(process.env.SMTP_PORT) || 587;
    transporte = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: puerto,
        secure: puerto === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
    return transporte;
}

// Devuelve true si se envió por SMTP, false si solo se mostró en consola.
async function enviarCorreo({ para, asunto, texto }) {
    const t = obtenerTransporte();
    if (!t) {
        console.log(`[CORREO SIMULADO] Para: ${para}\nAsunto: ${asunto}\n${texto}`);
        return false;
    }
    await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: para, subject: asunto, text: texto });
    return true;
}

module.exports = { enviarCorreo };
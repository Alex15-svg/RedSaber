// Verifica que la solicitud traiga un token JWT válido (RNF-01) y que la cuenta siga activa.
// Si todo está bien, deja los datos del usuario en req.usuario = { id, ocupacion },
// que es lo que usan roles.js y los controladores.
// El inicio de sesión (RF-03) firma el token con:
//   jwt.sign({ id: usuario.id, ocupacion: usuario.ocupacion }, process.env.JWT_SECRET)
const jwt = require('jsonwebtoken');
const pool = require('../config/dbPostgre');

// Revisa un token. Devuelve { usuario: { id, ocupacion } } si sirve, o { status, error } si no.
// La usan este middleware y la conexión en tiempo real de los chats (Socket.IO).
async function revisarToken(token) {
    let datos;
    try {
        // Solo se acepta HS256: evita que un token firmado con otro algoritmo pase la verificación.
        datos = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
        datos = null;
    }
    const id = Number(datos && datos.id);
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
        return { status: 401, error: 'La sesión no es válida o ya expiró. Inicia sesión otra vez.' };
    }

    // El estado y el rol se leen de la base en cada solicitud: una cuenta deshabilitada
    // pierde el acceso de inmediato, aunque su token aún no venza (OWASP A01 y A07).
    const r = await pool.query('SELECT ocupacion, estado FROM usuarios WHERE id = $1', [id]);
    const usuario = r.rows[0];
    if (!usuario) return { status: 401, error: 'La cuenta ya no existe. Inicia sesión otra vez.' };
    if (usuario.estado !== 'activa') return { status: 403, error: 'Cuenta deshabilitada' };
    return { usuario: { id, ocupacion: usuario.ocupacion } };
}

async function auth(req, res, next) {
    // El token llega en la cabecera:  Authorization: Bearer <token>
    const cabecera = req.headers.authorization || '';
    const [tipo, token] = cabecera.split(' ');

    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Debes iniciar sesión.' });
    }

    try {
        const resultado = await revisarToken(token);
        if (resultado.error) return res.status(resultado.status).json({ error: resultado.error });
        req.usuario = resultado.usuario;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = auth;
module.exports.revisarToken = revisarToken;

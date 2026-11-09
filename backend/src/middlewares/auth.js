// Verifica que la solicitud traiga un token JWT válido (RNF-01).
// Si es válido, deja los datos del usuario en req.usuario = { id, ocupacion },
// que es lo que usan roles.js y los controladores.
// El inicio de sesión (RF-03) debe firmar el token con esos mismos datos:
//   jwt.sign({ id: usuario.id, ocupacion: usuario.ocupacion }, process.env.JWT_SECRET)
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    // El token llega en la cabecera:  Authorization: Bearer <token>
    const cabecera = req.headers.authorization || '';
    const [tipo, token] = cabecera.split(' ');

    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Debes iniciar sesión.' });
    }

    try {
        const datos = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = { id: Number(datos.id), ocupacion: datos.ocupacion };
        next();
    } catch {
        res.status(401).json({ error: 'La sesión no es válida o ya expiró. Inicia sesión otra vez.' });
    }
}

module.exports = auth;

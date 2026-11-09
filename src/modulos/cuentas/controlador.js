const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const modelo = require('./modelo');

const CORREOS_DOCENTES = []; // RF-02 parcial: por ahora todos son estudiantes
const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');

// RF-01
async function registrar(req, res) {
  try {
    const { nombre, correo, contrasena, carrera } = req.body || {};
    if (!nombre || !correo || !contrasena)
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    if (!correo.toLowerCase().endsWith('@inacapmail.cl'))
      return res.status(400).json({ error: 'Usa tu correo @inacapmail.cl' });
    if (contrasena.length < 8)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    if (await modelo.buscarPorCorreo(correo))
      return res.status(409).json({ error: 'Ese correo ya está registrado' });

    const ocupacion = CORREOS_DOCENTES.includes(correo.toLowerCase()) ? 'docente' : 'estudiante';
    const contrasenaHash = await bcrypt.hash(contrasena, 10);
    const usuario = await modelo.crearUsuario({ nombre, correo, contrasenaHash, ocupacion, carrera });
    res.status(201).json({ mensaje: 'Cuenta creada', usuario });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ese correo ya está registrado' });
    if (e.code === '23514') return res.status(400).json({ error: 'Datos no válidos' });
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
}

// RF-03
async function iniciarSesionCorreo(req, res) {
  try {
    const { correo, contrasena } = req.body || {};
    if (!correo || !contrasena)
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });

    const usuario = await modelo.buscarPorCorreo(correo);
    const ok = usuario && await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!ok) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    if (usuario.estado !== 'activa') return res.status(403).json({ error: 'Cuenta deshabilitada' });

    const token = jwt.sign({ id: usuario.id, ocupacion: usuario.ocupacion },
                           process.env.JWT_SECRET, { expiresIn: '2h' });
    res.status(200).json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, ocupacion: usuario.ocupacion }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
}

// RF-04 (paso 1): genera el token. Sin correo real, se imprime en la consola.
async function recuperar(req, res) {
  try {
    const usuario = await modelo.buscarPorCorreo((req.body || {}).correo || '');
    if (usuario) {
      const token = crypto.randomBytes(32).toString('hex');
      await modelo.guardarToken(usuario.id, sha256(token));
      console.log('TOKEN DE RECUPERACIÓN (simula el correo):', token);
    }
    res.json({ mensaje: 'Si el correo existe, se envió un enlace de recuperación' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
}

// RF-04 (paso 2): cambia la contraseña con el token
async function restablecer(req, res) {
  try {
    const { token, contrasena } = req.body || {};
    if (!token || !contrasena || contrasena.length < 8)
      return res.status(400).json({ error: 'Token y nueva contraseña (mín. 8) son obligatorios' });
    const ok = await modelo.cambiarContrasenaConToken(sha256(token), await bcrypt.hash(contrasena, 10));
    if (!ok) return res.status(400).json({ error: 'Token inválido o vencido' });
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { registrar, iniciarSesionCorreo, recuperar, restablecer };
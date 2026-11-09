const pool = require('../../config/dbPostgre');
const enTransaccion = require('../../utils/transaccion');
// Busca un usuario por correo, sin distinguir mayúsculas (login y duplicados)
async function buscarPorCorreo(correo) {
  const r = await pool.query(
    'SELECT * FROM usuarios WHERE lower(correo_institucional) = lower($1)',
    [correo]
  );
  return r.rows[0]; // el usuario, o undefined si no existe
}

// Crea el usuario, su fila de ocupación y su perfil: todo o nada
async function crearUsuario({ nombre, correo, contrasenaHash, ocupacion, carrera }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // INSERT 1: el usuario
    const r = await client.query(
      `INSERT INTO usuarios (nombre, correo_institucional, contrasena_hash, ocupacion, carrera)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, correo_institucional, ocupacion, carrera`,
      [nombre, correo, contrasenaHash, ocupacion, carrera || null]
    );
    const usuario = r.rows[0];

    // INSERT 2: su fila según la ocupación
    if (ocupacion === 'estudiante') {
      await client.query('INSERT INTO estudiantes (usuario_id) VALUES ($1)', [usuario.id]);
    } else if (ocupacion === 'docente') {
      await client.query('INSERT INTO docentes (usuario_id) VALUES ($1)', [usuario.id]);
    }

    // INSERT 3: su perfil
    await client.query('INSERT INTO perfiles (usuario_id) VALUES ($1)', [usuario.id]);

    await client.query('COMMIT');
    return usuario;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Perfil de un usuario (CU-08)
async function buscarPorId(id) {
  const r = await pool.query(
    `SELECT u.id, u.nombre, u.correo_institucional, u.correo_publico,
            u.carrera, u.ocupacion, p.foto_url, p.encabezado_url, p.fondo_url
     FROM usuarios u
     LEFT JOIN perfiles p ON p.usuario_id = u.id
     WHERE u.id = $1`,
    [id]
  );
  return r.rows[0];
}

// RF-02: solo el administrador puede ver la lista de usuarios
async function listarUsuarios(req, res) {
  try {
    res.json(await modelo.listarUsuarios());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = {  registrar, iniciarSesionCorreo, recuperar, restablecer, listarUsuarios };
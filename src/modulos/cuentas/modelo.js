//Gestiona los datos y la interacción con la base de datos.
const pool = require('../../config/db');

// Busca un usuario por correo, sin distinguir mayúsculas (login y duplicados)
async function buscarPorCorreo(correo) {
  const r = await pool.query(
    'SELECT * FROM usuarios WHERE lower(correo_institucional) = lower($1)',
    [correo]
  );
  return r.rows[0]; // el usuario, o undefined si no existe
}

// Crea el usuario, su fila de ocupación y su perfil, todo o nada
async function crearUsuario({ nombre, correo, contrasenaHash, ocupacion, carrera }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const r = await client.query(
      `INSERT INTO usuarios (nombre, correo_institucional, contrasena_hash, ocupacion, carrera)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, correo_institucional, ocupacion, carrera`,
      [nombre, correo, contrasenaHash, ocupacion, carrera]
    );
    const usuario = r.rows[0];

    if (ocupacion === 'estudiante') {
      await client.query('INSERT INTO estudiantes (usuario_id) VALUES ($1)', [usuario.id]);
    } else if (ocupacion === 'docente') {
      await client.query('INSERT INTO docentes (usuario_id) VALUES ($1)', [usuario.id]);
    }
    await client.query('INSERT INTO perfiles (usuario_id) VALUES ($1)', [usuario.id]);

    await client.query('COMMIT');
    return usuario;
  } catch (err) {
    await client.query('ROLLBACK'); // deshace todo si algo falló
    throw err;                      // el controlador decide qué responder
  } finally {
    client.release();               // devuelve la conexión al pool
  }
}

// Perfil de un usuario (CU-08); el controlador decide si muestra el correo
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

module.exports = { buscarPorCorreo, crearUsuario, buscarPorId };
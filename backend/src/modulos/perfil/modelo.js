// Consultas SQL para personalizar el perfil (RF-05).
const pool = require('../../config/dbPostgre');

// Campo que pide el usuario -> columna de la tabla perfiles.
// Funciona como lista blanca: el nombre de la columna nunca sale del texto del usuario.
const COLUMNAS = { foto: 'foto_url', encabezado: 'encabezado_url', fondo: 'fondo_url' };

// Guarda la URL de una imagen y devuelve la URL anterior, para poder borrar ese archivo.
// Si el usuario todavía no tiene fila en perfiles, la crea.
async function cambiarImagen(usuarioId, campo, url) {
    const columna = COLUMNAS[campo];

    const actual = await pool.query(
        `SELECT ${columna} AS url FROM perfiles WHERE usuario_id = $1`,
        [usuarioId]
    );

    await pool.query(
        `INSERT INTO perfiles (usuario_id, ${columna}) VALUES ($1, $2)
         ON CONFLICT (usuario_id) DO UPDATE SET ${columna} = EXCLUDED.${columna}`,
        [usuarioId, url]
    );

    return actual.rows.length ? actual.rows[0].url : null;
}

// Cambia si el correo es público (true) o privado (false).
// Devuelve false si la cuenta no existe.
async function cambiarVisibilidadCorreo(usuarioId, publico) {
    const resultado = await pool.query(
        'UPDATE usuarios SET correo_publico = $2 WHERE id = $1',
        [usuarioId, publico]
    );
    return resultado.rowCount === 1;
}

module.exports = { COLUMNAS, cambiarImagen, cambiarVisibilidadCorreo };

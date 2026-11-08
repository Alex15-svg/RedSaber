// Consultas SQL de publicaciones: publicar (RF-06) y editar o borrar las propias (RF-07).
const pool = require('../../config/dbPostgre');

// Columnas que se devuelven al cliente.
const CAMPOS = `id, autor_id, tipo, titulo, carrera, asignatura, seccion, descripcion,
                estado, creado_en, actualizado_en`;

async function crear(autorId, datos) {
    const resultado = await pool.query(
        `INSERT INTO publicaciones (autor_id, tipo, titulo, carrera, asignatura, seccion, descripcion)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${CAMPOS}`,
        [autorId, datos.tipo, datos.titulo, datos.carrera, datos.asignatura, datos.seccion, datos.descripcion]
    );
    return resultado.rows[0];
}

// Publicaciones de un autor, de la más nueva a la más antigua (lista del perfil).
async function listarDeAutor(autorId) {
    const resultado = await pool.query(
        `SELECT ${CAMPOS} FROM publicaciones WHERE autor_id = $1 ORDER BY creado_en DESC`,
        [autorId]
    );
    return resultado.rows;
}

// Devuelve { autor_id, estado } de una publicación, o null si no existe.
async function buscarDueno(id) {
    const resultado = await pool.query(
        'SELECT autor_id, estado FROM publicaciones WHERE id = $1',
        [id]
    );
    return resultado.rows[0] || null;
}

async function editar(id, datos) {
    const resultado = await pool.query(
        `UPDATE publicaciones
            SET titulo = $2, carrera = $3, asignatura = $4, seccion = $5, descripcion = $6,
                actualizado_en = now()
          WHERE id = $1
          RETURNING ${CAMPOS}`,
        [id, datos.titulo, datos.carrera, datos.asignatura, datos.seccion, datos.descripcion]
    );
    return resultado.rows[0];
}

// Al borrar, la base elimina en cascada sus reportes, apelaciones y guardados.
async function borrar(id) {
    await pool.query('DELETE FROM publicaciones WHERE id = $1', [id]);
}

module.exports = { crear, listarDeAutor, buscarDueno, editar, borrar };

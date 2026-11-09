// Consultas SQL de la documentación por áreas (RF-10).
// La columna archivo_url guarda el nombre del archivo dentro de la carpeta privada.
const pool = require('../../config/dbPostgre');

// Áreas con la cantidad de documentos de cada una (el «índice» de la sección).
async function areas() {
    const resultado = await pool.query(
        `SELECT area, COUNT(*)::int AS documentos
           FROM documentos
          GROUP BY area
          ORDER BY area`
    );
    return resultado.rows;
}

// Documentos de un área, o de todas si area es null.
async function listar(area) {
    const resultado = await pool.query(
        `SELECT id, titulo, area, tamano_mb, creado_en
           FROM documentos
          WHERE $1::text IS NULL OR area = $1
          ORDER BY area, titulo`,
        [area]
    );
    return resultado.rows;
}

// Un documento con el nombre de su archivo, o null si no existe.
async function buscar(id) {
    const resultado = await pool.query(
        'SELECT id, titulo, area, archivo_url, tamano_mb, creado_en FROM documentos WHERE id = $1',
        [id]
    );
    return resultado.rows[0] || null;
}

async function crear({ titulo, area, archivo, tamanoMb }) {
    const resultado = await pool.query(
        `INSERT INTO documentos (titulo, area, archivo_url, tamano_mb)
         VALUES ($1, $2, $3, $4)
         RETURNING id, titulo, area, tamano_mb, creado_en`,
        [titulo, area, archivo, tamanoMb]
    );
    return resultado.rows[0];
}

module.exports = { areas, listar, buscar, crear };

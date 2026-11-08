// Consultas SQL de talleres (RF-16).
const pool = require('../../config/dbPostgre');

// Talleres de la sede con su capacidad, inscritos y cupos libres.
// Los inscritos no se guardan como número: se cuentan desde taller_inscripciones,
// así nunca quedan desactualizados.
async function listar() {
    const resultado = await pool.query(
        `SELECT t.id, t.nombre, t.capacidad,
                COUNT(i.estudiante_id)::int               AS inscritos,
                t.capacidad - COUNT(i.estudiante_id)::int AS cupos_disponibles
           FROM talleres t
           LEFT JOIN taller_inscripciones i ON i.taller_id = t.id
          GROUP BY t.id
          ORDER BY t.nombre`
    );
    return resultado.rows;
}

module.exports = { listar };

// Catálogo de cursos para estudiantes (complemento de RF-14 y RF-15).
// Está aparte de modelo.js (de Fabián) para no superar el límite de 120 líneas.
const pool = require('../../config/dbPostgre');

// Cursos solicitados o abiertos (y los cerrados en que el usuario ya ingresó),
// con su docente, cantidades y si el usuario ya marcó interés o ingresó.
async function listar(usuarioId) {
    const resultado = await pool.query(
        `SELECT c.id, c.nombre, c.objetivo, c.estado, c.capacidad, u.nombre AS docente,
                (SELECT COUNT(*)::int FROM curso_interesados i WHERE i.curso_id = c.id) AS interesados,
                (SELECT COUNT(*)::int FROM curso_estudiantes e WHERE e.curso_id = c.id) AS ingresados,
                EXISTS (SELECT 1 FROM curso_interesados i WHERE i.curso_id = c.id AND i.estudiante_id = $1) AS me_interesa,
                EXISTS (SELECT 1 FROM curso_estudiantes e WHERE e.curso_id = c.id AND e.estudiante_id = $1) AS ingresado
           FROM cursos c
           JOIN usuarios u ON u.id = c.docente_id
          WHERE c.estado <> 'cerrado'
             OR EXISTS (SELECT 1 FROM curso_estudiantes e WHERE e.curso_id = c.id AND e.estudiante_id = $1)
          ORDER BY CASE c.estado WHEN 'abierto' THEN 0 WHEN 'solicitado' THEN 1 ELSE 2 END, c.nombre`,
        [usuarioId]
    );
    return resultado.rows;
}

// GET /api/cursos
async function disponibles(req, res) {
    res.json(await listar(req.usuario.id));
}

module.exports = { disponibles };

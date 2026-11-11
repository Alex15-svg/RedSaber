const pool = require('../../config/dbPostgre');
const enTransaccion = require('../../utils/transaccion');

// RF-14: crea el grupo, sus integrantes, el curso (estado 'solicitado') y la solicitud.
// "correos" son los correos de los demás integrantes (el solicitante se agrega solo).
async function crearSolicitud({ solicitanteId, nombreGrupo, correos, docenteId, nombre, objetivo }) {
  return enTransaccion(async (c) => {
    const d = await c.query('SELECT 1 FROM docentes WHERE usuario_id = $1', [docenteId]);
    if (!d.rows[0]) return { error: 'El docente indicado no existe' };

    const e = await c.query(
      `SELECT u.id FROM usuarios u JOIN estudiantes s ON s.usuario_id = u.id
       WHERE lower(u.correo_institucional) = ANY($1::text[])`,
      [correos.map((x) => x.toLowerCase())]
    );
    if (e.rows.length !== correos.length)
      return { error: 'Algún integrante no existe o no es estudiante' };

    const ids = [...new Set([solicitanteId, ...e.rows.map((f) => f.id)])];

    const g = await c.query('INSERT INTO grupos (nombre) VALUES ($1) RETURNING id', [nombreGrupo]);
    const grupoId = g.rows[0].id;
    for (const id of ids) {
      await c.query('INSERT INTO grupo_integrantes (grupo_id, estudiante_id) VALUES ($1, $2)', [grupoId, id]);
    }

    const cu = await c.query(
      `INSERT INTO cursos (docente_id, nombre, objetivo) VALUES ($1, $2, $3) RETURNING id`,
      [docenteId, nombre, objetivo]
    );
    const cursoId = cu.rows[0].id;
    await c.query('INSERT INTO solicitudes_curso (grupo_id, curso_id) VALUES ($1, $2)', [grupoId, cursoId]);
    return { cursoId, grupoId };
  });
}

// RF-14: el docente ve las solicitudes que le llegaron
async function solicitudesDelDocente(docenteId) {
  const r = await pool.query(
    `SELECT c.id AS curso_id, c.nombre, c.objetivo, c.estado, g.id AS grupo_id, g.nombre AS grupo,
            s.fecha,
            (SELECT array_agg(u.nombre ORDER BY u.nombre)
               FROM grupo_integrantes gi JOIN usuarios u ON u.id = gi.estudiante_id
              WHERE gi.grupo_id = g.id) AS integrantes
     FROM solicitudes_curso s
     JOIN cursos c ON c.id = s.curso_id
     JOIN grupos g ON g.id = s.grupo_id
     WHERE c.docente_id = $1
     ORDER BY s.fecha DESC`,
    [docenteId]
  );
  return r.rows;
}

// RF-15: mis cursos con cantidad de interesados e ingresados
async function cursosDelDocente(docenteId) {
  const r = await pool.query(
    `SELECT c.id, c.nombre, c.estado, c.capacidad,
            (SELECT count(*) FROM curso_interesados i WHERE i.curso_id = c.id)::int AS interesados,
            (SELECT count(*) FROM curso_estudiantes e WHERE e.curso_id = c.id)::int AS ingresados
     FROM cursos c WHERE c.docente_id = $1 ORDER BY c.id`,
    [docenteId]
  );
  return r.rows;
}

// RF-15: cambia el estado de un curso del docente (solicitado→abierto, abierto→cerrado)
async function cambiarEstado(cursoId, docenteId, desde, hacia) {
  const r = await pool.query(
    `UPDATE cursos SET estado = $4 WHERE id = $1 AND docente_id = $2 AND estado = $3 RETURNING id`,
    [cursoId, docenteId, desde, hacia]
  );
  return r.rows[0] || null;
}

// RF-15: lista de usuarios ingresados (solo si el curso es del docente)
async function ingresados(cursoId, docenteId) {
  const r = await pool.query(
    `SELECT u.id, u.nombre, u.correo_institucional, e.ingresado_en
     FROM curso_estudiantes e
     JOIN usuarios u ON u.id = e.estudiante_id
     JOIN cursos c ON c.id = e.curso_id
     WHERE e.curso_id = $1 AND c.docente_id = $2
     ORDER BY e.ingresado_en`,
    [cursoId, docenteId]
  );
  return r.rows;
}

// Estudiante: manifiesta interés (cuenta como "interesado" para el docente)
async function marcarInteres(cursoId, estudianteId) {
  const r = await pool.query('SELECT estado FROM cursos WHERE id = $1', [cursoId]);
  if (!r.rows[0]) return 'no_existe';
  if (r.rows[0].estado === 'cerrado') return 'cerrado';
  await pool.query(
    `INSERT INTO curso_interesados (curso_id, estudiante_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [cursoId, estudianteId]
  );
  return 'ok';
}

// Estudiante: ingresa al curso. Solo si está 'abierto' y hay cupo.
async function ingresar(cursoId, estudianteId) {
  return enTransaccion(async (c) => {
    const r = await c.query('SELECT estado, capacidad FROM cursos WHERE id = $1 FOR UPDATE', [cursoId]);
    const curso = r.rows[0];
    if (!curso) return 'no_existe';
    if (curso.estado !== 'abierto') return 'no_abierto';
    if (curso.capacidad) {
      const n = await c.query('SELECT count(*)::int AS n FROM curso_estudiantes WHERE curso_id = $1', [cursoId]);
      if (n.rows[0].n >= curso.capacidad) return 'sin_cupo';
    }
    const ins = await c.query(
      `INSERT INTO curso_estudiantes (curso_id, estudiante_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING 1`,
      [cursoId, estudianteId]
    );
    return ins.rows[0] ? 'ok' : 'ya_ingresado';
  });
}

module.exports = {
  crearSolicitud, solicitudesDelDocente, cursosDelDocente,
  cambiarEstado, ingresados, marcarInteres, ingresar
};
const pool = require('../../config/dbPostgre');
const enTransaccion = require('../../utils/transaccion');

// Lista las apelaciones pendientes
async function listarPendientes() {
  const r = await pool.query(
    `SELECT id, usuario_id, publicacion_id, justificacion, fecha_limite, creado_en
     FROM apelaciones
     WHERE estado = 'pendiente'
     ORDER BY creado_en`
  );
  return r.rows;
}

// Acepta la apelación y rehabilita la cuenta o publicación (todo o nada).
// Devuelve la apelación, o null si no existe o ya estaba resuelta.
async function rehabilitar(apelacionId, adminId) {
  return enTransaccion(async (c) => {
    const r = await c.query(
      `UPDATE apelaciones
       SET estado = 'aceptada', resuelta_en = now(),
           administrador_id = (SELECT usuario_id FROM administradores WHERE usuario_id = $2)
       WHERE id = $1 AND estado = 'pendiente'
       RETURNING id, usuario_id, publicacion_id`,
      [apelacionId, adminId]
    );
    const ap = r.rows[0];
    if (!ap) return null;

    let tipo, objetivoId;
    if (ap.usuario_id) {
      await c.query(
        `UPDATE usuarios SET estado = 'activa', deshabilitado_en = NULL WHERE id = $1`,
        [ap.usuario_id]
      );
      tipo = 'usuario'; objetivoId = ap.usuario_id;
    } else {
      await c.query(
        `UPDATE publicaciones SET estado = 'activa', deshabilitado_en = NULL WHERE id = $1`,
        [ap.publicacion_id]
      );
      tipo = 'publicacion'; objetivoId = ap.publicacion_id;
    }

    await c.query(
      `INSERT INTO registro_moderacion (tipo_objetivo, objetivo_id, accion, responsable)
       VALUES ($1, $2, 'rehabilitar', (SELECT correo_institucional FROM usuarios WHERE id = $3))`,
      [tipo, objetivoId, adminId]
    );
    return ap;
  });
}

// Rechaza la apelación: la cuenta o publicación sigue deshabilitada y la limpieza
// de RF-12 la elimina al vencer el plazo. Devuelve la apelación, o null si no existe o ya estaba resuelta.
async function rechazar(apelacionId, adminId) {
  return enTransaccion(async (c) => {
    const r = await c.query(
      `UPDATE apelaciones
       SET estado = 'rechazada', resuelta_en = now(),
           administrador_id = (SELECT usuario_id FROM administradores WHERE usuario_id = $2)
       WHERE id = $1 AND estado = 'pendiente'
       RETURNING id, usuario_id, publicacion_id`,
      [apelacionId, adminId]
    );
    const ap = r.rows[0];
    if (!ap) return null;

    await c.query(
      `INSERT INTO registro_moderacion (tipo_objetivo, objetivo_id, accion, responsable)
       VALUES ($1, $2, 'rechazar apelacion', (SELECT correo_institucional FROM usuarios WHERE id = $3))`,
      [ap.usuario_id ? 'usuario' : 'publicacion', ap.usuario_id || ap.publicacion_id, adminId]
    );
    return ap;
  });
}

module.exports = { listarPendientes, rehabilitar, rechazar };
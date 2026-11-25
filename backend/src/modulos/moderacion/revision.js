// Moderación previa: el administrador revisa las publicaciones pendientes antes de que se vean.
// Aprobar la deja «activa» (visible para todos); rechazar la deja «rechazada» (solo la ve su autor,
// que puede editarla y volver a enviarla). Cada decisión queda en la bitácora registro_moderacion.
const pool = require('../../config/dbPostgre');
const enTransaccion = require('../../utils/transaccion');
const { leerId } = require('../../utils/validar');

// GET /api/moderacion/publicaciones/pendientes: de la más antigua a la más nueva, con su autor.
async function pendientes(req, res) {
    const r = await pool.query(
        `SELECT p.id, p.tipo, p.titulo, p.carrera, p.asignatura, p.seccion, p.descripcion,
                p.creado_en, p.actualizado_en, p.autor_id, u.nombre AS autor, u.correo_institucional AS correo
           FROM publicaciones p
           JOIN usuarios u ON u.id = p.autor_id
          WHERE p.estado = 'pendiente'
          ORDER BY p.actualizado_en, p.id`
    );
    res.json(r.rows);
}

// Cambia una publicación pendiente al estado indicado y lo anota en la bitácora con el correo del admin.
// Devuelve false si la publicación no existe o ya no está pendiente.
async function decidir(publicacionId, adminId, estado, accion) {
    return enTransaccion(async (c) => {
        const r = await c.query(
            `UPDATE publicaciones SET estado = $2 WHERE id = $1 AND estado = 'pendiente' RETURNING id`,
            [publicacionId, estado]
        );
        if (!r.rows[0]) return false;
        await c.query(
            `INSERT INTO registro_moderacion (tipo_objetivo, objetivo_id, accion, responsable)
             VALUES ('publicacion', $1, $2, (SELECT correo_institucional FROM usuarios WHERE id = $3))`,
            [publicacionId, accion, adminId]
        );
        return true;
    });
}

function resolver(estado, accion, mensaje) {
    return async (req, res) => {
        const id = leerId(req.params.id);
        const hecho = id ? await decidir(id, req.usuario.id, estado, accion) : false;
        if (!hecho) return res.status(404).json({ error: 'La publicación no existe o ya fue revisada.' });
        res.json({ id, estado, mensaje });
    };
}

module.exports = {
    pendientes,
    aprobar: resolver('activa', 'aprobar publicacion', 'Publicación aprobada: ya es visible.'),
    rechazar: resolver('rechazada', 'rechazar publicacion', 'Publicación rechazada: solo la ve su autor.')
};

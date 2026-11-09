// Consultas SQL de la moderación por reportes (RF-12). La revisión de apelaciones (RF-13) está en modulos/moderacion.
const pool = require('../../config/dbPostgre');
const enTransaccion = require('../../utils/transaccion');

// Lo que se puede reportar (lo «Reportable» del diagrama de clases).
// Funciona como lista blanca para los nombres de tablas y columnas.
const OBJETIVOS = {
    publicacion: { tabla: 'publicaciones', dueno: 'autor_id', reporte: 'publicacion_id', apelacion: 'publicacion_id' },
    usuario: { tabla: 'usuarios', dueno: 'id', reporte: 'usuario_reportado_id', apelacion: 'usuario_id' }
};

// Bitácora de moderación (RNF-09): qué pasó, sobre qué, quién y cuándo.
async function registrar(cliente, tipo, id, accion, responsable) {
    await cliente.query(
        `INSERT INTO registro_moderacion (tipo_objetivo, objetivo_id, accion, responsable)
         VALUES ($1, $2, $3, $4)`,
        [tipo, id, accion, responsable]
    );
}

// Dueño y estado de una publicación o cuenta, o null si no existe.
async function buscarObjetivo(tipo, id) {
    const { tabla, dueno } = OBJETIVOS[tipo];
    const resultado = await pool.query(`SELECT ${dueno} AS dueno_id, estado FROM ${tabla} WHERE id = $1`, [id]);
    return resultado.rows[0] || null;
}

// Guarda el reporte y, si se alcanza el umbral, deshabilita el objetivo. Todo en una transacción.
// Si el usuario ya lo había reportado, PostgreSQL lanza el error 23505 (índice único).
async function reportar(denuncianteId, tipo, id, motivo, umbral) {
    const { tabla, reporte } = OBJETIVOS[tipo];
    return enTransaccion(async (cliente) => {
        await cliente.query(
            `INSERT INTO reportes (denunciante_id, ${reporte}, motivo) VALUES ($1, $2, $3)`,
            [denuncianteId, id, motivo]
        );
        await registrar(cliente, tipo, id, 'reportar', `usuario ${denuncianteId}`);

        const conteo = await cliente.query(`SELECT COUNT(*)::int AS total FROM reportes WHERE ${reporte} = $1`, [id]);
        if (conteo.rows[0].total < umbral) return false;

        const cambio = await cliente.query(
            `UPDATE ${tabla} SET estado = 'deshabilitada', deshabilitado_en = now()
              WHERE id = $1 AND estado = 'activa'`,
            [id]
        );
        if (cambio.rowCount === 1) await registrar(cliente, tipo, id, 'deshabilitar', 'sistema');
        return cambio.rowCount === 1;
    });
}

// Crea la apelación si el objetivo está deshabilitado, el plazo no venció y no apeló antes.
// Devuelve { resultado, limite }. resultado: 'ok', 'activo', 'vencido' o 'repetida'.
async function apelar(tipo, id, justificacion, plazoDias, responsable) {
    const { tabla, apelacion } = OBJETIVOS[tipo];
    return enTransaccion(async (cliente) => {
        const estado = await cliente.query(
            `SELECT estado, deshabilitado_en + make_interval(days => $2) AS limite,
                    now() > deshabilitado_en + make_interval(days => $2) AS vencido,
                    EXISTS (SELECT 1 FROM apelaciones a
                             WHERE a.${apelacion} = t.id AND a.creado_en >= t.deshabilitado_en) AS repetida
               FROM ${tabla} t WHERE id = $1`,
            [id, plazoDias]
        );
        const fila = estado.rows[0];
        if (!fila || fila.estado !== 'deshabilitada') return { resultado: 'activo' };
        if (fila.vencido) return { resultado: 'vencido', limite: fila.limite };
        if (fila.repetida) return { resultado: 'repetida', limite: fila.limite };

        await cliente.query(
            `INSERT INTO apelaciones (${apelacion}, justificacion, fecha_limite) VALUES ($1, $2, $3)`,
            [id, justificacion, fila.limite]
        );
        await registrar(cliente, tipo, id, 'apelar', responsable);
        return { resultado: 'ok', limite: fila.limite };
    });
}

// Para apelar una cuenta deshabilitada (no puede iniciar sesión): busca por correo.
async function buscarCuenta(correo) {
    const resultado = await pool.query(
        'SELECT id, contrasena_hash, estado FROM usuarios WHERE lower(correo_institucional) = lower($1)',
        [correo]
    );
    return resultado.rows[0] || null;
}

module.exports = { OBJETIVOS, registrar, buscarObjetivo, reportar, apelar, buscarCuenta };

// Consultas SQL de chats e invitaciones (RF-17, CU-24 a CU-26).
const pool = require('../../config/dbPostgre');
const enTransaccion = require('../../utils/transaccion');

// Comprueba que todos los ids sean de cuentas que existen y están activas.
async function usuariosValidos(ids) {
    const resultado = await pool.query(
        `SELECT COUNT(*)::int AS total
           FROM usuarios
          WHERE id = ANY($1::int[]) AND estado = 'activa'`,
        [ids]
    );
    return resultado.rows[0].total === ids.length;
}

// CU-24: crea el chat, suma al creador como participante e invita a los demás.
// Va en una transacción: si una invitación falla, no queda un chat a medias.
async function crearChat(creadorId, tipo, invitados) {
    return enTransaccion(async (cliente) => {
        const resultado = await cliente.query(
            'INSERT INTO chats (tipo) VALUES ($1) RETURNING id, tipo, creado_en',
            [tipo]
        );
        const chat = resultado.rows[0];

        await cliente.query(
            'INSERT INTO chat_participantes (chat_id, usuario_id) VALUES ($1, $2)',
            [chat.id, creadorId]
        );
        for (const destinatarioId of invitados) {
            await cliente.query(
                `INSERT INTO invitaciones_chat (chat_id, remitente_id, destinatario_id)
                 VALUES ($1, $2, $3)`,
                [chat.id, creadorId, destinatarioId]
            );
        }
        return chat;
    });
}

// Chats donde participa el usuario, con la cantidad de participantes de cada uno.
async function misChats(usuarioId) {
    const resultado = await pool.query(
        `SELECT c.id, c.tipo, c.creado_en,
                (SELECT COUNT(*)::int FROM chat_participantes x WHERE x.chat_id = c.id) AS participantes
           FROM chats c
           JOIN chat_participantes p ON p.chat_id = c.id
          WHERE p.usuario_id = $1
          ORDER BY c.creado_en DESC`,
        [usuarioId]
    );
    return resultado.rows;
}

// Invitaciones que el usuario todavía no responde.
async function invitacionesPendientes(usuarioId) {
    const resultado = await pool.query(
        `SELECT i.id, i.chat_id, c.tipo, u.nombre AS remitente, i.fecha
           FROM invitaciones_chat i
           JOIN chats c    ON c.id = i.chat_id
           JOIN usuarios u ON u.id = i.remitente_id
          WHERE i.destinatario_id = $1 AND i.estado = 'pendiente'
          ORDER BY i.fecha DESC`,
        [usuarioId]
    );
    return resultado.rows;
}

// CU-25 y CU-26: acepta o rechaza una invitación pendiente del usuario.
// Al aceptar, lo suma como participante. Devuelve false si la invitación
// no existe, es de otra persona o ya fue respondida.
async function responder(invitacionId, usuarioId, aceptar) {
    return enTransaccion(async (cliente) => {
        const resultado = await cliente.query(
            `UPDATE invitaciones_chat SET estado = $3
              WHERE id = $1 AND destinatario_id = $2 AND estado = 'pendiente'
              RETURNING chat_id`,
            [invitacionId, usuarioId, aceptar ? 'aceptada' : 'rechazada']
        );
        if (resultado.rows.length === 0) return false;

        if (aceptar) {
            await cliente.query(
                `INSERT INTO chat_participantes (chat_id, usuario_id) VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [resultado.rows[0].chat_id, usuarioId]
            );
        }
        return true;
    });
}

module.exports = { usuariosValidos, crearChat, misChats, invitacionesPendientes, responder };

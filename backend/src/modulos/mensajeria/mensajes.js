// Consultas SQL de los mensajes de un chat (RF-17).
// La tabla mensajes exige que el autor sea participante del chat (clave foránea a chat_participantes).
const pool = require('../../config/dbPostgre');

// Cuántos mensajes se muestran al abrir un chat (los más recientes).
const HISTORIAL = 100;

// Indica si el usuario participa en el chat (aceptó la invitación o lo creó).
async function esParticipante(chatId, usuarioId) {
    const r = await pool.query(
        'SELECT 1 FROM chat_participantes WHERE chat_id = $1 AND usuario_id = $2',
        [chatId, usuarioId]
    );
    return r.rows.length > 0;
}

// Últimos mensajes del chat, del más antiguo al más nuevo, con el nombre del autor.
async function listar(chatId) {
    const r = await pool.query(
        `SELECT * FROM (
             SELECT m.id, m.chat_id, m.autor_id, u.nombre AS autor, m.contenido, m.fecha_envio
               FROM mensajes m
               LEFT JOIN usuarios u ON u.id = m.autor_id
              WHERE m.chat_id = $1
              ORDER BY m.fecha_envio DESC, m.id DESC
              LIMIT $2) recientes
          ORDER BY fecha_envio, id`,
        [chatId, HISTORIAL]
    );
    return r.rows;
}

// Guarda un mensaje y lo devuelve con el nombre del autor (para mostrarlo a los demás).
async function crear(chatId, autorId, contenido) {
    const r = await pool.query(
        `WITH nuevo AS (
             INSERT INTO mensajes (chat_id, autor_id, contenido) VALUES ($1, $2, $3)
             RETURNING id, chat_id, autor_id, contenido, fecha_envio)
         SELECT n.*, u.nombre AS autor FROM nuevo n JOIN usuarios u ON u.id = n.autor_id`,
        [chatId, autorId, contenido]
    );
    return r.rows[0];
}

module.exports = { esParticipante, listar, crear };

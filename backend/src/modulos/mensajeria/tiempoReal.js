// Mensajes en tiempo real (RF-17) con Socket.IO, como en el diagrama de despliegue.
// El cliente envía los mensajes por la API (POST /api/chats/:id/mensajes), que valida y guarda;
// Socket.IO solo reparte cada mensaje nuevo a quienes tienen ese chat abierto.
// Cada chat es una «sala» (chat:ID) y solo puede unirse quien participa en él.
const { Server } = require('socket.io');
const { revisarToken } = require('../../middlewares/auth');
const { leerId } = require('../../utils/validar');
const { esParticipante } = require('./mensajes');

let io = null;

function iniciar(servidorHttp) {
    io = new Server(servidorHttp, { serveClient: false });

    // Al conectarse, el cliente manda su token: mismas reglas que la API (cuenta existente y activa).
    io.use(async (socket, next) => {
        try {
            const resultado = await revisarToken(String((socket.handshake.auth || {}).token || ''));
            if (resultado.error) return next(new Error(resultado.error));
            socket.data.usuario = resultado.usuario;
            next();
        } catch {
            next(new Error('No se pudo verificar la sesión.'));
        }
    });

    io.on('connection', (socket) => {
        // Abrir un chat: se une a su sala solo si participa (RNF-02). Responde { ok } si se pide.
        socket.on('unirse', async (chatId, responder) => {
            const id = leerId(chatId);
            let ok = false;
            try {
                ok = Boolean(id) && await esParticipante(id, socket.data.usuario.id);
            } catch { ok = false; }
            if (ok) socket.join(`chat:${id}`);
            if (typeof responder === 'function') responder({ ok });
        });
        // Cerrar o cambiar de chat: deja de recibir sus mensajes.
        socket.on('salir', (chatId) => {
            const id = leerId(chatId);
            if (id) socket.leave(`chat:${id}`);
        });
    });
    return io;
}

// Envía un mensaje recién guardado a todos los que tienen el chat abierto.
function repartir(mensaje) {
    if (io) io.to(`chat:${mensaje.chat_id}`).emit('mensaje', mensaje);
}

module.exports = { iniciar, repartir };

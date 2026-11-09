// Ejecuta varias consultas como una sola unidad: o se guardan todas o ninguna.
const pool = require('../config/dbPostgre');

// "trabajo" es una función que recibe el cliente y hace las consultas con él.
async function enTransaccion(trabajo) {
    const cliente = await pool.connect();      // una conexión exclusiva para la transacción
    try {
        await cliente.query('BEGIN');
        const resultado = await trabajo(cliente);
        await cliente.query('COMMIT');          // todo salió bien: se guarda
        return resultado;
    } catch (error) {
        await cliente.query('ROLLBACK');        // algo falló: se deshace todo
        throw error;
    } finally {
        cliente.release();                      // devuelve la conexión al pool
    }
}

module.exports = enTransaccion;

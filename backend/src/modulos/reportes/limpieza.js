// RF-12: elimina de forma permanente lo deshabilitado que no se apeló dentro del plazo.
const pool = require('../../config/dbPostgre');
const enTransaccion = require('../../utils/transaccion');
const { OBJETIVOS, registrar } = require('./modelo');
const { PLAZO_APELACION_DIAS } = require('../../config/moderacion');

const UNA_HORA = 60 * 60 * 1000;

// ids deshabilitados hace más del plazo y sin apelación desde que se deshabilitaron.
async function buscarVencidos(tipo) {
    const { tabla, apelacion } = OBJETIVOS[tipo];
    const resultado = await pool.query(
        `SELECT t.id FROM ${tabla} t
          WHERE t.estado = 'deshabilitada'
            AND now() > t.deshabilitado_en + make_interval(days => $1)
            AND NOT EXISTS (SELECT 1 FROM apelaciones a
                             WHERE a.${apelacion} = t.id AND a.creado_en >= t.deshabilitado_en)`,
        [PLAZO_APELACION_DIAS]
    );
    return resultado.rows.map((fila) => fila.id);
}

// Elimina cada vencido en su propia transacción: primero lo anota en la bitácora y luego lo borra.
// Si uno falla (por ejemplo, un docente con cursos), se informa y se sigue con los demás.
async function eliminarVencidos() {
    let eliminados = 0;
    for (const tipo of Object.keys(OBJETIVOS)) {
        for (const id of await buscarVencidos(tipo)) {
            try {
                await enTransaccion(async (cliente) => {
                    await registrar(cliente, tipo, id, 'eliminar', 'sistema');
                    await cliente.query(`DELETE FROM ${OBJETIVOS[tipo].tabla} WHERE id = $1`, [id]);
                });
                eliminados++;
            } catch (error) {
                console.error(`Moderación: no se pudo eliminar ${tipo} ${id}:`, error.message);
            }
        }
    }
    return eliminados;
}

// Revisa una vez al iniciar el servidor y luego cada hora.
function programar() {
    const revisar = () => eliminarVencidos().catch((error) => console.error('Moderación:', error.message));
    revisar();
    return setInterval(revisar, UNA_HORA);
}

module.exports = { eliminarVencidos, programar };

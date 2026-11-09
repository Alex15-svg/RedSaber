// Consultas SQL de guías prácticas (RF-11).
// Una guía es una publicación de tipo «guia» más una fila en la tabla guias.
const pool = require('../../config/dbPostgre');
const enTransaccion = require('../../utils/transaccion');

const CAMPOS = `p.id, p.autor_id, u.nombre AS autor, p.titulo, p.carrera, p.asignatura, p.seccion,
                p.descripcion, g.con_solucion, g.verificada, p.creado_en, p.actualizado_en`;

// Crea la publicación y su fila de guía en una sola transacción.
// verificada = true: solo un docente llega a esta función (la ruta lo exige),
// así que la marca de verificación queda reservada a las guías docentes.
async function crear(autorId, datos, conSolucion) {
    const id = await enTransaccion(async (cliente) => {
        const resultado = await cliente.query(
            `INSERT INTO publicaciones (autor_id, tipo, titulo, carrera, asignatura, seccion, descripcion)
             VALUES ($1, 'guia', $2, $3, $4, $5, $6)
             RETURNING id`,
            [autorId, datos.titulo, datos.carrera, datos.asignatura, datos.seccion, datos.descripcion]
        );
        const nuevaId = resultado.rows[0].id;
        await cliente.query(
            'INSERT INTO guias (publicacion_id, con_solucion, verificada) VALUES ($1, $2, true)',
            [nuevaId, conSolucion]
        );
        return nuevaId;
    });
    return buscar(id);
}

// Una guía con sus datos de publicación, o null si no existe.
async function buscar(id) {
    const resultado = await pool.query(
        `SELECT ${CAMPOS}
           FROM guias g
           JOIN publicaciones p ON p.id = g.publicacion_id
           JOIN usuarios u      ON u.id = p.autor_id
          WHERE g.publicacion_id = $1`,
        [id]
    );
    return resultado.rows[0] || null;
}

// Guías activas, de la más nueva a la más antigua. Filtro opcional por carrera.
async function listar(carrera) {
    const resultado = await pool.query(
        `SELECT ${CAMPOS}
           FROM guias g
           JOIN publicaciones p ON p.id = g.publicacion_id
           JOIN usuarios u      ON u.id = p.autor_id
          WHERE p.estado = 'activa' AND ($1::text IS NULL OR p.carrera = $1)
          ORDER BY p.creado_en DESC`,
        [carrera]
    );
    return resultado.rows;
}

// Indica si la guía ya incluye su solución.
async function cambiarSolucion(id, conSolucion) {
    await pool.query('UPDATE guias SET con_solucion = $2 WHERE publicacion_id = $1', [id, conSolucion]);
    await pool.query('UPDATE publicaciones SET actualizado_en = now() WHERE id = $1', [id]);
}

module.exports = { crear, buscar, listar, cambiarSolucion };

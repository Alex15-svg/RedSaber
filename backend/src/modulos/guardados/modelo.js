// Consultas SQL de la lista privada de guardados del perfil (RF-08).
const pool = require('../../config/dbPostgre');

// Lo que se puede guardar. Funciona como lista blanca para los nombres de tablas y columnas.
// "existe" comprueba que el elemento exista y esté disponible antes de guardarlo.
const TIPOS = {
    publicaciones: {
        tabla: 'publicaciones_guardadas',
        columna: 'publicacion_id',
        existe: "SELECT 1 FROM publicaciones WHERE id = $1 AND estado = 'activa'"
    },
    documentos: {
        tabla: 'documentos_guardados',
        columna: 'documento_id',
        existe: 'SELECT 1 FROM documentos WHERE id = $1'
    }
};

async function existe(tipo, id) {
    const resultado = await pool.query(TIPOS[tipo].existe, [id]);
    return resultado.rowCount === 1;
}

// Guarda un elemento. Si ya estaba guardado, no hace nada (no se duplica).
async function guardar(usuarioId, tipo, id) {
    const { tabla, columna } = TIPOS[tipo];

    // Los guardados cuelgan del perfil: si el usuario aún no tiene perfil, se crea vacío.
    await pool.query(
        'INSERT INTO perfiles (usuario_id) VALUES ($1) ON CONFLICT (usuario_id) DO NOTHING',
        [usuarioId]
    );
    await pool.query(
        `INSERT INTO ${tabla} (usuario_id, ${columna}) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [usuarioId, id]
    );
}

// Quita un elemento de la lista. Devuelve false si no estaba guardado.
async function quitar(usuarioId, tipo, id) {
    const { tabla, columna } = TIPOS[tipo];
    const resultado = await pool.query(
        `DELETE FROM ${tabla} WHERE usuario_id = $1 AND ${columna} = $2`,
        [usuarioId, id]
    );
    return resultado.rowCount === 1;
}

// Lista privada: solo se consulta con el id del usuario de la sesión (RNF-02).
// No muestra publicaciones deshabilitadas por moderación.
async function listar(usuarioId) {
    const publicaciones = await pool.query(
        `SELECT p.id, p.tipo, p.titulo, p.carrera, p.asignatura, g.guardado_en
           FROM publicaciones_guardadas g
           JOIN publicaciones p ON p.id = g.publicacion_id
          WHERE g.usuario_id = $1 AND p.estado = 'activa'
          ORDER BY g.guardado_en DESC`,
        [usuarioId]
    );
    const documentos = await pool.query(
        `SELECT d.id, d.titulo, d.area, d.archivo_url, g.guardado_en
           FROM documentos_guardados g
           JOIN documentos d ON d.id = g.documento_id
          WHERE g.usuario_id = $1
          ORDER BY g.guardado_en DESC`,
        [usuarioId]
    );
    return { publicaciones: publicaciones.rows, documentos: documentos.rows };
}

module.exports = { TIPOS, existe, guardar, quitar, listar };

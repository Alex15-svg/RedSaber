// Consultas SQL de búsqueda (RF-09): publicaciones, usuarios y ejercicios,
// filtrables por etiqueta de carrera.
const pool = require('../../config/dbPostgre');

// Convierte el texto buscado en un patrón para ILIKE ("contiene", sin distinguir mayúsculas).
// Los comodines % y _ del usuario se escapan para que se busquen como texto normal.
const patron = (texto) => `%${texto.replace(/[\\%_]/g, (c) => '\\' + c)}%`;

// Etiquetas de carrera disponibles para el filtro: las de usuarios y las de publicaciones.
async function carreras() {
    const resultado = await pool.query(
        `SELECT carrera FROM usuarios WHERE carrera IS NOT NULL
         UNION
         SELECT carrera FROM publicaciones
         ORDER BY carrera`
    );
    return resultado.rows.map((fila) => fila.carrera);
}

// Publicaciones activas. Cada filtro en null no se aplica ("$1 IS NULL OR ...").
// tipo «guia» = ejercicios (guías prácticas de los docentes).
// La descripción se recorta a 400 caracteres: alcanza para la vista previa del listado.
async function publicaciones({ q, carrera, tipo }) {
    const resultado = await pool.query(
        `SELECT p.id, p.tipo, p.titulo, LEFT(p.descripcion, 400) AS descripcion, p.carrera, p.asignatura,
                p.seccion, p.creado_en, p.autor_id, u.nombre AS autor, u.ocupacion AS autor_ocupacion,
                COALESCE(g.verificada, false) AS verificada, g.con_solucion
           FROM publicaciones p
           JOIN usuarios u    ON u.id = p.autor_id
           LEFT JOIN guias g  ON g.publicacion_id = p.id
          WHERE p.estado = 'activa'
            AND ($1::text IS NULL OR p.titulo ILIKE $1 OR p.descripcion ILIKE $1 OR p.asignatura ILIKE $1)
            AND ($2::text IS NULL OR p.carrera = $2)
            AND ($3::text IS NULL OR p.tipo = $3)
          ORDER BY p.creado_en DESC
          LIMIT 50`,
        [q ? patron(q) : null, carrera, tipo]
    );
    return resultado.rows;
}

// Usuarios activos. El correo solo se muestra si su dueño lo hizo público (RF-05, RF-18).
async function usuarios({ q, carrera }) {
    const resultado = await pool.query(
        `SELECT id, nombre, carrera, ocupacion,
                CASE WHEN correo_publico THEN correo_institucional END AS correo
           FROM usuarios
          WHERE estado = 'activa'
            AND ($1::text IS NULL OR nombre ILIKE $1)
            AND ($2::text IS NULL OR carrera = $2)
          ORDER BY nombre
          LIMIT 50`,
        [q ? patron(q) : null, carrera]
    );
    return resultado.rows;
}

module.exports = { carreras, publicaciones, usuarios };

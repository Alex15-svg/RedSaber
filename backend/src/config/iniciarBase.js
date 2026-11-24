// Prepara la base al iniciar el servidor (por ejemplo, en Render):
// - Si está vacía (no existe la tabla usuarios), crea todas las tablas de tablas.sql.
// - Si ya tiene tablas, solo agrega lo que falte de versiones nuevas. Nunca borra ni modifica datos.
const fs = require('fs');
const path = require('path');
const pool = require('./dbPostgre');

// Cambios posteriores a la primera versión de tablas.sql. Cada uno se puede ejecutar más de una vez.
const ACTUALIZACIONES = [
    // Los PDF se guardan en la base para no perderlos cuando el servidor reinicia (RF-10).
    'ALTER TABLE documentos ADD COLUMN IF NOT EXISTS contenido BYTEA'
];

async function iniciarBase() {
    const r = await pool.query("SELECT to_regclass('public.usuarios') AS tabla");
    if (!r.rows[0].tabla) {
        const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'tablas.sql'), 'utf8');
        await pool.query(sql); // tablas.sql trae su propio BEGIN y COMMIT
        console.log('Base vacía: se crearon las tablas de tablas.sql.');
        return true;
    }
    for (const sql of ACTUALIZACIONES) await pool.query(sql);
    return false;
}

module.exports = iniciarBase;

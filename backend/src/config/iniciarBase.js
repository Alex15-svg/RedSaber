// Crea las tablas la primera vez que el servidor se conecta a una base vacía (por ejemplo, en Render).
// Si la tabla usuarios ya existe, no hace nada: nunca borra ni modifica datos.
const fs = require('fs');
const path = require('path');
const pool = require('./dbPostgre');

async function iniciarBase() {
    const r = await pool.query("SELECT to_regclass('public.usuarios') AS tabla");
    if (r.rows[0].tabla) return false;

    const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'tablas.sql'), 'utf8');
    await pool.query(sql); // tablas.sql trae su propio BEGIN y COMMIT
    console.log('Base vacía: se crearon las tablas de tablas.sql.');
    return true;
}

module.exports = iniciarBase;

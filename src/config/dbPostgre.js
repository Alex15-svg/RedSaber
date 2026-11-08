// Trae la clase Pool del módulo pg para manejar la conexión a la base de datos PostgreSQL.
const { Pool } = require('pg');


// Configuración de la conexión a la base de datos PostgreSQL.
// Los datos se leen del archivo .env (ver .env.example): así cada integrante usa
// su propia contraseña y nombre de base, y la contraseña no se sube a GitHub.
const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    max: 15,                        // conexiones abiertas como máximo
    idleTimeoutMillis: 10000,       // cierra una conexión sin uso después de 10 s
    connectionTimeoutMillis: 30000  // espera máxima para conseguir una conexión
});


// exporta la instancia de Pool para que pueda ser utilizada en otros módulos de la aplicación.
module.exports = pool;

// Trae la clase Pool del módulo pg para manejar la conexión a la base de datos PostgreSQL.
const { Pool } = require('pg');


// Opciones comunes del grupo de conexiones.
const opciones = {
    max: 15,                        // conexiones abiertas como máximo
    idleTimeoutMillis: 10000,       // cierra una conexión sin uso después de 10 s
    connectionTimeoutMillis: 30000  // espera máxima para conseguir una conexión
};

// En la nube (Render) la conexión llega en una sola variable: DATABASE_URL.
// PGSSL=true activa el cifrado (necesario si se usa la URL externa de la base).
// En local se usan los datos separados del archivo .env (ver .env.example):
// así cada integrante usa su propia contraseña y la contraseña no se sube a GitHub.
const conexion = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
    }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE
    };

const pool = new Pool({ ...conexion, ...opciones });


// exporta la instancia de Pool para que pueda ser utilizada en otros módulos de la aplicación.
module.exports = pool;

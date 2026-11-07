// Trae la clase Pool del módulo pg para manejar la conexión a la base de datos PostgreSQL.
const { Pool } = require('pg');


// Configuración de la conexión a la base de datos PostgreSQL
const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: '123456',
    database: 'redSaber',
    port: 5432,
    dialect: 'postgres', 
    pool: {
        maxConnection: 15,
        minConnection: 0,
        acquire: 30000,
        idle: 10000
    }
});


// exporta la instancia de Pool para que pueda ser utilizada en otros módulos de la aplicación.
module.exports = pool;


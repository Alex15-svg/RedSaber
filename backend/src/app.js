// Lee backend/.env (debe ir antes que todo lo demás). La ruta es fija para que funcione desde cualquier carpeta.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
const express = require('express'); // Módulo de Express para crear la aplicación web.
const app = express(); // Crea una instancia de la aplicación Express.
const PORT=3000; // Define el puerto en el que se ejecutará el servidor.
const path = require('path'); // Módulo path para trabajar con rutas de archivos//directorios.
const validator = require('validator'); // Módulo validator para validar y sanitizar datos de entrada (usado actualmente en validar correo institucional.)
const pool = require('./config/dbPostgre'); // Importa la configuración de la base de datos PostgreSQL desde el archivo dbPostgre.js.





// Middleware(s) para parsear el cuerpo de las solicitudes.
app.use(express.json());


pool.query('SELECT NOW()')
  .then(r => console.log('Conectado:', r.rows[0]))
  .catch(e => console.error('Error:', e.message));




app.get('/', (req, res) => {
    res.redirect('/app');
});

app.listen(PORT, () => {
    console.log(`REDSABER`);
    console.log(`**Servidor corriendo en el puerto: http://localhost:${PORT}**`);
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rutas de la API: RF-05 a RF-08, RF-16 y RF-17.
app.use('/api/perfil', require('./modulos/perfil/rutas'));
app.use('/api/publicaciones', require('./modulos/publicaciones/rutas'));
app.use('/api/guardados', require('./modulos/guardados/rutas'));
app.use('/api/talleres', require('./modulos/talleres/rutas'));
app.use('/api/chats', require('./modulos/mensajeria/rutas'));
app.use('/api/cuentas', require('./modulos/cuentas/rutas'));
app.use('/api/cursos', require('./modulos/cursos/rutas'));
app.use('/api/moderacion', require('./modulos/moderacion/rutas')); // RF-13: revisión de apelaciones

// Rutas de la API: RF-09 a RF-12.
app.use('/api/buscar', require('./modulos/busqueda/rutas'));
app.use('/api/documentos', require('./modulos/documentos/rutas'));
app.use('/api/guias', require('./modulos/guias/rutas'));
app.use('/api/moderacion', require('./modulos/reportes/rutas')); // RF-12: reportes y apelaciones

// RF-12: elimina cada hora lo deshabilitado que no se apeló dentro del plazo.
require('./modulos/reportes/limpieza').programar();

// Imágenes de perfil subidas por los usuarios (RF-05).
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Interfaz web en React: se abre en http://localhost:3000/app
// Sirve la versión compilada (frontend/dist), que se genera con «npm run build» en la carpeta frontend.
app.use('/app', express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));


// Manejador de errores: siempre debe ir al final, después de todas las rutas.
app.use(require('./middlewares/errores'));


require('dotenv').config({ quiet: true }); // Lee el archivo .env (debe ir antes que todo lo demás).
const express = require('express'); // Módulo de Express para crear la aplicación web.
const app = express(); // Crea una instancia de la aplicación Express.
const PORT=3000; // Define el puerto en el que se ejecutará el servidor.
const path = require('path'); // Módulo path para trabajar con rutas de archivos//directorios.
const validator = require('validator'); // Módulo validator para validar y sanitizar datos de entrada (usado actualmente en validar correo institucional.)
const pool = require('./config/dbPostgre'); // Importa la configuración de la base de datos PostgreSQL desde el archivo dbPostgre.js.





// Middleware(s) para parsear el cuerpo de las solicitudes.
app.use(express.json());

// 
pool.query('SELECT NOW()')
  .then(r => console.log('Conectado:', r.rows[0]))
  .catch(e => console.error('Error:', e.message));

app.listen(3000, () => console.log('Servidor en http://localhost:3000'));


app.get('/', (req, res) => {
    res.send('>> Hola mundo desde Express <<')
});

app.listen(PORT, () => {
    console.log(`**Servidor corriendo en el puerto: ${PORT}**`);
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rutas de la API: RF-05 a RF-08, RF-16 y RF-17.
app.use('/api/perfil', require('./modulos/perfil/rutas'));
app.use('/api/publicaciones', require('./modulos/publicaciones/rutas'));
app.use('/api/guardados', require('./modulos/guardados/rutas'));
app.use('/api/talleres', require('./modulos/talleres/rutas'));
app.use('/api/chats', require('./modulos/mensajeria/rutas'));

// Imágenes de perfil subidas por los usuarios (RF-05).
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));



// Ruta para mostrar el formulario html.
app.get(/formulario/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'formulario.html'));
});



// Procesar formulario.
app.post('/procesar-formulario', (req, res) => {
    const { correo,passwd } = req.body;

// Validaciones de formulario
    // Define el formato a validar de correo institucional.
    const correoValido = validator.isEmail(correo) && correo.endsWith('@inacapmail.cl');

    // Validar campos y correo institucional (mínimo 6 caracteres).
    const errors = [];
    if (!passwd || passwd.length < 6) {
        errors.push('La contraseña debe tener al menos 6 caracteres.');
    }
    if (!correo || !passwd) {
        errors.push('Todos los campos son obligatorios.');
    }
    if (!correoValido) {
        errors.push('El correo debe ser un correo institucional válido.');
    }
});

// Manejador de errores: siempre debe ir al final, después de todas las rutas.
app.use(require('./middlewares/errores'));


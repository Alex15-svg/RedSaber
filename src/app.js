const express = require('express'); // Módulo de Express para crear la aplicación web.
const app = express(); // Crea una instancia de la aplicación Express.
const PORT=3000; // Define el puerto en el que se ejecutará el servidor.
const path = require('path'); // Módulo path para trabajar con rutas de archivos//directorios.
const validator = require('validator'); // Módulo validator para validar y sanitizar datos de entrada (usado actualmente en validar correo institucional.)


// Middleware(s) para parsear el cuerpo de las solicitudes.
app.use(express.json());


app.get('/', (req, res) => {
    res.send('>> Hola mundo desde Express <<')
});

app.listen(PORT, () => {
    console.log(`**Servidor corriendo en el puerto: ${PORT}**`);
});

s.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



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


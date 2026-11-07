const express = require('express');
const session = require('express-session');
const path = require('path');




const app = express();

// Configuración de la sesión


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

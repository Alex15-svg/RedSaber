// Lógica de búsqueda (RF-09).
// Ejemplo: GET /api/buscar?q=sql&carrera=Ingeniería en Informática&en=publicaciones&tipo=guia
const modelo = require('./modelo');
const { textoOpcional } = require('../../utils/validar');

const DONDE = ['todo', 'publicaciones', 'usuarios'];
const TIPOS = ['pregunta', 'solucion', 'guia', 'publicacion'];

async function buscar(req, res) {
    const q = textoOpcional(req.query.q, 100);
    const carrera = textoOpcional(req.query.carrera, 120);
    const en = textoOpcional(req.query.en, 20) || 'todo';
    const tipo = textoOpcional(req.query.tipo, 20);

    if (!DONDE.includes(en)) {
        return res.status(400).json({ error: 'El parámetro "en" debe ser todo, publicaciones o usuarios.' });
    }
    if (tipo && !TIPOS.includes(tipo)) {
        return res.status(400).json({ error: 'El parámetro "tipo" debe ser pregunta, solucion, guia (ejercicios) o publicacion.' });
    }

    // Solo se consulta lo pedido; lo demás vuelve como lista vacía.
    const resultado = { publicaciones: [], usuarios: [] };
    if (en !== 'usuarios') resultado.publicaciones = await modelo.publicaciones({ q, carrera, tipo });
    if (en !== 'publicaciones') resultado.usuarios = await modelo.usuarios({ q, carrera });
    res.json(resultado);
}

// Lista de etiquetas de carrera para armar el filtro en la interfaz.
async function carreras(req, res) {
    res.json(await modelo.carreras());
}

module.exports = { buscar, carreras };

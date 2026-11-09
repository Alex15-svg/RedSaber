// Lógica de publicaciones: publicar dudas o soluciones (RF-06)
// y editar o borrar solo las propias (RF-07).
const modelo = require('./modelo');
const { leerId, revisarTextos } = require('../../utils/validar');

// Largo máximo de cada campo (coincide con las columnas de tablas.sql).
const LIMITES = { titulo: 200, carrera: 120, asignatura: 120, seccion: 30, descripcion: 5000 };
const TIPOS = ['pregunta', 'solucion'];

// Valida los textos y los devuelve sin espacios sobrantes al inicio y al final.
function leerDatos(cuerpo) {
    const errores = revisarTextos(cuerpo, LIMITES);
    const datos = {};
    for (const campo of Object.keys(LIMITES)) {
        if (typeof cuerpo[campo] === 'string') {
            datos[campo] = cuerpo[campo].trim();
        }
    }
    return { errores, datos };
}

// Busca la publicación de la URL y comprueba que sea del usuario.
// Si algo falla, responde el error y devuelve null.
async function buscarPropia(req, res) {
    const id = leerId(req.params.id);
    const publicacion = id ? await modelo.buscarDueno(id) : null;

    if (!publicacion) {
        res.status(404).json({ error: 'La publicación no existe.' });
        return null;
    }
    if (publicacion.autor_id !== req.usuario.id) {
        res.status(403).json({ error: 'Solo puedes modificar tus propias publicaciones.' });
        return null;
    }
    return { id, estado: publicacion.estado };
}

// RF-06: un estudiante publica una pregunta o la solución de un ejercicio.
async function crear(req, res) {
    const cuerpo = req.body || {};
    const { errores, datos } = leerDatos(cuerpo);

    if (!TIPOS.includes(cuerpo.tipo)) {
        errores.push('El campo "tipo" debe ser "pregunta" o "solucion".');
    }
    if (errores.length) {
        return res.status(400).json({ error: errores.join(' ') });
    }

    datos.tipo = cuerpo.tipo;
    const publicacion = await modelo.crear(req.usuario.id, datos);
    res.status(201).json(publicacion);
}

// RF-07: lista de mis publicaciones, para elegir cuál editar o borrar desde el perfil.
async function listarMias(req, res) {
    res.json(await modelo.listarDeAutor(req.usuario.id));
}

// RF-07: editar una publicación propia.
async function editar(req, res) {
    const publicacion = await buscarPropia(req, res);
    if (!publicacion) return;

    if (publicacion.estado === 'deshabilitada') {
        return res.status(409).json({ error: 'La publicación está deshabilitada por moderación y no se puede editar.' });
    }

    const { errores, datos } = leerDatos(req.body || {});
    if (errores.length) {
        return res.status(400).json({ error: errores.join(' ') });
    }

    res.json(await modelo.editar(publicacion.id, datos));
}

// RF-07: borrar una publicación propia.
async function borrar(req, res) {
    const publicacion = await buscarPropia(req, res);
    if (!publicacion) return;

    await modelo.borrar(publicacion.id);
    res.status(204).end(); // 204: se borró y no hay nada que devolver
}

module.exports = { crear, listarMias, editar, borrar };

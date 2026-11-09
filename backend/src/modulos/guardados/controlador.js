// Lógica de la lista privada de guardados (RF-08): publicaciones y documentos.
const modelo = require('./modelo');
const { leerId, esOpcion } = require('../../utils/validar');

// Lee y valida :tipo y :id de la URL. Si algo falla, responde el error y devuelve null.
function leerParametros(req, res) {
    const { tipo } = req.params;
    const id = leerId(req.params.id);

    if (!esOpcion(modelo.TIPOS, tipo)) {
        res.status(400).json({ error: 'El tipo debe ser "publicaciones" o "documentos".' });
        return null;
    }
    if (!id) {
        res.status(400).json({ error: 'El id no es válido.' });
        return null;
    }
    return { tipo, id };
}

async function listar(req, res) {
    res.json(await modelo.listar(req.usuario.id));
}

async function guardar(req, res) {
    const elegido = leerParametros(req, res);
    if (!elegido) return;

    if (!(await modelo.existe(elegido.tipo, elegido.id))) {
        return res.status(404).json({ error: 'No existe o ya no está disponible.' });
    }

    await modelo.guardar(req.usuario.id, elegido.tipo, elegido.id);
    res.status(201).json({ tipo: elegido.tipo, id: elegido.id, guardado: true });
}

async function quitar(req, res) {
    const elegido = leerParametros(req, res);
    if (!elegido) return;

    const estaba = await modelo.quitar(req.usuario.id, elegido.tipo, elegido.id);
    if (!estaba) {
        return res.status(404).json({ error: 'Ese elemento no estaba en tu lista de guardados.' });
    }
    res.status(204).end();
}

module.exports = { listar, guardar, quitar };

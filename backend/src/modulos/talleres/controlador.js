// Lógica de talleres (RF-16): mostrar los talleres con inscritos y capacidad.
const modelo = require('./modelo');

async function listar(req, res) {
    const talleres = await modelo.listar();

    // CU-23, flujo alternativo: la sede no tiene talleres disponibles.
    if (talleres.length === 0) {
        return res.json({ talleres, mensaje: 'No hay talleres disponibles en la sede.' });
    }
    res.json({ talleres });
}

module.exports = { listar };

// Lógica de guías prácticas (RF-11): los docentes publican guías permanentes,
// con o sin solución, que llevan la marca de verificación.
// Editar o borrar el texto de una guía usa las rutas de publicaciones (RF-07).
const modelo = require('./modelo');
const { leerId, leerPublicacion, textoOpcional } = require('../../utils/validar');

// POST /api/guias  Cuerpo: titulo, carrera, asignatura, seccion, descripcion y con_solucion (opcional).
async function crear(req, res) {
    const cuerpo = req.body || {};
    const { errores, datos } = leerPublicacion(cuerpo);

    const conSolucion = cuerpo.con_solucion === undefined ? false : cuerpo.con_solucion;
    if (typeof conSolucion !== 'boolean') {
        errores.push('El campo "con_solucion" debe ser true o false.');
    }
    if (errores.length) {
        return res.status(400).json({ error: errores.join(' ') });
    }

    const guia = await modelo.crear(req.usuario.id, datos, conSolucion);
    res.status(201).json(guia);
}

// GET /api/guias?carrera=...
async function listar(req, res) {
    res.json(await modelo.listar(textoOpcional(req.query.carrera, 120)));
}

// PATCH /api/guias/:id/solucion  Cuerpo: { "con_solucion": true }. Solo el autor.
async function cambiarSolucion(req, res) {
    const id = leerId(req.params.id);
    const guia = id ? await modelo.buscar(id) : null;
    const { con_solucion: conSolucion } = req.body || {};

    if (!guia) {
        return res.status(404).json({ error: 'La guía no existe.' });
    }
    if (guia.autor_id !== req.usuario.id) {
        return res.status(403).json({ error: 'Solo el docente que publicó la guía puede modificarla.' });
    }
    if (typeof conSolucion !== 'boolean') {
        return res.status(400).json({ error: 'Indica "con_solucion": true o false.' });
    }

    await modelo.cambiarSolucion(id, conSolucion);
    res.json(await modelo.buscar(id));
}

module.exports = { crear, listar, cambiarSolucion };

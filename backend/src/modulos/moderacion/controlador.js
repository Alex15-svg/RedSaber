const modelo = require('./modelo');
const { leerId } = require('../../utils/validar');

async function listarApelaciones(req, res) {
  try {
    res.json(await modelo.listarPendientes());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
}

async function rehabilitar(req, res) {
  try {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Id no válido' });

    const apelacion = await modelo.rehabilitar(id, req.usuario.id);
    if (!apelacion)
      return res.status(404).json({ error: 'Apelación no encontrada o ya resuelta' });

    res.json({ mensaje: 'Apelación aceptada y caso rehabilitado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
}

async function rechazar(req, res) {
  try {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Id no válido' });

    const apelacion = await modelo.rechazar(id, req.usuario.id);
    if (!apelacion)
      return res.status(404).json({ error: 'Apelación no encontrada o ya resuelta' });

    res.json({ mensaje: 'Apelación rechazada: se eliminará al vencer el plazo' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { listarApelaciones, rehabilitar, rechazar };
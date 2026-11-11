const modelo = require('./modelo');
const { leerId, revisarTextos } = require('../../utils/validar');

function falla(res, e) {
  console.error(e);
  res.status(500).json({ error: 'Error interno' });
}

// RF-14: un estudiante forma un grupo y solicita un curso a un docente
async function solicitar(req, res) {
  try {
    const b = req.body || {};
    const errores = revisarTextos(b, { nombreGrupo: 120, nombre: 200, objetivo: 1000 });
    const docenteId = leerId(b.docenteId);
    if (!docenteId) errores.push('docenteId no es válido.');
    const correos = Array.isArray(b.correos) ? b.correos.filter((x) => typeof x === 'string') : [];
    if (errores.length) return res.status(400).json({ error: errores.join(' ') });

    const r = await modelo.crearSolicitud({
      solicitanteId: req.usuario.id,
      nombreGrupo: b.nombreGrupo.trim(),
      correos,
      docenteId,
      nombre: b.nombre.trim(),
      objetivo: b.objetivo.trim()
    });
    if (r.error) return res.status(400).json({ error: r.error });
    res.status(201).json({ mensaje: 'Solicitud enviada al docente', cursoId: r.cursoId });
  } catch (e) { falla(res, e); }
}

// RF-14: el docente ve las solicitudes recibidas
async function solicitudes(req, res) {
  try { res.json(await modelo.solicitudesDelDocente(req.usuario.id)); } catch (e) { falla(res, e); }
}

// RF-15: mis cursos con interesados e ingresados
async function misCursos(req, res) {
  try { res.json(await modelo.cursosDelDocente(req.usuario.id)); } catch (e) { falla(res, e); }
}

// RF-15: abrir / cerrar el ingreso
function cambiar(desde, hacia, mensaje) {
  return async (req, res) => {
    try {
      const id = leerId(req.params.id);
      if (!id) return res.status(400).json({ error: 'Id no válido' });
      const ok = await modelo.cambiarEstado(id, req.usuario.id, desde, hacia);
      if (!ok) return res.status(404).json({ error: `El curso no existe, no es tuyo o no está "${desde}"` });
      res.json({ mensaje });
    } catch (e) { falla(res, e); }
  };
}

// RF-15: usuarios ingresados
async function listaIngresados(req, res) {
  try {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Id no válido' });
    res.json(await modelo.ingresados(id, req.usuario.id));
  } catch (e) { falla(res, e); }
}

// Estudiante: interés e ingreso (contraparte de RF-15)
async function interes(req, res) {
  try {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Id no válido' });
    const r = await modelo.marcarInteres(id, req.usuario.id);
    if (r === 'no_existe') return res.status(404).json({ error: 'Curso no encontrado' });
    if (r === 'cerrado') return res.status(409).json({ error: 'El curso está cerrado' });
    res.json({ mensaje: 'Interés registrado' });
  } catch (e) { falla(res, e); }
}

async function ingresar(req, res) {
  try {
    const id = leerId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Id no válido' });
    const r = await modelo.ingresar(id, req.usuario.id);
    const respuestas = {
      no_existe: [404, 'Curso no encontrado'],
      no_abierto: [409, 'El ingreso a este curso no está abierto'],
      sin_cupo: [409, 'El curso no tiene cupos'],
      ya_ingresado: [409, 'Ya estás ingresado en este curso']
    };
    if (r !== 'ok') return res.status(respuestas[r][0]).json({ error: respuestas[r][1] });
    res.status(201).json({ mensaje: 'Ingresaste al curso' });
  } catch (e) { falla(res, e); }
}

module.exports = {
  solicitar, solicitudes, misCursos,
  abrir: cambiar('solicitado', 'abierto', 'Ingreso abierto'),
  cerrar: cambiar('abierto', 'cerrado', 'Curso cerrado: no entran más usuarios'),
  listaIngresados, interes, ingresar
};
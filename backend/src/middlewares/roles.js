// Uso: roles('administrador')  o  roles('docente', 'administrador')
module.exports = (...permitidos) => (req, res, next) => {
  if (!req.usuario || !permitidos.includes(req.usuario.ocupacion)) {
    return res.status(403).json({ error: 'No tienes permiso para esta acción' });
  }
  next();
};
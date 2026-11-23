// Funciones pequeñas para validar los datos que llegan del cliente.

const validator = require('validator');

// Mayor id que admite una columna INTEGER de PostgreSQL. Un id más grande daría error 500 en la base.
const ID_MAXIMO = 2147483647;

// Convierte un valor (por ejemplo, un parámetro de la URL) en un id entero positivo.
// Devuelve null si no es un id válido.
function leerId(valor) {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 && id <= ID_MAXIMO ? id : null;
}

// PostgreSQL no admite el carácter nulo (\0) en un texto: se rechaza cualquier solicitud que lo traiga,
// en el cuerpo o en la URL, con un 400 en vez de un error interno.
function tieneNulo(valor) {
    if (typeof valor === 'string') return valor.includes('\0');
    if (valor && typeof valor === 'object') return Object.values(valor).some(tieneNulo);
    return false;
}
function rechazarNulos(req, res, next) {
    if (tieneNulo(req.body) || tieneNulo(req.query)) {
        return res.status(400).json({ error: 'Los datos contienen caracteres no permitidos.' });
    }
    next();
}

// RF-01: valida los datos del registro. Exige texto en cada campo, quita los espacios sobrantes,
// revisa el correo completo (no solo su final) y no acepta contraseñas formadas solo por espacios.
function leerCuenta(cuerpo) {
    const { nombre, correo, contrasena, carrera } = cuerpo || {};
    const esTexto = (v) => typeof v === 'string';
    if (!esTexto(nombre) || !esTexto(correo) || !esTexto(contrasena) || (carrera != null && !esTexto(carrera))) {
        return { errores: ['Nombre, correo, contraseña y carrera deben ser texto.'] };
    }
    const datos = { nombre: nombre.trim(), correo: correo.trim().toLowerCase(), contrasena,
                    carrera: carrera ? carrera.trim() || null : null };
    const errores = [];
    if (!datos.nombre || !datos.correo || !contrasena) errores.push('Faltan campos obligatorios');
    else if (!validator.isEmail(datos.correo) || !datos.correo.endsWith('@inacapmail.cl')) {
        errores.push('Usa tu correo @inacapmail.cl');
    } else if (contrasena.trim().length < 8) {
        errores.push('La contraseña debe tener al menos 8 caracteres');
    } else if (Buffer.byteLength(contrasena) > 72) {
        errores.push('La contraseña admite como máximo 72 caracteres'); // bcrypt solo usa 72 bytes
    } else if (datos.nombre.length > 120 || (datos.carrera && datos.carrera.length > 120)) {
        errores.push('El nombre y la carrera admiten como máximo 120 caracteres');
    }
    return { errores, datos };
}

// Revisa que cada campo sea un texto con contenido y que no supere su largo máximo.
// limites: { nombreDelCampo: largoMaximo }. Devuelve la lista de errores (vacía si todo está bien).
function revisarTextos(datos, limites) {
    const errores = [];
    for (const [campo, maximo] of Object.entries(limites)) {
        const valor = datos[campo];
        if (typeof valor !== 'string' || valor.trim() === '') {
            errores.push(`El campo "${campo}" es obligatorio.`);
        } else if (valor.includes('\0')) {
            errores.push(`El campo "${campo}" contiene caracteres no permitidos.`);
        } else if (valor.trim().length > maximo) {
            errores.push(`El campo "${campo}" admite como máximo ${maximo} caracteres.`);
        }
    }
    return errores;
}

// Indica si "clave" es una opción propia de la lista (y no algo heredado como "constructor").
function esOpcion(lista, clave) {
    return Object.hasOwn(lista, clave);
}

// Largo máximo de cada campo de una publicación o guía (coincide con tablas.sql).
const LIMITES_PUBLICACION = { titulo: 200, carrera: 120, asignatura: 120, seccion: 30, descripcion: 5000 };

// Valida los textos de una publicación y los devuelve sin espacios sobrantes.
// Solo copia los campos esperados: cualquier otro dato del cliente se ignora.
function leerPublicacion(cuerpo) {
    const errores = revisarTextos(cuerpo, LIMITES_PUBLICACION);
    const datos = {};
    for (const campo of Object.keys(LIMITES_PUBLICACION)) {
        if (typeof cuerpo[campo] === 'string') {
            datos[campo] = cuerpo[campo].trim();
        }
    }
    return { errores, datos };
}

// Largo máximo de una publicación libre (solo texto, sin título ni etiquetas).
const LIMITE_PUBLICACION_LIBRE = 400;

// Valida una publicación libre (tipo "publicacion"): solo lleva texto.
// El resto de las columnas queda en null.
function leerPublicacionLibre(cuerpo) {
    const errores = revisarTextos(cuerpo, { descripcion: LIMITE_PUBLICACION_LIBRE });
    const descripcion = typeof cuerpo.descripcion === 'string' ? cuerpo.descripcion.trim() : '';
    return { errores, datos: { titulo: null, carrera: null, asignatura: null, seccion: null, descripcion } };
}

// Lee un texto opcional de la URL (?carrera=...). Devuelve null si viene vacío.
function textoOpcional(valor, maximo) {
    if (typeof valor !== 'string' || valor.trim() === '') return null;
    return valor.trim().slice(0, maximo);
}

module.exports = {
    leerId, revisarTextos, esOpcion, leerPublicacion, leerPublicacionLibre, textoOpcional,
    rechazarNulos, leerCuenta
};

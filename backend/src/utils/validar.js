// Funciones pequeñas para validar los datos que llegan del cliente.

// Convierte un valor (por ejemplo, un parámetro de la URL) en un id entero positivo.
// Devuelve null si no es un id válido.
function leerId(valor) {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// Revisa que cada campo sea un texto con contenido y que no supere su largo máximo.
// limites: { nombreDelCampo: largoMaximo }. Devuelve la lista de errores (vacía si todo está bien).
function revisarTextos(datos, limites) {
    const errores = [];
    for (const [campo, maximo] of Object.entries(limites)) {
        const valor = datos[campo];
        if (typeof valor !== 'string' || valor.trim() === '') {
            errores.push(`El campo "${campo}" es obligatorio.`);
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

module.exports = { leerId, revisarTextos, esOpcion, leerPublicacion, leerPublicacionLibre, textoOpcional };

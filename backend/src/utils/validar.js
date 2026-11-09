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

module.exports = { leerId, revisarTextos, esOpcion };

// Conexión con la API del backend (/api). Guarda la sesión y agrega el token a cada solicitud.
const CLAVE = 'rs-sesion';
let memoria; // copia en memoria, por si el navegador no permite guardar

// Sesión actual: { token, usuario: { id, nombre, ocupacion } } o null.
export function sesion() {
    if (memoria !== undefined) return memoria;
    try { memoria = JSON.parse(localStorage.getItem(CLAVE)); } catch { memoria = null; }
    return memoria;
}

export function guardarSesion(datos) {
    memoria = datos;
    try {
        if (datos) localStorage.setItem(CLAVE, JSON.stringify(datos));
        else localStorage.removeItem(CLAVE);
    } catch { /* sin almacenamiento: la sesión dura hasta recargar */ }
}

export const usuario = () => sesion()?.usuario || null;
const cabeceraToken = () => (sesion()?.token ? { Authorization: `Bearer ${sesion().token}` } : {});

// Hace una solicitud a la API. Devuelve los datos o lanza un Error con el mensaje del servidor.
// cuerpo puede ser un objeto (se envía como JSON) o un FormData (formularios con archivos).
export async function api(metodo, ruta, cuerpo) {
    const opciones = { method: metodo, headers: cabeceraToken() };
    if (cuerpo instanceof FormData) {
        opciones.body = cuerpo;
    } else if (cuerpo !== undefined) {
        opciones.headers['Content-Type'] = 'application/json';
        opciones.body = JSON.stringify(cuerpo);
    }

    let respuesta;
    try {
        respuesta = await fetch('/api' + ruta, opciones);
    } catch {
        throw new Error('No se pudo conectar con el servidor. Revisa que esté encendido.');
    }

    // Token vencido o inválido: se cierra la sesión y la aplicación vuelve a la bienvenida.
    if (respuesta.status === 401 && sesion()?.token) {
        guardarSesion(null);
        window.dispatchEvent(new Event('rs-sesion-vencida'));
    }
    if (respuesta.status === 204) return null;

    const esJson = (respuesta.headers.get('content-type') || '').includes('json');
    const datos = esJson ? await respuesta.json() : null;
    if (!respuesta.ok) {
        const error = new Error(datos?.error || `Error ${respuesta.status}`);
        error.status = respuesta.status;
        throw error;
    }
    return datos;
}

// Abre (vista de lectura) o descarga un PDF protegido. Se pide con el token y se entrega
// al navegador como archivo local. La ventana se abre antes de esperar, para que no la bloqueen.
export async function archivo(ruta, nombre, descargar) {
    const ventana = descargar ? null : window.open('', '_blank');
    try {
        const respuesta = await fetch('/api' + ruta, { headers: cabeceraToken() });
        if (!respuesta.ok) throw new Error('El archivo no está disponible.');
        const url = URL.createObjectURL(await respuesta.blob());
        if (ventana) {
            ventana.location.href = url;
        } else {
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = nombre;
            enlace.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
        if (ventana) ventana.close();
        throw error;
    }
}

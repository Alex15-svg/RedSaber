// Datos y funciones pequeñas que usan varias vistas.
export const ROLES = { estudiante: 'Estudiante', docente: 'Docente', administrador: 'Administración' };
export const TIPOS = { pregunta: 'Pregunta', solucion: 'Solución', guia: 'Guía docente' };
export const CARRERAS = ['Ingeniería en Informática', 'Administración', 'Electricidad', 'Construcción'];

export const iniciales = (nombre = '?') => nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
export const fecha = (f) => new Date(f).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).toUpperCase();

// Dirección de un ícono del sprite (public/img/iconos.svg), respetando la base /app/.
export const icono = (nombre) => `${import.meta.env.BASE_URL}img/iconos.svg#${nombre}`;

// Lee varios campos de un FormData como textos sin espacios sobrantes.
export const textos = (datos, nombres) => Object.fromEntries(nombres.map((n) => [n, String(datos.get(n) || '').trim()]));

// Revisa los campos obligatorios. pares: [[nombre, mensaje], ...]. marcar(nombre, mensaje) anota el error.
export function exigir(datos, pares, marcar) {
    let ok = true;
    for (const [nombre, mensaje] of pares) {
        if (!String(datos.get(nombre) || '').trim()) {
            marcar(nombre, mensaje);
            ok = false;
        }
    }
    return ok;
}

// Navegar cambiando la dirección: #/pagina?parametros
export function ir(pagina, parametros = {}) {
    const consulta = new URLSearchParams(Object.entries(parametros).filter(([, v]) => v !== undefined && v !== ''));
    location.hash = `#/${pagina}${consulta.toString() ? '?' + consulta : ''}`;
}

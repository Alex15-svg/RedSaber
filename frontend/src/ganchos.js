// Ganchos (hooks) propios: la página actual según la dirección y la carga de datos de la API.
import { useCallback, useEffect, useState } from 'react';

// Lee la dirección #/pagina?parametros y se actualiza cuando cambia.
export function useRuta() {
    const leer = () => {
        const [ruta, consulta = ''] = location.hash.slice(2).split('?');
        return { pagina: ruta || 'portada', parametros: Object.fromEntries(new URLSearchParams(consulta)) };
    };
    const [actual, setActual] = useState(leer);
    useEffect(() => {
        const cambio = () => setActual(leer());
        window.addEventListener('hashchange', cambio);
        return () => window.removeEventListener('hashchange', cambio);
    }, []);
    return actual;
}

// Ejecuta cargar() al montar el componente (y cuando cambian las dependencias).
// Devuelve { datos, error, cargando, recargar }. recargar() vuelve a pedir los datos.
export function useDatos(cargar, dependencias = []) {
    const [estado, setEstado] = useState({ datos: null, error: null, cargando: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const pedir = useCallback(cargar, dependencias);

    const recargar = useCallback(async () => {
        try {
            const datos = await pedir();
            setEstado({ datos, error: null, cargando: false });
        } catch (error) {
            setEstado((anterior) => ({ ...anterior, error, cargando: false }));
        }
    }, [pedir]);

    useEffect(() => {
        let vigente = true; // evita pintar datos viejos si el componente cambió mientras esperaba
        setEstado((anterior) => ({ ...anterior, cargando: true }));
        pedir()
            .then((datos) => vigente && setEstado({ datos, error: null, cargando: false }))
            .catch((error) => vigente && setEstado({ datos: null, error, cargando: false }));
        return () => { vigente = false; };
    }, [pedir]);

    return { ...estado, recargar };
}

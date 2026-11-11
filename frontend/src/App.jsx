// Aplicación: arma la página (cabecera, encabezado, contenido y columna derecha)
// y elige la vista según la dirección (#/portada, #/perfil, ...).
import { useEffect } from 'react';
import { useSesion, useModal, useAviso } from './contexto.jsx';
import { useRuta } from './ganchos.js';
import { ir } from './utiles.js';
import { Cabecera, Encabezado, Lateral } from './componentes/Estructura.jsx';
import { Bienvenida, Acceso } from './vistas/Acceso.jsx';
import Portada from './vistas/Portada.jsx';
import Explorar from './vistas/Explorar.jsx';
import Mensajes from './vistas/Mensajes.jsx';
import Guardados from './vistas/Guardados.jsx';
import Biblioteca from './vistas/Biblioteca.jsx';
import Cursos from './vistas/Cursos.jsx';
import Talleres from './vistas/Talleres.jsx';
import Perfil from './vistas/Perfil.jsx';
import Moderacion from './vistas/Moderacion.jsx';

const VISTAS = {
    portada: ['Portada', Portada], explorar: ['Explorar', Explorar], mensajes: ['Mensajes', Mensajes],
    guardados: ['Guardados', Guardados], biblioteca: ['Biblioteca', Biblioteca], cursos: ['Cursos', Cursos], talleres: ['Talleres', Talleres],
    perfil: ['Perfil', Perfil], moderacion: ['Moderación', Moderacion]
};

export default function App() {
    const { usuario, salir } = useSesion();
    const modal = useModal();
    const avisar = useAviso();
    const { pagina: pedida, parametros } = useRuta();

    const esAdmin = usuario?.ocupacion === 'administrador';
    const pagina = VISTAS[pedida] && (pedida !== 'moderacion' || esAdmin) ? pedida : 'portada';
    const paginas = Object.entries(VISTAS).filter(([p]) => p !== 'moderacion' || esAdmin).map(([p, [titulo]]) => [p, titulo]);
    const [titulo, Vista] = VISTAS[pagina];
    const numero = String(Object.keys(VISTAS).indexOf(pagina) + 1).padStart(2, '0');

    const abrirAcceso = (modo) => modal.abrir('Acceso', <Acceso modoInicial={modo} />);
    function botonSesion() {
        if (!usuario) return abrirAcceso('ingresar');
        salir();
        avisar('Sesión cerrada.');
        ir('portada');
    }

    // Al cambiar de sección, el foco y el desplazamiento vuelven al inicio del contenido.
    useEffect(() => { window.scrollTo({ top: 0 }); }, [pagina]);

    return (
        <>
            <a className="rs-skip" href="#contenido" onClick={(e) => { e.preventDefault(); document.getElementById('contenido').focus(); }}>Saltar al contenido</a>
            <div className="rs-layout">
                <Cabecera paginas={paginas} actual={pagina} alIngresar={() => abrirAcceso('ingresar')} />
                <main className="rs-main" id="contenido" tabIndex={-1}>
                    <Encabezado numero={numero} titulo={titulo} alSesion={botonSesion} />
                    {/* Toda la plataforma exige cuenta institucional (RNF-01). key: cada usuario ve su propia vista. */}
                    {usuario ? <Vista key={`${pagina}-${usuario.id}`} parametros={parametros} /> : <Bienvenida alAbrir={abrirAcceso} />}
                </main>
                <Lateral />
            </div>
            <button className="rs-button rs-fab" type="button" aria-label="Publicar" onClick={() => ir('portada', { publicar: 1 })}>✎</button>
        </>
    );
}

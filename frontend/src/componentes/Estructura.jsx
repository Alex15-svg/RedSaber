// Partes fijas de la página: cabecera lateral (marca y navegación), encabezado y columna derecha.
import { useState } from 'react';
import { useSesion, useModal } from '../contexto.jsx';
import { api } from '../api.js';
import { useDatos } from '../ganchos.js';
import { ROLES, ir } from '../utiles.js';
import { Icono, Avatar } from './Piezas.jsx';

const SOLO_ESCRITORIO = ['guardados', 'biblioteca', 'moderacion']; // en celular se abren desde «Menú»

export function Cabecera({ paginas, actual, alIngresar }) {
    const { usuario } = useSesion();
    const modal = useModal();
    const [oscuro, setOscuro] = useState(document.documentElement.dataset.bsTheme === 'dark');

    function cambiarTema() {
        const nuevo = oscuro ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', nuevo);
        try { localStorage.setItem('rs-tema', nuevo); } catch { /* sin almacenamiento */ }
        setOscuro(!oscuro);
    }
    const abrirMenu = () => modal.abrir('Secciones', (
        <ol className="rs-aside-list">{paginas.map(([p, titulo]) => (
            <li key={p}><button type="button" onClick={() => { modal.cerrar(); ir(p); }}><strong>{titulo}</strong></button></li>))}
        </ol>));

    return (
        <aside className="rs-masthead rs-paper-texture" aria-label="Navegación principal">
            <a className="rs-brand" href="#/portada">
                <Icono nombre="rs-glifo" className="rs-brand-symbol" role="img" aria-hidden={undefined} aria-label="Glifo de RedSaber" />
                <span className="rs-brand-name">Red<span>Saber</span></span>
            </a>
            <div className="rs-brand-tagline">COMUNIDAD ACADÉMICA · SEDE · Nº 01</div>
            <nav className="rs-navbar">
                {paginas.map(([p, titulo], i) => (
                    <button key={p} className="rs-nav-link" type="button" onClick={() => ir(p)} aria-current={p === actual ? 'page' : undefined}
                            data-movil={SOLO_ESCRITORIO.includes(p) ? 'no' : undefined}>
                        <span className="rs-nav-index">{String(i + 1).padStart(2, '0')}</span>
                        <Icono nombre={`i-${p}`} /><span className="rs-nav-text">{titulo}</span>
                    </button>))}
            </nav>
            <button className="rs-button rs-button--publish" type="button" onClick={() => ir('portada', { publicar: 1 })}>
                <span aria-hidden="true">✎</span><span className="rs-publish-text">Publicar</span>
            </button>
            <button className="rs-theme-toggle rs-menu-toggle" type="button" onClick={abrirMenu} aria-label="Abrir menú de secciones">☰ Menú</button>
            <button className="rs-theme-toggle" type="button" onClick={cambiarTema} aria-label="Cambiar tema claro u oscuro">
                <span aria-hidden="true">◐</span><span className="rs-theme-text">{oscuro ? 'Tema claro' : 'Tema oscuro'}</span>
            </button>
            <button className="rs-account" type="button" onClick={() => (usuario ? ir('perfil') : alIngresar())}>
                <Avatar nombre={usuario ? usuario.nombre : 'R S'} ocupacion={usuario?.ocupacion} tamano="rs-avatar--sm" />
                <span className="rs-account-text"><strong>{usuario ? usuario.nombre : 'Visitante'}</strong>
                    <small>{usuario ? ROLES[usuario.ocupacion] : 'Ingresa con tu cuenta'}</small></span>
            </button>
        </aside>
    );
}

export function Encabezado({ numero, titulo, alSesion }) {
    const { usuario } = useSesion();
    const hoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
    return (
        <header className="rs-pagehead">
            <div className="rs-pagehead-row">
                <div>
                    <div className="rs-kicker">Nº {numero} · {titulo}</div>
                    <h1 className="rs-display rs-misprint">{usuario ? titulo : 'RedSaber'}</h1>
                </div>
                <div className="d-flex gap-2 align-items-center pb-3">
                    <span className="rs-meta d-none d-md-inline">{hoy}</span>
                    <button className="rs-button rs-button--ghost rs-button--sm" type="button" onClick={alSesion}>{usuario ? 'Cerrar sesión' : 'Ingresar'}</button>
                </div>
            </div>
            <div className="rs-pagehead-rules" />
        </header>
    );
}

// Columna derecha: buscador, etiquetas de carrera (RF-09) y accesos.
export function Lateral() {
    const { usuario } = useSesion();
    const { datos: carreras } = useDatos(() => (usuario ? api('GET', '/buscar/carreras') : Promise.resolve([])), [usuario?.id]);
    const buscar = (e) => { e.preventDefault(); ir('explorar', { q: new FormData(e.currentTarget).get('q').trim() }); };
    const acceso = (p, titulo, texto) => <li><button type="button" onClick={() => ir(p)}><strong>{titulo}</strong><small>{texto}</small></button></li>;
    return (
        <aside className="rs-aside" aria-label="Índice y accesos">
            <form className="rs-search mb-4" role="search" onSubmit={buscar}>
                <Icono nombre="i-buscar" />
                <label className="visually-hidden" htmlFor="buscar">Buscar en RedSaber</label>
                <input className="rs-input" id="buscar" name="q" type="search" placeholder="Buscar en RedSaber" />
            </form>
            <section className="rs-aside-block"><h2 className="rs-h3 mb-2">Carreras</h2>
                <ol className="rs-aside-list">
                    {(carreras || []).map((c) => <li key={c}><button type="button" onClick={() => ir('explorar', { carrera: c })}>
                        <strong>{c}</strong><small>Ver publicaciones y personas</small></button></li>)}
                    {!carreras?.length && <li><small className="rs-muted">{usuario ? 'Aún no hay carreras.' : 'Ingresa para ver las carreras.'}</small></li>}
                </ol></section>
            <section className="rs-aside-block"><h2 className="rs-h3 mb-2">Accesos</h2>
                <ol className="rs-aside-list">{acceso('biblioteca', 'Biblioteca', 'Documentación por área')}
                    {acceso('guardados', 'Guardados', 'Tu lista privada')}{acceso('talleres', 'Talleres de la sede', 'Inscritos y capacidad')}</ol></section>
            <p className="rs-caption">RedSaber · Ingeniería de Software TI3043 · INACAP.</p>
        </aside>
    );
}

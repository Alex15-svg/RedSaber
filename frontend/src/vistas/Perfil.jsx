// Perfil propio: datos y etiquetas, personalización (RF-05) y mis publicaciones (RF-07),
// con la opción de apelar las que la moderación deshabilitó (RF-12).
import { api } from '../api.js';
import { useAviso, useModal } from '../contexto.jsx';
import { useDatos } from '../ganchos.js';
import { ROLES } from '../utiles.js';
import { useFormulario, Campo, Enviar } from '../componentes/Formulario.jsx';
import { Avatar, Estado, Etiqueta, Vacio } from '../componentes/Piezas.jsx';
import Entrada from '../componentes/Entrada.jsx';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];

function Personalizar({ correoPublico, alGuardar }) {
    const { errores, ocupado, onSubmit } = useFormulario(async (d, marcar) => {
        // 1) Revisar todas las imágenes elegidas antes de subir nada.
        const imagenes = ['foto', 'encabezado', 'fondo'].map((c) => [c, d.get(c)]).filter(([, a]) => a && a.size);
        let ok = true;
        for (const [nombre, a] of imagenes) {
            if (!TIPOS_IMAGEN.includes(a.type)) { marcar(nombre, 'Formato no admitido: usa JPG, PNG o WEBP.'); ok = false; }
            else if (a.size > 2 * 1024 * 1024) { marcar(nombre, 'La imagen supera los 2 MB.'); ok = false; }
        }
        if (!ok) return;
        // 2) Subir cada imagen (una solicitud por campo) y guardar la visibilidad del correo.
        for (const [nombre, a] of imagenes) {
            const envio = new FormData();
            envio.append('imagen', a);
            await api('PUT', `/perfil/imagen/${nombre}`, envio);
        }
        await api('PATCH', '/perfil/correo', { publico: d.get('publico') === 'on' });
        alGuardar();
    });
    const imagen = (nombre, etiqueta) => <Campo nombre={nombre} etiqueta={etiqueta} type="file" accept={TIPOS_IMAGEN.join(',')} error={errores[nombre]} />;
    return (
        <form className="rs-form" onSubmit={onSubmit} noValidate>
            {imagen('foto', 'Foto de perfil')}{imagen('encabezado', 'Encabezado')}{imagen('fondo', 'Fondo')}
            <p className="rs-hint mb-0">JPG, PNG o WEBP de hasta 2 MB. Deja vacío lo que no quieras cambiar.</p>
            <label className="rs-check"><input type="checkbox" name="publico" defaultChecked={correoPublico} /> Mostrar mi correo en el perfil y en las búsquedas</label>
            <Enviar ocupado={ocupado} error={errores.general}>Guardar cambios</Enviar>
        </form>
    );
}

export default function Perfil() {
    const avisar = useAviso();
    const modal = useModal();
    const { datos, error, cargando, recargar } = useDatos(async () => {
        const [perfil, mias, guias, guardados] = await Promise.all([
            api('GET', '/perfil'), api('GET', '/publicaciones/mias'), api('GET', '/guias'), api('GET', '/guardados')]);
        // Las publicaciones propias se completan con la marca de verificación y «con solución» de las guías (RF-11).
        const guia = new Map(guias.map((g) => [g.id, g]));
        const publicaciones = mias.map((p) => ({ ...p, verificada: guia.get(p.id)?.verificada, con_solucion: guia.get(p.id)?.con_solucion }));
        return { perfil, publicaciones, guardadas: new Set(guardados.publicaciones.map((p) => p.id)) };
    });
    const personalizar = () => modal.abrir('Personalizar perfil', (
        <Personalizar correoPublico={datos.perfil.correo_publico} alGuardar={() => { modal.cerrar(); avisar('Perfil actualizado.'); recargar(); }} />));

    if (!datos) return <Estado cargando={cargando} error={error} />;
    const { perfil, publicaciones, guardadas } = datos;
    return (
        <>
            <div className="rs-cover rs-paper-texture rs-torn" style={perfil.encabezado_url ? { backgroundImage: `url("${perfil.encabezado_url}")` } : undefined}>
                <span className="rs-cover-word" aria-hidden="true">{perfil.nombre.split(' ')[0]}</span>
            </div>
            <div className="rs-profile-head">
                <Avatar nombre={perfil.nombre} ocupacion={perfil.ocupacion} foto={perfil.foto_url} tamano="rs-avatar--lg" />
                <button className="rs-button rs-button--ghost rs-button--sm mb-2" type="button" onClick={personalizar}>Personalizar perfil</button>
            </div>
            <section className="rs-section">
                <h2 className="rs-h2 mb-1">{perfil.nombre}</h2>
                <p className="rs-meta">{perfil.correo_institucional} · {perfil.correo_publico ? 'CORREO PÚBLICO' : 'CORREO PRIVADO'}</p>
                <div className="rs-tags"><Etiqueta acento>{ROLES[perfil.ocupacion]}</Etiqueta><Etiqueta>{perfil.carrera || 'Sin carrera'}</Etiqueta>
                    <Etiqueta suave>{publicaciones.length} publicaciones</Etiqueta></div>
            </section>
            <h2 className="rs-h3 rs-section pb-0 mb-0">Mis publicaciones</h2>
            {publicaciones.length
                ? publicaciones.map((p) => <Entrada key={p.id} p={p} guardadas={guardadas} alCambiar={recargar} />)
                : <Vacio titulo="Sin publicaciones">Lo que publiques aparecerá aquí, con opciones para editar o borrar.</Vacio>}
        </>
    );
}

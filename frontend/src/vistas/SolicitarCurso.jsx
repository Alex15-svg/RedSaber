// Ventana «Solicitar curso» (RF-14): el estudiante forma un grupo y pide un curso a un docente.
import { api } from '../api.js';
import { useDatos } from '../ganchos.js';
import { exigir, textos } from '../utiles.js';
import { useFormulario, Campo, Enviar } from '../componentes/Formulario.jsx';

// Convierte el texto de integrantes en una lista de correos sin repetidos.
const leerCorreos = (texto) => [...new Set(texto.split(/[\s,;]+/).map((c) => c.trim().toLowerCase()).filter(Boolean))];

export default function SolicitarCurso({ alSolicitar }) {
    // Docentes para elegir, con la búsqueda de usuarios de RF-09.
    const { datos: docentes } = useDatos(async () => (await api('GET', '/buscar?en=usuarios')).usuarios.filter((u) => u.ocupacion === 'docente'));

    const { errores, ocupado, onSubmit } = useFormulario(async (d, marcar) => {
        let ok = exigir(d, [['nombreGrupo', 'Ponle un nombre al grupo.'], ['nombre', 'Escribe el nombre del curso.'],
            ['objetivo', 'Explica qué quieren aprender.'], ['docenteId', 'Elige un docente.']], marcar);
        const correos = leerCorreos(String(d.get('correos') || ''));
        const invalido = correos.find((c) => !c.endsWith('@inacapmail.cl'));
        if (invalido) { marcar('correos', `«${invalido}» no es un correo @inacapmail.cl.`); ok = false; }
        if (!ok) return;
        const r = await api('POST', '/cursos/solicitar', { ...textos(d, ['nombreGrupo', 'nombre', 'objetivo']), docenteId: Number(d.get('docenteId')), correos });
        alSolicitar(r.mensaje);
    });

    return (
        <form className="rs-form" onSubmit={onSubmit} noValidate>
            <Campo nombre="nombreGrupo" etiqueta="Nombre del grupo" maxLength={120} placeholder="Grupo de estudio BD" error={errores.nombreGrupo} />
            <Campo nombre="nombre" etiqueta="Curso que solicitan" maxLength={200} placeholder="SQL avanzado" error={errores.nombre} />
            <Campo nombre="objetivo" etiqueta="Objetivo" como="textarea" rows={3} maxLength={1000} error={errores.objetivo} />
            <Campo nombre="docenteId" etiqueta="Docente" como="select" defaultValue="" error={errores.docenteId}>
                <option value="" disabled>{docentes ? 'Elige un docente' : 'Cargando…'}</option>
                {(docentes || []).map((u) => <option key={u.id} value={u.id}>{u.nombre}{u.carrera ? ` · ${u.carrera}` : ''}</option>)}
            </Campo>
            <Campo nombre="correos" etiqueta="Correos de los demás integrantes" como="textarea" rows={2} error={errores.correos}
                   placeholder="nombre@inacapmail.cl, otro@inacapmail.cl" ayuda="Separados por coma o salto de línea. Tú quedas incluido automáticamente." />
            <Enviar ocupado={ocupado} error={errores.general}>Enviar solicitud</Enviar>
        </form>
    );
}

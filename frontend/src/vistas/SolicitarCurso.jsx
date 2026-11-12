// Ventana «Solicitar curso» (RF-14): el estudiante forma un grupo y pide un curso a un docente.
import { useState } from 'react';
import { api } from '../api.js';
import { useDatos } from '../ganchos.js';
import { exigir, textos } from '../utiles.js';
import { useFormulario, Campo, Enviar } from '../componentes/Formulario.jsx';

// Catálogo (capacitaciones y certificaciones de pago). Cada curso indica en qué áreas está y qué organizaciones lo ofrecen:
//   c('Nombre del curso', ['Área 1', 'Área 2'], ['Organización 1', 'Organización 2'])
// Para agregar o quitar cursos, áreas u organizaciones basta con editar esta lista.
const c = (nombre, areas, orgs) => areas.flatMap((area) => orgs.map((org) => ({ nombre, area, org })));
const SO = 'Sistemas operativos', PROG = 'Programación', REDES = 'Redes y telecomunicaciones', BD = 'Bases de datos';
const SEG = 'Ciberseguridad', WEB = 'Desarrollo web', IA = 'Inteligencia artificial y datos', OFI = 'Ofimática (Excel y Word)';
const CURSOS = [
    c('Administración de Linux', [SO], ['Red Hat', 'Linux Foundation']),
    c('Administración de Windows Server', [SO], ['Microsoft']),
    c('Virtualización de servidores', [SO], ['VMware', 'Microsoft', 'Red Hat']),
    c('Python desde cero', [PROG], ['Python Institute', 'Udemy', 'Platzi']),
    c('Java orientado a objetos', [PROG], ['Oracle', 'Udemy']),
    c('C# y .NET', [PROG], ['Microsoft', 'Udemy']),
    c('JavaScript', [PROG, WEB], ['Udemy', 'Platzi', 'LinkedIn Learning']),
    c('Fundamentos de redes', [REDES], ['Cisco', 'CompTIA']),
    c('Subredes y direccionamiento IP', [REDES], ['Cisco', 'CompTIA']),
    c('Cisco CCNA', [REDES], ['Cisco']),
    c('Configuración de routers y switches', [REDES], ['Cisco', 'Juniper', 'MikroTik']),
    c('Redes inalámbricas (Wi-Fi)', [REDES], ['Cisco', 'CWNP']),
    c('Seguridad en redes', [REDES, SEG], ['Cisco', 'CompTIA']),
    c('SQL y bases de datos relacionales', [BD], ['Oracle', 'Microsoft', 'EDB (PostgreSQL)']),
    c('Administración de PostgreSQL', [BD], ['EDB (PostgreSQL)']),
    c('Fundamentos de ciberseguridad', [SEG], ['Cisco', 'CompTIA', 'ISC2']),
    c('Hacking ético', [SEG], ['EC-Council', 'Offensive Security']),
    c('Pruebas de penetración', [SEG], ['Offensive Security', 'EC-Council']),
    c('Seguridad de la información', [SEG], ['ISC2', 'ISACA']),
    c('HTML y CSS', [WEB], ['Udemy', 'Platzi', 'LinkedIn Learning']),
    c('React', [WEB], ['Platzi', 'Udemy']),
    c('Node.js y Express', [WEB, PROG], ['Udemy', 'LinkedIn Learning']),
    c('Introducción a la inteligencia artificial', [IA], ['IBM', 'Microsoft', 'Google Cloud']),
    c('Análisis de datos con Python', [IA], ['IBM', 'Coursera']),
    c('Machine learning', [IA], ['AWS', 'Google Cloud', 'IBM', 'Coursera']),
    c('Power BI', [IA, OFI], ['Microsoft', 'Udemy', 'LinkedIn Learning']),
    c('Excel básico', [OFI], ['Microsoft', 'LinkedIn Learning', 'Udemy']),
    c('Excel intermedio (fórmulas y tablas dinámicas)', [OFI], ['Microsoft', 'LinkedIn Learning', 'Udemy']),
    c('Excel avanzado (macros y VBA)', [OFI, PROG], ['Microsoft', 'LinkedIn Learning', 'Udemy']),
    c('Word básico', [OFI], ['Microsoft', 'LinkedIn Learning', 'Udemy']),
    c('Word avanzado (estilos, índices y formato)', [OFI], ['Microsoft', 'LinkedIn Learning', 'Udemy']),
    c('Combinar correspondencia (Word + Excel)', [OFI], ['Microsoft', 'LinkedIn Learning'])
].flat();

const OTRO = 'Otro curso (escribir)';
const TODOS = 'Volver a mostrar todos los cursos';
const unicos = (lista) => [...new Set(lista)];

// Niveles de dificultad, parecidos a los de Cisco.
const NIVELES = ['Introducción (Entry)', 'Intermedio (Associate)', 'Avanzado (Professional)', 'Experto (Expert)'];

// Filas del catálogo que coinciden con lo elegido (lo que esté vacío, o sea «Otro curso», no filtra).
const filasDe = (s) => CURSOS.filter((x) => (!s.curso || s.curso === OTRO || x.nombre === s.curso)
    && (!s.area || x.area === s.area) && (!s.org || x.org === s.org));

// Mantiene curso, área y organización siempre relacionados.
// Lo que el estudiante acaba de elegir manda: los otros dos se conservan solo si siguen siendo compatibles,
// y lo que quede con una única opción posible se completa solo.
function reconciliar(estado, cambio) {
    const [clave] = Object.keys(cambio);
    const sel = { curso: '', area: '', org: '', [clave]: cambio[clave] };
    for (const k of ['curso', 'org', 'area'].filter((x) => x !== clave)) {
        if (estado[k] && filasDe({ ...sel, [k]: estado[k] }).length) sel[k] = estado[k];
    }
    const filas = filasDe(sel);
    if (!sel.area && unicos(filas.map((x) => x.area)).length === 1) sel.area = filas[0].area;
    if (!sel.org && unicos(filas.map((x) => x.org)).length === 1) sel.org = filas[0].org;
    if (!sel.curso && (sel.area || sel.org) && unicos(filas.map((x) => x.nombre)).length === 1) sel.curso = filas[0].nombre;
    return sel;
}

// Convierte el texto de integrantes en una lista de correos sin repetidos.
const leerCorreos = (texto) => [...new Set(texto.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean))];

export default function SolicitarCurso({ alSolicitar }) {
    // Docentes para elegir, con la búsqueda de usuarios de RF-09.
    const { datos: docentes } = useDatos(async () => (await api('GET', '/buscar?en=usuarios')).usuarios.filter((u) => u.ocupacion === 'docente'));
    const [sel, setSel] = useState({ curso: '', area: '', org: '' });
    const cambiar = (cambio) => setSel((actual) => reconciliar(actual, cambio));
    const { curso, area, org } = sel;

    const { errores, ocupado, onSubmit } = useFormulario(async (d, marcar) => {
        let ok = exigir(d, [['nombreGrupo', 'Ponle un nombre al grupo.'], ['nivel', 'Elige un nivel.'],
            ['objetivo', 'Explica qué quieren aprender.'], ['docenteId', 'Elige un docente.']], marcar);
        const nombreCurso = curso === OTRO ? String(d.get('cursoOtro') || '').trim() : curso;
        if (!curso) { marcar('curso', 'Elige un curso.'); ok = false; }
        else if (!nombreCurso) { marcar('cursoOtro', 'Escribe el nombre del curso.'); ok = false; }
        if (!area) { marcar('area', 'Elige un área.'); ok = false; }
        if (!org) { marcar('organizacion', 'Elige una organización.'); ok = false; }
        const correos = leerCorreos(String(d.get('correos') || ''));
        const invalido = correos.find((x) => !x.endsWith('@inacapmail.cl'));
        if (invalido) { marcar('correos', `«${invalido}» no es un correo @inacapmail.cl.`); ok = false; }
        if (!ok) return;

        const t = textos(d, ['nombreGrupo', 'nivel', 'objetivo']);
        // Área, organización y nivel viajan dentro del objetivo (el servidor aún no tiene campos para ellos).
        const objetivo = `Área: ${area} · Organización: ${org} · Nivel: ${t.nivel}\n${t.objetivo}`;
        const r = await api('POST', '/cursos/solicitar', { nombreGrupo: t.nombreGrupo, nombre: nombreCurso, objetivo, docenteId: Number(d.get('docenteId')), correos });
        alSolicitar(r.mensaje);
    });

    // Cada menú muestra solo lo que es compatible con lo elegido en los otros dos.
    const cursosPorArea = {};
    for (const x of filasDe({ area, org })) {
        const lista = cursosPorArea[x.area] = cursosPorArea[x.area] || [];
        if (!Object.values(cursosPorArea).some((l) => l.includes(x.nombre))) lista.push(x.nombre);
    }
    const areasVisibles = unicos(filasDe({ curso, org }).map((x) => x.area));
    const orgsVisibles = unicos(filasDe({ curso, area }).map((x) => x.org));
    const conCurso = curso && curso !== OTRO;

    return (
        <form className="rs-form" onSubmit={onSubmit} noValidate>
            <Campo nombre="nombreGrupo" etiqueta="Nombre del grupo" maxLength={120} placeholder="Grupo de estudio BD" error={errores.nombreGrupo} />
            <Campo nombre="curso" etiqueta="Curso que solicitan" como="select" value={curso} error={errores.curso}
                   onChange={(e) => (e.target.value === TODOS
                       ? setSel({ curso: '', area: '', org: '' })
                       : cambiar({ curso: e.target.value }))}>
                <option value="" disabled>Elige un curso</option>
                {(curso || area || org) && <option value={TODOS}>↺ {TODOS}</option>}
                {Object.entries(cursosPorArea).filter(([, l]) => l.length).map(([a, lista]) => (
                    <optgroup key={a} label={a}>{lista.map((n) => <option key={n} value={n}>{n}</option>)}</optgroup>
                ))}
                <option value={OTRO}>{OTRO}</option>
            </Campo>
            {curso === OTRO && <Campo nombre="cursoOtro" etiqueta="Nombre del curso" maxLength={200} placeholder="SQL avanzado" error={errores.cursoOtro} />}
            <Campo nombre="area" etiqueta="Área" como="select" value={area} error={errores.area}
                   ayuda={conCurso ? 'Áreas en las que está este curso.' : undefined}
                   onChange={(e) => cambiar({ area: e.target.value })}>
                <option value="" disabled>Elige un área</option>
                {areasVisibles.map((a) => <option key={a} value={a}>{a}</option>)}
            </Campo>
            <Campo nombre="organizacion" etiqueta="Organización" como="select" value={org} error={errores.organizacion}
                   ayuda={conCurso ? 'Organizaciones que ofrecen este curso.' : undefined}
                   onChange={(e) => cambiar({ org: e.target.value })}>
                <option value="" disabled>Elige una organización</option>
                {orgsVisibles.map((o) => <option key={o} value={o}>{o}</option>)}
            </Campo>
            <Campo nombre="nivel" etiqueta="Nivel de dificultad" como="select" defaultValue="" error={errores.nivel}>
                <option value="" disabled>Elige un nivel</option>
                {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
            </Campo>
            <Campo nombre="objetivo" etiqueta="Objetivo" como="textarea" rows={3} maxLength={850} error={errores.objetivo} />
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
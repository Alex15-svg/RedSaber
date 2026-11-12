# RedSaber

Plataforma web de conocimiento y comunidad para estudiantes, docentes y administración de una sede de INACAP.
Toma como inspiración las redes sociales actuales: permite publicar dudas y soluciones, consultar guías y
documentos por carrera, formar grupos para solicitar cursos, ver los talleres de la sede y conversar por chat.

Prototipo de la asignatura **Ingeniería de Software (TI3043)** de INACAP, versión 0.1.0.
Integrantes: Fabián Nuñez y Samuel Carrasco.

---

## Contenido

1. [Funcionalidades](#funcionalidades)
2. [Tecnologías](#tecnologías)
3. [Estructura del repositorio](#estructura-del-repositorio)
4. [Instalación](#instalación)
5. [Configuración (.env)](#configuración-env)
6. [Uso](#uso)
7. [API](#api)
8. [Pruebas](#pruebas)
9. [Problemas conocidos](#problemas-conocidos)
10. [Cómo contribuir](#cómo-contribuir)

---

## Funcionalidades

Toda la plataforma exige una cuenta con correo institucional `@inacapmail.cl`. Hay tres roles: **estudiante**,
**docente** y **administrador**. El servidor asigna el rol al registrarse, según las listas del archivo `.env`.

| Módulo | Qué permite | Requerimientos |
|---|---|---|
| Cuentas | Registrarse, iniciar sesión y recuperar la contraseña con un código enviado al correo (vence en 30 minutos) | RF-01 a RF-04 |
| Perfil | Cambiar foto, encabezado y fondo, y elegir si el correo es público o privado | RF-05 |
| Publicaciones | Publicar dudas o soluciones (estudiantes); editar y borrar solo las propias | RF-06, RF-07 |
| Guardados | Lista privada de publicaciones y documentos guardados | RF-08 |
| Búsqueda | Buscar publicaciones y personas, con filtro por carrera | RF-09 |
| Documentos | Biblioteca de PDF por área, con lectura y descarga | RF-10 |
| Guías | Guías prácticas de docentes, marcadas como verificadas | RF-11 |
| Reportes | Reportar perfiles y publicaciones; con 3 reportes se deshabilitan y su dueño puede apelar | RF-12 |
| Moderación | El administrador acepta o rechaza las apelaciones | RF-13 |
| Cursos | Los estudiantes forman grupos y solicitan cursos; el docente los abre, los cierra y ve a los ingresados | RF-14, RF-15, RF-19, RF-20 |
| Talleres | Talleres de la sede con inscritos y capacidad | RF-16 |
| Mensajería | Crear chats individuales o grupales e invitar a otros usuarios | RF-17 |

El envío de mensajes en tiempo real (Socket.IO) aún no está implementado.

## Tecnologías

| Capa | Tecnología | Versión |
|---|---|---|
| Interfaz | React + Vite | 18.3.1 / 5.4.10 |
| Servidor | Node.js + Express | 20 o superior (probado en 24) / 5 |
| Base de datos | PostgreSQL (librería `pg`) | 16 o superior (probado en 18) |
| Seguridad | bcrypt (contraseñas) y jsonwebtoken (sesiones) | 6 / 9 |
| Archivos y correo | multer (subidas) y Nodemailer (correo) | 2 / 10 |
| Configuración | dotenv y validator | 18 / 13 |

## Estructura del repositorio

```
backend/                  Servidor: API REST en Node.js + Express
  src/
    app.js                Monta las rutas /api y entrega la interfaz compilada en /app
    config/               Conexión a PostgreSQL, JWT y valores de moderación
    middlewares/          auth.js (valida el JWT), roles.js (permisos) y errores.js
    modulos/              12 módulos; cada uno con rutas.js, controlador.js y modelo.js
    utils/                Validación de datos, transacciones y envío de correo
  tablas.sql              Crea las 26 tablas de la base de datos
  .env.example            Plantilla de configuración (se copia como .env)
frontend/                 Interfaz web en React (Vite)
  src/
    vistas/               Pantallas: Portada, Explorar, Mensajes, Perfil, Moderación, etc.
    componentes/          Piezas reutilizables (estructura, formularios, tarjetas)
    css/                  Estilos
    api.js                Conexión con la API y manejo de la sesión
  public/img/             Logo e íconos
  index.html              Página de entrada de Vite
  css/, js/, views/       Interfaz anterior en HTML (ya no se usa; se conserva como referencia)
```

Cada módulo del backend sigue la misma estructura:

```
rutas.js        Direcciones de la API y permisos (auth, roles)
controlador.js  Valida los datos y aplica las reglas de negocio
modelo.js       Consultas SQL parametrizadas a PostgreSQL
```

## Instalación

### Requisitos

- [Node.js](https://nodejs.org/) 20 o superior (incluye npm).
- [PostgreSQL](https://www.postgresql.org/) 16 o superior, con pgAdmin u otra herramienta para ejecutar SQL.
- Git.

### Pasos

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/Alex15-svg/RedSaber.git
   cd RedSaber
   ```

2. **Crear la base de datos.** En pgAdmin, crear una base llamada `redsaber_db` y ejecutar en ella el archivo
   `backend/tablas.sql`. También se puede hacer desde la consola:

   ```bash
   createdb -U postgres redsaber_db
   psql -U postgres -d redsaber_db -f backend/tablas.sql
   ```

3. **Configurar el servidor.** Copiar `backend/.env.example` con el nombre `backend/.env` y completar los datos
   (ver [Configuración](#configuración-env)).

4. **Compilar la interfaz**

   ```bash
   cd frontend
   npm install
   npm run build
   ```

   Esto genera la carpeta `frontend/dist`, que el servidor entrega en `/app`.

5. **Iniciar el servidor**

   ```bash
   cd ../backend
   npm install
   npm start
   ```

6. Abrir **http://localhost:3000/app** en el navegador.

## Configuración (.env)

El archivo `backend/.env` no se sube a GitHub. Variables disponibles:

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PGHOST`, `PGPORT` | Sí | Servidor de PostgreSQL (por defecto `localhost` y `5432`) |
| `PGUSER`, `PGPASSWORD` | Sí | Usuario y contraseña de PostgreSQL |
| `PGDATABASE` | Sí | Nombre de la base (`redsaber_db`) |
| `JWT_SECRET` | Sí | Clave larga y secreta para firmar las sesiones |
| `CORREOS_DOCENTES` | No | Correos completos, separados por coma, que se registran como docentes |
| `CORREOS_ADMIN` | No | Correos completos, separados por coma, que se registran como administradores |
| `MODERACION_UMBRAL` | No | Reportes necesarios para deshabilitar algo (por defecto 3) |
| `PLAZO_APELACION_DIAS` | No | Días para apelar (por defecto 7) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | No | Servidor de correo para la recuperación de contraseña |

Si no se configura SMTP, el código de recuperación se muestra en la consola del servidor como `[CORREO SIMULADO]`.

El servidor usa el puerto **3000**.

## Uso

1. Crear una cuenta con un correo `@inacapmail.cl` y una contraseña de al menos 8 caracteres.
2. El rol depende de `CORREOS_DOCENTES` y `CORREOS_ADMIN`; cualquier otro correo queda como estudiante.
   Ejemplo: `CORREOS_DOCENTES=docente@inacapmail.cl` y `CORREOS_ADMIN=admin@inacapmail.cl`.
3. Cada rol ve sus propias opciones:
   - **Estudiante:** publica dudas y soluciones, guarda, reporta, apela y solicita cursos.
   - **Docente:** publica guías, sube documentos y gestiona sus cursos.
   - **Administrador:** revisa las apelaciones y la lista de usuarios en la vista Moderación.

Límites de archivos: imágenes de perfil JPG, PNG o WEBP de hasta 2 MB; documentos PDF de hasta 10 MB.

### Modo desarrollo

Para trabajar en la interfaz con recarga automática, con el servidor encendido:

```bash
cd frontend
npm run dev
```

Abrir **http://localhost:5173/app**. Las llamadas a `/api` y `/uploads` se reenvían al puerto 3000.

## API

Todas las rutas, salvo registro, inicio de sesión, recuperación y apelación de cuenta, exigen la cabecera
`Authorization: Bearer <token>`. El token se obtiene en `POST /api/cuentas/login` y vence en 2 horas.
Las respuestas son JSON; los errores tienen la forma `{ "error": "mensaje" }`.

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/cuentas/registro` | Público | Crear cuenta |
| POST | `/api/cuentas/login` | Público | Iniciar sesión |
| POST | `/api/cuentas/recuperar` | Público | Enviar código de recuperación |
| POST | `/api/cuentas/restablecer` | Público | Cambiar la contraseña con el código |
| GET | `/api/cuentas/usuarios` | Administrador | Lista de usuarios |
| GET | `/api/perfil` | Sesión | Ver mi perfil |
| PUT | `/api/perfil/imagen/:campo` | Sesión | Cambiar foto, encabezado o fondo |
| PATCH | `/api/perfil/correo` | Sesión | Correo público o privado |
| POST | `/api/publicaciones` | Estudiante | Publicar duda o solución |
| GET | `/api/publicaciones/mias` | Sesión | Mis publicaciones |
| PUT, DELETE | `/api/publicaciones/:id` | Autor | Editar o borrar una publicación propia |
| GET | `/api/guardados` | Sesión | Ver mi lista privada |
| POST, DELETE | `/api/guardados/:tipo/:id` | Sesión | Guardar o quitar (`publicaciones` o `documentos`) |
| GET | `/api/buscar` | Sesión | Buscar (`?q=`, `?carrera=`, `?tipo=`, `?en=`) |
| GET | `/api/buscar/carreras` | Sesión | Etiquetas de carrera |
| GET | `/api/documentos`, `/api/documentos/areas` | Sesión | Documentos y áreas |
| GET | `/api/documentos/:id/leer`, `/api/documentos/:id/descargar` | Sesión | Leer o descargar un PDF |
| POST | `/api/documentos` | Docente, administrador | Subir un PDF |
| GET | `/api/guias` | Sesión | Ver guías |
| POST | `/api/guias` | Docente | Publicar una guía |
| PATCH | `/api/guias/:id/solucion` | Docente | Indicar si la guía trae solución |
| POST | `/api/moderacion/reportes` | Sesión | Reportar un perfil o una publicación |
| POST | `/api/moderacion/apelaciones/publicacion` | Autor | Apelar una publicación deshabilitada |
| POST | `/api/moderacion/apelaciones/cuenta` | Público | Apelar una cuenta deshabilitada |
| GET | `/api/moderacion/apelaciones` | Administrador | Apelaciones pendientes |
| POST | `/api/moderacion/apelaciones/:id/rehabilitar` | Administrador | Aceptar la apelación |
| POST | `/api/moderacion/apelaciones/:id/rechazar` | Administrador | Rechazar la apelación |
| POST | `/api/moderacion/limpieza` | Administrador | Eliminar ahora lo que no se apeló a tiempo |
| GET | `/api/cursos` | Sesión | Catálogo de cursos |
| POST | `/api/cursos/solicitar` | Estudiante | Solicitar un curso con un grupo |
| POST | `/api/cursos/:id/interes`, `/api/cursos/:id/ingresar` | Estudiante | Mostrar interés o ingresar a un curso abierto |
| GET | `/api/cursos/solicitudes`, `/api/cursos/mios` | Docente | Solicitudes recibidas y mis cursos |
| POST | `/api/cursos/:id/abrir`, `/api/cursos/:id/cerrar` | Docente | Abrir o cerrar el ingreso |
| GET | `/api/cursos/:id/ingresados` | Docente | Estudiantes ingresados |
| GET | `/api/talleres` | Sesión | Talleres con inscritos y capacidad |
| GET, POST | `/api/chats` | Sesión | Mis chats y crear un chat con invitados |
| GET | `/api/chats/invitaciones` | Sesión | Invitaciones pendientes |
| POST | `/api/chats/invitaciones/:id/aceptar`, `.../rechazar` | Invitado | Responder una invitación |

## Pruebas

La API se probó contra un servidor local y una base de datos temporal:

| Prueba | Herramienta | Resultado |
|---|---|---|
| Integración de RF-01 a RF-17 | 5 scripts en Node.js (172 casos) | 172 de 172 aprobados |
| Calidad: requerimientos, permisos y reglas de negocio | Postman + Newman (150 pruebas, 685 verificaciones) | 98,7 % aprobadas |
| Seguridad y robustez: inyección SQL, XSS, JWT, IDOR, concurrencia | Postman + Newman (207 pruebas, 1.149 verificaciones) | 97,0 % aprobadas |

Para ejecutar una colección de Postman desde la consola con Newman:

```bash
npm install -g newman
newman run coleccion.postman_collection.json
```

## Problemas conocidos

Pendientes de corregir (detalle en el informe del proyecto):

- La **publicación libre** responde con error 500: `tablas.sql` aún no admite el tipo `publicacion` ni
  publicaciones sin título, carrera, asignatura y sección.
- Una **cuenta deshabilitada** conserva el acceso hasta que vence su token (2 horas).
- Algunos datos con tipo o formato inesperado provocan error 500 (tipos incorrectos en el registro,
  carácter nulo en el título, id fuera de rango).
- Se aceptan algunos datos inválidos: correo con doble arroba y contraseña o nombre formados solo por espacios.
- En cursos: los correos repetidos se rechazan con un mensaje equivocado, se acepta un grupo de una sola persona
  y un docente que consulta un curso ajeno recibe una lista vacía en vez de un error 404.
- Faltan protecciones de endurecimiento: límite de intentos de inicio de sesión, cabeceras de seguridad
  (por ejemplo, con `helmet`) y un 404 de la API en formato JSON.

## Cómo contribuir

1. Crear una rama desde `main` con un nombre descriptivo: `feat/...` para funcionalidades, `fix/...` para
   correcciones y `chore/...` para mantenimiento.
2. Seguir las reglas del proyecto: código simple y probado, nombres y comentarios en español,
   un comentario por bloque y archivos de 120 líneas como máximo.
3. Si un cambio afecta la base de datos, actualizar también `backend/tablas.sql`.
4. Abrir un pull request hacia `main` para que el otro integrante lo revise antes de unirlo.

## Licencia

ISC.

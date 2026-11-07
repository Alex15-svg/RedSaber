-- RedSaber: esquema de la base de datos (PostgreSQL 15 o superior).
-- Basado en el diagrama de clases de dominio del informe.
--
-- Crear la base (una sola vez) y cargar este archivo:
--   CREATE DATABASE redsaber_db ENCODING 'UTF8';
--   psql -U postgres -d redsaber_db -f tablas.sql
--
-- Valores por definir en la aplicacion, no aqui: cantidad de reportes para
-- deshabilitar, plazo de apelacion, vigencia del enlace de recuperacion,
-- tamano de archivos, integrantes minimos de grupos y chats.

BEGIN;

-- ---------------------------------------------------------------------------
-- Cuentas y perfiles (RF-01 a RF-05)
-- ---------------------------------------------------------------------------

CREATE TABLE usuarios (
    id                   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre               VARCHAR(120) NOT NULL,
    correo_institucional VARCHAR(254) NOT NULL,
    contrasena_hash      VARCHAR(255) NOT NULL,
    carrera              VARCHAR(120),
    ocupacion            VARCHAR(20)  NOT NULL,
    correo_publico       BOOLEAN      NOT NULL DEFAULT FALSE,
    estado               VARCHAR(20)  NOT NULL DEFAULT 'activa',
    deshabilitado_en     TIMESTAMPTZ,
    creado_en            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_usuarios_correo
        CHECK (lower(correo_institucional) LIKE '%@inacapmail.cl'),
    CONSTRAINT ck_usuarios_ocupacion
        CHECK (ocupacion IN ('estudiante', 'docente', 'administrador')),
    CONSTRAINT ck_usuarios_estado
        CHECK (estado IN ('activa', 'deshabilitada')),
    CONSTRAINT ck_usuarios_deshabilitado
        CHECK ((estado = 'deshabilitada') = (deshabilitado_en IS NOT NULL))
);

-- El correo se compara sin distinguir mayusculas (RF-01).
CREATE UNIQUE INDEX ux_usuarios_correo ON usuarios (lower(correo_institucional));
CREATE INDEX ix_usuarios_carrera ON usuarios (carrera);

-- Especializaciones de Usuario: una fila por cada usuario de ese tipo.
CREATE TABLE estudiantes (
    usuario_id INTEGER PRIMARY KEY REFERENCES usuarios (id) ON DELETE CASCADE,
    seccion    VARCHAR(30)
);

CREATE TABLE docentes (
    usuario_id   INTEGER PRIMARY KEY REFERENCES usuarios (id) ON DELETE CASCADE,
    departamento VARCHAR(120)
);

CREATE TABLE administradores (
    usuario_id   INTEGER PRIMARY KEY REFERENCES usuarios (id) ON DELETE CASCADE,
    nivel_acceso INTEGER NOT NULL DEFAULT 1 CHECK (nivel_acceso > 0)
);

-- Las etiquetas de carrera y ocupacion salen de la tabla usuarios.
CREATE TABLE perfiles (
    usuario_id    INTEGER PRIMARY KEY REFERENCES usuarios (id) ON DELETE CASCADE,
    foto_url      TEXT,
    encabezado_url TEXT,
    fondo_url     TEXT
);

-- Enlace de restablecimiento: de un solo uso y con vencimiento (RF-04).
-- Se guarda el hash del token, nunca el token.
CREATE TABLE tokens_recuperacion (
    id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER      NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expira_en  TIMESTAMPTZ  NOT NULL,
    usado_en   TIMESTAMPTZ,
    creado_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ix_tokens_usuario ON tokens_recuperacion (usuario_id);

-- ---------------------------------------------------------------------------
-- Publicaciones y documentacion (RF-06 a RF-11)
-- ---------------------------------------------------------------------------

CREATE TABLE publicaciones (
    id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    autor_id         INTEGER      NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    tipo             VARCHAR(20)  NOT NULL,
    titulo           VARCHAR(200) NOT NULL,
    carrera          VARCHAR(120) NOT NULL,
    asignatura       VARCHAR(120) NOT NULL,
    seccion          VARCHAR(30)  NOT NULL,
    descripcion      TEXT         NOT NULL,
    estado           VARCHAR(20)  NOT NULL DEFAULT 'activa',
    deshabilitado_en TIMESTAMPTZ,
    creado_en        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_publicaciones_tipo
        CHECK (tipo IN ('pregunta', 'solucion', 'guia')),
    CONSTRAINT ck_publicaciones_estado
        CHECK (estado IN ('activa', 'deshabilitada')),
    CONSTRAINT ck_publicaciones_deshabilitado
        CHECK ((estado = 'deshabilitada') = (deshabilitado_en IS NOT NULL))
);

CREATE INDEX ix_publicaciones_autor ON publicaciones (autor_id);
CREATE INDEX ix_publicaciones_carrera ON publicaciones (carrera);

-- Guia es una especializacion de Publicacion (RF-11).
CREATE TABLE guias (
    publicacion_id INTEGER PRIMARY KEY REFERENCES publicaciones (id) ON DELETE CASCADE,
    con_solucion   BOOLEAN NOT NULL DEFAULT FALSE,
    verificada     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE documentos (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo      VARCHAR(200)  NOT NULL,
    area        VARCHAR(120)  NOT NULL,
    archivo_url TEXT          NOT NULL,
    tamano_mb   NUMERIC(6, 2) NOT NULL CHECK (tamano_mb > 0),
    creado_en   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX ix_documentos_area ON documentos (area);

-- Lista privada del perfil (RF-08).
CREATE TABLE publicaciones_guardadas (
    usuario_id     INTEGER     NOT NULL REFERENCES perfiles (usuario_id) ON DELETE CASCADE,
    publicacion_id INTEGER     NOT NULL REFERENCES publicaciones (id) ON DELETE CASCADE,
    guardado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (usuario_id, publicacion_id)
);

CREATE TABLE documentos_guardados (
    usuario_id   INTEGER     NOT NULL REFERENCES perfiles (usuario_id) ON DELETE CASCADE,
    documento_id INTEGER     NOT NULL REFERENCES documentos (id) ON DELETE CASCADE,
    guardado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (usuario_id, documento_id)
);

-- ---------------------------------------------------------------------------
-- Moderacion (RF-12, RF-13, RNF-09)
-- Reportable es un usuario o una publicacion: cada fila apunta a uno solo.
-- ---------------------------------------------------------------------------

CREATE TABLE reportes (
    id                   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    denunciante_id       INTEGER     NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    usuario_reportado_id INTEGER     REFERENCES usuarios (id) ON DELETE CASCADE,
    publicacion_id       INTEGER     REFERENCES publicaciones (id) ON DELETE CASCADE,
    motivo               TEXT        NOT NULL,
    fecha                TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_reportes_objetivo
        CHECK (num_nonnulls(usuario_reportado_id, publicacion_id) = 1)
);

-- Cada usuario reporta una sola vez lo mismo: asi nadie deshabilita contenido solo.
CREATE UNIQUE INDEX ux_reportes_usuario
    ON reportes (denunciante_id, usuario_reportado_id)
    WHERE usuario_reportado_id IS NOT NULL;
CREATE UNIQUE INDEX ux_reportes_publicacion
    ON reportes (denunciante_id, publicacion_id)
    WHERE publicacion_id IS NOT NULL;
CREATE INDEX ix_reportes_usuario ON reportes (usuario_reportado_id);
CREATE INDEX ix_reportes_publicacion ON reportes (publicacion_id);

CREATE TABLE apelaciones (
    id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id       INTEGER     REFERENCES usuarios (id) ON DELETE CASCADE,
    publicacion_id   INTEGER     REFERENCES publicaciones (id) ON DELETE CASCADE,
    justificacion    TEXT        NOT NULL,
    estado           VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_limite     TIMESTAMPTZ NOT NULL,
    administrador_id INTEGER     REFERENCES administradores (usuario_id) ON DELETE SET NULL,
    resuelta_en      TIMESTAMPTZ,
    creado_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_apelaciones_objetivo
        CHECK (num_nonnulls(usuario_id, publicacion_id) = 1),
    CONSTRAINT ck_apelaciones_estado
        CHECK (estado IN ('pendiente', 'aceptada', 'rechazada'))
);

-- Solo una apelacion pendiente por cuenta o publicacion.
CREATE UNIQUE INDEX ux_apelaciones_usuario
    ON apelaciones (usuario_id) WHERE estado = 'pendiente' AND usuario_id IS NOT NULL;
CREATE UNIQUE INDEX ux_apelaciones_publicacion
    ON apelaciones (publicacion_id) WHERE estado = 'pendiente' AND publicacion_id IS NOT NULL;

-- Bitacora: sin claves foraneas, para conservarla aunque se elimine el objetivo.
CREATE TABLE registro_moderacion (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo_objetivo VARCHAR(20)  NOT NULL CHECK (tipo_objetivo IN ('usuario', 'publicacion')),
    objetivo_id   INTEGER      NOT NULL,
    accion        VARCHAR(40)  NOT NULL,
    responsable   VARCHAR(254) NOT NULL,
    fecha         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ix_registro_objetivo ON registro_moderacion (tipo_objetivo, objetivo_id);

-- ---------------------------------------------------------------------------
-- Cursos, grupos y talleres (RF-14 a RF-16, RF-21)
-- ---------------------------------------------------------------------------

CREATE TABLE grupos (
    id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre    VARCHAR(120) NOT NULL,
    creado_en TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE grupo_integrantes (
    grupo_id      INTEGER NOT NULL REFERENCES grupos (id) ON DELETE CASCADE,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes (usuario_id) ON DELETE CASCADE,
    PRIMARY KEY (grupo_id, estudiante_id)
);

CREATE INDEX ix_grupo_integrantes_estudiante ON grupo_integrantes (estudiante_id);

-- Nace 'solicitado' por un grupo; el docente lo abre y luego lo cierra.
CREATE TABLE cursos (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    docente_id      INTEGER      NOT NULL REFERENCES docentes (usuario_id) ON DELETE RESTRICT,
    nombre          VARCHAR(200) NOT NULL,
    objetivo        TEXT         NOT NULL,
    capacidad       INTEGER      CHECK (capacidad > 0),
    estado          VARCHAR(20)  NOT NULL DEFAULT 'solicitado',
    url_certificado TEXT,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_cursos_estado
        CHECK (estado IN ('solicitado', 'abierto', 'cerrado'))
);

CREATE INDEX ix_cursos_docente ON cursos (docente_id);

CREATE TABLE solicitudes_curso (
    grupo_id INTEGER     NOT NULL REFERENCES grupos (id) ON DELETE CASCADE,
    curso_id INTEGER     NOT NULL REFERENCES cursos (id) ON DELETE CASCADE,
    fecha    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (grupo_id, curso_id)
);

CREATE INDEX ix_solicitudes_curso ON solicitudes_curso (curso_id);

-- Interesados e ingresados se cuentan desde estas tablas (RF-15).
CREATE TABLE curso_interesados (
    curso_id      INTEGER NOT NULL REFERENCES cursos (id) ON DELETE CASCADE,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes (usuario_id) ON DELETE CASCADE,
    PRIMARY KEY (curso_id, estudiante_id)
);

CREATE TABLE curso_estudiantes (
    curso_id      INTEGER     NOT NULL REFERENCES cursos (id) ON DELETE CASCADE,
    estudiante_id INTEGER     NOT NULL REFERENCES estudiantes (usuario_id) ON DELETE CASCADE,
    ingresado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (curso_id, estudiante_id)
);

CREATE INDEX ix_curso_estudiantes_estudiante ON curso_estudiantes (estudiante_id);

CREATE TABLE talleres (
    id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre    VARCHAR(200) NOT NULL,
    capacidad INTEGER      NOT NULL CHECK (capacidad > 0)
);

-- Los inscritos se cuentan desde esta tabla (RF-16).
CREATE TABLE taller_inscripciones (
    taller_id     INTEGER     NOT NULL REFERENCES talleres (id) ON DELETE CASCADE,
    estudiante_id INTEGER     NOT NULL REFERENCES estudiantes (usuario_id) ON DELETE CASCADE,
    inscrito_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (taller_id, estudiante_id)
);

CREATE INDEX ix_taller_inscripciones_estudiante ON taller_inscripciones (estudiante_id);

-- ---------------------------------------------------------------------------
-- Chats (RF-17)
-- ---------------------------------------------------------------------------

CREATE TABLE chats (
    id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo      VARCHAR(20) NOT NULL CHECK (tipo IN ('individual', 'grupal')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_participantes (
    chat_id    INTEGER     NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    usuario_id INTEGER     NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    unido_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chat_id, usuario_id)
);

CREATE INDEX ix_chat_participantes_usuario ON chat_participantes (usuario_id);

CREATE TABLE invitaciones_chat (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chat_id        INTEGER     NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    remitente_id   INTEGER     NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    destinatario_id INTEGER    NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    estado         VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_invitaciones_estado
        CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
    CONSTRAINT ck_invitaciones_distintos
        CHECK (remitente_id <> destinatario_id),
    CONSTRAINT uq_invitaciones_chat UNIQUE (chat_id, destinatario_id)
);

CREATE INDEX ix_invitaciones_destinatario ON invitaciones_chat (destinatario_id);

-- Solo un participante del chat puede escribir en el. Si se elimina su cuenta,
-- el mensaje se conserva sin autor.
CREATE TABLE mensajes (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chat_id     INTEGER     NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    autor_id    INTEGER,
    contenido   TEXT        NOT NULL,
    fecha_envio TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_mensajes_participante
        FOREIGN KEY (chat_id, autor_id)
        REFERENCES chat_participantes (chat_id, usuario_id)
        ON DELETE SET NULL (autor_id)
);

CREATE INDEX ix_mensajes_chat ON mensajes (chat_id, fecha_envio);

COMMIT;

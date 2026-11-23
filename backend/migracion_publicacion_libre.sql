-- Actualiza una base creada con un tablas.sql anterior para aceptar la publicacion libre (RF-06).
-- Solo hace falta en bases que ya existian; una base nueva ya trae estos cambios.
--   psql -U postgres -d redsaber_db -f migracion_publicacion_libre.sql

BEGIN;

ALTER TABLE publicaciones
    ALTER COLUMN titulo     DROP NOT NULL,
    ALTER COLUMN carrera    DROP NOT NULL,
    ALTER COLUMN asignatura DROP NOT NULL,
    ALTER COLUMN seccion    DROP NOT NULL;

ALTER TABLE publicaciones DROP CONSTRAINT IF EXISTS ck_publicaciones_tipo;
ALTER TABLE publicaciones ADD CONSTRAINT ck_publicaciones_tipo
    CHECK (tipo IN ('pregunta', 'solucion', 'guia', 'publicacion'));

ALTER TABLE publicaciones DROP CONSTRAINT IF EXISTS ck_publicaciones_etiquetas;
ALTER TABLE publicaciones ADD CONSTRAINT ck_publicaciones_etiquetas
    CHECK (tipo = 'publicacion' OR (titulo IS NOT NULL AND carrera IS NOT NULL
           AND asignatura IS NOT NULL AND seccion IS NOT NULL));

COMMIT;

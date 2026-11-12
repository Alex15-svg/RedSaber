# RedSaber-0.1.0
Aplicación web prototipo basado en la comunidad de INACAP tomando como referencia redes sociales actuales como inspiración para el desarrollo de redSaber.

## Estructura

```
backend/            Servidor (Node.js + Express + PostgreSQL)
  src/              Código: app.js, config, middlewares, modulos y utils
  tablas.sql        Tablas de la base de datos
  .env.example      Plantilla de configuración (copiar como .env)
frontend/           Interfaz web en React (Vite)
  src/              Componentes, vistas y estilos (css/)
  public/img/       Glifo e íconos
  index.html        Página de entrada
README/             Documentacion.
```

## Cómo iniciar

1. Base de datos: crear la base en pgAdmin y ejecutar `backend/tablas.sql` en ella.
2. Configuración: copiar `backend/.env.example` como `backend/.env` y completar PostgreSQL y `JWT_SECRET`.
   `CORREOS_DOCENTES` y `CORREOS_ADMIN` (separados por coma) definen quién se registra como docente o administración.
3. Interfaz: `cd frontend`, luego `npm install` y `npm run build` (genera `frontend/dist`).
4. Servidor: `cd backend`, luego `npm install` y `npm start`.
5. Abrir http://localhost:3000/app

Para trabajar en la interfaz con recarga automática: con el servidor encendido, ejecutar `npm run dev` en `frontend`
y abrir http://localhost:5173/app (las llamadas a la API se reenvían al puerto 3000).

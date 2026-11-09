# RedSaber-0.1.0
Aplicación web prototipo basado en la comunidad de INACAP tomando como referencia redes sociales actuales como inspiración para el desarrollo de redSaber.

## Estructura

```
backend/            Servidor (Node.js + Express + PostgreSQL)
  src/              Código: app.js, config, middlewares, modulos y utils
  tablas.sql        Tablas de la base de datos
  .env.example      Plantilla de configuración (copiar como .env)
  package.json      Dependencias del servidor
frontend/           Interfaz web
  views/            Páginas HTML
  css/              Estilos
  js/               Scripts del navegador
docs/               Documentación del código
```

## Cómo iniciar el servidor

1. Entrar a la carpeta del servidor: `cd backend`
2. Instalar dependencias: `npm install`
3. Copiar `.env.example` como `.env` (dentro de `backend/`) y completar los datos de PostgreSQL y `JWT_SECRET`.
4. Crear la base en pgAdmin y ejecutar `tablas.sql` en ella.
5. Iniciar: `npm start` (o `node src/app.js`). Queda en http://localhost:3000

// Configuración de Vite para la interfaz React de RedSaber.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    // La interfaz se publica en http://localhost:3000/app (la sirve el backend).
    base: '/app/',
    build: { outDir: 'dist', emptyOutDir: true },
    // En desarrollo (npm run dev), las llamadas a /api y /uploads se reenvían al backend.
    server: {
        port: 5173,
        proxy: { '/api': 'http://localhost:3000', '/uploads': 'http://localhost:3000' }
    }
});

// Punto de entrada: carga el sistema visual y monta la aplicación en <div id="raiz">.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './css/tema.css';
import './css/base.css';
import './css/estructura.css';
import './css/componentes.css';
import './css/formularios.css';
import './css/vistas.css';
import './css/responsive.css';
import { Proveedores } from './contexto.jsx';
import App from './App.jsx';

createRoot(document.getElementById('raiz')).render(
    <StrictMode>
        <Proveedores>
            <App />
        </Proveedores>
    </StrictMode>
);

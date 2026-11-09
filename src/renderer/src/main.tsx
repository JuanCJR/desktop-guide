/**
 * Aquí arranca la interfaz (la parte visual de la app).
 *
 * Carga los estilos globales (`./styles/globals.css`) y le pide a React (la
 * librería con la que se construye la interfaz) que dibuje el componente
 * principal `App` (`./app.tsx`) dentro del contenedor #root de
 * `../index.html`.
 */
import './styles/globals.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

// Busca el contenedor donde se dibuja la app; si no existe, algo está muy mal.
const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

// StrictMode activa revisiones extra de React durante el desarrollo.
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

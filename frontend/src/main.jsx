import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Erro global capturado:', event?.error ?? event);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise não tratada:', event?.reason ?? event);
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

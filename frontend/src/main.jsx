import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

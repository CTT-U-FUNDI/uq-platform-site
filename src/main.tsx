// Capture toutes les erreurs et les envoie au backend
import { apiFetch } from './api/client';

window.onerror = (msg, src, line, col, err) => {
  const errorData = {
    message: String(msg),
    source: String(src),
    line: line,
    col: col,
    stack: err?.stack || '',
    url: window.location.href,
    timestamp: Date.now()
  };
  console.error('🔴 ERREUR:', errorData);
  apiFetch('/api/debug/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorData)
  }).catch(() => {});
};

// Capture aussi les rejets de promesses
window.addEventListener('unhandledrejection', (e) => {
  const errorData = {
    message: 'Unhandled promise rejection: ' + String(e.reason),
    stack: e.reason?.stack || '',
    url: window.location.href,
    timestamp: Date.now()
  };
  console.error('🔴 PROMESSE REJETÉE:', errorData);
  apiFetch('/api/debug/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorData)
  }).catch(() => {});
});
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

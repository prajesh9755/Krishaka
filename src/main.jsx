import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AdminApp } from './components/admin/AdminApp.jsx';
import './index.css';

const isAdmin = window.location.pathname.startsWith('/admin');
// Admin panel is English-only; mark it before Google Translate's script can run.
if (isAdmin) {
  document.documentElement.classList.add('notranslate');
  document.documentElement.setAttribute('translate', 'no');
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      {isAdmin ? <AdminApp /> : <App />}
    </StrictMode>,
  );
}

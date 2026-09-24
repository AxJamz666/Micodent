import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';
import AppErrorBoundary from './components/AppErrorBoundary';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* ✅ Toaster aquí arriba de todo — nunca tapado por nada */}
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '16px',
          fontWeight: '700',
          fontSize: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: '14px 18px',
          zIndex: 99999,
        },
        success: {
          style: {
            background: '#f0fdf4',
            color: '#15803d',
            border: '1px solid #bbf7d0',
          },
          iconTheme: { primary: '#22c55e', secondary: '#f0fdf4' },
        },
        error: {
          style: {
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
          },
          iconTheme: { primary: '#ef4444', secondary: '#fef2f2' },
        },
      }}
    />
    <AppErrorBoundary><App /></AppErrorBoundary>
  </StrictMode>
);

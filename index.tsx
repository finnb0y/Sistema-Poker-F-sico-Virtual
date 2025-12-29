import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; 

// ========================================
// Camada de Depuração
// ========================================

console.log('Iniciando aplicação...');
console.log('Timestamp:', new Date().toISOString());
console.log('Navegador:', navigator.userAgent);
console.log('URL atual:', window.location.href);

// Listener para DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM totalmente carregado.');
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Elemento root (#root) não encontrado.');
  } else {
    console.log('Elemento root encontrado:', rootElement);
  }
});

// Listener para erros globais
window.addEventListener('error', (event) => {
  console.error('Erro capturado:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

// Listener para Promises não tratadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise não capturada:', {
    reason: event.reason,
    promise: event.promise
  });
});

// ========================================
// Inicialização do React
// ========================================

console.log('Procurando elemento root...');
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Elemento root (#root) não encontrado. Aplicação não pode ser iniciada.');
  throw new Error("Could not find root element to mount to");
}
console.log('Elemento root encontrado, criando React root...');

const root = ReactDOM.createRoot(rootElement);
console.log('React root criado, renderizando aplicação...');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('Chamada de render do React concluída.');

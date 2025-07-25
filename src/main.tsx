import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ToastProvider from './components/ToastProvider.tsx'; // Import ToastProvider

console.log("main.tsx is executing!"); // Added for debugging

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider /> {/* Add ToastProvider here */}
    <App />
  </StrictMode>
);
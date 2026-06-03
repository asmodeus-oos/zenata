import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fix for 'write EIO' error in environments where stdout might be closed (e.g. Electron)
if (typeof process !== 'undefined' && process.stdout) {
  process.stdout.on('error', (err: any) => {
    if (err.code === 'EIO') return;
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

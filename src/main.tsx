import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// StrictMode disabled: See README "Known Limitations" section
createRoot(document.getElementById('root')!).render(
  <App />
);

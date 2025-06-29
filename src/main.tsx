// trait-solar-system/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';           // we'll create this next
import './styles/neon-theme.css';  // optional, for your styling

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

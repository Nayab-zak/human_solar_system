// src/App.tsx
import React from 'react';
import { ForceGraph3D } from './components/ForceGraph3D';

console.log('App loaded');

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', color: 'lime' }}>
      <h1>App is rendering</h1>
      <ForceGraph3D />
    </div>
  );
}

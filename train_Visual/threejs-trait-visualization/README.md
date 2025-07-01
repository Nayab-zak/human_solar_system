# Three.js Trait Visualization App

## Overview
This project is an interactive 3D visualization app built with TypeScript, React, and Three.js. It features a central neon node ("sun") and outer nodes orbiting in a galaxy/starfield background. The app includes physics-based animation, velocity arrows, interactive tooltips, day/night mode, a floating control panel, and real-time parameter adjustment.

## Features
- Neon-glowing spheres for nodes and sun
- Draggable nodes (including the sun) with physics-based movement
- Real-time physics simulation with velocity arrows
- Interactive, neomorphic tooltips on hover/click
- Day/night mode toggle
- Floating, compact, neomorphic control panel with icon buttons
- Real-time adjustment of node count, attributes, force constants, node/sun size and color, and angular speed
- Central node (sun) selection and customization
- Node orbit initialization (randomized)
- Camera lock/unlock, reset, and pan/zoom controls
- Performance optimization for up to 20 nodes
- Neon starfield background with interactive glow effect

## Usage
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm start
   ```
3. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Controls
- Use the floating control panel (bottom right) to adjust all simulation parameters in real time.
- Drag any node (including the sun) to reposition it. Dragging the sun moves all nodes with a springy effect.
- Click nodes to view tooltips. Only one tooltip is shown at a time.
- Use the camera controls to pan, zoom, lock/unlock, and reset the view.
- Toggle day/night mode with the button at the top right.

## File Structure
- `src/ThreeSceneComponent.tsx` — Main React component, UI logic, drag/tooltip logic
- `src/ThreeSceneCore.ts` — Three.js scene setup, animation, node creation, orbit logic, physics
- `src/ThreeSceneUtils.ts` — Utility functions, tooltips
- `src/ControlsPanel.tsx` — Neomorphic control panel
- `src/PerformanceService.ts` — Performance optimization
- `src/node.interface.ts`, `src/mock-data.ts`, `src/PhysicsService.ts` — Data and physics logic
- `public/index.html`, `package.json`, `tsconfig.json`, `webpack.config.js` — Project config

## Customization
- All simulation and visual parameters can be adjusted in real time via the control panel.
- The code is modular and easy to extend for new features or visual styles.

## License
MIT

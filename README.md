# Trait Solar System

A 3D force-directed graph visualization inspired by the solar system, built with React, React Three Fiber, and D3-force-3d.

## Features
- Interactive 3D force simulation with draggable nodes
- Neon glow and bloom effects (postprocessing)
- Customizable node count, colors, and physics via config
- Responsive and modern UI

## Quick Start

```sh
npm install
npm run dev
```
Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Configuration
- Edit `src/config/config.json` to tweak physics, display, and trait dimensions.
- Environment variables can be set in `.env` (see example in repo).

## Project Structure
- `src/components/ForceGraph3D.tsx` — Main 3D graph component
- `src/services/PhysicsService.ts` — Physics and force simulation logic
- `src/services/NodeService.ts` — Node generation and similarity
- `src/config/config.json` — Main config file

## Development
- Uses Vite for fast dev/build
- TypeScript for type safety
- See `.gitignore` for files excluded from git

## License
MIT

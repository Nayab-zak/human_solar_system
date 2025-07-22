# 🌌 Human Solar System - 3D Trait Visualization

An interactive 3D visualization system that represents human traits and preferences as nodes in a dynamic galaxy environment. Built with Angular, THREE.js, and advanced WebGL shaders.

![Project Preview](https://img.shields.io/badge/Status-Active-brightgreen) ![Angular](https://img.shields.io/badge/Angular-17+-red) ![THREE.js](https://img.shields.io/badge/THREE.js-Latest-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)

## ✨ Features

### 🎯 **3D Trait Visualization**
- **Dynamic Node System**: Represents individuals as 3D sprites with unique traits and preferences
- **Central Node Focus**: One node acts as the gravitational center with bright yellow highlighting
- **Compatibility Coloring**: Outer nodes are colored based on their compatibility with the central node
- **Physics-Based Animation**: Spring forces create natural, organic movement patterns

### 🌌 **Advanced Galaxy Background**
- **180,000+ Particle System**: Massive volumetric galaxy background with realistic depth and falloff
- **Custom GLSL Shaders**: Per-particle brightness attributes and gentle pocket push effects
- **Dynamic Repulsion**: Galaxy particles intelligently avoid node clusters
- **Color Zones**: Five distinct color regions from cyan core to magenta outer petals
- **Centralized Palette**: Consistent theming with carefully curated space colors

### 🎮 **Interactive Control Panel**
- **Minimizable Interface**: Clean, scrollable control panel that can be collapsed
- **Dynamic Central Switching**: Change the central node via dropdown - all nodes reposition smoothly
- **Physics Parameters**: Real-time adjustment of attraction, repulsion, damping, and angular speed
- **Visual Effects**: Control galaxy bend strength, twinkle speed, ambient rotation
- **Particle Controls**: Adjust galaxy clear zones, pocket push effects, and particle counts

### 🖱️ **Interactive Features**
- **Hover Tooltips**: Mouse over any node to see detailed trait and preference information
- **Smooth Transitions**: All interactions feature smooth animations and transitions
- **Responsive Design**: Works across different screen sizes and orientations
- **Real-time Updates**: Changes reflect immediately in the 3D visualization

### 🎨 **Visual Effects**
- **Bloom Post-Processing**: Glowing effects with adjustable strength
- **Volumetric Rendering**: Realistic depth and atmospheric effects
- **Custom Materials**: Specially designed glowing sprite materials
- **Smooth Animations**: 60fps performance with optimized rendering

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Angular CLI** (v17 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nayab-zak/human_solar_system.git
   cd human_solar_system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**

3. **Start the development server**
   ```bash
   npm start
   # or
   ng serve
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

## 🎛️ Usage Guide

### **Control Panel**
- **Minimize/Expand**: Click the ▲/▼ button to collapse/expand the control panel
- **Central Node**: Use the dropdown to switch which node acts as the central focus
- **Physics**: Adjust attraction/repulsion forces and damping for different movement styles
- **Galaxy**: Fine-tune background effects, particle counts, and visual parameters

### **Interactions**
- **Mouse Controls**: 
  - Left-click and drag to rotate the view
  - Right-click and drag to pan
  - Scroll wheel to zoom in/out
- **Tooltips**: Hover over any node to see its traits and preferences
- **Real-time**: All changes apply immediately to the visualization

## 🏗️ Architecture

### **Project Structure**
```
projects/
├── trait-viz/                    # Angular library
│   └── src/lib/
│       ├── control-panel/        # Interactive controls
│       ├── models/               # Data structures
│       ├── physics/              # Spring physics engine
│       ├── utils/                # Utility functions
│       ├── visual/               # Visual effects & materials
│       └── visualization/        # Main 3D component
└── trait-visualization-3d-demo/  # Demo application
```

### **Key Technologies**
- **Angular 17+**: Modern reactive framework
- **THREE.js**: WebGL 3D graphics library
- **TypeScript**: Type-safe development
- **SCSS**: Advanced styling with custom variables
- **WebGL Shaders**: Custom GLSL for advanced effects

## 🎨 Customization

### **Color Palette**
Located in `src/lib/visual/blueyard-palette.ts`:
```typescript
export const PAL_CYAN_LIGHT = new THREE.Color('#9fe9ff');
export const PAL_CYAN_CORE = new THREE.Color('#4fc9ff');
export const PAL_BLUE_CORE = new THREE.Color('#1a8dff');
// ... more colors
```

### **Physics Parameters**
Adjust in the control panel or modify defaults in `repo-spring-engine.ts`:
```typescript
const defaultConfig: RepoSpringConfig = {
  kAttraction: 1.0,
  kRepulsion: 1.0,
  damping: 0.95,
  angularSpeed: 0.25,
  restLength: 40
};
```

## 🔧 Development

### **Building**
```bash
# Build the library
ng build trait-viz

# Build the demo app
ng build trait-visualization-3d-demo
```

### **Testing**
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
### **Testing**
```bash
# Run unit tests
ng test

# Run e2e tests  
ng e2e
```

### **Linting**
```bash
# Check code style
ng lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📈 Roadmap

- [ ] **VR/AR Support**: WebXR integration for immersive experiences
- [ ] **Data Import**: Load trait data from CSV/JSON files
- [ ] **Export Features**: Save visualizations as images or videos
- [ ] **Clustering Algorithms**: Automatic grouping of similar nodes
- [ ] **Real-time Collaboration**: Multi-user visualization sessions
- [ ] **Mobile Optimization**: Touch controls and responsive design

## 🐛 Known Issues

- **Performance**: Large datasets (>100 nodes) may impact framerate
- **Browser Support**: Requires WebGL 2.0 support
- **Memory Usage**: Galaxy particles may consume significant GPU memory

## 📝 Changelog

### v1.0.0 (2025-01-19)
- ✨ Initial release with full 3D visualization
- 🌌 Advanced galaxy background with particle effects  
- 🎛️ Interactive control panel with minimization
- 🖱️ Node tooltips and hover interactions
- 🎯 Dynamic central node switching
- 🎨 Custom color palette and visual effects

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **THREE.js Community**: For the amazing 3D graphics library
- **Angular Team**: For the robust framework
- **WebGL Specifications**: For making advanced graphics possible
- **Open Source Contributors**: For inspiration and code examples

## 📞 Support

For support, questions, or feature requests:
- **GitHub Issues**: [Create an issue](https://github.com/Nayab-zak/human_solar_system/issues)
- **Documentation**: Check the inline code documentation
- **Examples**: Explore the demo application

---

**Made with ❤️ and lots of ☕ by the development team**

*Transform data into beautiful, interactive 3D experiences!* 🚀✨

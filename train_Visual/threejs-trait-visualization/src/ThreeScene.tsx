import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { initThreeScene, addCentralAndOuterNodes } from './ThreeSceneCore';

// FIX: Rename the legacy React component file to avoid import collision
// This file was previously ThreeScene.tsx and is now renamed to ThreeSceneLegacy.tsx

const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let spheres: THREE.Mesh[] = [];
    let raycaster: THREE.Raycaster;
    let mouse: THREE.Vector2;
    let hovered: THREE.Mesh | null = null;
    let originalEmissive: THREE.Color | null = null;
    let starfield: THREE.Points | null = null;
    let starfieldBasePositions: Float32Array | null = null;
    let lastNodeCenter = new THREE.Vector3();
    let starGlowFactors: number[] = [];

    if (mountRef.current) {
      const { scene, renderer, camera } = initThreeScene(mountRef.current);
      // --- Neon Starfield ---
      const starCount = 1200;
      const starGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(starCount * 3);
      const colors = new Float32Array(starCount * 3);
      const sizes = new Float32Array(starCount); // Per-star size
      starGlowFactors = new Array(starCount).fill(0);
      for (let i = 0; i < starCount; i++) {
        // Spread stars in a large sphere
        const r = 180 + Math.random() * 320;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        // Neon color palette: pink, blue, cyan, purple
        const neonColors = [
          [0.9, 0.1, 1.0], // magenta
          [0.1, 0.9, 1.0], // cyan
          [0.5, 0.2, 1.0], // purple
          [1.0, 0.3, 0.7], // pink
          [0.3, 1.0, 0.8], // teal
        ];
        const c = neonColors[Math.floor(Math.random() * neonColors.length)];
        colors[i * 3] = c[0];
        colors[i * 3 + 1] = c[1];
        colors[i * 3 + 2] = c[2];
        sizes[i] = 3.2;
      }
      starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      starfieldBasePositions = positions.slice();
      // Use a custom shader material for per-point size and color glow
      const starMaterial = new THREE.PointsMaterial({
        size: 3.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      starfield = new THREE.Points(starGeometry, starMaterial);
      scene.add(starfield);
      // --- Responsive glow effect ---
      let pointer = { x: 0, y: 0 };
      function updatePointerFromEvent(e: MouseEvent | TouchEvent) {
        let clientX = 0, clientY = 0;
        if ('touches' in e && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else if ('clientX' in e) {
          clientX = e.clientX;
          clientY = e.clientY;
        }
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      }
      renderer.domElement.addEventListener('mousemove', updatePointerFromEvent);
      renderer.domElement.addEventListener('touchmove', updatePointerFromEvent);

      import('./ThreeSceneCore').then(mod => {
        const { spheres, nodes } = mod.addCentralAndOuterNodes(scene);
        // Add click event for tooltips
        renderer.domElement.addEventListener('click', (event: MouseEvent) => {
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(spheres);
          if (intersects.length > 0) {
            const obj = intersects[0].object as THREE.Mesh;
            // Remove any existing tooltip
            document.querySelectorAll('.three-tooltip').forEach(el => el.remove());
            // Show a persistent tooltip near the mouse
            const tooltip = document.createElement('div');
            tooltip.textContent = obj === spheres[0] ? 'Central Node' : `Outer Node ${spheres.indexOf(obj)}`;
            tooltip.style.position = 'fixed';
            tooltip.style.left = `${event.clientX + 10}px`;
            tooltip.style.top = `${event.clientY + 10}px`;
            tooltip.style.background = 'linear-gradient(135deg, #2a003f 0%, #c300ff 100%)';
            tooltip.style.color = '#fff';
            tooltip.style.padding = '10px 18px';
            tooltip.style.borderRadius = '10px';
            tooltip.style.boxShadow = '0 4px 24px 0 #c300ff88, 0 1.5px 8px 0 #0008';
            tooltip.style.pointerEvents = 'auto';
            tooltip.style.zIndex = '10000';
            tooltip.style.fontSize = '1.1rem';
            tooltip.style.fontWeight = 'bold';
            tooltip.style.letterSpacing = '0.03em';
            tooltip.style.border = '2px solid #ff3366';
            tooltip.style.textShadow = '0 2px 8px #c300ff, 0 1px 2px #000';
            tooltip.style.transition = 'opacity 0.2s';
            tooltip.style.opacity = '0.98';
            // Style close button
            const closeBtn = document.createElement('span');
            closeBtn.textContent = ' ×';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.marginLeft = '12px';
            closeBtn.style.color = '#ff3366';
            closeBtn.style.fontWeight = 'bold';
            closeBtn.style.fontSize = '1.2em';
            closeBtn.style.textShadow = '0 1px 4px #c300ff';
            closeBtn.onclick = () => tooltip.remove();
            tooltip.appendChild(closeBtn);
            document.body.appendChild(tooltip);
          }
        });
      });

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      const onMouseMove = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      };
      renderer.domElement.addEventListener('mousemove', onMouseMove);

      const animate = () => {
        requestAnimationFrame(animate);
        // --- Starfield drift and subtle node reaction ---
        if (starfield && starfieldBasePositions) {
          const time = performance.now() * 0.00012;
          const positions = (starfield.geometry as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute;
          const colorsAttr = (starfield.geometry as THREE.BufferGeometry).attributes.color as THREE.BufferAttribute;
          const sizesAttr = (starfield.geometry as THREE.BufferGeometry).attributes.size as THREE.BufferAttribute;
          // Compute node center (average position)
          let nodeCenter = new THREE.Vector3();
          if (spheres && spheres.length > 0) {
            for (let i = 0; i < spheres.length; i++) nodeCenter.add(spheres[i].position);
            nodeCenter.multiplyScalar(1 / spheres.length);
          }
          // Subtle reaction: move stars slightly based on node center delta
          const nodeDelta = nodeCenter.clone().sub(lastNodeCenter);
          lastNodeCenter.copy(nodeCenter);
          // Project pointer to 3D ray for glow effect
          const pointerVec = new THREE.Vector3(pointer.x, pointer.y, 0.5).unproject(camera);
          for (let i = 0; i < positions.count; i++) {
            // Drift
            const baseX = starfieldBasePositions[i * 3];
            const baseY = starfieldBasePositions[i * 3 + 1];
            const baseZ = starfieldBasePositions[i * 3 + 2];
            positions.setX(i, baseX + Math.sin(time + i) * 6 + nodeDelta.x * 0.7);
            positions.setY(i, baseY + Math.cos(time * 0.7 + i * 0.5) * 6 + nodeDelta.y * 0.7);
            positions.setZ(i, baseZ + Math.sin(time * 0.5 + i * 0.3) * 6 + nodeDelta.z * 0.7);
            // --- Responsive glow: increase glow for stars near pointer ---
            const starPos = new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
            const dist = starPos.distanceTo(pointerVec);
            // Glow factor: 1.0 if very close, fades out with distance
            const glow = Math.max(0, 1.2 - dist / 30);
            // Animate a pulse for extra glow
            const pulse = 0.7 + 0.3 * Math.sin(time * 2 + i);
            starGlowFactors[i] += (glow * pulse - starGlowFactors[i]) * 0.18;
            // Set per-star size and color
            sizesAttr.setX(i, 3.2 + 12 * starGlowFactors[i]);
            // Make color more white as it glows
            const baseR = colorsAttr.getX(i);
            const baseG = colorsAttr.getY(i);
            const baseB = colorsAttr.getZ(i);
            colorsAttr.setX(i, Math.min(1, baseR + starGlowFactors[i] * 1.2));
            colorsAttr.setY(i, Math.min(1, baseG + starGlowFactors[i] * 1.2));
            colorsAttr.setZ(i, Math.min(1, baseB + starGlowFactors[i] * 1.2));
          }
          positions.needsUpdate = true;
          sizesAttr.needsUpdate = true;
          colorsAttr.needsUpdate = true;
        }
        // --- Node hover effect ---
        if (spheres.length > 0) {
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(spheres);
          if (intersects.length > 0) {
            const obj = intersects[0].object as THREE.Mesh;
            const mat = obj.material as THREE.MeshPhysicalMaterial;
            if (hovered !== obj) {
              if (hovered && originalEmissive) {
                (hovered.material as THREE.MeshPhysicalMaterial).emissive.set(originalEmissive);
              }
              hovered = obj;
              originalEmissive = mat.emissive.clone();
              mat.emissive.set('#FFFF00');
            }
          } else if (hovered && originalEmissive) {
            (hovered.material as THREE.MeshPhysicalMaterial).emissive.set(originalEmissive);
            hovered = null;
            originalEmissive = null;
          }
        }
      };
      animate();

      return () => {
        renderer.domElement.removeEventListener('mousemove', updatePointerFromEvent);
        renderer.domElement.removeEventListener('touchmove', updatePointerFromEvent);
        if (starfield) scene.remove(starfield);
        renderer.dispose();
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
    }
  }, []);

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }} />;
};

export default ThreeScene;

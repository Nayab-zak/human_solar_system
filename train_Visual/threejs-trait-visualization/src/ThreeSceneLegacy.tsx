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

    if (mountRef.current) {
      const { scene, renderer, camera } = initThreeScene(mountRef.current);
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

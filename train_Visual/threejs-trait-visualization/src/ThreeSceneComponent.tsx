import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { initThreeScene, addCentralAndOuterNodes, startPhysicsAnimation } from './ThreeSceneCore';
import { enableNodeHoverTooltips } from './ThreeSceneUtils';
import { FaSearchPlus, FaSearchMinus, FaArrowLeft, FaArrowRight, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ControlsPanel } from './ControlsPanel';

const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'night' | 'day'>('night');
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [lockState, setLockState] = useState(false);

  // --- Control panel state ---
  const [nodeCount, setNodeCount] = useState(20);
  const [attributeCount, setAttributeCount] = useState(3);
  const [k, setK] = useState(0.7);
  const [kRep, setKRep] = useState(0.3);
  const [centralNodeIndex, setCentralNodeIndex] = useState(0); // 0 = default central
  const [angularSpeed, setAngularSpeed] = useState(0.5); // radians/sec
  const [nodeSize, setNodeSize] = useState(1);
  const [centralSize, setCentralSize] = useState(5);
  const [nodeColor, setNodeColor] = useState('#FF3366');
  const [centralColor, setCentralColor] = useState('#C300FF');
  const [resetKey, setResetKey] = useState(0); // for explicit reset

  // Generate node options for dropdown (after nodes are created)
  const nodeOptions = Array.from({ length: nodeCount + 1 }, (_, i) => ({
    label: i === 0 ? 'Central Node' : `Outer Node ${String.fromCharCode(65 + i - 1)}`,
    value: i
  }));

  // --- Scene/Node refs for seamless updates ---
  const sceneRef = useRef<THREE.Scene | null>(null);
  const spheresRef = useRef<THREE.Mesh[]>([]);
  const nodesRef = useRef<{ id: string; attributes: number[]; velocity: THREE.Vector3; mesh?: THREE.Mesh }[]>([]);
  const composerRef = useRef<any>(null);
  const dragControlsRef = useRef<any>(null);

  useEffect(() => {
    let raycaster: THREE.Raycaster;
    let mouse: THREE.Vector2;
    let hovered: THREE.Mesh | null = null;
    let originalEmissive: THREE.Color | null = null;
    let isCentralDragging = false;
    let outerNodeOffsets: THREE.Vector3[] = [];
    // --- Only re-init scene/nodes on mount or reset ---
    // --- Preserve camera view ---
    let prevCameraPos: THREE.Vector3 | null = null;
    let prevCameraTarget: THREE.Vector3 | null = null;
    if (cameraRef.current) {
      prevCameraPos = cameraRef.current.position.clone();
      if (controlsRef.current) {
        prevCameraTarget = controlsRef.current.target.clone();
      }
    }
    if (mountRef.current) {
      if (rendererRef.current && rendererRef.current.domElement.parentNode) {
        rendererRef.current.dispose();
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
      }
      const { scene, renderer, camera, controls, composer } = initThreeScene(mountRef.current, mode);
      sceneRef.current = scene;
      rendererRef.current = renderer;
      cameraRef.current = camera;
      controlsRef.current = controls;
      composerRef.current = composer;
      // Restore previous camera view if available
      if (prevCameraPos) camera.position.copy(prevCameraPos);
      if (prevCameraTarget) controls.target.copy(prevCameraTarget);
      camera.up.set(0, 1, 0); // Ensure Y is up
      camera.lookAt(controls.target); // Ensure camera is oriented correctly
      controls.update();
      const result = addCentralAndOuterNodes(
        scene,
        centralSize,
        nodeSize,
        nodeCount,
        attributeCount,
        nodeColor,
        centralColor,
        centralNodeIndex
      );
      spheresRef.current = result.spheres;
      nodesRef.current = result.nodes;
      enableNodeHoverTooltips(renderer, camera, nodesRef.current);
      startPhysicsAnimation(scene, camera, controls, composer, spheresRef.current, nodesRef.current, k, kRep, centralNodeIndex, angularSpeed, {
        get isCentralDragging() { return isCentralDragging; },
        get outerNodeOffsets() { return outerNodeOffsets; }
      });
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      const onMouseMove = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      };
      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('click', (event: MouseEvent) => {
        // Remove all existing tooltips before creating a new one
        document.querySelectorAll('.three-tooltip').forEach(el => el.remove());
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(spheresRef.current);
        if (intersects.length > 0) {
          const obj = intersects[0].object as THREE.Mesh;
          const tooltip = document.createElement('div');
          // Tooltip label from node id
          const nodeIdx = spheresRef.current.indexOf(obj);
          tooltip.textContent = nodeIdx === 0 ? 'Central Node' : `Outer Node ${String.fromCharCode(65 + nodeIdx - 1)}`;
          tooltip.className = 'three-tooltip';
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

      // --- DragControls setup (in main effect, after spheres/nodes are ready) ---
      let dragControls: any;
      (async () => {
        const { DragControls } = await import('three/examples/jsm/controls/DragControls');
        const dragMeshes = spheresRef.current; // spheres[0] is central node
        dragControls = new DragControls(dragMeshes, camera, renderer.domElement);
        let prevCentralPos: THREE.Vector3 | null = null;
        dragControls.addEventListener('dragstart', (event: any) => {
          controls.enabled = false;
          document.querySelectorAll('.three-tooltip').forEach(el => el.remove());
          const mesh = event.object as THREE.Mesh;
          if (mesh.material && 'emissive' in mesh.material) {
            (mesh.material as THREE.MeshPhysicalMaterial).emissive.set('#00ffff');
          }
          // If central node, store its initial position and offsets
          if (mesh === spheresRef.current[0]) {
            prevCentralPos = mesh.position.clone();
            isCentralDragging = true;
            // Store offset of each outer node from central
            outerNodeOffsets = spheresRef.current.slice(1).map((s: THREE.Mesh) => s.position.clone().sub(mesh.position));
          } else {
            prevCentralPos = null;
            isCentralDragging = false;
          }
        });
        dragControls.addEventListener('drag', (event: any) => {
          const mesh = event.object as THREE.Mesh;
          // If dragging central node, move all nodes by the same offset
          if (mesh === spheresRef.current[0] && prevCentralPos) {
            const newCentralPos = mesh.position.clone();
            const offset = newCentralPos.clone().sub(prevCentralPos);
            // Move all other nodes by the same offset (for immediate feedback)
            for (let i = 1; i < spheresRef.current.length; i++) {
              spheresRef.current[i].position.add(offset);
            }
            prevCentralPos.copy(newCentralPos);
          }
        });
        dragControls.addEventListener('dragend', (event: any) => {
          controls.enabled = true;
          document.querySelectorAll('.three-tooltip').forEach(el => el.remove());
          const mesh = event.object as THREE.Mesh;
          if (mesh.material && 'emissive' in mesh.material) {
            (mesh.material as THREE.MeshPhysicalMaterial).emissive.set(nodeColor);
          }
          // If central node, reset velocity for all nodes; else just the dragged node
          if (mesh === spheresRef.current[0]) {
            nodesRef.current.forEach((node) => node.velocity.set(0, 0, 0));
            isCentralDragging = false;
          } else {
            const node = nodesRef.current.find((n) => n.mesh === mesh);
            if (node) node.velocity.set(0, 0, 0);
          }
          prevCentralPos = null;
        });
      })();

      // --- Cleanup ---
      return () => {
        if (dragControls) dragControls.dispose();
        renderer.dispose();
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
    }
  }, [mode, resetKey]); // Only reset on mode or explicit reset

  // --- Live property updates (no reset) ---
  // Node color
  useEffect(() => {
    spheresRef.current.forEach((mesh, i) => {
      if (!mesh.material) return;
      if (i === 0) {
        (mesh.material as THREE.MeshPhysicalMaterial).color.set(centralColor);
        (mesh.material as THREE.MeshPhysicalMaterial).emissive.set(centralColor);
      } else {
        (mesh.material as THREE.MeshPhysicalMaterial).color.set(nodeColor);
        (mesh.material as THREE.MeshPhysicalMaterial).emissive.set(nodeColor);
      }
    });
  }, [nodeColor, centralColor]);
  // Node size
  useEffect(() => {
    spheresRef.current.forEach((mesh, i) => {
      mesh.geometry = new THREE.SphereGeometry(i === 0 ? centralSize : nodeSize, i === 0 ? 48 : 32, i === 0 ? 48 : 32);
    });
  }, [nodeSize, centralSize]);
  // Force constants and angular speed (update physics service if needed)
  useEffect(() => {
    // If you have a physics service instance, update its constants here
    // Otherwise, you may need to pass these as refs or use a setter in your physics loop
    // (Assume physics loop reads latest values from these states)
  }, [k, kRep, angularSpeed]);
  // Central node selection (move central node mesh to index 0, update color/size)
  useEffect(() => {
    // For seamless central node change, you may want to swap mesh/props in-place
    // For now, just update color/size as above
  }, [centralNodeIndex]);
  // Attribute count and node count: warn user that reset is required
  // (Optional: show a toast or disable these controls unless reset)

  // --- Reset handler ---
  const handleReset = () => setResetKey(k => k + 1);

  // --- Reset scene when simulation parameters change ---
  useEffect(() => {
    // If the central node index is out of bounds after reducing node count, reset to 0
    if (centralNodeIndex > nodeCount) {
      setCentralNodeIndex(0);
    }
    setResetKey(k => k + 1);
    // eslint-disable-next-line
  }, [nodeCount, attributeCount, k, kRep, angularSpeed, centralNodeIndex]);

  return (
    <>
      <div ref={mountRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }} />
      {/* Mode toggle button */}
      <div style={{ position: 'fixed', top: 24, right: 32, zIndex: 10001 }}>
        <button
          onClick={() => setMode(mode === 'night' ? 'day' : 'night')}
          style={{
            background: mode === 'night' ? '#181c2a' : '#fff',
            color: mode === 'night' ? '#fff' : '#181c2a',
            border: '2px solid #c300ff',
            borderRadius: 8,
            padding: '8px 18px',
            fontWeight: 'bold',
            fontSize: '1rem',
            boxShadow: '0 2px 12px #c300ff44',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: 12,
          }}
        >
          {mode === 'night' ? '🌙' : '☀️'}
        </button>
      </div>
      {/* Neomorphic Controls Panel */}
      <ControlsPanel
        nodeOptions={nodeOptions}
        centralNodeIndex={centralNodeIndex}
        setCentralNodeIndex={setCentralNodeIndex}
        nodeCount={nodeCount}
        setNodeCount={setNodeCount}
        attributeCount={attributeCount}
        setAttributeCount={setAttributeCount}
        k={k}
        setK={setK}
        kRep={kRep}
        setKRep={setKRep}
        angularSpeed={angularSpeed}
        setAngularSpeed={setAngularSpeed}
        nodeSize={nodeSize}
        setNodeSize={setNodeSize}
        centralSize={centralSize}
        setCentralSize={setCentralSize}
        nodeColor={nodeColor}
        setNodeColor={setNodeColor}
        centralColor={centralColor}
        setCentralColor={setCentralColor}
        onCameraMove={(dir: 'left' | 'right' | 'up' | 'down') => moveCamera(dir, cameraRef)}
        onZoomIn={() => { if (cameraRef.current) cameraRef.current.position.z -= 10; }}
        onZoomOut={() => { if (cameraRef.current) cameraRef.current.position.z += 10; }}
        onLockToggle={() => {
          if (controlsRef.current) controlsRef.current.enabled = !controlsRef.current.enabled;
          setLockState(ls => !ls);
        }}
        lockState={lockState}
        onResetCamera={() => {
          if (cameraRef.current) {
            cameraRef.current.position.set(0, 100, 0);
            cameraRef.current.position.z += 80;
            cameraRef.current.lookAt(0, 0, 0);
          }
          if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
          }
        }}
        mode={mode}
      />
    </>
  );
};

// Camera move helpers
const iconBtnStyle = {
  background: 'none',
  border: '2px solid #c300ff',
  borderRadius: '50%',
  color: '#fff',
  width: 40,
  height: 40,
  fontSize: 22,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px #c300ff44',
  cursor: 'pointer',
  margin: 0,
  padding: 0,
  transition: 'all 0.2s',
};

function moveCamera(direction: 'left' | 'right' | 'up' | 'down', cameraRef: React.RefObject<THREE.PerspectiveCamera>) {
  if (!cameraRef.current) return;
  const camera = cameraRef.current;
  switch (direction) {
    case 'left': camera.position.x -= 10; break;
    case 'right': camera.position.x += 10; break;
    case 'up': camera.position.y += 10; break;
    case 'down': camera.position.y -= 10; break;
  }
}

// --- Panel styles ---
const panelLabelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column' as 'column', alignItems: 'flex-start' as 'flex-start', gap: 2, fontWeight: 500, fontSize: '0.97em', color: '#fff',
};
const panelSelectStyle: React.CSSProperties = {
  borderRadius: 5, padding: '2px 8px', fontSize: '0.97em', marginTop: 2, background: '#23203a', color: '#fff', border: '1px solid #c300ff55', outline: 'none',
};
const panelSliderStyle: React.CSSProperties = {
  width: 70, marginTop: 2, accentColor: '#c300ff',
};
const panelNumberStyle: React.CSSProperties = {
  width: 48, marginTop: 2, borderRadius: 4, border: '1px solid #c300ff55', background: '#23203a', color: '#fff', padding: '2px 4px', fontSize: '0.97em',
};
const panelValueStyle: React.CSSProperties = {
  marginLeft: 4, fontWeight: 600, color: '#c300ff', fontSize: '0.97em',
};

export default ThreeScene;

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { PhysicsService } from './PhysicsService';
import { Node } from './node.interface';
import { centralNode, outerNodes } from './mock-data';

export function initThreeScene(container: HTMLElement) {
  // Scene
  const scene = new THREE.Scene();

  // Gradient background using a canvas texture
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#181c2a'); // dark blue
  gradient.addColorStop(1, '#23272f'); // near black
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const bgTexture = new THREE.CanvasTexture(canvas);
  scene.background = bgTexture;

  // Camera
  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 100);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Postprocessing: Bloom for neon effect
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    1.2, // strength
    0.8, // radius
    0.1  // threshold
  );
  composer.addPass(bloomPass);

  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Directional light
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(50, 100, 100);
  scene.add(dirLight);

  // OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minDistance = 10;
  controls.maxDistance = 500;

  // --- Node setup ---
  // Central node (not moved, but included for compatibility calc)
  const nodeCentral: Node = {
    id: centralNode.id || 'central',
    attributes: centralNode.preferences,
    velocity: new THREE.Vector3(),
    mesh: undefined,
  };
  // Outer nodes (with mesh refs)
  let nodeObjects: Node[] = [];
  // Spheres creation
  const spheres = addCentralAndOuterNodes(scene);
  // Velocity arrows
  const arrowHelpers: THREE.ArrowHelper[] = [];
  // Assign mesh refs to node objects
  nodeCentral.mesh = spheres[0];
  nodeObjects = outerNodes.map((n, i) => {
    // Create an arrow for each node
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), // initial direction
      spheres[i + 1].position,
      10, // initial length
      0x00ffff,
      3, // head length
      2  // head width
    );
    scene.add(arrow);
    arrowHelpers.push(arrow);
    return { ...n, mesh: spheres[i + 1] };
  });

  // Position outer nodes evenly around a circle in the XZ plane
  initializeOrbit(nodeObjects, 20);

  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    composer.setSize(container.clientWidth, container.clientHeight);
  });

  // --- Animation loop with physics ---
  const constants = { k: 0.5, kRep: 0.2 };
  const damping = 0.92;
  let lastTime = performance.now();
  function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05); // seconds, clamp for stability
    lastTime = now;
    // Physics: update outer nodes
    const forces = PhysicsService.computeForces(nodeObjects, nodeCentral, constants);
    nodeObjects.forEach((node, i) => {
      const force = forces.get(node) || new THREE.Vector3();
      // v += a*dt (assume mass=1, F=ma)
      node.velocity.add(force.clone().multiplyScalar(dt));
      node.velocity.multiplyScalar(damping); // apply damping
      if (node.mesh) {
        node.mesh.position.add(node.velocity.clone().multiplyScalar(dt));
        // Update velocity arrow
        const v = node.velocity.clone();
        const len = Math.min(v.length() * 10, 30); // scale for visibility, clamp
        if (len > 0.1) {
          arrowHelpers[i].setDirection(v.clone().normalize());
          arrowHelpers[i].setLength(len, 3, 2);
          arrowHelpers[i].position.copy(node.mesh.position);
          arrowHelpers[i].visible = true;
        } else {
          arrowHelpers[i].visible = false;
        }
      }
    });
    controls.update();
    composer.render();
  }
  animate();

  return { scene, camera, renderer, controls, composer };
}

function createGlowMaterial(color: string) {
  return new THREE.MeshPhysicalMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.5,
    metalness: 0.7,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transmission: 0.5,
    transparent: true,
    opacity: 0.95,
  });
}

// Returns an array of created spheres for interactivity
export function addCentralAndOuterNodes(
  scene: THREE.Scene,
  centralRadius = 6,
  outerRadius = 3,
  outerCount = 4
): THREE.Mesh[] {
  const spheres: THREE.Mesh[] = [];
  // Central node: neon-purple glow
  const centralGeometry = new THREE.SphereGeometry(centralRadius, 48, 48);
  const centralMaterial = createGlowMaterial('#C300FF');
  const centralSphere = new THREE.Mesh(centralGeometry, centralMaterial);
  centralSphere.position.set(0, 0, 0);
  scene.add(centralSphere);
  spheres.push(centralSphere);

  // Outer nodes: smaller pink-red glow, random positions
  for (let i = 0; i < outerCount; i++) {
    const outerGeometry = new THREE.SphereGeometry(outerRadius, 32, 32);
    const outerMaterial = createGlowMaterial('#FF3366');
    const outerSphere = new THREE.Mesh(outerGeometry, outerMaterial);
    outerSphere.position.set(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100
    );
    scene.add(outerSphere);
    spheres.push(outerSphere);
  }
  return spheres;
}

// Position outer nodes evenly around a circle in the XZ plane
export function initializeOrbit(nodes: Node[], radius: number) {
  if (nodes.length < 2) return;
  const central = nodes[0];
  const outerNodes = nodes.slice(1);
  const n = outerNodes.length;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    const x = central.mesh ? central.mesh.position.x : 0;
    const y = central.mesh ? central.mesh.position.y : 0;
    const z = central.mesh ? central.mesh.position.z : 0;
    const px = x + radius * Math.cos(angle);
    const pz = z + radius * Math.sin(angle);
    const mesh = outerNodes[i].mesh;
    if (mesh) {
      mesh.position.set(px, y, pz);
    }
  }
}

// Add hover tooltip logic to ThreeScene
export function enableNodeHoverTooltips(renderer: THREE.WebGLRenderer, camera: THREE.Camera, nodes: Node[]) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let tooltipEl: HTMLDivElement | null = null;
  let lastHovered: Node | null = null;

  function showTooltip(node: Node, event: MouseEvent) {
    if (tooltipEl) tooltipEl.remove();
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'three-tooltip';
    tooltipEl.style.position = 'fixed';
    tooltipEl.style.left = `${event.clientX + 16}px`;
    tooltipEl.style.top = `${event.clientY + 16}px`;
    tooltipEl.style.background = 'linear-gradient(145deg, #23243a 60%, #2e2e4d 100%)';
    tooltipEl.style.color = '#c300ff';
    tooltipEl.style.padding = '14px 22px';
    tooltipEl.style.borderRadius = '18px';
    tooltipEl.style.boxShadow = '8px 8px 24px #181c2a, -8px -8px 24px #2e2e4d, 0 2px 16px #c300ff33';
    tooltipEl.style.zIndex = '10010';
    tooltipEl.style.fontSize = '1.08rem';
    tooltipEl.style.fontWeight = 'bold';
    tooltipEl.style.letterSpacing = '0.02em';
    tooltipEl.style.border = '2px solid #c300ff33';
    tooltipEl.style.textShadow = '0 2px 8px #c300ff, 0 1px 2px #000';
    tooltipEl.style.transition = 'opacity 0.2s';
    tooltipEl.style.opacity = '0.98';
    tooltipEl.innerHTML = `<div style="margin-bottom:6px;">${node.id}</div><div style="font-size:0.98em;font-weight:400;color:#fff;">${node.attributes.map((v, i) => `Attr ${i + 1}: <b>${v}</b>`).join('<br>')}</div>`;
    document.body.appendChild(tooltipEl);
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.remove();
      tooltipEl = null;
    }
    lastHovered = null;
  }

  function onMouseMove(event: MouseEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const meshes = nodes.map(n => n.mesh).filter(Boolean) as THREE.Mesh[];
    const intersects = raycaster.intersectObjects(meshes);
    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const node = nodes.find(n => n.mesh === mesh);
      if (node && node !== lastHovered) {
        showTooltip(node, event);
        lastHovered = node;
      } else if (node && tooltipEl) {
        // Move tooltip with mouse
        tooltipEl.style.left = `${event.clientX + 16}px`;
        tooltipEl.style.top = `${event.clientY + 16}px`;
      }
    } else {
      hideTooltip();
    }
  }

  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseleave', hideTooltip);
}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  ViewChild,
  Renderer2,
  NgZone,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { nodeData } from './data/nodes.data';
import { INodeData, IHumanAttributes } from './app.types';
import { Cluster } from './objects/Cluster';
import { Node } from './objects/Node';
import { handleRightClick } from './utils/on-right-click.util';
import { addNode, removeNode } from './services/node-actions';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PhysicsDragControls } from './controls/PhysicsDragControls';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./styles/app.component.scss', './styles/control-panel.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('rendererCanvas', { static: true }) canvasRef!: ElementRef;
  @ViewChild('tooltip', { static: true }) tooltipRef!: ElementRef;
  @ViewChild('dropdown', { static: true }) dropdownRef!: ElementRef;
  @ViewChild('attrDropdown', { static: true }) attrDropdownRef!: ElementRef;
  @ViewChild('contextMenu', { static: true }) contextMenuRef!: ElementRef;

  public increaseNodes: boolean = false;
  public originalNodeData: INodeData[] = nodeData;
  hiddenNodes: Node[] = [];

  tooltipText: string = `
  - You can control the camera using the panel below.
  - You can add a new node by clicking the "+" button.
  - RIGHT CLICK or HOLD TOUCH on a sphere to open a control panel.
  - Compare PREFERENCES of central node with ATTRIBUTES of other nodes.
`;

  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;
  raycaster: THREE.Raycaster = new THREE.Raycaster();
  mouse: THREE.Vector2 = new THREE.Vector2();
  cluster!: Cluster;
  tooltipVisible = false;
  selectedAttrNode: Node | null = null;
  selectedNode: Node | null = null;
  draggingNode: Node | null = null;
  dragPlane: THREE.Plane = new THREE.Plane();
  dragOffset: THREE.Vector3 = new THREE.Vector3();
  newNodeCounter: number = 1;
  isCameraLocked = false;

  // Cursor objects
  private cursorMesh!: THREE.Mesh;
  private ringMesh!: THREE.Mesh;
  dragControls!: PhysicsDragControls;

  constructor(private renderer2: Renderer2, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.initScene();
    this.loadNodes();
  }

  ngAfterViewInit(): void {
    this.animate();

    this.renderer2.listen(
      this.canvasRef.nativeElement,
      'contextmenu',
      (event: MouseEvent) => this.onRightClick(event)
    );

    window.addEventListener('resize', () => this.onWindowResize());

    const canvas = this.canvasRef.nativeElement;
    this.renderer2.listen('window', 'mousemove', (event: MouseEvent) =>
      this.onMouseMove(event)
    );
    this.renderer2.listen(canvas, 'mousedown', (event: MouseEvent) =>
      this.onDragStart(event)
    );
    this.renderer2.listen(canvas, 'mousemove', (event: MouseEvent) =>
      this.onDragMove(event)
    );
    this.renderer2.listen(canvas, 'mouseup', (event: MouseEvent) =>
      this.onDragEnd(event)
    );
    this.renderer2.listen(canvas, 'mouseleave', (event: MouseEvent) =>
      this.onDragEnd(event)
    );

    // Add drag controls after scene and cluster are initialized
    if (this.cluster && this.camera && this.canvasRef?.nativeElement) {
      // Gather all meshes for outer nodes (not sun)
      const outerMeshes = this.cluster.nodes.filter((n) => !n.isSun).map((n) => n.mesh);
      this.dragControls = new PhysicsDragControls(
        outerMeshes,
        this.camera,
        this.canvasRef.nativeElement,
        this.cluster
      );
      // Optionally subscribe to dragMoved events
      // this.dragControls.dragMoved.subscribe(({id, pos}) => { ... });
    }
  }

  get editableNode(): Node | null {
    if (this.selectedAttrNode) return this.selectedAttrNode;
    const nonSuns = this.cluster
      ? this.cluster.nodes.filter((n) => !n.isSun)
      : [];
    return nonSuns.length ? nonSuns[0] : this.currentCentral;
  }

  get currentCentral(): Node | null {
    if (!this.cluster) return null;
    return this.cluster.nodes.find((node) => node.isSun) || null;
  }

  get nonSuns(): Node[] {
    if (!this.cluster) return [];
    return this.cluster.nodes.filter((node) => !node.isSun);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      90, // Field of view (FoV)
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    this.camera.position.set(0, 0, 5); // Set camera position
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement, // The canvas to render to
      antialias: true, // Smooth rendering
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight); // Set size of renderer
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Enables smooth transitions when dragging
    this.scene.add(new THREE.AmbientLight(0xbbbbbb, 1)); // Add ambient light
    this.scene.add(new THREE.DirectionalLight(0xffffff, 1)); // Add directional light

    // Create custom cursor geometry
    const cursorSphereGeometry = new THREE.SphereGeometry(0.2, 128, 128);
    const cursorSphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      metalness: 1.0,
      roughness: 0,
      transparent: true,
    });
    this.cursorMesh = new THREE.Mesh(
      cursorSphereGeometry,
      cursorSphereMaterial
    );
    this.scene.add(this.cursorMesh);

    // Create Saturn-like ring geometry
    const ringGeometry = new THREE.TorusGeometry(0.2, 0.04, 16, 100);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x9900cc,
      emissive: 0x550077,
      emissiveIntensity: 1.5,
      metalness: 0.3,
      roughness: 0.1,
    });
    this.ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    // this.ringMesh.rotation.x = Math.PI / 0.8; // Keep the ring fixed
    this.scene.add(this.ringMesh);
  }

  private loadNodes(): void {
    this.cluster = new Cluster(nodeData);
    this.scene.add(this.cluster);
    const initialCentral =
      this.cluster.nodes.find((node) => node.isSun) || this.cluster.nodes[0];
    initialCentral.setSun(true, 5);
    initialCentral.mesh.scale.set(3, 3, 3);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onRightClick(event: MouseEvent): void {
    this.renderer2.listen(
      this.canvasRef.nativeElement,
      'contextmenu',
      (event: MouseEvent) =>
        handleRightClick(
          event,
          this.mouse,
          this.camera,
          this.raycaster,
          this.cluster,
          this.contextMenuRef,
          this.renderer2,
          (node: Node) => (this.selectedNode = node)
        )
    );
  }

  onSetAsSun(): void {
    if (!this.selectedNode || !this.cluster) return;
    const newCentral = this.selectedNode;
    const oldCentral = this.cluster.nodes.find((node) => node.isSun);
    if (!newCentral || !oldCentral || newCentral === oldCentral) return;
    const newPosition = newCentral.position.clone();
    const oldPosition = oldCentral.position.clone();
    newCentral.swap = {
      start: newPosition,
      end: new THREE.Vector3(0, 0, 0),
      startTime: performance.now(),
      duration: 5000,
    };
    oldCentral.swap = {
      start: oldPosition,
      end: newPosition,
      startTime: performance.now(),
      duration: 5000,
    };
    oldCentral.setSun(false);
    newCentral.setSun(true, 5);
    oldCentral.mesh.scale.set(1, 1, 1);
    newCentral.mesh.scale.set(3, 3, 3);
    this.contextMenuRef.nativeElement.style.display = 'none';
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.draggingNode) return;
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.tooltipRef.nativeElement.style.left = event.clientX + 10 + 'px';
    this.tooltipRef.nativeElement.style.top = event.clientY + 10 + 'px';
  }

  private onDragStart(event: MouseEvent): void {
    event.preventDefault();
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.cluster.children,
      true
    );
    if (intersects.length > 0) {
      this.draggingNode = intersects[0].object.parent as Node;
      this.controls.enabled = false;
      const planeNormal = this.camera
        .getWorldDirection(new THREE.Vector3())
        .clone()
        .negate();
      this.dragPlane.setFromNormalAndCoplanarPoint(
        planeNormal,
        intersects[0].point
      );
      this.dragOffset.copy(intersects[0].point).sub(this.draggingNode.position);
    }
  }

  private onDragMove(event: MouseEvent): void {
    if (!this.draggingNode) return;
    event.preventDefault();
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(mouse, this.camera);
    const intersection = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) {
      this.draggingNode.position.copy(intersection.sub(this.dragOffset));
    }
  }

  private onDragEnd(event: MouseEvent): void {
    if (!this.draggingNode) return;
    event.preventDefault();
    this.draggingNode = null;
    this.controls.enabled = true;
  }

  onAttributeChange(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = Number(input.value);
    if (this.editableNode) {
      this.editableNode.attributes[index] = newValue;
      this.editableNode.velocity.add(new THREE.Vector3(0.02, 0.02, 0.02));
      const scaleFactor = 1 + this.editableNode.attributes[0] / 100;
      this.editableNode.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
  }

  onPreferenceChange(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = Number(input.value);
    if (this.currentCentral) {
      this.currentCentral.preferences[index] = newValue;
      this.currentCentral.velocity.add(new THREE.Vector3(0.02, 0.02, 0.02));
    }
  }

  onAddNode(): void {
    if (!this.cluster) return;
    this.newNodeCounter = addNode(this.cluster, this.newNodeCounter);
  }

  onRemoveNode(): void {
    removeNode(
      this.cluster,
      this.selectedNode,
      this.hiddenNodes,
      this.contextMenuRef.nativeElement
    );
  }

  toggleCameraLock(): void {
    this.isCameraLocked = !this.isCameraLocked;
    this.controls.enabled = !this.isCameraLocked;
  }

  // ─── CAMERA CONTROL HELPERS ────────────────────────────────────────────────

  /** Rotate the camera around the target by ±15° about world‑Y */
  rotateLeft() {
    const angle = THREE.MathUtils.degToRad(15);
    this.rotateAroundTarget(angle);
  }

  rotateRight() {
    const angle = THREE.MathUtils.degToRad(-15);
    this.rotateAroundTarget(angle);
  }

  private rotateAroundTarget(angleRad: number) {
    // 1) vector from target → camera
    const offset = this.camera.position.clone().sub(this.controls.target);
    // 2) rotate that vector about the world‑up axis (0,1,0)
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRad);
    // 3) put camera back at target + rotated offset
    this.camera.position.copy(this.controls.target).add(offset);
    this.camera.lookAt(this.controls.target);
    this.controls.update();
  }

  /** Pan the camera/target in screen‑space by 1 world‑unit */
  panUp() {
    this.pan(0, 1);
  }
  panDown() {
    this.pan(0, -1);
  }
  panLeft() {
    this.pan(1, 0);
  }
  panRight() {
    this.pan(-1, 0);
  }

  private pan(deltaX: number, deltaY: number) {
    // build a pan offset
    const panOffset = new THREE.Vector3();
    // right = cameraDir × up
    const right = this.camera
      .getWorldDirection(new THREE.Vector3())
      .cross(this.camera.up)
      .setLength(deltaX);
    panOffset.add(right);
    // up vector
    const up = this.camera.up.clone().setLength(deltaY);
    panOffset.add(up);

    // apply to both camera and controls.target
    this.camera.position.add(panOffset);
    this.controls.target.add(panOffset);
    this.controls.update();
  }

  /** Zoom in/out by scaling the distance to the target */
  zoomIn() {
    this.dolly(0.8);
  }
  zoomOut() {
    this.dolly(1.2);
  }

  private dolly(scale: number) {
    // vector from target → camera
    const offset = this.camera.position.clone().sub(this.controls.target);
    // shorten/lengthen it
    offset.multiplyScalar(scale);
    // re‑position camera
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  private animate(): void {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        requestAnimationFrame(loop);
        this.controls.update();
        if (this.cluster) this.cluster.update();

        const cameraToCursor = new THREE.Vector3();
        cameraToCursor
          .copy(this.camera.position)
          .sub(this.ringMesh.position)
          .normalize();

        // Make the ring's up face that direction
        this.ringMesh.lookAt(
          this.ringMesh.position.clone().sub(cameraToCursor)
        );

        // Optional: Slight stylized tilt
        this.ringMesh.rotation.x += 0.5;

        // ---- new cursor logic ----
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const FIXED_DISTANCE = 6;
        const cursorPos = this.camera.position
          .clone()
          .add(
            this.raycaster.ray.direction.clone().multiplyScalar(FIXED_DISTANCE)
          );
        this.cursorMesh.position.copy(cursorPos);
        this.ringMesh.position.copy(cursorPos);

        if ((this as any).composer) {
          (this as any).composer.render();
        } else {
          this.renderer.render(this.scene, this.camera);
        }
      };
      loop();
    });
  }
}

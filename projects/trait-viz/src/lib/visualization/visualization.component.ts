import {
  Component, ElementRef, Input, AfterViewInit, OnDestroy, ViewChild, OnChanges, SimpleChanges, Inject, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { TraitNode } from '../models/node';
import { getTraitKeys, ensureTraitCount, canonicalKey } from '../models/trait-utils';
import { RepoSpringEngine, RepoSpringConfig } from '../physics/repo-spring-engine';
import { SimSettings } from '../control-panel/control-panel.component';
import { ControlPanelComponent } from '../control-panel/control-panel.component';
import { NodeTraitEdit } from '../control-panel/node-sliders/node-sliders';
import { randomInt } from '../utils/random';
import { BlueyardGalaxyBackground } from '../visual/blueyard-galaxy-background';
import { initPostFX, PostFXBundle } from '../visual/postfx';
import { makeGlowySpriteMaterial } from '../visual/glowy-node-material';
import { compatToColor, COLOR_CENTRAL_YELLOW } from '../visual/node-colors';
import { compatibility } from '../physics/math';

@Component({
  selector: 'tv-visualization',
  standalone: true,
  imports: [ControlPanelComponent],
  template: `
    <div class="tv-viz-wrapper">
      <canvas #viz class="viz-canvas"></canvas>
      <tv-control-panel
        class="tv-viz-panel"
        [nodes]="nodes"
        [traitKeys]="traitKeys"
        [centralIndex]="centralIndex"
        [kAttraction]="kAttraction"
        [kRepulsion]="kRepulsion"
        [damping]="damping"
        [angularSpeed]="angularSpeed"
        [restLength]="restLength"
        [traitCount]="traitCount"
        [nodeCount]="nodeCount"
        [galaxyBendStrength]="galaxyBendStrength"
        [galaxyTwinkleSpeed]="galaxyTwinkleSpeed"
        [galaxyAmbientRot]="galaxyAmbientRot"
        [galaxyParticles]="galaxyParticles"
        [glowStrength]="glowStrength"
        [galaxyPointSize]="galaxyPointSize"
        [dragCluster]="dragCluster"
        [galaxyClearPush]="galaxyClearPush"
        [galaxyPocketPush]="galaxyPocketPush"
        [galaxyPocketRingBoost]="galaxyPocketRingBoost"
        [centralNodeClearance]="centralNodeClearance"
        [spiralArms]="spiralArms"
        [spiralTightness]="spiralTightness"
        [spiralWinds]="spiralWinds"
        [armWidth]="armWidth"
        [armBrightness]="armBrightness"
        [armMaxWidth]="armMaxWidth"
        [armMinWidth]="armMinWidth"
        [armThicknessProfile]="armThicknessProfile"
        [galaxyTiltX]="galaxyTiltX"
        [galaxyTiltZ]="galaxyTiltZ"
        [nebulaIntensity]="nebulaIntensity"
        [nebulaClusters]="nebulaClusters"
        [nebulaRadius]="nebulaRadius"
        [fieldStarDensity]="fieldStarDensity"
        [fieldStarDistance]="fieldStarDistance"
        [diskEllipticity]="diskEllipticity"
        [zGaussianStrength]="zGaussianStrength"
        (centralChange)="handleCentralChange($event)"
        (simChange)="handleSimChange($event)"
        (nodeEdit)="handleNodeEdit($event)"
        (traitCountChange)="handleTraitCount($event)"
        (nodeCountChange)="handleNodeCount($event)"
        (dragClusterChange)="dragCluster=$event"
        (galaxyClearPushChange)="handleClearPush($event)"
        (galaxyPocketPushChange)="handlePocketPush($event)"
        (galaxyPocketRingBoostChange)="handlePocketRingBoost($event)"
        (centralClearanceChange)="handleCentralClearance($event)"
        (galaxyPointSizeChange)="handlePointSize($event)"
        (spiralArmsChange)="handleSpiralArms($event)"
        (spiralTightnessChange)="handleSpiralTightness($event)"
        (spiralWindsChange)="handleSpiralWinds($event)"
        (armWidthChange)="handleArmWidth($event)"
        (armBrightnessChange)="handleArmBrightness($event)"
        (armMaxWidthChange)="handleArmMaxWidth($event)"
        (armMinWidthChange)="handleArmMinWidth($event)"
        (armThicknessProfileChange)="handleArmThicknessProfile($event)"
        (galaxyTiltXChange)="handleGalaxyTiltX($event)"
        (galaxyTiltZChange)="handleGalaxyTiltZ($event)"
        (nebulaIntensityChange)="handleNebulaIntensity($event)"
        (nebulaClustersChange)="handleNebulaClusters($event)"
        (nebulaRadiusChange)="handleNebulaRadius($event)"
        (fieldStarDensityChange)="handleFieldStarDensity($event)"
        (fieldStarDistanceChange)="handleFieldStarDistance($event)"
        (diskEllipticityChange)="handleDiskEllipticity($event)"
        (zGaussianStrengthChange)="handleZGaussianStrength($event)"
        (galaxyReseedChange)="handleGalaxyReseed()"
        (visualChange)="handleVisualChange($event)">
      </tv-control-panel>
    </div>
  `,
  styles:[`
    :host, .tv-viz-wrapper { width:100%; height:100%; display:block; position:relative; }
    .viz-canvas, .tv-viz-wrapper > canvas { position:absolute; inset:0; width:100%; height:100%; display:block; }
    .tv-viz-panel { position:absolute; top:0; left:0; }
  `]
})
export class VisualizationComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('viz', { static:true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  /** Full repo-style node array (node 0 will be central initially unless overridden). */
  @Input({required:true}) nodes!: TraitNode[];
  /** Central node index. */
  @Input() centralIndex = 0;

  /** Physics tunables (control panel later). */
  @Input() kAttraction = 1;
  @Input() kRepulsion  = 1;
  @Input() damping     = 0.95;
  @Input() angularSpeed = 0.25;
  @Input() restLength   = 25;     // approximate target ring radius - reduced for tighter clustering
  @Input() timestep     = 1/60;

  /** Dataset controls */
  @Input() traitCount = 3;
  @Input() nodeCount = 4;

  /** Visual controls */
  @Input() galaxyParticles = 40000;
  @Input() galaxyBendStrength = 0.5;
  @Input() galaxyTwinkleSpeed = 0.5;
  @Input() galaxyAmbientRot = 0.005;
  @Input() glowStrength = 1.2;
  @Input() galaxyPointSize = 2.0;  // Star size control
  @Input() dragCluster = true; // true=move cluster rigidly, false=central-only
  @Input() integrateNodeColors = true; // recolor nodes to galaxy ramp
  @Input() nodeSpriteSize = 4; // px scale factor; central scaled larger
  @Input() galaxyClearPush = 1; // default full visual repulsion
  @Input() galaxyPocketPush = 0.8;       // 0..1
  @Input() galaxyPocketRingBoost = 1.2;  // 0..2
  @Input() galaxyFlowerWeight = 0.8;     // 0..1 (requires reseed)
  @Input() centralNodeClearance = 2.5;   // multiplier for central node clear zone size

  // Spiral galaxy parameters
  @Input() spiralArms = 3;
  @Input() spiralTightness = 0.15;
  @Input() spiralWinds = 1.5;
  @Input() armWidth = 0.15;
  @Input() armBrightness = 1.3;
  
  // Arm thickness variation parameters
  @Input() armMaxWidth = 25;
  @Input() armMinWidth = 3;
  @Input() armThicknessProfile = 0.6;
  
  // Galaxy tilt parameters
  @Input() galaxyTiltX = 0;    // pitch tilt in degrees
  @Input() galaxyTiltZ = 12;   // roll tilt in degrees
  
  // Background starfield parameters
  @Input() nebulaIntensity = 1.0;
  @Input() nebulaClusters = 8;
  @Input() nebulaRadius = 25;
  @Input() fieldStarDensity = 1.0;
  @Input() fieldStarDistance = 1.8;
  
  // Elliptical disk shape parameters
  @Input() diskEllipticity = 0.8;
  @Input() zGaussianStrength = 1.0;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;

  private engine?: RepoSpringEngine;
  traitKeys: string[] = [];

  private centralMesh?: THREE.Object3D;
  private outerMeshes: THREE.Object3D[] = [];

  private galaxy?: BlueyardGalaxyBackground;
  private postfx?: PostFXBundle;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private dragActive = false;
  private dragStartZ = 0;
  private lastCentralDragPos = new THREE.Vector3();

  private _clusterRadius = 6;

  private anim?: number;
  private lastTime = performance.now();

  // Tooltip mouse tracking
  private mouse = new THREE.Vector2();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(){
    // Only initialize Three.js on the client side (browser)
    if (isPlatformBrowser(this.platformId)) {
      this.initThree();
      this.buildScene();
      this.startLoop();

      const canvasEl = this.canvasRef.nativeElement;
      canvasEl.addEventListener('pointerdown', this.onPointerDown);
      canvasEl.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
    }
  }

  ngOnChanges(ch: SimpleChanges){
    // Rebuild engine when nodes or central index changes *after* init
    if (!this.renderer) return;
    if (ch['nodes'] || ch['centralIndex']) {
      this.rebuildEngine();
    }
    // Update physics params live
    if (this.engine && (ch['kAttraction'] || ch['kRepulsion'] || ch['damping'] || ch['angularSpeed'] || ch['restLength'])){
      const cfg = this.engine.cfg;
      cfg.kAttraction = this.kAttraction;
      cfg.kRepulsion  = this.kRepulsion;
      cfg.damping     = this.damping;
      cfg.angularSpeed= this.angularSpeed;
      cfg.restLength  = this.restLength;
    }
  }

  // --- init ---

  private initThree(){
    const canvas = this.canvasRef.nativeElement;
    const r = new THREE.WebGLRenderer({canvas, antialias:true});
    r.setPixelRatio(window.devicePixelRatio);
    r.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer = r;

    this.scene = new THREE.Scene();
    this.scene.background = null; // No background - let galaxy show through

    this.camera = new THREE.PerspectiveCamera(
      60, canvas.clientWidth/canvas.clientHeight, 0.1, 2000
    );
    this.camera.position.set(0,0,300); // Move camera further away to see galaxy

    this.controls = new OrbitControls(this.camera, r.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;

    window.addEventListener('resize', () => this.onResize());
    
    this.postfx = initPostFX(this.renderer, this.scene, this.camera, this.glowStrength);
  }

  private buildScene(){
    // Clear previous (if rebuilding)
    this.outerMeshes.forEach(m => this.scene.remove(m));
    if (this.centralMesh) this.scene.remove(this.centralMesh);
    this.outerMeshes = [];

    // remove galaxy container if present
    if (this.galaxy) {
      this.scene.remove(this.galaxy.getObject3D());
      this.galaxy = undefined;
    }
    // create galaxy
    this.galaxy = new BlueyardGalaxyBackground({
      count: this.galaxyParticles,
      bendStrength: this.galaxyBendStrength,
      twinkleSpeed: this.galaxyTwinkleSpeed,
      ambientRotSpeed: this.galaxyAmbientRot,
      pointSize: this.galaxyPointSize,  // Add point size configuration
      pocketPush: this.galaxyPocketPush,
      pocketRingBoost: this.galaxyPocketRingBoost,
      flowerWeight: this.galaxyFlowerWeight,
      
      // Spiral arm configuration - using component properties
      spiralArms: this.spiralArms,
      spiralTightness: this.spiralTightness,
      spiralWinds: this.spiralWinds,
      armWidth: this.armWidth,
      armBrightness: this.armBrightness,
      
      // Arm thickness variation configuration
      armMaxWidth: this.armMaxWidth,
      armMinWidth: this.armMinWidth,
      armThicknessProfile: this.armThicknessProfile,
      
      // Galaxy tilt configuration
      galaxyTiltX: this.galaxyTiltX,
      galaxyTiltZ: this.galaxyTiltZ,
      
      // Background starfield configuration
      nebulaIntensity: this.nebulaIntensity,
      nebulaClusters: this.nebulaClusters,
      nebulaRadius: this.nebulaRadius,
      fieldStarDensity: this.fieldStarDensity,
      fieldStarDistance: this.fieldStarDistance,
      
      // Elliptical disk shape configuration
      diskEllipticity: this.diskEllipticity,
      zGaussianStrength: this.zGaussianStrength,
    });
    this.scene.add(this.galaxy.getObject3D());

    // Reseed to apply flowerWeight settings for stronger magenta petals
    this.galaxy.reseed();

    this.scaleGalaxyToViewport();

    if (!this.nodes?.length) return;

    // trait keys
    this.traitKeys = getTraitKeys(this.nodes);

    // CENTRAL
    const central = this.nodes[this.centralIndex];
    const cMat = makeGlowySpriteMaterial(COLOR_CENTRAL_YELLOW);
    const cSprite = new THREE.Sprite(cMat);
    cSprite.scale.setScalar(this.nodeSpriteSize * 4); // bigger central
    cSprite.position.set(0,0,0);
    central.mesh = cSprite;
    this.centralMesh = cSprite;
    this.scene.add(cSprite);

    // OUTERS
    for (let i=0;i<this.nodes.length;i++){
      if (i===this.centralIndex) continue;
      const n = this.nodes[i];
      // provisional color (updated after engine built)
      const mat = makeGlowySpriteMaterial(0xffffff); // temp; recolor later
      const s = new THREE.Sprite(mat);
      // spawn near rest length disc
      const r = this.restLength + Math.random()*this.restLength*0.5;
      const theta = Math.random()*Math.PI*2;
      const x = r*Math.cos(theta);
      const y = (Math.random()-0.5)*r*0.5; // compressed vertical for disc feel
      const z = (Math.random()-0.5)*r*0.3;
      s.position.set(x,y,z);
      s.scale.setScalar(this.nodeSpriteSize);
      n.mesh = s;
      if (!n.velocity) n.velocity = new THREE.Vector3();
      this.outerMeshes.push(s);
      this.scene.add(s);
    }

    this.rebuildEngine();
    
    // Set initial cluster bubble radius after all meshes are positioned
    this.updateGalaxyClusterUniform();
  }

  private rebuildEngine(){
    // Build central + outers slices
    const central = this.nodes[this.centralIndex];
    const outers = this.nodes.filter((_,i)=>i!==this.centralIndex);

    const cfg: RepoSpringConfig = {
      kAttraction: this.kAttraction,
      kRepulsion: this.kRepulsion,
      damping: this.damping,
      angularSpeed: this.angularSpeed,
      restLength: this.restLength,
      dt: this.timestep,
    };

    this.engine = new RepoSpringEngine(central, outers, this.traitKeys, cfg);

    // sync engine positions to meshes (engine got random positions; override w/ mesh positions)
    this.engine.outers.forEach(o => {
      const mesh = o.node.mesh as THREE.Object3D;
      o.position.copy(mesh.position);
    });

    // recolor outers by compat if requested
    if (this.integrateNodeColors && this.engine){
      const prefs = this.engine.central.prefsArr;
      const clr = new THREE.Color();
      this.engine.outers.forEach(o=>{
        const compat = compatibility(prefs, o.attrsArr); // reuse function; import it
        compatToColor(compat, clr);
        const spr = o.node.mesh as THREE.Sprite;
        (spr.material as THREE.SpriteMaterial).color.copy(clr);
      });
    }
  }

  // --- loop ---

  private startLoop = () => {
    this.anim = requestAnimationFrame(this.startLoop);

    // Tooltip raycasting
    this.updateTooltip();

    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (this.engine){
      // refresh trait arrays if external edits could have happened (cheap for <=20 nodes)
      this.engine.refreshTraits();
      // step with fixed dt (engine cfg.dt) for stability; could substep based on dt if needed
      this.engine.step();
      // sync mesh positions
      this.engine.outers.forEach(o=>{
        if (o.node.mesh) o.node.mesh.position.copy(o.position);
      });
    }

    if (this.galaxy){
      this.updateGalaxyClusterUniform(); // keep bubble sized to current cluster
      this.galaxy.setNodes(this.collectNodeVec4s());
      this.galaxy.update(dt);
    }
    
    this.controls.update();
    if (this.postfx) {
      this.postfx.bloom.strength = this.glowStrength;
      this.postfx.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  };

  private onResize(){
    const canvas = this.canvasRef.nativeElement;
    this.renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);
    this.camera.aspect = canvas.clientWidth/canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    
    if (this.postfx) {
      const size = new THREE.Vector2(this.canvasRef.nativeElement.clientWidth, this.canvasRef.nativeElement.clientHeight);
      this.postfx.composer.setSize(size.x, size.y);
    }

    this.scaleGalaxyToViewport();
  }

  private scaleGalaxyToViewport(){
    if (!this.galaxy) return;
    const cam = this.camera;
    const dist = cam.position.length(); // if camera always at z>0
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const halfH = Math.tan(vFov/2) * dist;
    const halfW = halfH * cam.aspect;
    const target = Math.max(halfW, halfH) * 1.4; // overscan
    const s = target / this.galaxy.cfg.rOuter;
    this.galaxy.getObject3D().scale.setScalar(s);
  }

  private collectNodeVec4s(): THREE.Vector4[] {
    const list: THREE.Vector4[] = [];
    // central influence radius ~ central sphere diam ~8 world units
    const cRad = 8;
    list.push(new THREE.Vector4(0,0,0,cRad));
    // outers
    for (const n of this.nodes){
      if (n.mesh === this.centralMesh) continue;
      const m = n.mesh as THREE.Object3D;
      if (!m) continue;
      list.push(new THREE.Vector4(m.position.x, m.position.y, m.position.z, 3));
    }
    return list;
  }

  handleCentralChange(i: number){
    if (i === this.centralIndex) return; // no change
    
    if (!this.nodes || i >= this.nodes.length || i < 0) {
      console.error('Invalid central index:', i, 'Nodes length:', this.nodes?.length);
      return;
    }
    
    // Update central index and rebuild scene
    this.centralIndex = i;
    this.buildScene();
  }

  private rebuildSceneForCentralSwitch(savedPositions: Map<string, THREE.Vector3>, offset: THREE.Vector3) {
    console.log('=== REBUILD SCENE START ===');
    
    // Clear previous meshes
    this.outerMeshes.forEach(m => this.scene.remove(m));
    if (this.centralMesh) this.scene.remove(this.centralMesh);
    this.outerMeshes = [];

    if (!this.nodes?.length) return;

    // trait keys
    this.traitKeys = getTraitKeys(this.nodes);

    // CENTRAL - new central node at origin
    const central = this.nodes[this.centralIndex];
    console.log('Creating central node for:', central.id, 'at index:', this.centralIndex);
    
    const cMat = makeGlowySpriteMaterial(COLOR_CENTRAL_YELLOW);
    console.log('Central material color:', COLOR_CENTRAL_YELLOW);
    
    const cSprite = new THREE.Sprite(cMat);
    cSprite.scale.setScalar(this.nodeSpriteSize * 4); // bigger central
    cSprite.position.set(0, 0, 0);
    central.mesh = cSprite;
    this.centralMesh = cSprite;
    this.scene.add(cSprite);
    
    console.log('Central node created:', central.id, 'mesh scale:', cSprite.scale.x, 'position:', cSprite.position);
    console.log('Central material after creation:', (cSprite.material as THREE.SpriteMaterial).color);

    // OUTERS - restore positions with offset
    let outerCount = 0;
    for (let i = 0; i < this.nodes.length; i++) {
      if (i === this.centralIndex) continue;
      const n = this.nodes[i];
      
      // Create sprite with temp color (will be updated by engine)
      const mat = makeGlowySpriteMaterial(0xffffff);
      const s = new THREE.Sprite(mat);
      s.scale.setScalar(this.nodeSpriteSize);
      
      // Restore position with offset, or use default if no saved position
      const savedPos = savedPositions.get(n.id);
      if (savedPos) {
        const newPos = savedPos.clone().add(offset);
        s.position.copy(newPos);
        console.log(`Restored ${n.id} position:`, newPos);
      } else {
        // Fallback to default positioning if no saved position
        const r = this.restLength + Math.random() * this.restLength * 0.5;
        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.cos(theta);
        const y = (Math.random() - 0.5) * r * 0.5;
        const z = (Math.random() - 0.5) * r * 0.3;
        s.position.set(x, y, z);
        console.log(`Default position for ${n.id}:`, s.position);
      }
      
      n.mesh = s;
      if (!n.velocity) n.velocity = new THREE.Vector3();
      this.outerMeshes.push(s);
      this.scene.add(s);
      outerCount++;
    }

    console.log(`Created ${outerCount} outer nodes`);
    console.log('=== REBUILD SCENE BEFORE ENGINE ===');

    // Rebuild physics engine
    this.rebuildEngine();

    console.log('=== REBUILD SCENE AFTER ENGINE ===');
    console.log('Central mesh after engine rebuild:', this.centralMesh ? 'exists' : 'null');
    if (this.centralMesh) {
      const centralSprite = this.centralMesh as THREE.Sprite;
      console.log('Central material color after engine:', (centralSprite.material as THREE.SpriteMaterial).color);
    }

    // Ensure central node stays yellow after engine rebuild
    if (this.centralMesh) {
      const centralSprite = this.centralMesh as THREE.Sprite;
      if (centralSprite.material) {
        (centralSprite.material as THREE.SpriteMaterial).color.copy(COLOR_CENTRAL_YELLOW);
        console.log('Central node color FORCED to yellow after engine rebuild');
        console.log('Final central color:', (centralSprite.material as THREE.SpriteMaterial).color);
      }
    }

    // Update cluster bubble
    this.updateGalaxyClusterUniform();
    
    console.log('=== REBUILD SCENE COMPLETE ===');
  }

  handleSimChange(s: SimSettings){
    this.kAttraction = s.kAttraction;
    this.kRepulsion  = s.kRepulsion;
    this.damping     = s.damping;
    this.angularSpeed= s.angularSpeed;
    this.restLength  = s.restLength;

    if (this.engine){
      const cfg = this.engine.cfg;
      cfg.kAttraction = this.kAttraction;
      cfg.kRepulsion  = this.kRepulsion;
      cfg.damping     = this.damping;
      cfg.angularSpeed= this.angularSpeed;
      cfg.restLength  = this.restLength;
    }
  }

  handleNodeEdit(event: NodeTraitEdit){
    console.log('NodeEdit event received:', event);
    // Apply the edit to the actual node
    if (event.field === 'traits') {
      event.node.traits[event.key] = event.value;
    } else if (event.field === 'preferences') {
      event.node.preferences[event.key] = event.value;
    }
    // Ensure engine sees change next frame
    this.engine?.refreshTraits();
  }

  handleTraitCount(n: number){
    if (n === this.traitCount) return;
    this.traitCount = n;
    // update keys array
    ensureTraitCount(this.nodes[this.centralIndex], this.traitKeys, n);
    this.nodes.forEach((node,idx)=>{
      if (idx===this.centralIndex) return;
      ensureTraitCount(node, this.traitKeys, n);
    });
    // force panel refresh: traitKeys Input updates automatically
    this.buildScene();   // rebuild meshes & engine
  }

  handleNodeCount(n: number){
    if (n === this.nodeCount) return;
    const outerTarget = n;
    const currentOuter = this.nodes.length - 1;
    if (outerTarget > currentOuter){
      // ADD nodes
      for (let i=currentOuter; i<outerTarget; i++){
        const id = `N${i+1}`;
        const traits:Record<string,number> = {};
        this.traitKeys.forEach(k => traits[k] = randomInt(0,100));
        const prefs = {...traits};      // unused until node becomes central
        this.nodes.push({
          id,
          traits,
          preferences: prefs,
          velocity: new THREE.Vector3(),
        } as TraitNode);
      }
    } else {
      // REMOVE extras
      this.nodes.splice(outerTarget+1); // keep central at index 0
    }
    this.nodeCount = outerTarget;
    this.buildScene();
    // Update cluster bubble after rebuilding scene
    this.updateGalaxyClusterUniform();
  }

  handleVisualChange(v:{bend:number;twinkle:number;ambient:number;particles:number;glow:number}){
    this.galaxyBendStrength = v.bend;
    this.galaxyTwinkleSpeed = v.twinkle;
    this.galaxyAmbientRot   = v.ambient;
    this.galaxyParticles    = v.particles;
    this.glowStrength       = v.glow;

    if (this.galaxy){
      this.galaxy.setBendStrength(this.galaxyBendStrength);
      // Note: setTwinkleSpeed and setAmbientRotSpeed methods removed - these are set in constructor
      // Changing particle count triggers reseed (slow) — do after slider release if needed.
      this.galaxy.reseed(this.galaxyParticles);
    }
    if (this.postfx){
      this.postfx.bloom.strength = this.glowStrength;
    }
  }

  handleClearPush(v:number){
    this.galaxyClearPush = v;
    this.galaxy?.setPocketPush(v);
  }

  handlePocketPush(v:number){
    this.galaxyPocketPush = v;
    this.galaxy?.setPocketPush(v);
  }

  handlePocketFade(on:boolean){
    this.galaxy?.setPocketFade(on);
  }

  handlePocketRingBoost(v:number){
    this.galaxyPocketRingBoost = v;
    this.galaxy?.setPocketRingBoost(v);
  }
  
  handleCentralClearance(v:number){
    this.centralNodeClearance = v;
    // Update cluster immediately to reflect the new clearance
    this.updateGalaxyClusterUniform();
  }

  handlePointSize(v:number){
    this.galaxyPointSize = v;
    this.galaxy?.setPointSize(v);
  }

  handleGalaxyReseed(){
    this.galaxy?.reseed();
  }

  // Spiral galaxy structure handlers
  handleSpiralArms(v:number){
    this.spiralArms = v;
    this.galaxy?.setSpiralArms(v);
    this.galaxy?.reseed(); // Need to reseed to apply structural changes
  }

  handleSpiralTightness(v:number){
    this.spiralTightness = v;
    this.galaxy?.setSpiralTightness(v);
    this.galaxy?.reseed();
  }

  handleSpiralWinds(v:number){
    this.spiralWinds = v;
    this.galaxy?.setSpiralWinds(v);
    this.galaxy?.reseed();
  }

  handleArmWidth(v:number){
    this.armWidth = v;
    this.galaxy?.setArmWidth(v);
    this.galaxy?.reseed();
  }

  handleArmBrightness(v:number){
    this.armBrightness = v;
    this.galaxy?.setArmBrightness(v);
    this.galaxy?.reseed();
  }
  
  // Arm thickness variation handlers
  handleArmMaxWidth(v:number){
    this.armMaxWidth = v;
    this.galaxy?.setArmMaxWidth(v);
    this.galaxy?.reseed();
  }

  handleArmMinWidth(v:number){
    this.armMinWidth = v;
    this.galaxy?.setArmMinWidth(v);
    this.galaxy?.reseed();
  }

  handleArmThicknessProfile(v:number){
    this.armThicknessProfile = v;
    this.galaxy?.setArmThicknessProfile(v);
    this.galaxy?.reseed();
  }
  
  // Galaxy tilt handlers
  handleGalaxyTiltX(v:number){
    this.galaxyTiltX = v;
    this.galaxy?.setGalaxyTiltX(v);
  }
  
  handleGalaxyTiltZ(v:number){
    this.galaxyTiltZ = v;
    this.galaxy?.setGalaxyTiltZ(v);
  }
  
  // Background starfield handlers
  handleNebulaIntensity(v:number){
    this.nebulaIntensity = v;
    this.galaxy?.setNebulaIntensity(v);
    this.galaxy?.reseed(); // Reseed to apply nebula changes
  }
  
  handleNebulaClusters(v:number){
    this.nebulaClusters = v;
    this.galaxy?.setNebulaClusters(v);
    this.galaxy?.reseed(); // Reseed to apply cluster changes
  }
  
  handleNebulaRadius(v:number){
    this.nebulaRadius = v;
    this.galaxy?.setNebulaRadius(v);
    this.galaxy?.reseed(); // Reseed to apply radius changes
  }
  
  handleFieldStarDensity(v:number){
    this.fieldStarDensity = v;
    this.galaxy?.setFieldStarDensity(v);
    this.galaxy?.reseed(); // Reseed to apply density changes
  }
  
  handleFieldStarDistance(v:number){
    this.fieldStarDistance = v;
    this.galaxy?.setFieldStarDistance(v);
    this.galaxy?.reseed(); // Reseed to apply distance changes
  }
  
  // Elliptical disk shape handlers
  handleDiskEllipticity(v:number){
    this.diskEllipticity = v;
    this.galaxy?.setDiskEllipticity(v);
    this.galaxy?.reseed(); // Reseed to apply ellipticity changes
  }
  
  handleZGaussianStrength(v:number){
    this.zGaussianStrength = v;
    this.galaxy?.setZGaussianStrength(v);
    this.galaxy?.reseed(); // Reseed to apply gaussian strength changes
  }

  private getPointerNDC(event: PointerEvent){
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown = (ev: PointerEvent) => {
    this.getPointerNDC(ev);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (!this.centralMesh) return;
    const intersects = this.raycaster.intersectObject(this.centralMesh, false);
    if (intersects.length){
      this.dragActive = true;
      this.controls.enabled = false;
      // capture Z layer to drag on (gives shallow volume feel)
      this.dragStartZ = this.centralMesh.position.z;
    }
  };

  private onPointerMove = (ev: PointerEvent) => {
    this.getPointerNDC(ev);
    
    // Update mouse coordinates for tooltip (copy from pointer)
    this.mouse.copy(this.pointer);
    
    if (!this.dragActive) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    // Ray intersect with XY plane at dragStartZ
    const plane = new THREE.Plane(new THREE.Vector3(0,0,1), -this.dragStartZ);
    const ray = this.raycaster.ray;
    const hit = new THREE.Vector3();
    const t = ray.intersectPlane(plane, hit);
    if (t === null) return;

    // small depth wobble: hold Shift to lift/lower w/ Y motion
    if (ev.shiftKey){
      const dy = (ev.movementY || 0);
      this.dragStartZ += dy * 0.2; // scale depth sensitivity
      hit.z = this.dragStartZ;
    }

    this.moveCentralTo(hit);
  };

  private onPointerUp = (_ev: PointerEvent) => {
    if (!this.dragActive) return;
    this.dragActive = false;
    this.controls.enabled = true;
  };

  private moveCentralTo(p: THREE.Vector3){
    if (!this.centralMesh) return;
    // delta before move
    const prev = this.centralMesh.position.clone();
    const delta = new THREE.Vector3().subVectors(p, prev);

    this.centralMesh.position.copy(p);
    const centralNode = this.nodes[this.centralIndex];
    (centralNode.mesh as THREE.Object3D).position.copy(p);

    if (this.engine){
      if (this.dragCluster){
        // rigid offset outers immediately
        this.engine.outers.forEach(o=>{
          o.position.add(delta);
          if (o.node.mesh) o.node.mesh.position.add(delta);
        });
      }
      // update engine central AFTER possible delta copy
      this.engine.central.position.copy(p);
    }

    this.updateGalaxyClusterUniform();
  }

  private updateGalaxyClusterUniform(){
    if (!this.galaxy) return;
    const center = this.centralMesh ? this.centralMesh.position : new THREE.Vector3();
    
    // Enhanced cluster radius calculation for central node visibility
    // Create a larger, more visible black space around the central yellow node
    const centralNodeBaseRadius = 6;    // Base radius for central node visibility
    const visibilityMultiplier = this.centralNodeClearance;   // User-configurable multiplier
    const minVisiblePocket = centralNodeBaseRadius * visibilityMultiplier;
    
    // Still consider distance to nearest outer node for dynamic sizing
    let minD = Infinity;
    for (let i=0;i<this.nodes.length;i++){
      if (i===this.centralIndex) continue;
      const m = this.nodes[i].mesh as THREE.Object3D;
      if (!m) continue;
      const d = center.distanceTo(m.position);
      if (d < minD) minD = d;
    }
    if (!isFinite(minD)) minD = minVisiblePocket;
    
    // Enhanced sizing: use larger of minimum visible pocket or dynamic sizing
    const dynamicPocket = Math.min(minD * 0.7, minVisiblePocket * 1.5); // Up to 1.5x min size
    const target = Math.max(minVisiblePocket, dynamicPocket);
    
    this._clusterRadius = THREE.MathUtils.lerp(
        this._clusterRadius ?? target, target, 0.25);
    this.galaxy.setCluster(center, this._clusterRadius);
  }

  private updateTooltip(){
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Collect all mesh objects to raycast against
    const meshObjects: THREE.Object3D[] = [];
    if (this.centralMesh) meshObjects.push(this.centralMesh);
    this.outerMeshes.forEach(mesh => {
      if (mesh) meshObjects.push(mesh);
    });

    const hits = this.raycaster.intersectObjects(meshObjects, false);
    
    if (hits.length > 0) {
      const obj = hits[0].object;
      let html = '';
      
      if (obj === this.centralMesh) {
        // Central node - show name, traits, and preferences
        const central = this.nodes[this.centralIndex];
        const traits = Object.entries(central.traits)
          .map(([key, val]) => `${key}: ${val.toFixed(1)}`)
          .join(', ');
        const prefs = Object.entries(central.preferences)
          .map(([key, val]) => `${key}: ${val.toFixed(1)}`)
          .join(', ');
        html = `<b>Central: ${central.id}</b><br>` +
               `Traits: [${traits}]<br>` +
               `Preferences: [${prefs}]`;
      } else {
        // Find the outer node - show name, traits, and preferences
        const nodeIndex = this.outerMeshes.findIndex(mesh => mesh === obj);
        if (nodeIndex >= 0) {
          const outerNodes = this.nodes.filter((_, i) => i !== this.centralIndex);
          const node = outerNodes[nodeIndex];
          if (node) {
            const traits = Object.entries(node.traits)
              .map(([key, val]) => `${key}: ${val.toFixed(1)}`)
              .join(', ');
            const prefs = Object.entries(node.preferences)
              .map(([key, val]) => `${key}: ${val.toFixed(1)}`)
              .join(', ');
            html = `<b>Outer: ${node.id}</b><br>` +
                   `Traits: [${traits}]<br>` +
                   `Preferences: [${prefs}]`;
          }
        }
      }
      
      if (html) {
        tooltip.style.display = 'block';
        tooltip.innerHTML = html;
        
        // Position tooltip near mouse with better positioning
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const x = (this.mouse.x * 0.5 + 0.5) * canvas.clientWidth + rect.left + 12;
        const y = (-this.mouse.y * 0.5 + 0.5) * canvas.clientHeight + rect.top + 12;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
      }
    } else {
      tooltip.style.display = 'none';
    }
  }

  ngOnDestroy(){
    if (this.anim) cancelAnimationFrame(this.anim);
    
    // Only remove event listeners in browser environment
    if (isPlatformBrowser(this.platformId)) {
      const canvasEl = this.canvasRef.nativeElement;
      if (canvasEl) {
        canvasEl.removeEventListener('pointerdown', this.onPointerDown);
        canvasEl.removeEventListener('pointermove', this.onPointerMove);
      }
      window.removeEventListener('pointerup', this.onPointerUp);
    }
  }
}

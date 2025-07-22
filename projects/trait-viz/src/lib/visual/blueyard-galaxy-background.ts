import * as THREE from 'three';
import {
  PAL_CYAN_LIGHT,PAL_CYAN_CORE,PAL_BLUE_CORE,PAL_BLUE_DEEP,
  PAL_VIOLET,PAL_MAGENTA,PAL_TEAL_DARK,PAL_SPACE_BLACK,COLOR_DEEP_BLUE
} from './blueyard-palette';
const MAX_NODES = 32;

export interface BlueyardGalaxyConfig {
  count?: number;
  rCore?: number;          // inner dense radius (all seeded; no static hole)
  rFlower?: number;        // magenta flower band center
  rOuter?: number;         // far fade
  flattenY?: number;       // disc compression (0 flat, 1 sphere)
  thicknessZ?: number;     // z extent
  bendStrength?: number;
  bendRadius?: number;
  ambientRotSpeed?: number;
  rotationAxis?: string;    // 'x', 'y', 'z' - which axis to rotate around
  rotationMode?: string;    // 'screen', 'world', 'local' - rotation coordinate system
  rotationSpeed?: number;   // rotation speed (replaces ambientRotSpeed)
  twinkleSpeed?: number;
  twinkleAmp?: number;
  pointSize?: number;
  pocketFade?: boolean;    // fade inside cluster pocket?
  pocketPush?: number;     // 0..1 XY push amount
  pocketRingBoost?: number;// 0..2 ring brightness at pocket edge
  flowerWeight?: number;   // 0..1 how strong magenta petals appear
  
  // Spiral arm configuration
  spiralArms?: number;     // number of spiral arms (default 3)
  spiralTightness?: number;// 0..1 how tightly wound (default 0.15)
  spiralWinds?: number;    // how many times to wrap, in full rotations (default 1.5 = 270°)
  armWidth?: number;       // relative width of spiral arms (default 0.15)
  armBrightness?: number;  // brightness multiplier for arm particles (default 1.3)
  
  // Arm thickness variation (thick at center, thin at edges)
  armMaxWidth?: number;    // maximum arm width at galactic center (default 25)
  armMinWidth?: number;    // minimum arm width at galaxy edge (default 3)
  armThicknessProfile?: number; // 0..2 how dramatically thickness changes (default 0.6)
  
  // Enhanced color controls
  colorSaturation?: number; // 0..2 color saturation multiplier (default 1.0)
  magentaBoost?: number;    // 0..2 magenta accent intensity in arms (default 1.0)
  
  // Galactic plane orientation
  galaxyTiltX?: number;     // tilt around X axis in degrees (-30 to 30, default 0)
  galaxyTiltZ?: number;     // tilt around Z axis in degrees (-30 to 30, default 12)
  
  // Background starfield & nebula effects
  nebulaIntensity?: number; // 0..2 intensity of nebula clustering (default 1.0)
  nebulaClusters?: number;  // number of nebula cluster centers (default 8)
  nebulaRadius?: number;    // radius of each nebula cluster (default 25)
  fieldStarDensity?: number; // 0..2 density of distant field stars (default 1.0)
  fieldStarDistance?: number; // multiplier for field star distance (default 1.8)
  
  // Elliptical disk shape controls
  diskEllipticity?: number;  // 0..1 how elliptical the Z profile is (0=flat, 1=full ellipse, default 0.8)
  zGaussianStrength?: number; // 0..2 how gaussian the Z distribution is (default 1.0)
}

export class BlueyardGalaxyBackground {
  readonly cfg: Required<BlueyardGalaxyConfig>;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private points: THREE.Points;
  private rotObj = new THREE.Object3D();
  private cameraRef?: THREE.Camera; // Reference to camera for screen-relative rotation
  private positions!: Float32Array;
  private colors!: Float32Array;
  private brightness!: Float32Array;
  private nodeUniform: THREE.Vector4[];
  private time = 0;

  constructor(cfg: BlueyardGalaxyConfig = {}){
    this.cfg = {
      count: cfg.count ?? 180000,        // Optimal balance: visually rich but performant
      rCore: cfg.rCore ?? 225,           // Large core (9x original)
      rFlower: cfg.rFlower ?? 400,       // Scale up flower band
      rOuter: cfg.rOuter ?? 800,         // Much larger outer radius
      flattenY: cfg.flattenY ?? 0.45,
      thicknessZ: cfg.thicknessZ ?? 0.35,
      bendStrength: cfg.bendStrength ?? 0.4,
      bendRadius: cfg.bendRadius ?? 10,
      ambientRotSpeed: cfg.ambientRotSpeed ?? 0.02,  // Much higher default for very visible rotation
      rotationAxis: cfg.rotationAxis ?? 'z',        // Default to Z-axis rotation
      rotationMode: cfg.rotationMode ?? 'screen',   // Default to screen-relative rotation
      rotationSpeed: cfg.rotationSpeed ?? 0.02,     // New dedicated rotation speed
      twinkleSpeed: cfg.twinkleSpeed ?? 0.2,
      twinkleAmp: cfg.twinkleAmp ?? 0.06,
      pointSize: cfg.pointSize ?? 2.0,  // Even bigger galaxy stars
      pocketFade: cfg.pocketFade ?? true,
      pocketPush: cfg.pocketPush ?? 0.8,
      pocketRingBoost: cfg.pocketRingBoost ?? 1.2,
      flowerWeight: cfg.flowerWeight ?? 0.8,
      
      // Spiral arm defaults - enhanced for better visibility
      spiralArms: cfg.spiralArms ?? 3,
      spiralTightness: cfg.spiralTightness ?? 0.15,
      spiralWinds: cfg.spiralWinds ?? 1.5,
      armWidth: cfg.armWidth ?? 0.15,
      armBrightness: cfg.armBrightness ?? 2.0,  // Increased from 1.3 to 2.0 for better visibility
      
      // Arm thickness variation defaults
      armMaxWidth: cfg.armMaxWidth ?? 25,
      armMinWidth: cfg.armMinWidth ?? 3,
      armThicknessProfile: cfg.armThicknessProfile ?? 0.6,
      
      // Enhanced color defaults
      colorSaturation: cfg.colorSaturation ?? 1.2,
      magentaBoost: cfg.magentaBoost ?? 1.4,
      
      // Galactic tilt defaults (degrees)
      galaxyTiltX: cfg.galaxyTiltX ?? 0,
      galaxyTiltZ: cfg.galaxyTiltZ ?? 12, // Default 12° tilt for depth
      
      // Background starfield defaults
      nebulaIntensity: cfg.nebulaIntensity ?? 1.0,
      nebulaClusters: cfg.nebulaClusters ?? 8,
      nebulaRadius: cfg.nebulaRadius ?? 25,
      fieldStarDensity: cfg.fieldStarDensity ?? 1.0,
      fieldStarDistance: cfg.fieldStarDistance ?? 1.8,
      
      // Elliptical disk defaults
      diskEllipticity: cfg.diskEllipticity ?? 0.8,
      zGaussianStrength: cfg.zGaussianStrength ?? 1.0,
    } as Required<BlueyardGalaxyConfig>;

    this.nodeUniform = Array.from({length:MAX_NODES},()=>new THREE.Vector4());
    this.geometry = new THREE.BufferGeometry();
    this.seedParticles();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions,3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors,3));
    this.geometry.setAttribute('brightness', new THREE.BufferAttribute(this.brightness, 1));

    this.material = new THREE.ShaderMaterial({
      transparent:true,
      depthWrite:false,
      vertexColors:true,
      blending:THREE.AdditiveBlending,
      uniforms:{
        uTime:{value:0},
        uPointSize:{value:this.cfg.pointSize},
        uBendStrength:{value:this.cfg.bendStrength},
        uBendRadius:{value:this.cfg.bendRadius},
        uNodeCount:{value:0},
        uNodes:{value:this.nodeUniform},
        uTwinkleSpeed:{value:this.cfg.twinkleSpeed},
        uTwinkleAmp:{value:this.cfg.twinkleAmp},
        uClusterCenter:{value:new THREE.Vector3()},
        uClusterRadius:{value:0},
        uPocketFade:{value:this.cfg.pocketFade?1:0},
        uPocketPush:{value:this.cfg.pocketPush},
        uPocketRingBoost:{value:this.cfg.pocketRingBoost},
        uPocketInner:{value:0.8},
      },
      vertexShader:this.vs(),
      fragmentShader:this.fs(),
    });

    this.points = new THREE.Points(this.geometry,this.material);
    this.rotObj.add(this.points);
  }

  getObject3D(){ return this.rotObj; }
  
  setCameraReference(camera: THREE.Camera){ 
    this.cameraRef = camera; 
  }

  /* ---------- public controls ---------- */
  setCluster(c:THREE.Vector3, r:number){
    (this.material.uniforms['uClusterCenter'].value as THREE.Vector3).copy(c);
    this.material.uniforms['uClusterRadius'].value = r;
  }
  setNodes(nodes:THREE.Vector4[]){
    const ct=Math.min(nodes.length,MAX_NODES);
    this.material.uniforms['uNodeCount'].value=ct;
    for(let i=0;i<ct;i++){ this.nodeUniform[i].copy(nodes[i]); }
  }
  setPocketPush(v:number){ this.cfg.pocketPush=v; this.material.uniforms['uPocketPush'].value=v; }
  setPocketFade(on:boolean){ this.cfg.pocketFade=on; this.material.uniforms['uPocketFade'].value=on?1:0; }
  setPocketRingBoost(v:number){ this.cfg.pocketRingBoost=v; this.material.uniforms['uPocketRingBoost'].value=v; }
  setPocketInner(v:number){ this.material.uniforms['uPocketInner'].value = v; }
  setBendStrength(v:number){ this.cfg.bendStrength=v; this.material.uniforms['uBendStrength'].value=v; }
  setAmbientRotSpeed(v:number){ this.cfg.ambientRotSpeed = Math.max(0, Math.min(0.05, v)); } // 0-0.05 range
  
  setRotationAxis(axis:string){ 
    if(['x', 'y', 'z'].includes(axis)) {
      this.cfg.rotationAxis = axis; 
    }
  }
  
  setRotationMode(mode:string){ 
    if(['screen', 'world', 'local'].includes(mode)) {
      this.cfg.rotationMode = mode; 
    }
  }
  
  setRotationSpeed(v:number){ 
    this.cfg.rotationSpeed = Math.max(0, Math.min(0.1, v)); // 0-0.1 range
  }
  
  // Spiral arm control methods
  setSpiralArms(count:number){ 
    this.cfg.spiralArms = Math.max(1, Math.min(8, Math.floor(count))); // 1-8 arms
  }
  setSpiralTightness(v:number){ 
    this.cfg.spiralTightness = Math.max(0.05, Math.min(0.5, v)); // 0.05-0.5 range
  }
  setSpiralWinds(v:number){ 
    this.cfg.spiralWinds = Math.max(0.5, Math.min(3.0, v)); // 0.5-3.0 rotations
  }
  setArmWidth(v:number){ 
    this.cfg.armWidth = Math.max(0.05, Math.min(0.4, v)); // 0.05-0.4 relative width
  }
  setArmBrightness(v:number){ 
    this.cfg.armBrightness = Math.max(1.0, Math.min(2.0, v)); // 1.0-2.0x brightness
  }
  
  // Arm thickness variation control methods
  setArmMaxWidth(v:number){ 
    this.cfg.armMaxWidth = Math.max(5, Math.min(50, v)); // 5-50 pixels at center
  }
  setArmMinWidth(v:number){ 
    this.cfg.armMinWidth = Math.max(1, Math.min(10, v)); // 1-10 pixels at edge
  }
  setArmThicknessProfile(v:number){ 
    this.cfg.armThicknessProfile = Math.max(0.1, Math.min(2.0, v)); // 0.1-2.0 profile curve
  }

  // Enhanced color control methods
  setColorSaturation(v:number){
    this.cfg.colorSaturation = Math.max(0.5, Math.min(2.0, v)); // 0.5-2.0x saturation
  }
  
  setMagentaBoost(v:number){
    this.cfg.magentaBoost = Math.max(1.0, Math.min(3.0, v)); // 1.0-3.0x magenta intensity
  }
  
  // Galactic tilt control methods
  setGalaxyTiltX(degrees:number){
    this.cfg.galaxyTiltX = Math.max(-30, Math.min(30, degrees)); // -30° to +30°
    this.reseed(); // Re-apply tilt to all particles
  }
  
  setGalaxyTiltZ(degrees:number){
    this.cfg.galaxyTiltZ = Math.max(-30, Math.min(30, degrees)); // -30° to +30°
    this.reseed(); // Re-apply tilt to all particles
  }
  
  // Background starfield control methods
  setNebulaIntensity(v:number){
    this.cfg.nebulaIntensity = Math.max(0, Math.min(2.0, v)); // 0-2.0x intensity
  }
  
  setNebulaClusters(count:number){
    this.cfg.nebulaClusters = Math.max(3, Math.min(15, Math.floor(count))); // 3-15 clusters
  }
  
  setNebulaRadius(v:number){
    this.cfg.nebulaRadius = Math.max(10, Math.min(50, v)); // 10-50 radius
  }
  
  setFieldStarDensity(v:number){
    this.cfg.fieldStarDensity = Math.max(0, Math.min(2.0, v)); // 0-2.0x density
  }
  
  setFieldStarDistance(v:number){
    this.cfg.fieldStarDistance = Math.max(1.2, Math.min(3.0, v)); // 1.2-3.0x distance
  }
  
  // Elliptical disk shape control methods
  setDiskEllipticity(v:number){
    this.cfg.diskEllipticity = Math.max(0, Math.min(1.0, v)); // 0-1.0 ellipticity
  }
  
  setZGaussianStrength(v:number){
    this.cfg.zGaussianStrength = Math.max(0, Math.min(2.0, v)); // 0-2.0x gaussian strength
  }
  
  // Star size control method
  setPointSize(v:number){
    this.cfg.pointSize = Math.max(0.5, Math.min(5.0, v)); // 0.5-5.0 point size
    this.material.uniforms['uPointSize'].value = this.cfg.pointSize;
  }

  setCoreSize(v:number){
    this.cfg.rCore = Math.max(15, Math.min(450, v)); // 15-450 core radius for larger galaxy
    this.reseed(); // Core size change requires reseeding particles
  }

  update(dt:number){
    this.time+=dt;
    this.material.uniforms['uTime'].value=this.time;
    
    // New rotation system with mode and axis selection
    if(this.cfg.rotationSpeed!==0){
      const speed = this.cfg.rotationSpeed * dt;
      
      if(this.cfg.rotationMode === 'screen' && this.cameraRef){
        // Screen-relative rotation: rotate relative to camera view
        this.applyScreenRelativeRotation(speed);
      } else if(this.cfg.rotationMode === 'local'){
        // Local rotation: rotate around galaxy's own tilted axes
        this.applyLocalRotation(speed);
      } else {
        // World rotation: rotate around world coordinate axes
        this.applyWorldRotation(speed);
      }
    }
    
    // Legacy ambient rotation (kept for backwards compatibility)
    if(this.cfg.ambientRotSpeed!==0){
      this.rotObj.rotation.x+=this.cfg.ambientRotSpeed*dt;
    }
  }
  
  private applyScreenRelativeRotation(speed: number){
    if(!this.cameraRef) return;
    
    // Get camera's transformation matrices
    const cameraMatrix = this.cameraRef.matrixWorld.clone();
    const cameraRotation = new THREE.Euler().setFromRotationMatrix(cameraMatrix);
    
    // Create rotation around screen axes
    const tempObject = new THREE.Object3D();
    tempObject.position.copy(this.rotObj.position);
    tempObject.rotation.copy(this.rotObj.rotation);
    
    switch(this.cfg.rotationAxis){
      case 'x': // Screen horizontal (side-to-side)
        tempObject.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0).applyEuler(cameraRotation), speed);
        break;
      case 'y': // Screen vertical (up-down) 
        tempObject.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0).applyEuler(cameraRotation), speed);
        break;
      case 'z': // Screen depth (in-out)
      default:
        tempObject.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1).applyEuler(cameraRotation), speed);
        break;
    }
    
    this.rotObj.rotation.copy(tempObject.rotation);
  }
  
  private applyLocalRotation(speed: number){
    // Rotate around galaxy's own axes (considering its tilt)
    const tiltXRad = (this.cfg.galaxyTiltX! * Math.PI) / 180;
    const tiltZRad = (this.cfg.galaxyTiltZ! * Math.PI) / 180;
    
    const localRotationMatrix = new THREE.Matrix4()
      .makeRotationX(tiltXRad)
      .multiply(new THREE.Matrix4().makeRotationZ(tiltZRad));
    
    const localAxis = new THREE.Vector3();
    switch(this.cfg.rotationAxis){
      case 'x':
        localAxis.set(1, 0, 0);
        break;
      case 'y':
        localAxis.set(0, 1, 0);
        break;
      case 'z':
      default:
        localAxis.set(0, 0, 1);
        break;
    }
    
    localAxis.applyMatrix4(localRotationMatrix);
    this.rotObj.rotateOnWorldAxis(localAxis, speed);
  }
  
  private applyWorldRotation(speed: number){
    // Simple world coordinate rotation
    switch(this.cfg.rotationAxis){
      case 'x':
        this.rotObj.rotation.x += speed;
        break;
      case 'y':
        this.rotObj.rotation.y += speed;
        break;
      case 'z':
      default:
        this.rotObj.rotation.z += speed;
        break;
    }
  }

  reseed(count?:number){
    if(count) this.cfg.count=count;
    this.seedParticles();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions,3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors,3));
    this.geometry.setAttribute('brightness', new THREE.BufferAttribute(this.brightness, 1));
    this.geometry.attributes['position'].needsUpdate=true;
    this.geometry.attributes['color'].needsUpdate=true;
    this.geometry.attributes['brightness'].needsUpdate=true;
  }

  /* ---------- seeding ---------- */
  private seedParticles(){
    const {count,rCore,rFlower,rOuter,flattenY,thicknessZ,flowerWeight,
           spiralArms,spiralTightness,spiralWinds,armWidth,armBrightness,
           colorSaturation,magentaBoost,galaxyTiltX,galaxyTiltZ,
           nebulaIntensity,nebulaClusters,nebulaRadius,fieldStarDensity,fieldStarDistance,
           diskEllipticity,zGaussianStrength} = this.cfg;
    this.positions = new Float32Array(count*3);
    this.colors    = new Float32Array(count*3);
    this.brightness= new Float32Array(count);

    // Create rotation matrix for galactic plane tilt
    const tiltXRad = (galaxyTiltX * Math.PI) / 180;
    const tiltZRad = (galaxyTiltZ * Math.PI) / 180;
    
    // Rotation matrices for X and Z axis tilts
    const cosX = Math.cos(tiltXRad), sinX = Math.sin(tiltXRad);
    const cosZ = Math.cos(tiltZRad), sinZ = Math.sin(tiltZRad);

    // Pre-generate nebula cluster centers for consistent clustering
    const nebulaCenters: {x: number, y: number, intensity: number}[] = [];
    for (let i = 0; i < nebulaClusters; i++) {
      const clusterAngle = Math.random() * Math.PI * 2;
      const clusterRadius = rFlower + Math.random() * (rOuter - rFlower) * 0.7; // clusters in outer regions
      nebulaCenters.push({
        x: clusterRadius * Math.cos(clusterAngle),
        y: clusterRadius * Math.sin(clusterAngle),
        intensity: 0.5 + Math.random() * 0.5 // vary nebula brightness
      });
    }

    const col = new THREE.Color();
    for(let i=0;i<count;i++){
      const idx=i*3;
      const u = Math.random();
      let r:number, ang:number;
      let particleType: 'core' | 'spiral' | 'halo' | 'nebula' | 'fieldstar' = 'halo';

      // Enhanced particle distribution with nebulae and field stars
      const nebulaChance = Math.min(0.15, nebulaIntensity * 0.15); // 0-15% nebula particles
      const fieldStarChance = Math.min(0.05, fieldStarDensity * 0.05); // 0-5% field stars
      const adjustedHaloChance = Math.max(0.05, 0.15 - nebulaChance - fieldStarChance); // remaining for halo

      if (u < 0.10){ // reduced core to 10% since it's now much larger physically
        particleType = 'core';
        r = Math.pow(Math.random(),0.45)*rCore;
        ang = Math.random()*Math.PI*2;
        
      } else if (u < 0.70){ // increased spiral arms to 60% for better visibility
        particleType = 'spiral';
        // Create configurable number of distinct spiral arms with logarithmic spiral pattern
        const armIndex = Math.floor(Math.random() * spiralArms);
        const armOffsetAngle = (armIndex * 2 * Math.PI) / spiralArms; // evenly spaced
        
        // Random position along the arm with increased density towards outer regions
        let armProgress = Math.random(); // 0 to 1 along the arm
        
        // Bias towards outer regions - higher armProgress values get higher probability
        // This creates more stars as we move outward from the center
        const densityBias = Math.random();
        if (densityBias < 0.6) { // 60% chance to bias towards outer regions
          armProgress = Math.pow(armProgress, 0.4); // curve that favors higher values
        }
        
        const spiralAngle = armProgress * spiralWinds * 2 * Math.PI; // total angle to wind
        
        // Radius grows as we spiral outward
        r = rCore + (rOuter - rCore) * Math.pow(armProgress, 0.7);
        
        // Final angle combines arm offset + spiral winding
        ang = armOffsetAngle + spiralAngle * spiralTightness;
        
        // Enhanced arm width: thick at center, gradually thinning outward
        const radiusNormalized = (r - rCore) / (rOuter - rCore); // 0 at center, 1 at outer edge
        const thicknessProfile = 1.0 - Math.pow(radiusNormalized, this.cfg.armThicknessProfile); // Thick at center, thin at edges
        const armWidthPixels = this.cfg.armMinWidth + (this.cfg.armMaxWidth - this.cfg.armMinWidth) * thicknessProfile * armWidth;
        
        const perpendicular = ang + Math.PI/2;
        const armOffset = (Math.random() - 0.5) * armWidthPixels;
        const armX = r * Math.cos(ang) + armOffset * Math.cos(perpendicular);
        const armY = r * Math.sin(ang) + armOffset * Math.sin(perpendicular);
        
        // Convert back to r,ang for the rest of the pipeline
        r = Math.sqrt(armX*armX + armY*armY);
        ang = Math.atan2(armY, armX);
        
      } else if (u < 0.65 + adjustedHaloChance){ // sparse halo between arms
        particleType = 'halo';
        ang = Math.random()*Math.PI*2;
        r = rFlower + (rOuter-rFlower)*Math.pow(Math.random(),1.8); // more concentrated toward inner edge
        
        // Reduce density in spiral regions to make arms more distinct
        const armSpacing = 2*Math.PI/spiralArms;
        let minArmDist = Math.PI;
        for(let arm=0; arm<spiralArms; arm++){
          const armAngle = arm * armSpacing;
          let angDiff = Math.abs(ang - armAngle);
          if(angDiff > Math.PI) angDiff = 2*Math.PI - angDiff;
          minArmDist = Math.min(minArmDist, angDiff);
        }
        
        // Skip particles too close to spiral arms
        const armAvoidance = 0.3; // radians (~17 degrees)
        if(minArmDist < armAvoidance && Math.random() < 0.7){
          i--; // retry this particle
          continue;
        }
        
      } else if (u < 0.65 + adjustedHaloChance + nebulaChance){ // clustered nebula particles
        particleType = 'nebula';
        // Choose random nebula cluster
        const clusterIndex = Math.floor(Math.random() * nebulaCenters.length);
        const cluster = nebulaCenters[clusterIndex];
        
        // Generate particle within cluster radius using gaussian distribution
        const clusterDist = Math.abs(Math.random() - Math.random()) * nebulaRadius; // gaussian-like
        const clusterAngle = Math.random() * Math.PI * 2;
        
        const nebulaX = cluster.x + clusterDist * Math.cos(clusterAngle);
        const nebulaY = cluster.y + clusterDist * Math.sin(clusterAngle);
        
        r = Math.sqrt(nebulaX*nebulaX + nebulaY*nebulaY);
        ang = Math.atan2(nebulaY, nebulaX);
        
        // Skip if nebula particle is too close to galaxy center or too far out
        if (r < rCore * 0.8 || r > rOuter * 1.2) {
          i--; // retry this particle
          continue;
        }
        
      } else { // distant field stars
        particleType = 'fieldstar';
        // Place field stars at greater distances with more scattered distribution
        ang = Math.random() * Math.PI * 2;
        r = rOuter * fieldStarDistance * (0.8 + Math.random() * 0.7); // 0.8-1.5x outer radius
      }

      const x = r*Math.cos(ang);
      let y = r*Math.sin(ang)*flattenY;
      y += Math.sin(r*0.03 + ang*3.0)*1.5;
      
      // Enhanced elliptical Z distribution for realistic galactic disk
      const radiusNorm = Math.min(r / rOuter, 1.0);           // 0 .. 1, clamped
      
      // Create elliptical disk profile with configurable ellipticity
      // diskEllipticity: 0 = flat disk, 1 = full ellipse
      const ellipseProfile = diskEllipticity * Math.sqrt(Math.max(0, 1.0 - radiusNorm*radiusNorm)) + 
                            (1.0 - diskEllipticity);
      const maxThickness = rOuter * thicknessZ * ellipseProfile;
      
      // Enhanced gaussian-like distribution with configurable strength
      const gaussianZ1 = Math.random() - 0.5;
      const gaussianZ2 = Math.random() - 0.5;
      const gaussianSum = gaussianZ1 + gaussianZ2; // sum of two uniforms approximates gaussian
      
      // Blend between gaussian and uniform based on zGaussianStrength
      const uniformZ = Math.random() - 0.5;
      const blendedZ = gaussianSum * zGaussianStrength + uniformZ * (1.0 - zGaussianStrength);
      const normalizedZ = blendedZ * 0.6; // scale down for reasonable range
      
      // Different Z distribution for different particle types
      let zScale = 1.0;
      let z: number;
      
      if (particleType === 'fieldstar') {
        // Field stars have more Z spread (thicker distribution) and less elliptical constraint
        zScale = 1.8;
        const fieldStarZ = (Math.random() - 0.5) * 2; // more uniform for field stars
        z = fieldStarZ * maxThickness * zScale;
      } else if (particleType === 'nebula') {
        // Nebula particles are more confined to disk plane
        zScale = 0.6;
        z = normalizedZ * maxThickness * zScale;
      } else {
        // Core, spiral, and halo particles use elliptical gaussian blend
        if (particleType === 'core') {
          zScale = 0.4; // central core is very flat
        } else if (particleType === 'spiral') {
          // Enhanced spiral arm Z-thickness: thick at center, thin at edges
          const radiusNorm = Math.min(r / rOuter, 1.0);
          const thicknessProfile = 1.0 - Math.pow(radiusNorm, 0.8); // Gradual thinning
          const maxSpiralThickness = 1.2; // Thick at center
          const minSpiralThickness = 0.3; // Thin at edges
          zScale = minSpiralThickness + (maxSpiralThickness - minSpiralThickness) * thicknessProfile;
        } else {
          zScale = 1.2; // halo particles can be a bit thicker
        }
        z = normalizedZ * maxThickness * zScale;
      }

      // Apply galactic plane tilt transformation
      // First rotate around X axis (pitch), then around Z axis (roll)
      let tiltedX = x;
      let tiltedY = y * cosX - z * sinX;  // X rotation: Y' = Y*cos - Z*sin
      let tiltedZ = y * sinX + z * cosX;  // X rotation: Z' = Y*sin + Z*cos
      
      // Then rotate around Z axis
      const finalX = tiltedX * cosZ - tiltedY * sinZ;  // Z rotation: X' = X*cos - Y*sin
      const finalY = tiltedX * sinZ + tiltedY * cosZ;  // Z rotation: Y' = X*sin + Y*cos
      const finalZ = tiltedZ;                          // Z rotation: Z' = Z (unchanged)

      this.positions[idx]=finalX;
      this.positions[idx+1]=finalY;
      this.positions[idx+2]=finalZ;

      // ---- Enhanced color system for different particle types ----
      const t = Math.min(r / rOuter, 1.0); // 0 to 1 from center to edge, clamped
      let baseBrightness = 0.5;
      const jitter = Math.random() * 0.3; // color variation
      
      if (particleType === 'fieldstar') {
        // Distant bright blue/white field stars
        const starIntensity = 0.6 + Math.random() * 0.4; // 0.6-1.0 brightness
        if (Math.random() < 0.7) {
          // 70% bright blue field stars
          col.copy(PAL_CYAN_LIGHT).lerp(PAL_BLUE_CORE, Math.random() * 0.4);
        } else {
          // 30% bright white field stars
          col.setRGB(0.9 + Math.random() * 0.1, 0.95 + Math.random() * 0.05, 1.0);
        }
        baseBrightness = starIntensity * fieldStarDensity;
        
      } else if (particleType === 'nebula') {
        // Clustered purple/magenta nebula particles
        const clusterIndex = Math.floor(Math.random() * nebulaCenters.length);
        const cluster = nebulaCenters[clusterIndex];
        
        // Nebula particles are primarily purple/magenta with some variation
        if (Math.random() < 0.8) {
          // 80% magenta/purple nebula
          col.copy(PAL_MAGENTA).lerp(PAL_VIOLET, Math.random() * 0.6);
        } else {
          // 20% deeper purple nebula
          col.copy(PAL_VIOLET).lerp(PAL_TEAL_DARK, Math.random() * 0.3);
        }
        
        baseBrightness = (0.4 + Math.random() * 0.4) * cluster.intensity * nebulaIntensity;
        
      } else if (t < 0.15) { 
        // Bright cyan-blue core (0-15%)
        col.copy(PAL_CYAN_CORE).lerp(PAL_CYAN_LIGHT, jitter);
        baseBrightness = 0.95;
        
      } else if (t < 0.35) { 
        // Deep blue transition zone (15-35%)
        const mixRatio = (t - 0.15) / 0.2; // 0 to 1 within this band
        col.copy(PAL_CYAN_CORE).lerp(PAL_BLUE_DEEP, mixRatio + jitter * 0.3);
        baseBrightness = 0.8 - mixRatio * 0.1;
        
      } else if (t < 0.60) { 
        // Purple-violet zone with magenta accents (35-60%)
        const mixRatio = (t - 0.35) / 0.25; // 0 to 1 within this band
        
        // Enhanced magenta accents for spiral arms
        if (particleType === 'spiral' && Math.random() < 0.4) {
          // 40% chance of magenta accent particles in spiral arms
          col.copy(PAL_MAGENTA).lerp(PAL_VIOLET, 0.3 + jitter * 0.4);
          // Apply magenta boost
          col.lerp(PAL_MAGENTA, Math.min(magentaBoost - 1.0, 0.5));
          baseBrightness = 0.85;
        } else {
          // Regular purple-violet gradient
          col.copy(PAL_BLUE_DEEP).lerp(PAL_VIOLET, mixRatio + jitter * 0.4);
          baseBrightness = 0.7 - mixRatio * 0.1;
        }
        
      } else if (t < 0.85) { 
        // Outer magenta-purple ring (60-85%)
        const mixRatio = (t - 0.60) / 0.25; // 0 to 1 within this band
        
        // More magenta in spiral arms
        if (particleType === 'spiral' && Math.random() < 0.6) {
          // 60% chance of strong magenta in outer spiral arms
          col.copy(PAL_MAGENTA).lerp(PAL_VIOLET, jitter * 0.5);
          baseBrightness = 0.75;
        } else {
          // Purple to magenta gradient
          col.copy(PAL_VIOLET).lerp(PAL_MAGENTA, mixRatio + jitter * 0.3);
          baseBrightness = 0.6 - mixRatio * 0.1;
        }
        
      } else { 
        // Dark outer halo (85-100%)
        const mixRatio = (t - 0.85) / 0.15; // 0 to 1 within this band
        col.copy(PAL_TEAL_DARK).lerp(PAL_SPACE_BLACK, mixRatio + jitter * 0.2);
        baseBrightness = 0.25 * (1.0 - mixRatio);
      }
      
      // Additional spiral arm enhancements
      if (particleType === 'spiral') {
        baseBrightness *= armBrightness;
        
        // Add subtle blue-shift to inner spiral arms for depth
        if (t < 0.5 && Math.random() < 0.3) {
          col.lerp(PAL_BLUE_CORE, 0.2);
        }
      }
      
      // Apply color saturation enhancement
      if (colorSaturation !== 1.0) {
        // Convert to HSL, boost saturation, convert back
        const hsl = col.getHSL({h:0, s:0, l:0});
        hsl.s = Math.min(1.0, hsl.s * colorSaturation);
        col.setHSL(hsl.h, hsl.s, hsl.l);
      }
      
      this.brightness[i] = Math.min(1.0, baseBrightness + Math.random() * 0.1);

      this.colors[idx]=col.r;
      this.colors[idx+1]=col.g;
      this.colors[idx+2]=col.b;
    }
  }

  /* ---------- shaders ---------- */
  private vs():string{
    return /* glsl */`
      uniform float uTime;
      uniform float uPointSize;
      uniform float uBendStrength;
      uniform float uBendRadius;
      uniform float uTwinkleSpeed;
      uniform float uTwinkleAmp;
      uniform int   uNodeCount;
      uniform vec4  uNodes[${MAX_NODES}];
      uniform vec3  uClusterCenter;
      uniform float uClusterRadius;
      uniform int   uPocketFade;
      uniform float uPocketPush;
      uniform float uPocketRingBoost;
      uniform float uPocketInner;

      attribute float brightness;
      varying vec3 vColor;
      varying float vFade;
      varying float vBright;

      float hash3(vec3 p){
        return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453)*2.0-1.0;
      }

      void main(){
        vColor = color;
        vec3 pos = position;

        // ----- 2D cavity (XY only) -----
        float fade=1.0;
        if (uClusterRadius > 0.0){
          vec3 dc = pos - uClusterCenter;
          float distXY = length(dc.xy);        // <-- 2D distance
          float n = hash3(dc*0.1);
          float rVar = uClusterRadius * (1.0 + 0.15*n);
          if (distXY < rVar){
            // Enhanced fade to black for more visible pocket around central node
            if (uPocketFade==1){
              // Create sharper, more visible black boundary
              float innerBoundary = rVar * 0.3;  // Inner 30% completely black
              float outerBoundary = rVar * 0.8;  // Fade from 30% to 80%
              
              if (distXY < innerBoundary) {
                fade = 0.0;  // Completely black in inner zone
              } else if (distXY < outerBoundary) {
                // Smooth transition from black to normal in middle zone
                fade = smoothstep(innerBoundary, outerBoundary, distXY) * 0.6;
              } else {
                // Gentle fade in outer zone to blend with galaxy
                fade = 0.6 + smoothstep(outerBoundary, rVar, distXY) * 0.4;
              }
            }
            // push XY only (visual repulsion)
            if (uPocketPush>0.0){
              float inner = uPocketInner;          // 0.8 means push only inner 80%
              if (distXY < rVar * inner){
                float k   = 1.0 - distXY / (rVar * inner);   // 1 → 0
                vec2 dir  = (distXY > 0.0) ? dc.xy / distXY : vec2(0.0,1.0);
                float push = k * (rVar*inner - distXY) * uPocketPush;
                pos.x += dir.x * push;
                pos.y += dir.y * push;
              }
            }
            // Enhanced edge brightness accent for cleaner ring definition
            float ring = 1.0 - smoothstep(rVar*0.7, rVar, distXY);
            vColor *= (1.0 + ring * uPocketRingBoost);
          }
        }

        // node bending (unchanged 3D)
        if (uBendStrength > 0.0) {
          for (int i=0;i<${MAX_NODES};i++){
            if (i>=uNodeCount) break;
            vec3 np = uNodes[i].xyz;
            float nr = uNodes[i].w;
            vec3 d = pos - np;
            float dist = length(d);
            float infl = 1.0 - smoothstep(nr, nr + uBendRadius, dist);
            if (infl>0.0){
              vec3 swirl = normalize(cross(d, vec3(0.0,0.0,1.0)));
              vec3 pull  = normalize(-d);
              float s = uBendStrength * infl;
              pos += swirl * s * nr * 0.25;
              pos += pull  * s * nr * 0.05;
            }
          }
        }

        // twinkle
        float tw = sin(dot(pos, vec3(12.9,78.2,37.7)) + uTime*uTwinkleSpeed)*uTwinkleAmp;
        float size = uPointSize*(1.0+tw);

        vFade = fade;
        vBright = brightness;
        vec4 mv = modelViewMatrix * vec4(pos,1.0);
        float dist = -mv.z;
        gl_PointSize = size * (300.0/dist);
        gl_Position = projectionMatrix * mv;
      }
    `;
  }

  private fs():string{
    return /* glsl */`
      varying vec3 vColor;
      varying float vFade;
      varying float vBright;
      void main(){
        vec2 uv = gl_PointCoord.xy*2.0-1.0;
        float d = length(uv);  // Use length for perfect circular distance
        if (d > 1.0) discard;  // Discard pixels outside circle
        
        // Enhanced circular particle shape with multiple falloff zones
        float alpha = 1.0;
        
        // Create soft circular falloff with multiple zones for better appearance
        if (d > 0.9) {
          // Outer edge - very soft falloff
          alpha = 1.0 - smoothstep(0.9, 1.0, d);
        } else if (d > 0.6) {
          // Middle zone - gentle falloff
          alpha = 1.0 - smoothstep(0.6, 0.9, d) * 0.3;
        } else {
          // Inner core - full opacity with slight center softening
          alpha = 1.0 - d * 0.1;
        }
        
        alpha *= vFade * vBright;
        
        // Enhanced color depth with brightness-based color mixing
        vec3 c = vColor;
        
        // Add subtle glow effect for brighter particles
        if (vBright > 0.7) {
          // Bright particles get a subtle color boost and glow
          c = mix(c, c * 1.3, (vBright - 0.7) * 3.33);
          
          // Add inner glow for very bright particles (circular)
          float innerGlow = 1.0 - smoothstep(0.2, 0.6, d);
          c += innerGlow * vColor * 0.5 * (vBright - 0.7) * 3.33;
        }
        
        // Apply brightness modulation
        c *= (0.6 + 0.4 * vBright);
        
        gl_FragColor = vec4(c, alpha);
      }
    `;
  }
}

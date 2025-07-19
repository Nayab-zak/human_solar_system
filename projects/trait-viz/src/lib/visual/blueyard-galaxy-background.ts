import * as THREE from 'three';
import {
  PAL_CYAN_LIGHT,PAL_CYAN_CORE,PAL_BLUE_CORE,PAL_BLUE_DEEP,
  PAL_VIOLET,PAL_MAGENTA,PAL_TEAL_DARK,COLOR_DEEP_BLUE
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
  twinkleSpeed?: number;
  twinkleAmp?: number;
  pointSize?: number;
  pocketFade?: boolean;    // fade inside cluster pocket?
  pocketPush?: number;     // 0..1 XY push amount
  pocketRingBoost?: number;// 0..2 ring brightness at pocket edge
  flowerWeight?: number;   // 0..1 how strong magenta petals appear
}

export class BlueyardGalaxyBackground {
  readonly cfg: Required<BlueyardGalaxyConfig>;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private points: THREE.Points;
  private rotObj = new THREE.Object3D();
  private positions!: Float32Array;
  private colors!: Float32Array;
  private brightness!: Float32Array;
  private nodeUniform: THREE.Vector4[];
  private time = 0;

  constructor(cfg: BlueyardGalaxyConfig = {}){
    this.cfg = {
      count: cfg.count ?? 70000,
      rCore: cfg.rCore ?? 25,
      rFlower: cfg.rFlower ?? 55,
      rOuter: cfg.rOuter ?? 220,
      flattenY: cfg.flattenY ?? 0.45,
      thicknessZ: cfg.thicknessZ ?? 0.35,
      bendStrength: cfg.bendStrength ?? 0.4,
      bendRadius: cfg.bendRadius ?? 10,
      ambientRotSpeed: cfg.ambientRotSpeed ?? 0.001,
      twinkleSpeed: cfg.twinkleSpeed ?? 0.2,
      twinkleAmp: cfg.twinkleAmp ?? 0.06,
      pointSize: cfg.pointSize ?? 1.0,
      pocketFade: cfg.pocketFade ?? true,
      pocketPush: cfg.pocketPush ?? 0.8,
      pocketRingBoost: cfg.pocketRingBoost ?? 1.2,
      flowerWeight: cfg.flowerWeight ?? 0.8,
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

  update(dt:number){
    this.time+=dt;
    this.material.uniforms['uTime'].value=this.time;
    if(this.cfg.ambientRotSpeed!==0){
      this.rotObj.rotation.y+=this.cfg.ambientRotSpeed*dt;
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
    const {count,rCore,rFlower,rOuter,flattenY,thicknessZ,flowerWeight} = this.cfg;
    this.positions = new Float32Array(count*3);
    this.colors    = new Float32Array(count*3);
    this.brightness= new Float32Array(count);

    const col = new THREE.Color();
    for(let i=0;i<count;i++){
      const idx=i*3;
      const u = Math.random();
      let r:number, ang:number;

      if (u < 0.45){ // inner core
        r = Math.pow(Math.random(),0.45)*rCore;
        ang = Math.random()*Math.PI*2;
      } else if (u < 0.85){ // flower band
        ang = Math.random()*Math.PI*2;
        const petals = 5.0;
        const petalNoise = Math.pow(Math.abs(Math.sin(ang*petals)),2.0) * (15.0*flowerWeight) * Math.random();
        r = rFlower + (Math.random()-0.5)*8 + petalNoise;
      } else { // halo
        ang = Math.random()*Math.PI*2;
        r = rFlower + (rOuter-rFlower)*Math.pow(Math.random(),1.3);
      }

      const x = r*Math.cos(ang);
      let y = r*Math.sin(ang)*flattenY;
      y += Math.sin(r*0.03 + ang*3.0)*1.5;
      
      // Volumetric Z fall-off
      const radiusNorm = r / rOuter;                         // 0 .. 1
      const zMax = (1.0 - radiusNorm*radiusNorm)             // quadratic fall-off
                   * (rOuter * thicknessZ);                  // cfg.thicknessZ ≈ 0.35
      const z = (Math.random() - 0.5) * 2 * zMax;

      this.positions[idx]=x;
      this.positions[idx+1]=y;
      this.positions[idx+2]=z;

      // ---- color ramp w/ random jitter ----
      const t = r / rOuter;
      if (t < 0.2) {                     // bright cyan core
        col.setRGB(0.70, 0.90, 1.00);
        this.brightness[i] = 0.9 + Math.random()*0.1;
      } else if (t < 0.35) {             // NEW deep-blue band (20-35 %)
        col.copy(COLOR_DEEP_BLUE).lerp(new THREE.Color('#1a8dff'), Math.random()*0.4);
        this.brightness[i] = 0.7 + Math.random()*0.2;
      } else if (t < 0.55) {             // purple / violet mix
        col.setRGB(0.50, 0.00, 1.00).lerp(new THREE.Color('#7e6bff'), Math.random()*0.6);
        this.brightness[i] = 0.6 + Math.random()*0.2;
      } else if (t < 0.80) {             // pink / magenta ring
        col.setRGB(0.85, 0.15, 0.85);
        this.brightness[i] = 0.5 + Math.random()*0.2;
      } else {
        col.setRGB(0.10, 0.12, 0.22);      // far field dark
        this.brightness[i] = 0.15 + Math.random()*0.1;
      }

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
            // fade to black
            if (uPocketFade==1){
              fade = smoothstep(rVar, rVar*0.4, distXY);
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
            // edge brightness accent for ring look
            float ring = 1.0 - smoothstep(rVar*0.6, rVar, distXY);
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
        float d = dot(uv,uv);
        if (d>1.0) discard;
        float alpha = 1.0 - smoothstep(0.8,1.0,d);
        alpha *= vFade * vBright;
        // gamma-ish brighten center but preserve color: raise color slightly by brightness too
        vec3 c = vColor * (0.5 + 0.5*vBright); // scales 0.5..1.0
        gl_FragColor = vec4(c, alpha);
      }
    `;
  }
}

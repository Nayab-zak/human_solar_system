import * as THREE from 'three';
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
    this.geometry.attributes['position'].needsUpdate=true;
    this.geometry.attributes['color'].needsUpdate=true;
  }

  /* ---------- seeding ---------- */
  private seedParticles(){
    const {count,rCore,rFlower,rOuter,flattenY,thicknessZ,flowerWeight} = this.cfg;
    this.positions = new Float32Array(count*3);
    this.colors    = new Float32Array(count*3);
    const col = new THREE.Color();
    for(let i=0;i<count;i++){
      const idx=i*3;

      // choose radial bucket with weighting
      const u = Math.random();
      let r:number, ang:number;
      if (u < 0.45){ // inner core (cyan/blue)
        r = Math.pow(Math.random(),0.45)*rCore;
        ang = Math.random()*Math.PI*2;
      } else if (u < 0.85){ // flower band (magenta petals / violet mix)
        ang = Math.random()*Math.PI*2;
        // petal amplitude: 5 lobes for richer "flower"
        const petals = 5.0;
        const petalNoise = (Math.pow(Math.abs(Math.sin(ang*petals)),2.0) * (15.0*flowerWeight));
        r = rFlower + (Math.random()-0.5)*8 + petalNoise;
      } else { // halo
        ang = Math.random()*Math.PI*2;
        r = rFlower + (rOuter-rFlower)*Math.pow(Math.random(),1.3);
      }

      const x = r*Math.cos(ang);
      let y = r*Math.sin(ang)*flattenY;
      // low swirl to avoid streak lines
      y += Math.sin(r*0.03 + ang*3.0)*1.5;
      const z = (Math.random()-0.5)*2*(rOuter*thicknessZ);

      this.positions[idx]=x;
      this.positions[idx+1]=y;
      this.positions[idx+2]=z;

      // color ramp by region
      if (r < rCore){
        // blend cyan + blue noise
        col.set('#8ee1ff').lerp(new THREE.Color('#1d8bff'), Math.random()*0.5);
      } else if (r < rFlower){
        // mostly blue→violet
        col.set('#1d8bff').lerp(new THREE.Color('#7e6bff'), Math.random());
      } else if (r < rFlower+30){
        // magenta petals
        col.set('#7e6bff').lerp(new THREE.Color('#ff4fd2'), Math.random());
      } else {
        // dark halo speckled teal
        col.set('#021626').lerp(new THREE.Color('#1d8bff'), Math.random()*0.15);
      }
      this.colors[idx]=col.r;this.colors[idx+1]=col.g;this.colors[idx+2]=col.b;
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

      varying vec3 vColor;
      varying float vFade;

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
              vec2 dir = (distXY>0.0) ? (dc.xy/distXY) : vec2(0.0,1.0);
              float push = (rVar - distXY) * uPocketPush;
              pos.x += dir.x * push;
              pos.y += dir.y * push;
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
      void main(){
        vec2 uv = gl_PointCoord.xy*2.0-1.0;
        float d = dot(uv,uv);
        if (d>1.0) discard;
        float alpha = 1.0 - smoothstep(0.8,1.0,d);
        alpha *= vFade;
        gl_FragColor = vec4(vColor, alpha);
      }
    `;
  }
}
